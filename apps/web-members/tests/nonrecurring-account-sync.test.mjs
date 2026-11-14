import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

function load(file, modules = {}, globals = {}) {
  const context = { exports: {}, URL, Buffer, AbortSignal, console: { log() {}, warn() {}, error() {} }, process: { env: {} }, require: name => {
    if (!(name in modules)) throw Error('Unexpected dependency ' + name); return modules[name]
  }, ...globals }
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context); return context.exports
}
const plan = { DIRECTORY_PASS_PLAN_UID: 'PassPlan', PLAN_UIDS: { FREE: 'FreePlan' } }
const payment = load('../lib/directory-pass-payment.ts')
const orders = load('../lib/active-campaign-pass-orders.ts')
const entitlement = load('../lib/directory-pass-entitlement.ts', { 'server-only': {}, './plan-config': plan })
const reads = load('../lib/nonrecurring-provider-reads.ts', { '@/lib/directory-pass-payment': payment,
  '@/lib/directory-pass-entitlement': entitlement, '@/lib/plan-config': plan })
const ac = load('../lib/active-campaign-nonrecurring-client.ts', { '@/lib/nonrecurring-provider-reads': reads, '@/lib/active-campaign-pass-orders': orders })
function fixture({ mode = 'verify', missing = false, held = false, profileMissing = false, lostCustomer = false } = {}) {
  const calls = [], intents = new Set()
  const profile = { id: 'profile', user_email: 'member@fixture.test', outseta_person_uid: 'Person01', outseta_account_id: 'Account1',
    subscription_status: 'active', ac_contact_id: missing ? null : '123', ac_customer_id: missing ? null : '456' }
  let contact = missing ? null : { id: '123', email: profile.user_email }
  let customer = missing ? null : { id: '456', email: profile.user_email, externalid: 'Person01', connectionid: '4', acceptsMarketing: '1' }
  const account = { Uid: 'Account1', IsDemo: false, IsLivemode: true, AccountStage: 2, PersonAccount: [{ IsPrimary: true, Person: { Uid: 'Person01' } }],
    CurrentSubscription: { Uid: 'Subscr01', Plan: { Uid: 'FreePlan' }, EndDate: null }, LatestSubscription: { Uid: 'Subscr01' } }
  const db = { from(table) {
    let operation = 'read', value
    const q = { select() { return q }, eq() { return q }, is() { return q }, or() { return q }, limit() { return q },
      insert(v) { operation = 'insert'; value = v; return q }, update(v) { operation = 'update'; value = v; return q }, single() { return q },
      then(resolve) {
        if (table === 'profiles' && operation === 'read') return Promise.resolve({ data: profileMissing ? [] : [profile], error: null }).then(resolve)
        if (table === 'member_offboarding_holds') return Promise.resolve({ data: held ? [{ account_uid: 'Account1' }] : [], error: null }).then(resolve)
        if (table === 'profiles' && operation === 'update') { calls.push('profile-link'); Object.assign(profile, value); return Promise.resolve({ data: value, error: null }).then(resolve) }
        if (table === 'ac_nonrecurring_identity_intents' && operation === 'insert') {
          calls.push('intent:' + value.kind)
          if (intents.has(value.kind)) return Promise.resolve({ data: null, error: { code: '23505' } }).then(resolve)
          intents.add(value.kind); return Promise.resolve({ data: { person_uid: 'Person01' }, error: null }).then(resolve)
        }
        throw Error('unexpected_database_write')
      } }; return q
  } }
  const env = { AC_NONRECURRING_SYNC_MODE: mode, AC_CONNECTION_ID: '4', AC_API_URL: 'https://awilliams.api-us1.com', AC_API_KEY: 'fixture',
    OUTSETA_API_KEY: 'fixture', OUTSETA_API_SECRET: 'fixture' }
  const fetcher = async (url, init) => {
    const u = new URL(url), path = u.pathname, method = init.method
    calls.push(method + ':' + path)
    assert.equal(init.redirect, 'error'); assert.equal(init.cache, 'no-store')
    const respond = data => ({ ok: true, json: async () => data })
    if (url.includes('.outseta.com')) {
      assert.equal(method, 'GET')
      if (path.includes('/crm/accounts/')) return respond(account)
      if (path.includes('/crm/people/')) return respond({ Uid: 'Person01', Email: profile.user_email, PersonAccount: [{ IsPrimary: true, Account: { Uid: 'Account1' } }] })
      if (path.includes('/billing/transactions/')) return respond({ metadata: { total: 0 }, items: [] })
      if (path.includes('/billing/invoices/')) return respond({ Uid: 'Invoice1', AmountPaid: 0, Subscription: { Account: { Uid: 'Account1' }, Plan: { Uid: 'PassPlan' } } })
    }
    if (method === 'POST') {
      const body = JSON.parse(init.body)
      if (path.endsWith('/contact/sync')) { contact = { id: '123', ...body.contact }; return respond({ contact }) }
      if (path.endsWith('/ecomCustomers')) { if (lostCustomer) throw Error('transport'); customer = { id: '456', ...body.ecomCustomer }; return respond({ ecomCustomer: customer }) }
      throw Error('forbidden_provider_write')
    }
    if (path.endsWith('/contacts')) return respond({ contacts: contact ? [contact] : [], meta: { total: contact ? '1' : '0' } })
    if (path.endsWith('/ecomCustomers')) return respond({ ecomCustomers: customer ? [customer] : [], meta: { total: customer ? '1' : '0' } })
    if (path.endsWith('/automations')) return respond({ automations: [], meta: { total: '0' } })
    if (path.endsWith('/contactAutomations')) return respond({ contactAutomations: [], meta: { total: '0' } })
    throw Error('unexpected_request')
  }
  const service = load('../lib/nonrecurring-ac-sync.ts', { 'server-only': {}, '@/lib/supabase-admin': { createServiceRoleClient: () => db },
    '@/lib/plan-config': plan, '@/lib/directory-pass-payment': payment, '@/lib/active-campaign-pass-orders': orders,
    '@/lib/active-campaign-nonrecurring-client': ac, '@/lib/nonrecurring-provider-reads': reads }, { process: { env } })
  return { calls, account, profile, env, intents, run: invoice => service.reconcileNonrecurringAccount('Account1', invoice, { fetcher, now: () => '2026-11-14T18:00:00Z' }) }
}
test('verify mode confirms Free identity without provider, profile or receipt writes', async () => {
  const f = fixture(), result = await f.run()
  assert.equal(result.code, 'free_customer_only_nonrecurring'); assert.equal(result.providerWrite, false)
  assert.equal(f.calls.some(x => !x.startsWith('GET:')), false)
  assert.equal(f.calls.some(x => x.includes('billing')), false)
})
test('Free signup creates only contact/customer with durable intents and saves independently read links', async () => {
  const f = fixture({ mode: 'apply', missing: true }), result = await f.run()
  assert.equal(result.state, 'verified'); assert.equal(result.providerWrite, true)
  assert.ok(f.calls.indexOf('intent:contact') < f.calls.indexOf('POST:/api/3/contact/sync'))
  assert.ok(f.calls.indexOf('intent:customer') < f.calls.indexOf('POST:/api/3/ecomCustomers'))
  assert.equal(f.profile.ac_customer_id, '456'); assert.equal(f.profile.ac_contact_id, '123')
  const before = f.calls.filter(x => x.startsWith('POST:')).length
  assert.equal((await f.run()).providerWrite, false)
  assert.equal(f.calls.filter(x => x.startsWith('POST:')).length, before)
})
test('uncertain customer creation can only reconcile GET and never posts again', async () => {
  const f = fixture({ mode: 'apply', missing: true, lostCustomer: true })
  assert.equal((await f.run()).state, 'uncertain')
  const posts = f.calls.filter(x => x.startsWith('POST:')).length
  assert.equal((await f.run()).state, 'blocked')
  assert.equal(f.calls.filter(x => x.startsWith('POST:')).length, posts)
})
for (const [name, options, mutate] of [
  ['offboarding hold', { held: true }, () => {}], ['missing profile', { profileMissing: true }, () => {}],
  ['current cancellation', {}, f => f.account.AccountStage = 4], ['cached removal', {}, f => f.profile.subscription_status = 'removed'],
]) test('Free creation blocks ' + name, async () => {
  const f = fixture({ mode: 'apply', missing: true, ...options }); mutate(f)
  assert.equal((await f.run()).state, 'blocked'); assert.equal(f.calls.some(x => x.startsWith('POST:')), false)
})
test('live zero-dollar invoice is excluded before missing Stripe configuration is considered', async () => {
  const f = fixture(); f.account.CurrentSubscription.Plan.Uid = 'PassPlan'
  const result = await f.run('Invoice1')
  assert.equal(result.orders[0].code, 'zero_charge_invoice'); assert.equal(result.providerWrite, false)
})
test('actual zero-charge test account is excluded before Stripe or customer writes', async () => {
  const f = fixture({ mode: 'apply', missing: true }); f.account.IsLivemode = false
  const result = await f.run('Invoice1')
  assert.equal(result.code, 'qa_demo_or_test_account'); assert.equal(f.calls.some(x => x.startsWith('POST:')), false)
})
test('membership webhook calls Free reconciliation after profile insert and does not emit lifecycle or journey events', async () => {
  const calls = []
  const query = { select() { return query }, eq() { return query }, update() { return query }, insert() { calls.push('profile-insert'); return query },
    async single() { return calls.includes('profile-insert') ? { data: { id: 'profile' }, error: null } : { data: null, error: null } } }
  const route = load('../app/api/webhooks/outseta/route.ts', {
    'next/server': { NextResponse: { json: (data, init = {}) => ({ data, status: init.status || 200 }) } },
    '@supabase/supabase-js': { createClient: () => ({ from: () => query }) }, crypto: { default: { randomUUID: () => 'fixture-uuid' } },
    '@/lib/security': { verifyOutsetaSignature: () => true }, '@/lib/free-to-pro-lifecycle': { buildPaidLifecycleDecision: () => { throw Error('unexpected_lifecycle') } },
    '@/lib/conversion-events': { recordConversionEvent: async () => {} },
    '@/lib/free-journey-operation-producer': { emitFreeJourneySourceEvent: async () => { throw Error('unexpected_journey') } },
    '@/lib/outseta-billing-stage': { mapOutsetaBillingStage: () => 'active' },
    '@/lib/outseta-plan-billing': { isConfiguredDirectoryPass: () => false, mapOutsetaPlanTier: () => 'free', outsetaSubscriptionEndDate: () => null },
    '@/lib/nonrecurring-ac-sync': { reconcileNonrecurringAccount: async () => { calls.push('reconcile'); return { state: 'verified', code: 'free_customer_only_nonrecurring' } } },
  }, { process: { env: { AC_NONRECURRING_SYNC_MODE: 'apply', OUTSETA_WEBHOOK_SECRET: 'fixture', SUPABASE_URL: 'fixture', SUPABASE_SERVICE_ROLE_KEY: 'fixture' } } })
  const response = await route.POST({ headers: { get: () => 'fixture' }, text: async () => JSON.stringify({ Uid: 'Person01', Email: 'member@fixture.test',
    PersonAccount: [{ IsPrimary: true, Account: { Uid: 'Account1', CurrentSubscription: { Plan: { Uid: 'FreePlan' } } } }] }) })
  assert.equal(response.status, 200); assert.deepEqual(calls, ['profile-insert', 'reconcile'])
})
