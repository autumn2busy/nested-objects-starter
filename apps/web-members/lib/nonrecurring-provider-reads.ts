import { outsetaAmountMinor, outsetaUtc, type PassPaymentEvidence } from '@/lib/directory-pass-payment'
import { currentDirectoryPassEntitlement } from '@/lib/directory-pass-entitlement'
import { DIRECTORY_PASS_PLAN_UID } from '@/lib/plan-config'

type Row = Record<string, any>
export type JsonRead = (path: string) => Promise<Row>
export const requireUid = (value: unknown): string => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9]{4,40}$/.test(value)) throw Error('invalid_provider_identity')
  return value
}
export const requireNumericId = (value: unknown): string => {
  const id = String(value ?? '')
  if (!/^[1-9]\d*$/.test(id)) throw Error('invalid_ac_identity')
  return id
}
const boolean = (value: unknown): boolean => {
  if (typeof value !== 'boolean') throw Error('missing_provider_flag')
  return value
}
const integer = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) throw Error('invalid_provider_integer')
  return value
}
export interface NonrecurringMember {
  personUid: string; accountUid: string; email: string; acContactId: string | null; acCustomerId: string | null
}

/** Bounded, complete, duplicate-free account collection. Partial data never means zero. */
export async function readAccountTransactions(read: JsonRead, accountUid: string): Promise<Row[]> {
  requireUid(accountUid)
  const rows: Row[] = [], seen = new Set<string>()
  let expected: number | undefined
  for (let offset = 0; offset < 1000; offset += 100) {
    const page = await read(`billing/transactions/${accountUid}?limit=100&offset=${offset}&donotlog=1`)
    const total = page.metadata?.total
    if (!Array.isArray(page.items) || !Number.isSafeInteger(total) || total < 0 || total > 1000 ||
        (expected !== undefined && expected !== total)) throw Error('incomplete_transactions')
    expected = total
    for (const row of page.items) {
      if (row.Account?.Uid !== accountUid || seen.has(requireUid(row.Uid))) throw Error('transaction_identity_conflict')
      seen.add(row.Uid); rows.push(row)
    }
    if (rows.length === total) return rows
    if (page.items.length !== 100 || rows.length > total) throw Error('incomplete_transactions')
  }
  throw Error('transactions_exceed_limit')
}

export function verifyAccountPerson(account: Row, person: Row, member: NonrecurringMember) {
  if (account.Uid !== member.accountUid || person.Uid !== member.personUid ||
      typeof person.Email !== 'string' || person.Email.trim().toLowerCase() !== member.email.trim().toLowerCase()) {
    throw Error('authoritative_member_identity_conflict')
  }
  const links = account.PersonAccount
  const personLinks = person.PersonAccount
  if (!Array.isArray(links) || !Array.isArray(personLinks) ||
      links.filter((x: Row) => x.IsPrimary === true).length !== 1 ||
      !links.some((x: Row) => x.IsPrimary === true && x.Person?.Uid === member.personUid) ||
      !personLinks.some((x: Row) => x.IsPrimary === true && x.Account?.Uid === member.accountUid)) {
    throw Error('primary_membership_unverified')
  }
}

/** Creation requires current, live authority; cancellation never fabricates a refund. */
export function mayCreateNonrecurringCustomer(account: Row, planUid: string, held: boolean, now: string, passPlanUid = DIRECTORY_PASS_PLAN_UID): boolean {
  const current = account.CurrentSubscription, latest = account.LatestSubscription
  const validEnd = planUid === passPlanUid
    ? currentDirectoryPassEntitlement(account, { sub: account.PersonAccount?.find((x: Row) => x.IsPrimary === true)?.Person?.Uid,
      'outseta:accountUid': account.Uid, 'outseta:subscriptionUid': current?.Uid, 'outseta:planUid': planUid }, Date.parse(now), passPlanUid)
    : current?.EndDate === null && (current.ExpirationDate == null || Date.parse(outsetaUtc(current.ExpirationDate)) > Date.parse(now))
  return !held && account.IsLivemode === true && account.IsDemo === false &&
    [2, 3].includes(account.AccountStage) && current?.Plan?.Uid === planUid &&
    typeof current?.Uid === 'string' && current.Uid === latest?.Uid &&
    validEnd &&
    (account.IsDeleted === undefined || account.IsDeleted === false) &&
    (account.IsArchived === undefined || account.IsArchived === false)
}

export async function readPassPaymentEvidence(input: {
  outseta: JsonRead; stripe: JsonRead; account: Row; member: NonrecurringMember
  invoiceUid: string; transactions: Row[]; expectedStripeAccountId: string; observedAt: string
}): Promise<PassPaymentEvidence> {
  const { outseta, stripe, account: a, member, transactions: tx, observedAt } = input
  const i = await outseta(`billing/invoices/${requireUid(input.invoiceUid)}?donotlog=1`)
  if (i.Uid !== input.invoiceUid || i.Subscription?.Account?.Uid !== member.accountUid) throw Error('invoice_identity_conflict')
  const chargeIds = typeof i.StripePaymentTransactionIds === 'string'
    ? i.StripePaymentTransactionIds.split(',').map((s: string) => s.trim()).filter(Boolean) : []
  if (chargeIds.length !== 1 || !/^ch_[A-Za-z0-9]+$/.test(chargeIds[0])) throw Error('exact_charge_unavailable')
  const sa = await stripe('account')
  if (sa.id !== input.expectedStripeAccountId) throw Error('stripe_account_conflict')
  const c = await stripe(`charges/${chargeIds[0]}`)
  if (c.id !== chargeIds[0] || typeof c.payment_intent !== 'string' || !/^pi_[A-Za-z0-9]+$/.test(c.payment_intent)) throw Error('charge_intent_unverified')
  const p = await stripe(`payment_intents/${c.payment_intent}`)
  const refunds: Row[] = [], seen = new Set<string>()
  let after = '', complete = false
  for (let page = 0; page < 10; page++) {
    const r = await stripe(`refunds?charge=${c.id}&limit=100${after ? '&starting_after=' + after : ''}`)
    if (!Array.isArray(r.data) || typeof r.has_more !== 'boolean') throw Error('incomplete_refunds')
    for (const row of r.data) {
      if (typeof row.id !== 'string' || !/^re_[A-Za-z0-9]+$/.test(row.id) || seen.has(row.id) || row.charge !== c.id) throw Error('refund_identity_conflict')
      seen.add(row.id); refunds.push(row)
    }
    if (!r.has_more) { complete = true; break }
    if (r.data.length !== 100) throw Error('incomplete_refunds')
    after = r.data.at(-1).id
  }
  if (!complete) throw Error('refunds_exceed_limit')
  const epoch = (value: unknown) => new Date(integer(value) * 1000).toISOString()
  return {
    observedAt,
    account: { uid: a.Uid, primaryPersonUid: member.personUid, stripeCustomerId: a.StripeId,
      livemode: boolean(a.IsLivemode), isDemo: boolean(a.IsDemo), isQa: /(?:^|[+._-])qa(?:[+._@-]|$)|@example\.(?:com|invalid)$/i.test(member.email) },
    member: { personUid: member.personUid, accountUid: member.accountUid, acContactId: requireNumericId(member.acContactId), acCustomerId: requireNumericId(member.acCustomerId) },
    invoice: { uid: i.Uid, accountUid: i.Subscription.Account.Uid, subscriptionUid: requireUid(i.Subscription.Uid),
      planUid: requireUid(i.Subscription.Plan?.Uid), renewalTerm: integer(i.Subscription.BillingRenewalTerm), status: integer(i.BillingInvoiceStatus),
      // Invoice.Currency is preferred; account billing currency is accepted only when explicitly returned.
      currency: typeof (i.Currency ?? a.Currency) === 'string' ? (i.Currency ?? a.Currency).toUpperCase() : null,
      outstandingMinor: outsetaAmountMinor(i.AmountOutstanding), paidMinor: outsetaAmountMinor(i.AmountPaid),
      refundedMinor: outsetaAmountMinor(i.AmountRefunded), creditMinor: outsetaAmountMinor(i.AmountCredit),
      isUserGenerated: boolean(i.IsUserGenerated), stripeChargeIds: chargeIds,
      lines: Array.isArray(i.InvoiceLineItems) ? i.InvoiceLineItems.map((l: Row) => ({ kind: integer(l.LineItemType), amountMinor: outsetaAmountMinor(l.Amount), taxMinor: outsetaAmountMinor(l.Tax) })) : [],
    },
    transactions: tx.filter(t => t.Invoice?.Uid === i.Uid).map(t => ({ uid: t.Uid, accountUid: t.Account.Uid, invoiceUid: t.Invoice.Uid,
      kind: integer(t.BillingTransactionType), amountMinor: outsetaAmountMinor(t.Amount), captured: boolean(t.IsCaptured),
      electronic: boolean(t.IsElectronicTransaction), occurredAt: outsetaUtc(t.TransactionDate) })), transactionsComplete: true,
    charge: { id: c.id, stripeAccountId: sa.id, customerId: c.customer, livemode: boolean(c.livemode), status: c.status,
      paid: boolean(c.paid), captured: boolean(c.captured), capturedMinor: integer(c.amount_captured), refundedMinor: integer(c.amount_refunded),
      disputed: boolean(c.disputed), currency: c.currency, createdAt: epoch(c.created), paymentIntentId: c.payment_intent },
    paymentIntent: { id: p.id, latestChargeId: p.latest_charge, customerId: p.customer, livemode: boolean(p.livemode), status: p.status,
      captureMethod: p.capture_method, receivedMinor: integer(p.amount_received), currency: p.currency },
    refunds: refunds.map(r => ({ id: r.id, chargeId: r.charge, status: r.status, amountMinor: integer(r.amount), currency: r.currency, occurredAt: epoch(r.created) })), refundsComplete: true,
  }
}
