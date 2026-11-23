import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import crypto from 'node:crypto'
import ts from 'typescript'

function load(file, modules = {}, globals = {}) {
  const context = { exports: {}, URL, Buffer, AbortSignal, Date, process: { env: {} }, require: name => {
    if (!(name in modules)) throw Error('Unexpected dependency ' + name)
    return modules[name]
  }, ...globals }
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context)
  return context.exports
}
const plan = { DIRECTORY_PASS_PLAN_UID: 'PassPlan', PLAN_UIDS: { FREE: 'FreePlan' } }
const payment = load('../lib/directory-pass-payment.ts')
const orders = load('../lib/active-campaign-pass-orders.ts')
const entitlement = load('../lib/directory-pass-entitlement.ts', { 'server-only': {}, './plan-config': plan })
const reads = load('../lib/nonrecurring-provider-reads.ts', { '@/lib/directory-pass-payment': payment,
  '@/lib/directory-pass-entitlement': entitlement, '@/lib/plan-config': plan })
const ac = load('../lib/active-campaign-nonrecurring-client.ts', {
  '@/lib/nonrecurring-provider-reads': reads, '@/lib/active-campaign-pass-orders': orders })
const scopes = load('../lib/free-customer-scope.ts')
const security = load('../lib/security.ts', { crypto: { default: crypto } })
const NOW = Date.parse('2026-11-23T19:00:00Z')
const scopeFixture = (mode = 'verify') => ({ mode, accountUid: 'Account1', personUid: 'Person01', acContactId: '123', expiresAt: new Date(NOW + 900_000).toISOString() })
const inputFixture = (mode = 'verify') => ({ operation: scopes.FREE_CUSTOMER_OPERATION, mode, issuedAt: NOW, accountUid: 'Account1', personUid: 'Person01' })
const clone = x => JSON.parse(JSON.stringify(x))

function fixture(mode = 'verify') {
  const scope = scopeFixture(mode), input = inputFixture(mode), calls = [], sql = [], writes = []
  const state = { intent: false, customer: null, hold: false, holdUnavailable: false, missingProfile: false,
    duplicateProfile: false, contactMissing: false, activeJourney: false, unknownTrigger: false,
    customerTotalWrong: false, lostPost: false, acceptedThenTimeout: false, casConflict: false,
    linkReadbackWrong: false, postHold: false, postJourney: false, delayed: false, rawError: false }
  const profile = { id: 'profile-1', user_email: 'member@fixture.test', outseta_person_uid: 'Person01', outseta_account_id: 'Account1',
    plan_uid: 'FreePlan', subscription_status: 'active', ac_contact_id: '123', ac_customer_id: null }
  const account = { Uid: 'Account1', IsDemo: false, IsLivemode: false, AccountStage: 2, StripeId: null, PaymentInformation: null,
    PersonAccount: [{ IsPrimary: true, Person: { Uid: 'Person01' } }], CurrentSubscription: {
      Uid: 'Subscr01', Account: { Uid: 'Account1' }, Plan: { Uid: 'FreePlan' }, EndDate: null, ExpirationDate: null,
    }, LatestSubscription: { Uid: 'Subscr01' } }
  const person = { Uid: 'Person01', Email: profile.user_email, PersonAccount: [{ IsPrimary: true, Account: { Uid: 'Account1' } }] }
  const env = { VERCEL_ENV: 'production', AC_FREE_CUSTOMER_SYNC_SCOPE: JSON.stringify(scope),
    AC_CONNECTION_ID: '4', AC_API_URL: 'https://awilliams.api-us1.com', AC_API_KEY: 'fixture-ac-key',
    OUTSETA_API_KEY: 'fixture-outseta-key', OUTSETA_API_SECRET: 'fixture-outseta-secret' }
  const db = { from(table) {
    let operation = 'read', value, single = false
    const filters = []
    const q = { select() { return q }, eq(...v) { filters.push(['eq', ...v]); return q }, is(...v) { filters.push(['is', ...v]); return q },
      or(...v) { filters.push(['or', ...v]); return q }, limit() { return q }, single() { single = true; return q },
      insert(v) { operation = 'insert'; value = clone(v); return q }, update(v) { operation = 'update'; value = clone(v); return q },
      then(resolve, reject) {
        sql.push({ table, operation, value, filters })
        let response
        if (table === 'profiles' && operation === 'read') {
          response = { data: single ? { ...profile, ...(state.linkReadbackWrong ? { ac_customer_id: '999' } : {}) } :
            state.missingProfile ? [] : state.duplicateProfile ? [clone(profile), clone(profile)] : [clone(profile)], error: null }
        } else if (table === 'member_offboarding_holds' && operation === 'read') {
          response = { data: state.hold || (state.postHold && state.customer) ? [{}] : [], error: state.holdUnavailable ? {} : null }
        } else if (table === 'ac_nonrecurring_identity_intents' && operation === 'read') {
          response = { data: state.intent ? [{ person_uid: 'Person01' }] : [], error: null }
        } else if (table === 'ac_nonrecurring_identity_intents' && operation === 'insert') {
          writes.push('intent')
          if (state.intent) response = { data: null, error: { code: '23505' } }
          else { state.intent = true; response = { data: { person_uid: 'Person01' }, error: null } }
        } else if (table === 'profiles' && operation === 'update') {
          writes.push('profile')
          if (state.casConflict) response = { data: null, error: {} }
          else { Object.assign(profile, value); response = { data: clone(value), error: null } }
        } else throw Error('Unexpected database operation')
        return Promise.resolve(response).then(resolve, reject)
      } }
    return q
  } }
  const respond = data => ({ ok: true, json: async () => clone(data) })
  const fetcher = async (url, init) => {
    const u = new URL(url), path = u.pathname, method = init.method
    calls.push({ origin: u.origin, path, method, body: init.body && JSON.parse(init.body) })
    assert.equal(init.redirect, 'error'); assert.equal(init.cache, 'no-store')
    if (state.rawError) throw Error('secret_customer_name')
    if (u.origin === 'https://nested-objects.outseta.com') {
      assert.equal(method, 'GET')
      if (path.endsWith('/crm/accounts/' + scope.accountUid)) return respond(account)
      if (path.endsWith('/crm/people/' + scope.personUid)) return respond(person)
      throw Error('Forbidden billing lookup')
    }
    assert.equal(u.origin, 'https://awilliams.api-us1.com')
    if (method !== 'GET') {
      assert.equal(method, 'POST'); assert.equal(path, '/api/3/ecomCustomers')
      assert.ok(state.intent); writes.push('customer')
      if (state.lostPost) throw Error('timeout')
      state.customer = { id: '456', ...JSON.parse(init.body).ecomCustomer }
      if (state.acceptedThenTimeout) throw Error('timeout')
      return respond({ ecomCustomer: state.customer })
    }
    if (path.endsWith('/contacts')) return respond({ contacts: state.contactMissing ? [] : [{ id: '123', email: profile.user_email }], meta: { total: state.contactMissing ? '0' : '1' } })
    if (path.endsWith('/ecomCustomers')) return respond({ ecomCustomers: state.customer ? [state.customer] : [], meta: { total: state.customerTotalWrong ? '2' : state.customer ? '1' : '0' } })
    if (path.endsWith('/automations')) return respond({ automations: state.unknownTrigger ? [{ id: '999', status: '1' }] : [], meta: { total: state.unknownTrigger ? '1' : '0' } })
    if (path.endsWith('/contactAutomations')) return respond({ contactAutomations: state.activeJourney || (state.postJourney && state.customer)
      ? [{ id: '1', contact: '123', status: '1' }] : [], meta: { total: state.activeJourney || (state.postJourney && state.customer) ? '1' : '0' } })
    throw Error('Unexpected provider request')
  }
  const service = load('../lib/free-customer-ac-sync.ts', { 'server-only': {}, '@/lib/supabase-admin': { createServiceRoleClient: () => db },
    '@/lib/plan-config': plan, '@/lib/directory-pass-payment': payment, '@/lib/active-campaign-nonrecurring-client': ac,
    '@/lib/nonrecurring-provider-reads': reads, '@/lib/free-customer-scope': scopes }, { process: { env } })
  return { state, scope, input, profile, account, person, env, calls, sql, writes, service,
    syncScope() { env.AC_FREE_CUSTOMER_SYNC_SCOPE = JSON.stringify(scope) },
    run() { return service.reconcileOneFreeCustomer(input, { fetcher, now: () => NOW + (state.delayed && calls.length > 3 ? 61_000 : 0) }) } }
}

test('verify accepts a genuine scoped Free record with false IsLivemode using GET only and no Stripe', async () => {
  const f = fixture(), result = await f.run()
  assert.equal(result.code, 'eligible_free_customer_would_create_no_write')
  assert.equal(result.providerWrite, false); assert.equal(result.databaseWrite, false)
  assert.deepEqual(f.writes, [])
  assert.ok(f.calls.every(c => c.method === 'GET'))
  assert.ok(f.sql.every(c => c.operation === 'read'))
  assert.ok(!f.calls.some(c => /stripe|billing|orders|recurring/i.test(c.origin + c.path)))
})
test('apply makes only one customer with acceptsMarketing=0, durable intent before POST and narrow CAS/readback', async () => {
  const f = fixture('apply'), result = await f.run()
  assert.equal(result.code, 'free_customer_created_and_linked')
  assert.deepEqual(f.writes, ['intent', 'customer', 'profile'])
  const post = f.calls.find(c => c.method === 'POST')
  assert.deepEqual(post.body, { ecomCustomer: { connectionid: '4', externalid: 'Person01', email: 'member@fixture.test', acceptsMarketing: 0 } })
  const cas = f.sql.find(c => c.operation === 'update')
  assert.deepEqual(cas.value, { ac_customer_id: '456' })
  for (const expected of [['eq', 'id', 'profile-1'], ['eq', 'outseta_account_id', 'Account1'], ['eq', 'outseta_person_uid', 'Person01'],
    ['eq', 'ac_contact_id', '123'], ['eq', 'plan_uid', 'FreePlan'], ['eq', 'subscription_status', 'active'], ['is', 'ac_customer_id', null]]) {
    assert.ok(cas.filters.some(x => JSON.stringify(x) === JSON.stringify(expected)))
  }
  assert.equal(f.sql.at(-1).operation, 'read')
  assert.equal((await f.run()).code, 'existing_free_customer_readback_only')
  assert.equal(f.calls.filter(c => c.method === 'POST').length, 1)
})
test('concurrent approved requests can claim at most one provider creation', async () => {
  const f = fixture('apply'); await Promise.all([f.run(), f.run()])
  assert.equal(f.calls.filter(c => c.method === 'POST').length, 1)
})
test('uncertain POST cannot be retried when exact customer remains absent', async () => {
  const f = fixture('apply'); f.state.lostPost = true
  assert.equal((await f.run()).state, 'uncertain')
  assert.equal((await f.run()).code, 'prior_customer_intent_no_blind_retry')
  assert.equal(f.calls.filter(c => c.method === 'POST').length, 1)
  assert.equal(f.profile.ac_customer_id, null)
})
test('timeout after acceptance is decided by independent GET without a second POST', async () => {
  const f = fixture('apply'); f.state.acceptedThenTimeout = true
  assert.equal((await f.run()).code, 'free_customer_created_and_linked')
  assert.equal(f.calls.filter(c => c.method === 'POST').length, 1)
})
for (const [name, stateKey] of [['CAS conflict', 'casConflict'], ['link readback mismatch', 'linkReadbackWrong'],
  ['new hold', 'postHold'], ['new active journey', 'postJourney']]) test('post-write ' + name + ' stops as uncertain without replay', async () => {
  const f = fixture('apply'); f.state[stateKey] = true
  assert.equal((await f.run()).state, 'uncertain')
  await f.run()
  assert.equal(f.calls.filter(c => c.method === 'POST').length, 1)
})

const excludes = {
  missingScope: f => delete f.env.AC_FREE_CUSTOMER_SYNC_SCOPE,
  preview: f => f.env.VERCEL_ENV = 'preview',
  globalMode: f => f.env.AC_NONRECURRING_SYNC_MODE = 'verify',
  expandedScope: f => { f.scope.accounts = ['Account2']; f.syncScope() },
  expiredScope: f => { f.scope.expiresAt = new Date(NOW).toISOString(); f.syncScope() },
  unboundedScope: f => { f.scope.expiresAt = new Date(NOW + 86_400_001).toISOString(); f.syncScope() },
  wrongRequestAccount: f => f.input.accountUid = 'Account2',
  wrongRequestPerson: f => f.input.personUid = 'Person02',
  staleRequest: f => f.input.issuedAt = NOW - 120_001,
  futureRequest: f => f.input.issuedAt = NOW + 1,
  verifySignatureReusedForApply: f => f.input.mode = 'verify',
  wrongDestination: f => f.env.AC_API_URL = 'https://other.example',
  missingProfile: f => f.state.missingProfile = true,
  duplicateProfile: f => f.state.duplicateProfile = true,
  wrongProfilePerson: f => f.profile.outseta_person_uid = 'Person02',
  wrongProfileAccount: f => f.profile.outseta_account_id = 'Account2',
  wrongProfileContact: f => f.profile.ac_contact_id = '999',
  missingContact: f => f.state.contactMissing = true,
  ambiguousCustomer: f => f.state.customerTotalWrong = true,
  paidPass: f => f.account.CurrentSubscription.Plan.Uid = 'PassPlan',
  cachedPaidPlan: f => f.profile.plan_uid = 'PassPlan',
  canceled: f => f.profile.subscription_status = 'cancelled',
  pastDue: f => f.account.AccountStage = 7,
  expiredFree: f => f.account.CurrentSubscription.ExpirationDate = '2026-11-22T00:00:00',
  invalidFreeExpiry: f => f.account.CurrentSubscription.ExpirationDate = 'invalid',
  endedFree: f => f.account.CurrentSubscription.EndDate = '2026-11-23T00:00:00',
  wrongLatest: f => f.account.LatestSubscription.Uid = 'Subscr02',
  wrongSubscriptionAccount: f => f.account.CurrentSubscription.Account.Uid = 'Account2',
  secondaryPerson: f => f.account.PersonAccount[0].IsPrimary = false,
  demo: f => f.account.IsDemo = true,
  qaEmail: f => { f.profile.user_email = 'member+qa@fixture.test'; f.person.Email = f.profile.user_email },
  held: f => f.state.hold = true,
  holdUnavailable: f => f.state.holdUnavailable = true,
  archived: f => f.account.IsArchived = true,
  archivedUnknown: f => f.account.IsArchived = null,
  stripeCustomer: f => f.account.StripeId = 'cus_fixture',
  legacyStripeCustomer: f => f.account.PaymentInformation = { CustomerToken: 'cus_fixture' },
  unknownStripeField: f => delete f.account.StripeId,
  activeJourney: f => f.state.activeJourney = true,
  unknownTrigger: f => f.state.unknownTrigger = true,
  priorIntent: f => f.state.intent = true,
  stalePreflight: f => f.state.delayed = true,
}
for (const [name, mutate] of Object.entries(excludes)) test('apply blocks ' + name + ' before any write', async () => {
  const f = fixture('apply'); mutate(f)
  const result = await f.run()
  assert.equal(result.state, 'blocked'); assert.deepEqual(f.writes, [])
})
test('known QA account is excluded even if mapped Free and without a QA email marker', () => {
  const f = fixture(); f.account.Uid = 'Rm8ZJBE9'; f.account.CurrentSubscription.Account.Uid = 'Rm8ZJBE9'
  assert.throws(() => f.service.verifyFreeCustomerAuthority(f.account, f.profile, false, NOW), /demo_or_known_qa_account/)
})
test('unexpected exceptions are redacted even if they look like valid lowercase result codes', async () => {
  const f = fixture(); f.state.rawError = true
  const result = await f.run()
  assert.equal(result.code, 'customer_verification_unavailable')
  assert.ok(!JSON.stringify(result).includes('secret_customer_name'))
})
test('existing customer without a saved profile link requires review without an automatic repair', async () => {
  const f = fixture('apply')
  f.state.customer = { id: '456', email: f.profile.user_email, externalid: 'Person01', connectionid: '4' }
  const result = await f.run()
  assert.equal(result.code, 'existing_customer_link_requires_review'); assert.equal(result.state, 'blocked')
  assert.deepEqual(f.writes, [])
})
test('the Free authority is not imported by any paid payment assessor or membership webhook', () => {
  for (const file of ['../lib/directory-pass-payment.ts', '../lib/nonrecurring-ac-sync.ts', '../app/api/webhooks/outseta/route.ts']) {
    assert.doesNotMatch(readFileSync(new URL(file, import.meta.url), 'utf8'), /free-customer-ac-sync|AC_FREE_CUSTOMER_SYNC_SCOPE/)
  }
})

function routeFixture(configured = true) {
  const now = Date.now(), scope = { ...scopeFixture(), expiresAt: new Date(now + 900_000).toISOString() }
  const env = { VERCEL_ENV: 'production', OUTSETA_WEBHOOK_SECRET: 'fixture-hmac-secret',
    ...(configured ? { AC_FREE_CUSTOMER_SYNC_SCOPE: JSON.stringify(scope) } : {}) }
  let reconciliations = 0
  const route = load('../app/api/operations/ac-free-customer/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => ({ body, ...init }) } }, '@/lib/security': security,
    '@/lib/free-customer-scope': scopes, '@/lib/free-customer-ac-sync': { reconcileOneFreeCustomer: async () => {
      reconciliations++; return { state: 'verified', code: 'eligible_free_customer_would_create_no_write', providerWrite: false, databaseWrite: false }
    } },
  }, { process: { env } })
  return { env, count: () => reconciliations, async call(change = x => x, signed = true, rawOverride) {
    const raw = rawOverride ?? JSON.stringify(change({ ...inputFixture(), issuedAt: now }))
    const signature = signed ? 'sha256=' + crypto.createHmac('sha256', 'fixture-hmac-secret').update(raw).digest('hex') : 'invalid'
    return route.POST({ text: async () => raw, headers: { get: () => signature } })
  } }
}
test('route is disabled without the separate scope and never invokes reconciliation', async () => {
  const f = routeFixture(false); assert.equal((await f.call()).status, 503); assert.equal(f.count(), 0)
})
test('route verifies the actual HMAC before reconciliation and accepts only exact recent scope', async () => {
  const f = routeFixture()
  assert.equal((await f.call(x => x, false)).status, 401)
  for (const change of [x => ({ ...x, issuedAt: x.issuedAt - 120_001 }), x => ({ ...x, accountUid: 'Account2' }),
    x => ({ ...x, mode: 'apply' }), x => ({ ...x, invoiceUid: 'Invoice1' })]) assert.equal((await f.call(change)).status, 400)
  assert.equal((await f.call(x => x, true, '{')).status, 400)
  assert.equal((await f.call(x => x, true, 'x'.repeat(2049))).status, 413)
  assert.equal(f.count(), 0)
  const response = await f.call()
  assert.equal(response.status, 200); assert.equal(response.headers['Cache-Control'], 'no-store'); assert.equal(f.count(), 1)
})
