import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

const root = new URL('../', import.meta.url)
const data = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
const emptyModule = data('export {}')
const fixture = { claims: null, events: [], jwtError: null }
globalThis.__firmOffboardingFixture = fixture
const fixtureJwt = role => [
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify({ role })).toString('base64url'),
  'fixture-signature',
].join('.')
const fixtureServiceRoleKey = fixtureJwt('service_role')

const tokenStub = data(`
export const OUTSETA_ISSUER = 'https://nested-objects.outseta.com'
export async function verifyFirmJwt() {
  const fixture = globalThis.__firmOffboardingFixture
  fixture.events.push('jwt')
  if (fixture.jwtError) throw fixture.jwtError
  return fixture.claims
}
`)
const headersStub = data('export async function cookies() { return { get() { return undefined } } }')
const compiled = new Map()
function compile(path) {
  if (compiled.has(path)) return compiled.get(path)
  let source = ts.transpileModule(fs.readFileSync(new URL(path, root), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  source = source.replace(/import ['"]server-only['"];?/g, `import ${JSON.stringify(emptyModule)}`)
  source = source.replace(/from ['"]next\/headers['"]/g, `from ${JSON.stringify(headersStub)}`)
  source = source.replace(/from ['"]\.\/([^'"]+)['"]/g, (_, name) => {
    if (name === 'token') return `from ${JSON.stringify(tokenStub)}`
    return `from ${JSON.stringify(compile(`lib/firm-profile/${name}.ts`))}`
  })
  const url = data(source)
  compiled.set(path, url)
  return url
}

const offboarding = await import(compile('lib/firm-profile/offboarding.ts'))
const server = await import(compile('lib/firm-profile/server.ts'))
const originalFetch = globalThis.fetch
const environmentKeys = [
  'FIRM_PROFILE_ENABLED',
  'FIRMS_APP_ORIGIN',
  'FIRM_OFFBOARDING_SUPABASE_URL',
  'FIRM_OFFBOARDING_SUPABASE_SERVICE_ROLE_KEY',
  'OUTSETA_API_KEY',
  'OUTSETA_API_SECRET',
  'FIRM_SUPABASE_URL',
  'FIRM_SUPABASE_SERVICE_ROLE_KEY',
]
const originalEnvironment = Object.fromEntries(environmentKeys.map(key => [key, process.env[key]]))

function clearEnvironment() {
  for (const key of environmentKeys) delete process.env[key]
}
function configureOffboarding() {
  process.env.FIRM_OFFBOARDING_SUPABASE_URL = 'https://fixtureproject.supabase.co'
  process.env.FIRM_OFFBOARDING_SUPABASE_SERVICE_ROLE_KEY = fixtureServiceRoleKey
}
function configureEnabledServer() {
  process.env.FIRM_PROFILE_ENABLED = 'true'
  process.env.FIRMS_APP_ORIGIN = 'https://firm.example.test'
  configureOffboarding()
  process.env.OUTSETA_API_KEY = 'fixture-provider-key'
  process.env.OUTSETA_API_SECRET = 'fixture-provider-secret'
}
function resetFixture() {
  fixture.claims = {
    sub: 'person01',
    'outseta:accountUid': 'account1',
    'outseta:subscriptionUid': 'subscr01',
    'outseta:planUid': 'wmjGbGQV',
    'outseta:isPrimary': '1',
    exp: Math.floor(Date.now() / 1000) + 1200,
  }
  fixture.events = []
  fixture.jwtError = null
}
function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } })
}
async function rejectsWithStatus(promise, status) {
  await assert.rejects(promise, error => error?.status === status)
}

test.beforeEach(() => {
  clearEnvironment()
  resetFixture()
  globalThis.fetch = async () => { throw new Error('Unexpected network call') }
})
test.after(() => {
  clearEnvironment()
  for (const [key, value] of Object.entries(originalEnvironment)) if (value !== undefined) process.env[key] = value
  globalThis.fetch = originalFetch
  delete globalThis.__firmOffboardingFixture
})

test('offboarding identity validation uses the exact bounded CANCEL-002 UID grammar without trimming', () => {
  assert.equal(offboarding.isFirmOffboardingUid('A-z_0-9'), true)
  assert.equal(offboarding.isFirmOffboardingUid('a'.repeat(128)), true)
  for (const value of ['', ' account1', 'account1 ', 'account.1', 'a'.repeat(129), null, undefined]) {
    assert.equal(offboarding.isFirmOffboardingUid(value), false)
  }
})

test('missing and malformed offboarding configuration fail closed without a request', async () => {
  let calls = 0
  globalThis.fetch = async () => { calls += 1; return jsonResponse([]) }
  assert.equal(await offboarding.readFirmOffboardingAccess({ accountUid: 'account1', personUid: 'person01' }), 'unavailable')

  const invalid = [
    ['http://fixtureproject.supabase.co', fixtureServiceRoleKey],
    ['https://fixtureproject.supabase.co/', fixtureServiceRoleKey],
    ['https://fixtureproject.supabase.co/rest', fixtureServiceRoleKey],
    ['https://fixtureproject.supabase.co:444', fixtureServiceRoleKey],
    ['https://not-supabase.example.test', fixtureServiceRoleKey],
    ['not-a-url', fixtureServiceRoleKey],
    ['https://fixtureproject.supabase.co', 'fixture key'],
    ['https://fixtureproject.supabase.co', 'fixture-opaque-key'],
    ['https://fixtureproject.supabase.co', fixtureJwt('anon')],
    ['https://fixtureproject.supabase.co', fixtureJwt('authenticated')],
  ]
  for (const [origin, key] of invalid) {
    process.env.FIRM_OFFBOARDING_SUPABASE_URL = origin
    process.env.FIRM_OFFBOARDING_SUPABASE_SERVICE_ROLE_KEY = key
    assert.equal(await offboarding.readFirmOffboardingAccess({ accountUid: 'account1', personUid: 'person01' }), 'unavailable')
  }
  assert.equal(calls, 0)
})

test('malformed signed subjects fail closed without falling back or making a request', async () => {
  configureOffboarding()
  let calls = 0
  globalThis.fetch = async () => { calls += 1; return jsonResponse([]) }
  const invalid = [
    { accountUid: '', personUid: 'person01' },
    { accountUid: ' account1', personUid: 'person01' },
    { accountUid: 'a'.repeat(129), personUid: 'person01' },
    { accountUid: null, personUid: 'person01' },
    { accountUid: 'account1', personUid: 'person 01' },
    { personUid: '' },
  ]
  for (const subject of invalid) assert.equal(await offboarding.readFirmOffboardingAccess(subject), 'unavailable')
  assert.equal(calls, 0)
})

test('account context wins and sends an exact bounded no-store Supabase read', async () => {
  configureOffboarding()
  let captured
  globalThis.fetch = async (input, init) => { captured = { url: new URL(input), init }; return jsonResponse([]) }
  assert.equal(await offboarding.readFirmOffboardingAccess({ accountUid: 'account-1', personUid: 'person_01' }), 'allowed')
  assert.equal(captured.url.origin, 'https://fixtureproject.supabase.co')
  assert.equal(captured.url.pathname, '/rest/v1/member_offboarding_holds')
  assert.equal(captured.url.searchParams.get('select'), 'account_uid')
  assert.equal(captured.url.searchParams.get('released_at'), 'is.null')
  assert.equal(captured.url.searchParams.get('account_uid'), 'eq.account-1')
  assert.equal(captured.url.searchParams.has('person_uid'), false)
  assert.equal(captured.url.searchParams.get('limit'), '1')
  assert.equal(captured.init.method, 'GET')
  assert.equal(captured.init.cache, 'no-store')
  assert.equal('body' in captured.init, false)
  assert.ok(captured.init.signal instanceof AbortSignal)
  const headers = new Headers(captured.init.headers)
  assert.equal(headers.get('accept'), 'application/json')
  assert.equal(headers.get('apikey'), fixtureServiceRoleKey)
  assert.equal(headers.get('authorization'), `Bearer ${fixtureServiceRoleKey}`)
})

test('person scope is used only when account context is absent', async () => {
  configureOffboarding()
  let captured
  globalThis.fetch = async (input) => { captured = new URL(input); return jsonResponse([]) }
  assert.equal(await offboarding.readFirmOffboardingAccess({ personUid: 'person_01' }), 'allowed')
  assert.equal(captured.searchParams.get('person_uid'), 'eq.person_01')
  assert.equal(captured.searchParams.has('account_uid'), false)
})

test('one active hold blocks while transport, HTTP and response-shape failures stay unavailable', async () => {
  configureOffboarding()
  globalThis.fetch = async () => jsonResponse([{ reason: 'cancellation' }])
  assert.equal(await offboarding.readFirmOffboardingAccess({ accountUid: 'account1', personUid: 'person01' }), 'blocked')

  const failures = [
    async () => { throw new Error('offline') },
    async () => jsonResponse({ message: 'failure' }, 500),
    async () => new Response('not-json', { status: 200 }),
    async () => jsonResponse({ reason: 'cancellation' }),
  ]
  for (const fetcher of failures) {
    globalThis.fetch = fetcher
    assert.equal(await offboarding.readFirmOffboardingAccess({ accountUid: 'account1', personUid: 'person01' }), 'unavailable')
  }
})

test('offboarding reads use a five-second abort bound and timeout fail closed', async () => {
  configureOffboarding()
  const originalTimeout = AbortSignal.timeout
  let timeout
  Object.defineProperty(AbortSignal, 'timeout', {
    configurable: true,
    value(milliseconds) { timeout = milliseconds; return AbortSignal.abort(new DOMException('Timed out', 'TimeoutError')) },
  })
  try {
    globalThis.fetch = async (_input, init) => { throw init.signal.reason }
    assert.equal(await offboarding.readFirmOffboardingAccess({ accountUid: 'account1', personUid: 'person01' }), 'unavailable')
    assert.equal(timeout, 5000)
  } finally {
    Object.defineProperty(AbortSignal, 'timeout', { configurable: true, value: originalTimeout })
  }
})

test('every non-true feature flag reaches neither JWT verification nor any network dependency', async () => {
  process.env.FIRMS_APP_ORIGIN = 'https://firm.example.test'
  configureOffboarding()
  let calls = 0
  globalThis.fetch = async () => { calls += 1; return jsonResponse([]) }
  for (const value of [undefined, 'false', 'TRUE']) {
    if (value === undefined) delete process.env.FIRM_PROFILE_ENABLED
    else process.env.FIRM_PROFILE_ENABLED = value
    fixture.events = []
    await rejectsWithStatus(server.verifyFirmToken('fixture-token'), 503)
    assert.deepEqual(fixture.events, [])
  }
  assert.equal(calls, 0)
})

test('enabled server maps missing offboarding configuration to 503 before provider access', async () => {
  configureEnabledServer()
  delete process.env.FIRM_OFFBOARDING_SUPABASE_URL
  delete process.env.FIRM_OFFBOARDING_SUPABASE_SERVICE_ROLE_KEY
  let calls = 0
  globalThis.fetch = async () => { calls += 1; return jsonResponse([]) }
  await rejectsWithStatus(server.verifyFirmToken('fixture-token'), 503)
  assert.deepEqual(fixture.events, ['jwt'])
  assert.equal(calls, 0)
})

test('verified malformed signed identity is rejected before the hold or provider request', async () => {
  configureEnabledServer()
  fixture.claims = { ...fixture.claims, sub: ' person01' }
  let calls = 0
  globalThis.fetch = async () => { calls += 1; return jsonResponse([]) }
  await rejectsWithStatus(server.verifyFirmToken('fixture-token'), 403)
  assert.deepEqual(fixture.events, ['jwt'])
  assert.equal(calls, 0)
})

test('blocked and unavailable holds stop before fresh provider authorization', async () => {
  configureEnabledServer()
  for (const [response, expectedStatus] of [[jsonResponse([{ reason: 'cancellation' }]), 403], [jsonResponse({ message: 'failure' }, 500), 503]]) {
    resetFixture()
    globalThis.fetch = async input => {
      const url = new URL(input)
      fixture.events.push(url.hostname === 'fixtureproject.supabase.co' ? 'hold' : 'provider')
      return response
    }
    await rejectsWithStatus(server.verifyFirmToken('fixture-token'), expectedStatus)
    assert.deepEqual(fixture.events, ['jwt', 'hold'])
  }
})

test('only an allowed hold read proceeds to fresh provider and existing firm authorization', async () => {
  configureEnabledServer()
  const account = {
    Uid: 'account1',
    IsDemo: false,
    AccountStage: 3,
    PrimaryContact: { Uid: 'person01' },
    CurrentSubscription: { Uid: 'subscr01', Plan: { Uid: 'wmjGbGQV' }, Account: { Uid: 'account1' } },
    PersonAccount: [{ Person: { Uid: 'person01' } }],
  }
  globalThis.fetch = async input => {
    const url = new URL(input)
    if (url.hostname === 'fixtureproject.supabase.co') { fixture.events.push('hold'); return jsonResponse([]) }
    fixture.events.push('provider')
    return jsonResponse(account)
  }
  const result = await server.verifyFirmToken('fixture-token')
  assert.equal(result.identity.accountUid, 'account1')
  assert.equal(result.identity.personUid, 'person01')
  assert.deepEqual(fixture.events, ['jwt', 'hold', 'provider'])
})
