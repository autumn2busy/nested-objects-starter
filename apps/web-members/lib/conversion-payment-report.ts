import 'server-only'

export type PaymentMember = { memberUid: string | null; accountUid: string | null }
type Account = { Uid: string; IsDemo: boolean; AccountStageLabel: string; CurrentSubscription?: { Rate: number; RenewalDate: string } }
type Invoice = { Uid: string; InvoiceDate: string; BillingInvoiceStatus: number; AmountPaid: number; AmountRefunded: number; AmountOutstanding: number; Subscription?: { Account?: { Uid: string } } }
type Transaction = { Uid: string; TransactionDate: string; BillingTransactionType: number; Amount: number; IsCaptured: boolean; IsElectronicTransaction: boolean; Account?: { Uid: string }; Invoice?: { Uid: string } }
export type PaymentEvidence = { accounts: Account[]; invoices: Invoice[]; transactions: Transaction[] }
export type PaymentReport = {
  status: 'complete' | 'partial' | 'unavailable'
  reason: string | null
  members: number
  matchedMembers: number
  recordedPaidMembers: number
  trialingMembers: number
  pastDueMembers: number
  refundedMembers: number
  unknownMembers: number
  recordedAmount: number
}

export function unavailablePaymentReport(members: number, reason: string): PaymentReport {
  return { status: 'unavailable', reason, members, matchedMembers: 0, recordedPaidMembers: 0,
    trialingMembers: 0, pastDueMembers: 0, refundedMembers: 0, unknownMembers: members, recordedAmount: 0 }
}

export function reconcilePaymentEvidence(members: PaymentMember[], evidence: PaymentEvidence, complete = true): PaymentReport {
  const accounts = new Map(evidence.accounts.filter(a => !a.IsDemo).map(a => [a.Uid, a]))
  const invoices = new Map(evidence.invoices.map(i => [i.Uid, i]))
  const paidAccounts = new Set<string>(), refundedAccounts = new Set<string>()
  const conflictingAccounts = new Set<string>()
  const amounts = new Map<string, { accountUid: string; amount: number }>()
  // Invoice AmountPaid can survive a refund. Zero-dollar and credited invoices are not payments.
  for (const invoice of invoices.values()) {
    const uid = invoice.Subscription?.Account?.Uid
    if (!uid || !accounts.has(uid) || !(invoice.AmountPaid > 0)) continue
    if (invoice.AmountRefunded >= invoice.AmountPaid) { refundedAccounts.add(uid); continue }
    if (![2, 3, 4, 6, 7].includes(invoice.BillingInvoiceStatus)) { conflictingAccounts.add(uid); continue }
    paidAccounts.add(uid)
    amounts.set(invoice.Uid, { accountUid: uid, amount: invoice.AmountPaid - (invoice.AmountRefunded || 0) })
  }
  // Outseta Payment=2 uses negative accounting amounts. Never require Amount > 0.
  for (const transaction of new Map(evidence.transactions.map(t => [t.Uid, t])).values()) {
    const uid = transaction.Account?.Uid
    if (!uid || !accounts.has(uid) || transaction.BillingTransactionType !== 2
      || !transaction.IsCaptured || !transaction.IsElectronicTransaction || !Number.isFinite(transaction.Amount)
      || Math.abs(transaction.Amount) === 0) continue
    const invoice = transaction.Invoice?.Uid ? invoices.get(transaction.Invoice.Uid) : undefined
    if (invoice && invoice.AmountRefunded >= Math.abs(transaction.Amount)) { refundedAccounts.add(uid); continue }
    // A linked invoice with zero paid amount conflicts with the captured payment record.
    if (invoice && !(invoice.AmountPaid > 0)) { conflictingAccounts.add(uid); continue }
    paidAccounts.add(uid)
    const key = invoice?.Uid || transaction.Uid
    if (!amounts.has(key)) amounts.set(key, { accountUid: uid, amount: Math.abs(transaction.Amount) - (invoice?.AmountRefunded || 0) })
  }
  const report: PaymentReport = { status: complete ? 'complete' : 'partial',
    reason: complete ? null : 'Billing reads were incomplete; missing outcomes remain unknown.',
    members: members.length, matchedMembers: 0, recordedPaidMembers: 0, trialingMembers: 0,
    pastDueMembers: 0, refundedMembers: 0, unknownMembers: 0, recordedAmount: 0 }
  const cohortAccounts = new Set(members.map(m => m.accountUid).filter((id): id is string => !!id))
  for (const member of members) {
    const account = member.accountUid ? accounts.get(member.accountUid) : undefined
    if (!account) { report.unknownMembers++; continue }
    report.matchedMembers++
    if (conflictingAccounts.has(account.Uid)) report.unknownMembers++
    else if (paidAccounts.has(account.Uid)) report.recordedPaidMembers++
    else if (!complete) report.unknownMembers++
    if (refundedAccounts.has(account.Uid) && !paidAccounts.has(account.Uid)) report.refundedMembers++
    // Free accounts can also have the Trialing stage; only a positive-rate plan is a paid trial.
    if ((account.CurrentSubscription?.Rate || 0) > 0 && account.AccountStageLabel === 'Trialing') report.trialingMembers++
    if (account.AccountStageLabel === 'Past Due') report.pastDueMembers++
  }
  for (const { accountUid: uid, amount } of amounts.values()) {
    if (uid && cohortAccounts.has(uid) && !conflictingAccounts.has(uid)) report.recordedAmount += amount
  }
  if (report.unknownMembers && report.status === 'complete') {
    report.status = 'partial'
    report.reason = 'Some billing identities or outcomes are unmatched or conflicting.'
  }
  return report
}

export async function readConversionPaymentReport(
  members: PaymentMember[],
  window: { startDate: string; endDate: string },
  options: { apiKey?: string; apiSecret?: string; fetcher?: typeof fetch } = {},
): Promise<PaymentReport> {
  if (!members.length) return reconcilePaymentEvidence([], { accounts: [], invoices: [], transactions: [] })
  const apiKey = options.apiKey ?? process.env.OUTSETA_API_KEY ?? process.env.NEXT_PUBLIC_OUTSETA_PUBLIC_KEY
  const apiSecret = options.apiSecret ?? process.env.OUTSETA_API_SECRET
  if (!apiKey || !apiSecret) return unavailablePaymentReport(members.length, 'Billing credentials are unavailable.')
  const accountIds = [...new Set(members.map(m => m.accountUid).filter((id): id is string => !!id))]
  if (accountIds.length > 50 || accountIds.some(id => !/^[A-Za-z0-9]{1,40}$/.test(id))) {
    return unavailablePaymentReport(members.length, 'Billing account scope exceeds the safe report limit.')
  }
  if (!accountIds.length) return unavailablePaymentReport(members.length, 'Signup identities are not linked to billing accounts.')
  const fetcher = options.fetcher ?? fetch
  const end = Date.parse(window.endDate), start = Date.parse(window.startDate)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return unavailablePaymentReport(members.length, 'Billing time window is invalid.')
  }
  const request = async (path: string, params: URLSearchParams) => {
    params.set('donotlog', '1')
    const response = await fetcher('https://nested-objects.outseta.com/api/v1/' + path + '?' + params, {
      method: 'GET', headers: { Authorization: 'Outseta ' + apiKey + ':' + apiSecret },
      cache: 'no-store', signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) throw new Error('Billing read failed')
    return response.json()
  }
  const evidence: PaymentEvidence = { accounts: [], invoices: [], transactions: [] }
  let complete = true
  // Read exact account IDs; never assume an unsupported collection filter was applied.
  for (let offset = 0; offset < accountIds.length; offset += 4) {
    const batch = await Promise.allSettled(accountIds.slice(offset, offset + 4).map(async uid => {
      const account = await request('crm/accounts/' + encodeURIComponent(uid), new URLSearchParams({
        fields: 'Uid,IsDemo,AccountStageLabel,CurrentSubscription.Rate,CurrentSubscription.RenewalDate',
      }))
      if (account.Uid !== uid || typeof account.IsDemo !== 'boolean' || typeof account.AccountStageLabel !== 'string') throw new Error('Invalid account')
      return account as Account
    }))
    for (const result of batch) {
      if (result.status === 'fulfilled') evidence.accounts.push(result.value)
      else complete = false
    }
  }
  if (!evidence.accounts.length) return unavailablePaymentReport(members.length, 'Billing account reads are unavailable.')
  const readCollection = async (path: string, dateField: string, fields: string) => {
    const result: Array<Record<string, unknown>> = []
    let previous = Infinity
    for (let offset = 0; offset < 500; offset += 100) {
      const data = await request(path, new URLSearchParams({ limit: '100', offset: String(offset),
        orderBy: dateField + ' DESC', [dateField + '__gte']: window.startDate,
        [dateField + '__lt']: window.endDate, fields }))
      if (!Array.isArray(data.items) || !data.metadata || !Number.isInteger(data.metadata.total)) throw new Error('Invalid collection')
      for (const row of data.items) {
        if (typeof row.Uid !== 'string' || (path === 'billing/invoices'
          ? !Number.isFinite(row.AmountPaid) || !Number.isFinite(row.AmountRefunded) || !Number.isInteger(row.BillingInvoiceStatus)
          : !Number.isFinite(row.Amount) || !Number.isInteger(row.BillingTransactionType)
            || typeof row.IsCaptured !== 'boolean' || typeof row.IsElectronicTransaction !== 'boolean')) throw new Error('Invalid billing row')
        const timestamp = Date.parse(row[dateField])
        if (!Number.isFinite(timestamp) || timestamp > previous) throw new Error('Invalid ordering')
        previous = timestamp
        if (timestamp >= start && timestamp < end) result.push(row)
      }
      if (offset + data.items.length >= data.metadata.total || previous < start) return result
      if (data.items.length !== 100) throw new Error('Incomplete collection page')
    }
    throw new Error('Collection cap reached')
  }
  // Discard failed/incomplete collection results rather than reporting false zero payments.
  const collections = await Promise.allSettled([
    readCollection('billing/invoices', 'InvoiceDate',
      'Uid,InvoiceDate,BillingInvoiceStatus,AmountPaid,AmountRefunded,AmountOutstanding,Subscription.Account.Uid'),
    readCollection('billing/transactions', 'TransactionDate',
      'Uid,TransactionDate,BillingTransactionType,Amount,IsCaptured,IsElectronicTransaction,Account.Uid,Invoice.Uid'),
  ])
  if (collections[0].status === 'fulfilled') evidence.invoices = collections[0].value as Invoice[]
  else complete = false
  if (collections[1].status === 'fulfilled') evidence.transactions = collections[1].value as Transaction[]
  else complete = false
  if (collections.every(r => r.status === 'rejected')) return unavailablePaymentReport(members.length, 'Invoice and payment reads are unavailable.')
  return reconcilePaymentEvidence(members, evidence, complete)
}
