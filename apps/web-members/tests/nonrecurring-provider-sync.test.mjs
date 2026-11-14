import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { timingSafeEqual } from 'node:crypto'

const plain = x => JSON.parse(JSON.stringify(x))
function load(file, modules = {}, globals = {}) {
  const context = { exports: {}, Buffer, URL, AbortSignal, process: { env: {} }, require: name => {
    if (!(name in modules)) throw Error('Unexpected dependency ' + name); return modules[name]
  }, ...globals }
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context)
  return context.exports
}
const payment = load('../lib/directory-pass-payment.ts')
const orders = load('../lib/active-campaign-pass-orders.ts')
const entitlement = load('../lib/directory-pass-entitlement.ts', { 'server-only': {}, './plan-config': { DIRECTORY_PASS_PLAN_UID: 'PassPlan' } })
const reads = load('../lib/nonrecurring-provider-reads.ts', { '@/lib/directory-pass-payment': payment,
  '@/lib/directory-pass-entitlement': entitlement, '@/lib/plan-config': { DIRECTORY_PASS_PLAN_UID: 'PassPlan' } })
const acLib = load('../lib/active-campaign-nonrecurring-client.ts', {
  '@/lib/nonrecurring-provider-reads': reads, '@/lib/active-campaign-pass-orders': orders,
})
const member = { personUid: 'Person01', accountUid: 'Account1', email: 'member@example.invalid', acContactId: '123', acCustomerId: '456' }
const account = () => ({ Uid: 'Account1', IsLivemode: true, IsDemo: false, AccountStage: 2,
  PersonAccount: [{ IsPrimary: true, Person: { Uid: 'Person01' } }],
  CurrentSubscription: { Uid: 'Subscr01', Plan: { Uid: 'FreePlan' }, EndDate: null, ExpirationDate: null },
  LatestSubscription: { Uid: 'Subscr01' }, StripeId: 'cus_fixture', Currency: 'USD' })
const person = () => ({ Uid: 'Person01', Email: member.email, PersonAccount: [{ IsPrimary: true, Account: { Uid: 'Account1' } }] })
const now = '2026-11-14T18:00:00Z'
test('Free customer creation requires exact active primary authority with no hold', () => {
  reads.verifyAccountPerson(account(), person(), member)
  assert.equal(reads.mayCreateNonrecurringCustomer(account(), 'FreePlan', false, now), true)
  for (const change of [a => a.IsLivemode = false, a => a.IsDemo = true, a => a.AccountStage = 4,
    a => a.AccountStage = 5, a => a.CurrentSubscription.EndDate = now, a => a.LatestSubscription.Uid = 'other',
    a => a.CurrentSubscription.Plan.Uid = 'PaidPlan', a => a.IsArchived = true, a => a.IsDeleted = true,
    a => a.CurrentSubscription.ExpirationDate = '2026-11-13T00:00:00']) {
    const a = account(); change(a); assert.equal(reads.mayCreateNonrecurringCustomer(a, 'FreePlan', false, now), false)
  }
  assert.equal(reads.mayCreateNonrecurringCustomer(account(), 'FreePlan', true, now), false)
})
test('active Pass accepts the real far-future end sentinel while enforcing actual expiry, cancellation and holds', () => {
  const a = account(); a.AccountStage = 3; a.AccountStageLabel = 'Subscribing'
  a.CurrentSubscription = { Uid: 'Subscr01', Account: { Uid: 'Account1' }, BillingRenewalTerm: 4,
    Plan: { Uid: 'PassPlan', OneTimeRate: 199, ExpiresAfterMonths: 12, TrialPeriodDays: 0 },
    StartDate: '2026-11-14T17:00:00', EndDate: '2099-12-31T00:00:00', ExpirationDate: '2027-11-14T17:00:00' }
  assert.equal(reads.mayCreateNonrecurringCustomer(a, 'PassPlan', false, now), true)
  assert.equal(reads.mayCreateNonrecurringCustomer(a, 'PassPlan', true, now), false)
  for (const mutate of [x => x.CurrentSubscription.ExpirationDate = '2026-11-14T17:59:00',
    x => x.CurrentSubscription.EndDate = '2026-11-14T17:59:00', x => x.AccountStage = 4,
    x => x.CurrentSubscription.ExpirationDate = '2028-11-14T17:00:00', x => x.CurrentSubscription.ExpirationDate = null]) {
    const x = plain(a); mutate(x); assert.equal(reads.mayCreateNonrecurringCustomer(x, 'PassPlan', false, now), false)
  }
})
for (const [name, mutate] of Object.entries({
  account: a => a.Uid = 'Other001', primary: a => a.PersonAccount[0].Person.Uid = 'Other001',
  ambiguous: a => a.PersonAccount.push({ IsPrimary: true, Person: { Uid: 'Other001' } }),
})) test('identity rejects ' + name, () => { const a = account(); mutate(a); assert.throws(() => reads.verifyAccountPerson(a, person(), member)) })
test('account transactions require complete stable totals and exact account ownership', async () => {
  const row = { Uid: 'Trans001', Account: { Uid: 'Account1' } }
  assert.equal((await reads.readAccountTransactions(async () => ({ metadata: { total: 1 }, items: [row] }), 'Account1')).length, 1)
  for (const page of [{ metadata: { total: 2 }, items: [row] }, { metadata: { total: 1 }, items: [{ ...row, Account: { Uid: 'Other001' } }] },
    { items: [] }, { metadata: { total: 2 }, items: [row, row] }]) await assert.rejects(reads.readAccountTransactions(async () => page, 'Account1'))
})
function safeAc(overrides = {}) {
  return async path => {
    if (path in overrides) return overrides[path]
    if (path.startsWith('automations?')) return { automations: [{ id: '527', status: '1' }, { id: '528', status: '1' }], meta: { total: '2' } }
    if (path.startsWith('automations/527/')) return { automationTriggers: [{ seriesid: '527', multientry: '0', type: 'field', params: {
      field: '193', changes: 'ever', action: 'addupdate', accountfield: false, dealfield: false,
    } }] }
    if (path.startsWith('automations/528/')) return { automationTriggers: [{ seriesid: '528', multientry: '0', type: 'none', params: [] }] }
    if (path.includes('contactAutomations')) return { contactAutomations: [], meta: { total: '0' } }
    throw Error('unexpected_path')
  }
}
test('no-email preflight accepts only inspected starts and a complete inactive contact history', async () => {
  await acLib.verifyNonrecurringNoEmail(safeAc(), '123')
  await acLib.verifyNonrecurringNoEmail(safeAc(), null)
  await acLib.verifyNonrecurringNoEmail(safeAc({ 'contacts/123/contactAutomations': { contactAutomations: [] } }), '123')
})
for (const [name, path, value] of [
  ['unknown active automation', 'automations?filters[status]=1&limit=100&offset=0', { automations: [{ id: '999', status: '1' }], meta: { total: '1' } }],
  ['incomplete roster', 'automations?filters[status]=1&limit=100&offset=0', { automations: [], meta: { total: '1' } }],
  ['new purchase trigger', 'automations/527/triggers?limit=100&offset=0', { automationTriggers: [{ seriesid: '527', multientry: '0', type: 'purchase', params: {} }] }],
  ['active run', 'contacts/123/contactAutomations', { contactAutomations: [{ id: '8', contact: '123', status: '1' }], meta: { total: '1' } }],
  ['missing history', 'contacts/123/contactAutomations', {}],
  ['other contact run', 'contacts/123/contactAutomations', { contactAutomations: [{ id: '8', contact: '999', status: '2' }], meta: { total: '1' } }],
]) test('no-email preflight blocks ' + name, async () => { await assert.rejects(acLib.verifyNonrecurringNoEmail(safeAc({ [path]: value }), '123')) })
test('customer creation contains no consent grant, order, recurring schedule, field, list or tag', async () => {
  const writes = []
  const client = acLib.createNonrecurringAcClient(async (...args) => { writes.push(args); return {} }, '4')
  await client.createContact(member); await client.createCustomer(member)
  assert.deepEqual(plain(writes), [
    ['contact/sync', 'POST', { contact: { email: member.email } }],
    ['ecomCustomers', 'POST', { ecomCustomer: { connectionid: '4', externalid: 'Person01', email: member.email, acceptsMarketing: 0 } }],
  ])
})
test('customer lookup refuses missing stored link, foreign email and duplicate legacy connections', async () => {
  const row = { id: '456', connectionid: '4', externalid: member.personUid, email: member.email, acceptsMarketing: '1' }
  const client = rows => acLib.createNonrecurringAcClient(async () => ({ ecomCustomers: rows, meta: { total: String(rows.length) } }), '4')
  assert.equal(await client([row]).findCustomer(member), '456')
  assert.equal(await client([row, { ...row, id: '789', connectionid: '0', externalid: '0' }]).findCustomer(member), '456')
  for (const rows of [[], [row, { ...row, id: '789', connectionid: '1' }], [{ ...row, externalid: 'Other001' }], [{ ...row, email: 'other@example.invalid' }]]) {
    await assert.rejects(client(rows).findCustomer(member))
  }
})
test('order readback verifies exact product IDs and parent order, not aggregate revenue', async () => {
  const row = { id: '99', externalid: 'outseta-pass-invoice-Invoice1', connectionid: '4', customerid: '456', source: '0',
    totalPrice: '9900', currency: 'USD', externalCreatedDate: now, orderProducts: ['42'] }
  const product = { id: '42', orderid: '99', externalid: 'PassPlan', price: '9900', quantity: '1' }
  const client = p => acLib.createNonrecurringAcClient(async path => path.includes('/orderProducts') ? { ecomOrderProducts: [p] }
    : { ecomOrders: [row], meta: { total: '1' } }, '4')
  assert.equal((await client(product).findOrder(row.externalid)).totalMinor, 9900)
  await assert.rejects(client({ ...product, orderid: '88' }).findOrder(row.externalid))
  await assert.rejects(client({ ...product, id: '41' }).findOrder(row.externalid))
})
test('payment reader pins Stripe account, normalizes Outseta UTC, and reads refunds to completion', async () => {
  const a = account(), calls = []
  const invoice = { Uid: 'Invoice1', Subscription: { Uid: 'Subscr01', Account: { Uid: 'Account1' }, Plan: { Uid: 'PassPlan' }, BillingRenewalTerm: 4 },
    BillingInvoiceStatus: 2, AmountOutstanding: 0, AmountPaid: 99, AmountRefunded: 0, AmountCredit: 0, IsUserGenerated: false,
    StripePaymentTransactionIds: 'ch_fixture', InvoiceLineItems: [{ LineItemType: 1, Amount: 99, Tax: 0 }] }
  const tx = [{ Uid: 'Trans001', Account: { Uid: 'Account1' }, Invoice: { Uid: 'Invoice1' }, BillingTransactionType: 2,
    Amount: -99, IsCaptured: true, IsElectronicTransaction: true, TransactionDate: '2026-11-14T17:59:05' }]
  const stripe = async path => { calls.push(path)
    if (path === 'account') return { id: 'acct_fixture' }
    if (path.startsWith('charges/')) return { id: 'ch_fixture', customer: 'cus_fixture', payment_intent: 'pi_fixture', livemode: true,
      status: 'succeeded', paid: true, captured: true, amount_captured: 9900, amount_refunded: 0, disputed: false, currency: 'usd', created: Date.parse('2026-11-14T17:59:00Z') / 1000 }
    if (path.startsWith('payment_intents/')) return { id: 'pi_fixture', latest_charge: 'ch_fixture', customer: 'cus_fixture', livemode: true,
      status: 'succeeded', capture_method: 'automatic', amount_received: 9900, currency: 'usd' }
    return { data: [], has_more: false }
  }
  const input = { outseta: async () => invoice, stripe, account: a, member: { ...member, email: 'member@fixture.test' },
    invoiceUid: 'Invoice1', transactions: tx, expectedStripeAccountId: 'acct_fixture', observedAt: now }
  const evidence = await reads.readPassPaymentEvidence(input)
  assert.equal(evidence.transactions[0].occurredAt, '2026-11-14T17:59:05.000Z')
  assert.equal(payment.assessDirectoryPassPayment(evidence, { planUid: 'PassPlan', stripeAccountId: 'acct_fixture' }, now).state, 'ready')
  await assert.rejects(reads.readPassPaymentEvidence({ ...input, expectedStripeAccountId: 'acct_other' }))
  a.Currency = null
  assert.equal((await reads.readPassPaymentEvidence(input)).invoice.currency, null)
  assert.ok(calls.includes('refunds?charge=ch_fixture&limit=100'))
})
test('dedicated route fails closed and accepts only authenticated exact scope', async () => {
  const calls = [], env = { AC_NONRECURRING_SYNC_MODE: 'verify', AC_NONRECURRING_RECONCILE_SECRET: 'fixture-secret', OUTSETA_WEBHOOK_SECRET: 'signed-secret' }
  const route = load('../app/api/webhooks/outseta-nonrecurring/route.ts', {
    'next/server': { NextResponse: { json: (data, init) => ({ data, ...init }) } },
    'node:crypto': { timingSafeEqual }, '@/lib/security': { verifyOutsetaSignature: (s, body, secret) => s === 'fixture-signature' && secret === 'signed-secret' },
    '@/lib/nonrecurring-ac-sync': { reconcileNonrecurringAccount: async (...args) => { calls.push(args); return { state: 'verified', code: 'fixture' } } },
  }, { process: { env } })
  const req = (data, headers = {}) => ({ text: async () => JSON.stringify(data), headers: new Headers(headers) })
  assert.equal((await route.POST(req({ accountUid: 'Account1' }))).status, 401)
  assert.equal((await route.POST(req({ Uid: 'Person01', Email: 'person@fixture.test' }, { 'x-hub-signature-256': 'fixture-signature' }))).status, 400)
  assert.equal((await route.POST(req({ Uid: 'Account1', PersonAccount: [] }, { 'x-hub-signature-256': 'fixture-signature' }))).status, 200)
  assert.equal((await route.POST(req({ accountUid: 'Account1', invoiceUid: 'Invoice1' }, { authorization: 'Bearer fixture-secret' }))).status, 200)
  assert.equal(calls.length, 2)
  env.AC_NONRECURRING_SYNC_MODE = 'off'
  assert.equal((await route.POST(req({ accountUid: 'Account1' }, { authorization: 'Bearer fixture-secret' }))).status, 503)
})
