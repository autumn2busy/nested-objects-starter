import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const Fragment = Symbol('Fragment')
const jsx = (type, props) => ({ type, props })
const jsxRuntime = { Fragment, jsx, jsxs: jsx }

function load(relativePath, imports = {}, globals = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
  const result = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    reportDiagnostics: true,
  })
  const errors = (result.diagnostics || []).filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)
  assert.equal(errors.length, 0, `Transpile errors in ${relativePath}`)
  const exports = {}
  vm.runInNewContext(result.outputText, {
    exports, console, URL, URLSearchParams, Date, Math, Number, Object, Array, JSON, RegExp,
    ...globals,
    require(name) {
      if (name === 'react/jsx-runtime') return jsxRuntime
      if (name in imports) return imports[name]
      throw new Error(`Unexpected import in ${relativePath}: ${name}`)
    },
  })
  return exports
}

const DIRECTORY_PASS_UID = 'DirPass001'
const now = Date.parse('2027-04-15T12:00:00.000Z')
class FixtureDate extends Date {
  static now() { return now }
}
const moduleEnv = {
  NEXT_PUBLIC_OUTSETA_DIRECTORY_PASS_PLAN_UID: DIRECTORY_PASS_UID,
  OUTSETA_API_KEY: 'fixture-private-key',
  OUTSETA_API_SECRET: 'fixture-private-secret',
}
const processFixture = { env: moduleEnv }
const plan = load('../lib/plan-config.ts', {}, { process: processFixture })
let timeoutMilliseconds = null
let providerFetch = async () => { throw new Error('Unexpected provider request') }
const entitlement = load('../lib/directory-pass-entitlement.ts', {
  'server-only': {},
  './plan-config': plan,
}, {
  process: processFixture,
  Date: FixtureDate,
  AbortSignal: { timeout(milliseconds) { timeoutMilliseconds = milliseconds; return { milliseconds } } },
  fetch: (...args) => providerFetch(...args),
})

const identity = {
  sub: 'person01',
  'outseta:accountUid': 'account01',
  'outseta:subscriptionUid': 'subscription01',
  'outseta:planUid': DIRECTORY_PASS_UID,
}
function accountFixture(overrides = {}) {
  const account = {
    Uid: 'account01',
    IsDemo: false,
    AccountStage: 3,
    AccountStageLabel: 'Subscribing',
    CurrentSubscription: {
      Uid: 'subscription01',
      StartDate: '2026-11-14T15:30:00.000Z',
      ExpirationDate: '2027-11-14T15:30:00.000Z',
      EndDate: null,
      BillingRenewalTerm: 4,
      Plan: { Uid: DIRECTORY_PASS_UID, OneTimeRate: 199, ExpiresAfterMonths: 12, TrialPeriodDays: 0 },
      Account: { Uid: 'account01' },
    },
    PersonAccount: [{ Person: { Uid: 'person01' } }],
  }
  return { ...account, ...overrides }
}
const copy = value => JSON.parse(JSON.stringify(value))
const changed = mutate => { const value = copy(accountFixture()); mutate(value); return value }

test('strict Outseta UTC parsing accepts full Z or zone-less timestamps and rejects ambiguous/invalid dates', () => {
  assert.equal(entitlement.parseOutsetaUtcTimestamp('2026-11-14T15:30:00.123Z'), Date.parse('2026-11-14T15:30:00.123Z'))
  assert.equal(entitlement.parseOutsetaUtcTimestamp('2026-11-14T15:30:00.123'), Date.parse('2026-11-14T15:30:00.123Z'))
  for (const value of ['2026-11-14', '2026-11-14T15:30:00-05:00', '2026-02-29T00:00:00Z', 'not-a-date', null]) {
    assert.equal(entitlement.parseOutsetaUtcTimestamp(value), null)
  }
})

test('twelve calendar months clamp leap-day starts without becoming a 365-day approximation', () => {
  const leapStart = Date.parse('2024-02-29T08:15:30.250Z')
  assert.equal(entitlement.addUtcCalendarMonthsClamped(leapStart, 12), Date.parse('2025-02-28T08:15:30.250Z'))
  const beforeLeapYear = Date.parse('2023-03-01T00:00:00.000Z')
  assert.equal(entitlement.addUtcCalendarMonthsClamped(beforeLeapYear, 12), Date.parse('2024-03-01T00:00:00.000Z'))
})

test('fresh exact current-cycle Directory Pass evidence is allowed', () => {
  assert.equal(entitlement.currentDirectoryPassEntitlement(accountFixture(), identity, now, DIRECTORY_PASS_UID), true)
  const earlierExpiry = changed(value => { value.CurrentSubscription.ExpirationDate = '2027-11-01T15:30:00.000Z' })
  assert.equal(entitlement.currentDirectoryPassEntitlement(earlierExpiry, identity, now, DIRECTORY_PASS_UID), true)
  const boundedFutureEnd = changed(value => { value.CurrentSubscription.EndDate = '2027-10-01T15:30:00.000Z' })
  assert.equal(entitlement.currentDirectoryPassEntitlement(boundedFutureEnd, identity, now, DIRECTORY_PASS_UID), true)
})

test('identity, current cycle, provider stage, one-time terms and plan configuration all fail closed on mismatch', () => {
  const invalid = [
    value => { value.Uid = 'other-account' },
    value => { value.IsDemo = true },
    value => { value.AccountStage = 4; value.AccountStageLabel = 'Canceling' },
    value => { value.AccountStageLabel = 'Trialing' },
    value => { value.CurrentSubscription.Uid = 'other-subscription' },
    value => { value.CurrentSubscription.Account.Uid = 'other-account' },
    value => { value.CurrentSubscription.BillingRenewalTerm = 1 },
    value => { value.CurrentSubscription.Plan.Uid = 'other-plan' },
    value => { value.CurrentSubscription.Plan.OneTimeRate = 198.99 },
    value => { value.CurrentSubscription.Plan.ExpiresAfterMonths = 0 },
    value => { value.CurrentSubscription.Plan.ExpiresAfterMonths = 13 },
    value => { value.CurrentSubscription.Plan.TrialPeriodDays = 1 },
    value => { value.PersonAccount = [] },
    value => { value.PersonAccount = [{ Person: { Uid: 'person01' } }, { Person: { Uid: 'person01' } }] },
  ]
  for (const mutate of invalid) {
    assert.equal(entitlement.currentDirectoryPassEntitlement(changed(mutate), identity, now, DIRECTORY_PASS_UID), false)
  }
  for (const [key, value] of [['sub', 'other-person'], ['outseta:accountUid', 'other-account'], ['outseta:subscriptionUid', 'other-subscription'], ['outseta:planUid', 'other-plan']]) {
    assert.equal(entitlement.currentDirectoryPassEntitlement(accountFixture(), { ...identity, [key]: value }, now, DIRECTORY_PASS_UID), false)
  }
})

test('expired, future, malformed and extended dates never grant Directory Pass access', () => {
  const invalid = [
    value => { value.CurrentSubscription.StartDate = '2027-05-01T00:00:00.000Z' },
    value => { value.CurrentSubscription.ExpirationDate = '2027-04-15T12:00:00.000Z' },
    value => { value.CurrentSubscription.ExpirationDate = '2027-11-14T15:30:00.001Z' },
    value => { value.CurrentSubscription.ExpirationDate = '2027-11-15T15:30:00.000Z' },
    value => { value.CurrentSubscription.ExpirationDate = '2027-11-14' },
    value => { value.CurrentSubscription.EndDate = '2027-04-15T12:00:00.000Z' },
    value => { value.CurrentSubscription.EndDate = '2027-11-14T15:30:00.001Z' },
    value => { delete value.CurrentSubscription.EndDate },
  ]
  for (const mutate of invalid) {
    assert.equal(entitlement.currentDirectoryPassEntitlement(changed(mutate), identity, now, DIRECTORY_PASS_UID), false)
  }

  const leap = accountFixture({
    CurrentSubscription: {
      ...accountFixture().CurrentSubscription,
      StartDate: '2024-02-29T08:15:30.250Z',
      ExpirationDate: '2025-03-01T08:15:30.250Z',
    },
  })
  assert.equal(entitlement.currentDirectoryPassEntitlement(leap, identity, Date.parse('2024-11-14T00:00:00Z'), DIRECTORY_PASS_UID), false)
  leap.CurrentSubscription.ExpirationDate = '2025-02-28T08:15:30.250Z'
  assert.equal(entitlement.currentDirectoryPassEntitlement(leap, identity, Date.parse('2024-11-14T00:00:00Z'), DIRECTORY_PASS_UID), true)
})

test('provider verification requests only authoritative current-cycle fields with private credentials and no cache', async () => {
  let captured
  timeoutMilliseconds = null
  const allowed = await entitlement.verifyCurrentDirectoryPassEntitlement(identity, now, async (input, init) => {
    captured = { url: new URL(input), init }
    return { ok: true, json: async () => accountFixture() }
  })
  assert.equal(allowed, true)
  assert.equal(captured.url.pathname, '/api/v1/crm/accounts/account01')
  assert.equal(captured.url.searchParams.get('donotlog'), '1')
  assert.deepEqual(captured.url.searchParams.get('fields').split(','), [
    'Uid', 'IsDemo', 'AccountStage', 'AccountStageLabel',
    'CurrentSubscription.Uid', 'CurrentSubscription.StartDate', 'CurrentSubscription.ExpirationDate',
    'CurrentSubscription.EndDate', 'CurrentSubscription.BillingRenewalTerm',
    'CurrentSubscription.Plan.Uid', 'CurrentSubscription.Plan.OneTimeRate',
    'CurrentSubscription.Plan.ExpiresAfterMonths', 'CurrentSubscription.Plan.TrialPeriodDays',
    'CurrentSubscription.Account.Uid', 'PersonAccount.Person.Uid',
  ])
  assert.equal(captured.init.method, 'GET')
  assert.equal(captured.init.cache, 'no-store')
  assert.equal(captured.init.redirect, 'error')
  assert.equal(captured.init.headers.Authorization, 'Outseta fixture-private-key:fixture-private-secret')
  assert.equal(captured.init.headers.Accept, 'application/json')
  assert.equal(timeoutMilliseconds, 5000)
})

test('missing private credentials and provider failures deny without any public-key fallback', async () => {
  const originalKey = moduleEnv.OUTSETA_API_KEY
  let calls = 0
  delete moduleEnv.OUTSETA_API_KEY
  moduleEnv.NEXT_PUBLIC_OUTSETA_PUBLIC_KEY = 'fixture-public-key'
  assert.equal(await entitlement.verifyCurrentDirectoryPassEntitlement(identity, now, async () => { calls += 1 }), false)
  assert.equal(calls, 0)
  moduleEnv.OUTSETA_API_KEY = originalKey
  delete moduleEnv.NEXT_PUBLIC_OUTSETA_PUBLIC_KEY

  for (const fetcher of [
    async () => { throw new Error('offline') },
    async () => { const error = new Error('timed out'); error.name = 'TimeoutError'; throw error },
    async () => ({ ok: false }),
    async () => ({ ok: true, json: async () => { throw new Error('invalid json') } }),
    async () => ({ ok: true, json: async () => ({}) }),
  ]) assert.equal(await entitlement.verifyCurrentDirectoryPassEntitlement(identity, now, fetcher), false)
})

test('missing Directory Pass plan configuration fails closed without a provider request', async () => {
  const noConfigProcess = { env: { OUTSETA_API_KEY: 'fixture-private-key', OUTSETA_API_SECRET: 'fixture-private-secret' } }
  const noConfigPlan = load('../lib/plan-config.ts', {}, { process: noConfigProcess })
  let calls = 0
  const noConfigEntitlement = load('../lib/directory-pass-entitlement.ts', {
    'server-only': {},
    './plan-config': noConfigPlan,
  }, {
    process: noConfigProcess,
    AbortSignal: { timeout() { throw new Error('Timeout creation must not occur without plan configuration') } },
    fetch: async () => { calls += 1; throw new Error('Provider request must not occur without plan configuration') },
  })
  assert.equal(noConfigPlan.DIRECTORY_PASS_PLAN_UID, '')
  assert.equal(await noConfigEntitlement.verifyCurrentDirectoryPassEntitlement(identity, now), false)
  assert.equal(calls, 0)
})

const authState = { payload: null, jwtCalls: 0 }
const auth = load('../lib/auth-server.ts', {
  jose: {
    createRemoteJWKSet: () => () => {},
    async jwtVerify() { authState.jwtCalls += 1; return { payload: authState.payload } },
  },
  'next/headers': { cookies: () => ({ get: () => undefined }) },
  './plan-config': plan,
  './directory-pass-entitlement': entitlement,
}, { process: processFixture })
const sessionRoute = load('../app/api/auth/session/route.ts', {
  'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
  'next/headers': { cookies: () => ({ get: () => ({ value: 'fixture-token' }) }) },
  '@/lib/auth-server': auth,
}, { process: processFixture })

function jwtPayload(planUid) {
  return { ...identity, 'outseta:planUid': planUid, email: 'fixture@example.invalid', name: 'Fixture', exp: 4102444800,
    iss: 'https://nested-objects.outseta.com', aud: 'https://nested-objects.outseta.com' }
}

test('all six existing plan JWT paths remain unchanged with no new provider request', async () => {
  let calls = 0
  providerFetch = async () => { calls += 1; throw new Error('Legacy plan must not fetch') }
  for (const planUid of Object.values(plan.PLAN_UIDS)) {
    authState.payload = jwtPayload(planUid)
    const result = await auth.verifyOutsetaToken('fixture-token')
    assert.equal(result['outseta:planUid'], planUid)
  }
  assert.equal(calls, 0)
})

test('configured Directory Pass JWTs require fresh provider truth on every verification and otherwise become Free', async () => {
  authState.payload = jwtPayload(DIRECTORY_PASS_UID)
  let calls = 0
  providerFetch = async () => { calls += 1; return { ok: true, json: async () => accountFixture() } }
  assert.equal((await auth.verifyOutsetaToken('fixture-token'))['outseta:planUid'], DIRECTORY_PASS_UID)
  assert.equal((await auth.verifyOutsetaToken('fixture-token'))['outseta:planUid'], DIRECTORY_PASS_UID)
  assert.equal(calls, 2)

  providerFetch = async () => ({ ok: true, json: async () => changed(value => {
    value.CurrentSubscription.ExpirationDate = '2027-04-15T12:00:00.000Z'
  }) })
  const expired = await auth.verifyOutsetaToken('fixture-token')
  assert.equal(expired.sub, identity.sub)
  assert.equal(expired['outseta:planUid'], plan.PLAN_UIDS.FREE)
  assert.equal(plan.PAID_PLANS.includes(expired['outseta:planUid']), false)
  providerFetch = async () => { throw new Error('provider unavailable') }
  const unavailable = await auth.verifyOutsetaToken('fixture-token')
  assert.equal(unavailable.sub, identity.sub)
  assert.equal(unavailable['outseta:planUid'], plan.PLAN_UIDS.FREE)
  assert.equal(plan.PAID_PLANS.includes(unavailable['outseta:planUid']), false)

  const serverSession = await sessionRoute.GET()
  assert.equal(serverSession.status, 200)
  assert.equal(serverSession.body.isAuthenticated, true)
  assert.equal(serverSession.body.user.sub, identity.sub)
  assert.equal(serverSession.body.user['outseta:planUid'], plan.PLAN_UIDS.FREE)
  assert.equal(serverSession.body.planUid, plan.PLAN_UIDS.FREE)
  assert.equal(authState.payload['outseta:planUid'], DIRECTORY_PASS_UID, 'The raw signed claim stays untrusted')
})

test('server feature policy grants Directory Pass only directory access and fails unknown plans closed', async () => {
  assert.equal(auth.hasAccess(DIRECTORY_PASS_UID, 'directory_access'), true)
  for (const [feature, allowedPlans] of Object.entries(auth.FEATURE_ACCESS)) {
    if (feature === 'directory_access') continue
    assert.equal(allowedPlans.includes(DIRECTORY_PASS_UID), false, feature)
    assert.equal(auth.hasAccess(DIRECTORY_PASS_UID, feature), false, feature)
  }
  let calls = 0
  providerFetch = async () => { calls += 1; throw new Error('Unknown plan must not fetch') }
  authState.payload = jwtPayload('UnknownPlan01')
  assert.equal((await auth.verifyOutsetaToken('fixture-token'))['outseta:planUid'], 'UnknownPlan01')
  assert.equal(auth.hasAccess('UnknownPlan01', 'directory_access'), false)
  assert.equal(calls, 0)
})

const training = load('../lib/training-access-policy.ts', { './plan-config': plan })
test('Directory Pass remains outside every training entitlement', () => {
  assert.equal(training.PAID_TRAINING_PLANS.includes(DIRECTORY_PASS_UID), false)
  assert.equal(training.canOpenTrainingModule(DIRECTORY_PASS_UID,
    { id: 'module-1', module_number: 1, requires_previous_module: false },
    { modules: [], completedModuleIds: [], waivedModuleIds: [] }), false)
})

let directoryUser = null
let directoryRequests = []
const DirectoryView = () => null
const constants = load('../app/hiring-firms/constants.ts')
const stateData = load('../app/hiring-firms/state-data.ts', { './constants': constants })
const directoryFirms = Array.from({ length: 7 }, (_, index) => ({
  id: `firm-${index + 1}`, slug: `firm-${index + 1}`, name: `Fixture Firm ${index + 1}`,
  description: `DETAIL_${index + 1}`, url: 'https://fixture.invalid', vendor_page_url: 'https://fixture.invalid/apply',
  logo_url: null, categories: null, geographic_coverage: 'Georgia', pay_min: 20, pay_max: 40, pay_type: 'per visit',
  company_size: null, industry_focus: 'Mortgage', rating: null, contractor_rating: null, rating_count: null,
  verified_at: null, phone: 'fixture-phone', email: 'fixture@example.invalid', address: 'fixture-address',
  latitude: null, longitude: null, source: 'fixture', compensation_structure: 'fixture-compensation',
  client_reviews: 'fixture-review', services: null,
}))
const directoryPage = load('../app/hiring-firms/page.tsx', {
  'next/link': { default: props => jsx('a', props) },
  './DirectoryView': { DirectoryView },
  '@/lib/seo': { generatePageMetadata: value => value, getFAQPageSchema: value => value },
  './constants': constants,
  './state-data': stateData,
  '@/lib/testimonials': { TESTIMONIALS: [], getAverageRating: () => 0 },
  '@/lib/auth-server': { getCurrentUser: async () => directoryUser },
  '@/lib/plan-config': plan,
}, {
  process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.example', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fixture' } },
  async fetch(input) {
    directoryRequests.push(new URL(input))
    return { ok: true, headers: { get: name => name === 'content-range' ? '0-6/100' : null }, json: async () => directoryFirms }
  },
})
function findElement(node, predicate) {
  if (!node || typeof node !== 'object') return null
  if (predicate(node)) return node
  const children = Array.isArray(node.props?.children) ? node.props.children : [node.props?.children]
  for (const child of children) { const found = findElement(child, predicate); if (found) return found }
  return null
}
async function directoryViewFor(planUid) {
  directoryUser = planUid === null ? null : { 'outseta:planUid': planUid }
  directoryRequests = []
  const tree = await directoryPage.default({ searchParams: Promise.resolve({ state: 'GA', search: 'fixture', limit: '60' }) })
  const view = findElement(tree, node => node.type === DirectoryView)
  assert.ok(view)
  return view.props
}

test('actual directory server grants only known paid plans and projects unknown plans to the sanitized preview', async () => {
  for (const planUid of plan.PAID_PLANS) {
    const props = await directoryViewFor(planUid)
    assert.equal(props.access.isRestricted, false, planUid)
    assert.equal(props.initialFirms.length, 7)
    assert.equal(props.initialFirms[6].description, 'DETAIL_7')
    assert.equal(directoryRequests[0].searchParams.get('limit'), '60')
  }

  for (const planUid of [plan.PLAN_UIDS.FREE, 'UnknownPlan01']) {
    const props = await directoryViewFor(planUid)
    assert.equal(props.access.isRestricted, true, planUid)
    assert.equal(props.access.isFree, true, planUid)
    assert.equal(directoryRequests[0].searchParams.get('limit'), '7')
    assert.equal(props.initialFirms.length, 7)
    assert.equal(props.initialFirms[2].description, 'DETAIL_3')
    assert.equal(props.initialFirms[3].description, 'DETAIL_4')
    assert.equal(props.initialFirms[3].url, null)
    assert.equal(props.initialFirms[3].email, null)
  }

  const guest = await directoryViewFor(null)
  assert.equal(guest.access.isRestricted, true)
  assert.deepEqual(JSON.parse(JSON.stringify(guest.initialFirms)), [])
})
