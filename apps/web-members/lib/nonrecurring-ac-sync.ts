import 'server-only'
import { createServiceRoleClient } from '@/lib/supabase-admin'
import { DIRECTORY_PASS_PLAN_UID, PLAN_UIDS } from '@/lib/plan-config'
import { assessDirectoryPassPayment, type PassOrderProjection } from '@/lib/directory-pass-payment'
import { syncPassOrder, type PassOrderLease, type PassOrderSyncResult } from '@/lib/active-campaign-pass-orders'
import { createNonrecurringAcClient, type AcRequest } from '@/lib/active-campaign-nonrecurring-client'
import { mayCreateNonrecurringCustomer, readAccountTransactions, readPassPaymentEvidence, requireUid,
  requireNumericId, verifyAccountPerson, type JsonRead, type NonrecurringMember } from '@/lib/nonrecurring-provider-reads'

type Row = Record<string, any>
export type NonrecurringResult = { state: 'verified' | 'blocked' | 'skipped' | 'uncertain'; code: string;
  customer: string; orders: Array<{ state: string; code: string; providerWrite: boolean }>; providerWrite: boolean }

function configuration() {
  const mode = process.env.AC_NONRECURRING_SYNC_MODE
  if (mode !== 'verify' && mode !== 'apply') throw Error('nonrecurring_sync_disabled')
  const connectionId = requireNumericId(process.env.AC_CONNECTION_ID)
  const acUrl = new URL(process.env.AC_API_URL || '')
  // This integration is scoped to this tenant; do not transmit credentials to caller URLs.
  if (acUrl.origin !== 'https://awilliams.api-us1.com' || acUrl.pathname !== '/') throw Error('unverified_ac_origin')
  const acKey = process.env.AC_API_KEY
  const outsetaKey = process.env.OUTSETA_API_KEY || process.env.NEXT_PUBLIC_OUTSETA_PUBLIC_KEY
  const outsetaSecret = process.env.OUTSETA_API_SECRET
  if (!acKey || !outsetaKey || !outsetaSecret || !DIRECTORY_PASS_PLAN_UID) throw Error('missing_nonrecurring_configuration')
  return { apply: mode === 'apply', connectionId, acKey, outsetaKey, outsetaSecret,
    stripeKey: process.env.STRIPE_SECRET_KEY, stripeAccountId: process.env.AC_PASS_STRIPE_ACCOUNT_ID }
}

function transport(base: string, headers: Record<string, string>, fetcher: typeof fetch): AcRequest {
  return async (path, method = 'GET', body) => {
    if (path.startsWith('/') || path.includes('://') || path.includes('..')) throw Error('invalid_provider_path')
    const response = await fetcher(base + path, { method, redirect: 'error', cache: 'no-store',
      headers: { ...headers, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    if (!response.ok) throw Error('provider_request_failed')
    return response.json()
  }
}

/** Exact account only. No bulk enrollment, marketing permission, tags, or lifecycle events.
 * Each call rereads identity, offboarding holds, billing and native automation state.
 * Verification mode never writes, including profile links and retry receipts.
 */
export async function reconcileNonrecurringAccount(accountUid: string, invoiceUid?: string,
  options: { fetcher?: typeof fetch; now?: () => string } = {}): Promise<NonrecurringResult> {
  const result: NonrecurringResult = { state: 'blocked', code: 'verification_incomplete', customer: 'unverified', orders: [], providerWrite: false }
  try {
    requireUid(accountUid); if (invoiceUid) requireUid(invoiceUid)
    const config = configuration(), fetcher = options.fetcher || fetch, now = options.now || (() => new Date().toISOString())
    const db = createServiceRoleClient()
    const outseta: JsonRead = transport('https://nested-objects.outseta.com/api/v1/', { Authorization: `Outseta ${config.outsetaKey}:${config.outsetaSecret}` }, fetcher)
    const ac = transport('https://awilliams.api-us1.com/api/3/', { 'Api-Token': config.acKey }, fetcher)
    const client = createNonrecurringAcClient(ac, config.connectionId)
    const profileRead = await db.from('profiles').select('id,user_email,outseta_person_uid,outseta_account_id,ac_contact_id,ac_customer_id,subscription_status')
      .eq('outseta_account_id', accountUid).limit(2)
    if (profileRead.error || profileRead.data?.length !== 1) throw Error('exact_existing_member_required')
    const profile = profileRead.data[0]
    const member: NonrecurringMember = { personUid: requireUid(profile.outseta_person_uid), accountUid,
      email: profile.user_email, acContactId: profile.ac_contact_id ? requireNumericId(profile.ac_contact_id) : null,
      acCustomerId: profile.ac_customer_id ? requireNumericId(profile.ac_customer_id) : null }
    if (typeof member.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) throw Error('member_email_invalid')
    const [account, person, holds] = await Promise.all([
      outseta(`crm/accounts/${accountUid}?donotlog=1&fields=*,PersonAccount.*,PersonAccount.Person.*,CurrentSubscription.*,CurrentSubscription.Plan.*,CurrentSubscription.Account.Uid,LatestSubscription.*`),
      outseta(`crm/people/${member.personUid}?donotlog=1&fields=Uid,Email,PersonAccount.*,PersonAccount.Account.Uid`),
      db.from('member_offboarding_holds').select('account_uid,person_uid,released_at').or(`account_uid.eq.${accountUid},person_uid.eq.${member.personUid}`).is('released_at', null).limit(1),
    ])
    if (holds.error || !Array.isArray(holds.data)) throw Error('offboarding_hold_read_unavailable')
    verifyAccountPerson(account, person, member)
    const planUid = account.CurrentSubscription?.Plan?.Uid
    if (planUid !== PLAN_UIDS.FREE && planUid !== DIRECTORY_PASS_PLAN_UID && !invoiceUid) return { ...result, state: 'skipped', code: 'outside_nonrecurring_scope' }
    if (account.IsLivemode !== true || account.IsDemo !== false || /(?:^|[+._-])qa(?:[+._@-]|$)|@example\.(?:com|invalid)$/i.test(member.email)) {
      return { ...result, state: 'skipped', code: 'qa_demo_or_test_account' }
    }
    const eligible = mayCreateNonrecurringCustomer(account, planUid, holds.data.length > 0, now()) &&
      !['canceled', 'cancelled', 'removed', 'archived', 'paused', 'past_due'].includes(profile.subscription_status || '') &&
      [PLAN_UIDS.FREE, DIRECTORY_PASS_PLAN_UID].includes(planUid)
    // Existing identities can be read for a refund; never create/reactivate on cancellation.
    member.acContactId = await client.findContact(member)
    member.acCustomerId = await client.findCustomer(member)
    const markIdentityIntent = async (kind: 'contact' | 'customer') => {
      const inserted = await db.from('ac_nonrecurring_identity_intents').insert({ connection_id: config.connectionId,
        person_uid: member.personUid, account_uid: accountUid, kind }).select('person_uid').single()
      if (inserted.error || !inserted.data) throw Error('prior_identity_intent_no_blind_retry')
    }
    if (!member.acContactId || !member.acCustomerId) {
      if (!eligible) throw Error('inactive_or_held_member_not_created')
      if (!config.apply) return { ...result, code: 'identity_creation_required_verify_only' }
      if (!member.acContactId) {
        await client.noEmailPreflight(null)
        await markIdentityIntent('contact')
        result.providerWrite = true
        try { await client.createContact(member) } catch { /* GET decides uncertain outcome. */ }
        member.acContactId = await client.findContact(member)
        if (!member.acContactId) return { ...result, state: 'uncertain', code: 'contact_write_unconfirmed_no_replay' }
      }
      if (!member.acCustomerId) {
        await client.noEmailPreflight(member.acContactId)
        await markIdentityIntent('customer')
        result.providerWrite = true
        try { await client.createCustomer(member) } catch { /* GET decides uncertain outcome. */ }
        member.acCustomerId = await client.findCustomer(member)
        if (!member.acCustomerId) return { ...result, state: 'uncertain', code: 'customer_write_unconfirmed_no_replay' }
      }
    }
    result.customer = 'identity_readback_verified'
    if (config.apply && eligible && (profile.ac_contact_id !== member.acContactId || profile.ac_customer_id !== member.acCustomerId)) {
      // Compare-and-set both original links; unrelated profile edits are preserved.
      let update = db.from('profiles').update({ ac_contact_id: member.acContactId, ac_customer_id: member.acCustomerId })
        .eq('id', profile.id).eq('outseta_person_uid', member.personUid).eq('outseta_account_id', accountUid)
      update = profile.ac_contact_id ? update.eq('ac_contact_id', profile.ac_contact_id) : update.is('ac_contact_id', null)
      update = profile.ac_customer_id ? update.eq('ac_customer_id', profile.ac_customer_id) : update.is('ac_customer_id', null)
      const saved = await update.select('ac_contact_id,ac_customer_id').single()
      if (saved.error || saved.data?.ac_contact_id !== member.acContactId || saved.data?.ac_customer_id !== member.acCustomerId) throw Error('profile_link_readback_conflict')
    }
    if (planUid === PLAN_UIDS.FREE && !invoiceUid) return { ...result, state: 'verified', code: 'free_customer_only_nonrecurring' }
    const transactions = await readAccountTransactions(outseta, accountUid)
    const invoiceIds = invoiceUid ? [invoiceUid] : [...new Set(transactions.filter(t => [2, 4].includes(t.BillingTransactionType)).map(t => requireUid(t.Invoice?.Uid)))]
    if (invoiceIds.length > 20) throw Error('invoice_scope_exceeds_limit')
    for (const uid of invoiceIds) {
      const invoice = await outseta(`billing/invoices/${uid}?donotlog=1`)
      if (invoice.Uid !== uid || invoice.Subscription?.Account?.Uid !== accountUid) throw Error('invoice_identity_conflict')
      if (invoice.Subscription?.Plan?.Uid !== DIRECTORY_PASS_PLAN_UID) continue
      if (invoice.AmountPaid === 0) { result.orders.push({ state: 'skipped', code: 'zero_charge_invoice', providerWrite: false }); continue }
      if (!config.stripeKey || !/^acct_[A-Za-z0-9]+$/.test(config.stripeAccountId || '')) throw Error('stripe_account_pin_required')
      const stripe: JsonRead = transport('https://api.stripe.com/v1/', { Authorization: `Bearer ${config.stripeKey}`, 'Stripe-Version': '2025-06-30.basil' }, fetcher)
      const evidence = await readPassPaymentEvidence({ outseta, stripe, account, member, invoiceUid: uid,
        transactions, expectedStripeAccountId: config.stripeAccountId!, observedAt: now() })
      const decision = assessDirectoryPassPayment(evidence, { planUid: DIRECTORY_PASS_PLAN_UID, stripeAccountId: config.stripeAccountId! }, now())
      if (decision.state === 'ready' && !eligible) decision.createAllowed = false
      if (!config.apply) {
        result.orders.push({ state: decision.state === 'ready' ? 'verified' : decision.state,
          code: decision.state === 'ready' ? 'payment_evidence_verified_no_write' : decision.reason, providerWrite: false }); continue
      }
      const rpc = async (name: string, args: Row) => { const r = await db.rpc(name, args); if (r.error) throw Error('receipt_operation_failed'); return r.data }
      const identity = (o: PassOrderProjection) => ({ accountUid: o.accountUid, acContactId: o.acContactId, acCustomerId: o.acCustomerId,
        capturedMinor: o.capturedMinor, currency: o.currency, externalId: o.externalId, paidAt: o.paidAt, personUid: o.personUid,
        planUid: o.planUid, stripeAccountId: o.stripeAccountId, stripeChargeId: o.stripeChargeId, subscriptionUid: o.subscriptionUid })
      const synced: PassOrderSyncResult = await syncPassOrder(decision, config.connectionId, {
        claim: async o => await rpc('claim_ac_pass_order_sync', { p_connection_id: config.connectionId, p_invoice_uid: o.invoiceUid,
          p_identity: identity(o), p_refunded_minor: o.refundedMinor }) as PassOrderLease | null,
        markWriteStarted: async token => { await rpc('mark_ac_pass_order_write', { p_token: token }) },
        finish: async (token, r) => { await rpc('finish_ac_pass_order_sync', { p_token: token, p_state: r.state, p_code: r.code,
          p_order_id: r.orderId || null, p_refunded_minor: r.refundedMinor ?? null }) },
        noEmailPreflight: client.noEmailPreflight, findOrder: client.findOrder,
        createOrder: o => client.createOrder(o, member.email), updateOrder: (id, o) => client.updateOrder(id, o, member.email),
      })
      result.orders.push(synced); result.providerWrite ||= synced.providerWrite
    }
    const uncertain = result.orders.some(x => x.state === 'uncertain')
    const blocked = result.orders.some(x => x.state === 'blocked' || x.state === 'busy')
    return { ...result, state: uncertain ? 'uncertain' : blocked ? 'blocked' : 'verified',
      code: !result.orders.length ? 'customer_verified_no_pass_cash_invoice' : 'nonrecurring_reconciliation_finished' }
  } catch (error) {
    // No provider response, email, credential, body, or raw exception is returned/logged.
    const code = error instanceof Error && /^[a-z][a-z0-9_]{1,90}$/.test(error.message) ? error.message : 'provider_verification_unavailable'
    return { ...result, state: result.providerWrite ? 'uncertain' : 'blocked', code }
  }
}
