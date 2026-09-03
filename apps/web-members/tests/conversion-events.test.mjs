import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const clone = value => JSON.parse(JSON.stringify(value))

function load(relativePath, imports = {}, globals = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports, Error, Response, ...globals,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`)
      return imports[name]
    },
  })
  return exports
}

const conversion = load('../lib/conversion-events.ts')

// These are boundary tests of real route/writer source. The recording Supabase
// adapter proves the issued persistence contract, not a deployed DB's schema,
// RLS, or uniqueness enforcement. Auth, AC, and rate limiting are isolated stubs.
function createHarness({ user = null, storageError = null, environment = {}, rateLimitError = null } = {}) {
  const calls = { writes: [], campaigns: [], auth: 0, clients: 0, limits: [], errors: [] }
  const supabase = {
    from(table) {
      return {
        async upsert(row, options) {
          calls.writes.push(clone({ table, row, options }))
          return { error: storageError }
        },
      }
    },
  }
  const route = load('../app/api/conversion-events/route.ts', {
    crypto: { createHash: require('node:crypto').createHash },
    'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) } },
    '@/lib/auth-server': {
      getCurrentUser: async () => { calls.auth++; return user },
      getOutsetaUserId: current => current?.uid ?? null,
      getPlanName: uid => uid === 'synthetic-server-plan' ? 'Pro' : 'Unknown',
    },
    '@/lib/ac-event-tracking': {
      trackACServerEvent: async event => { calls.campaigns.push(clone(event)); return true },
    },
    '@/lib/conversion-events': conversion,
    '@/lib/rate-limit': {
      rateLimit: () => ({ check: async key => {
        calls.limits.push(key)
        if (rateLimitError) throw rateLimitError
      } }),
      isRateLimitExceededError: error => error?.code === 'RATE_LIMIT_EXCEEDED',
      isRateLimitUnavailableError: error => error?.code === 'RATE_LIMIT_BACKEND_UNAVAILABLE',
    },
    '@/lib/supabase-server': {
      createServiceRoleClient: () => { calls.clients++; return supabase },
    },
  }, {
    process: { env: environment },
    console: { error: (...args) => calls.errors.push(args) },
  })
  function post(overrides = {}, headers = {}) {
    return route.POST(new Request('http://synthetic.invalid/api/conversion-events', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({
        event: 'pricing_view', clientEventId: 'event:synthetic-1',
        anonymousId: 'anon:synthetic', sessionId: 'session:synthetic',
        eventData: { sourcePage: '/membership-pricing', utm_source: 'synthetic' },
        ...overrides,
      }),
    }))
  }
  return { calls, supabase, route, post }
}

test('anonymous intent is persisted without caller-supplied member or plan identity', async () => {
  const harness = createHarness()
  const response = await harness.post({
    memberUid: 'forged-member', memberEmail: 'forged@example.test',
    planUid: 'forged-plan', planName: 'Founders',
  })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { recorded: true, activeCampaignTracked: false })
  const { table, row } = harness.calls.writes[0]
  assert.equal(table, 'conversion_events')
  assert.equal(row.event_name, 'pricing_view')
  assert.equal(row.member_uid, null)
  assert.equal(row.member_email, null)
  assert.equal(row.plan_uid, null)
  assert.equal(row.plan_name, null)
  assert.equal(row.source_page, '/membership-pricing')
  assert.equal(row.utm_source, 'synthetic')
  assert.equal(harness.calls.campaigns.length, 0)
})

test('authenticated identity and plan come from the server session', async () => {
  const harness = createHarness({ user: {
    uid: 'synthetic-server-member', email: 'Member@Example.test', 'outseta:planUid': 'synthetic-server-plan',
  } })
  const response = await harness.post({
    memberUid: 'forged-member', memberEmail: 'forged@example.test', planUid: 'forged-plan', planName: 'Founders',
  })
  assert.equal(response.status, 200)
  const { row } = harness.calls.writes[0]
  assert.equal(row.member_uid, 'synthetic-server-member')
  assert.equal(row.member_email, 'member@example.test')
  assert.equal(row.plan_uid, 'synthetic-server-plan')
  assert.equal(row.plan_name, 'Pro')
  assert.equal(harness.calls.campaigns.length, 1)
  assert.equal(harness.calls.campaigns[0].email, 'Member@Example.test')
  assert.equal(harness.calls.campaigns[0].event, 'pricing_view')
})

test('duplicate deliveries use the same stable key and insert-once conflict policy', async () => {
  const harness = createHarness()
  const occurredAt = new Date().toISOString()
  await harness.post({ occurredAt })
  await harness.post({ occurredAt })
  assert.equal(harness.calls.writes.length, 2)
  assert.deepEqual(harness.calls.writes[0], harness.calls.writes[1])
  assert.equal(harness.calls.writes[0].row.client_event_id, 'event:synthetic-1')
  assert.deepEqual(harness.calls.writes[0].options, { onConflict: 'client_event_id', ignoreDuplicates: true })
})

test('unavailable storage is reported as unrecorded even when the AC stub accepts the event', async () => {
  const storageError = { code: 'PGRST205', message: 'Synthetic missing conversion_events table' }
  const harness = createHarness({ storageError, user: { uid: 'synthetic-member', email: 'synthetic@example.test' } })
  const response = await harness.post()
  assert.equal(response.status, 202)
  assert.deepEqual(await response.json(), { recorded: false, activeCampaignTracked: true })
  assert.equal(harness.calls.campaigns.length, 1)
  assert.equal(harness.calls.errors[0][0], '[Conversion Events] First-party storage failed:')
  assert.equal(harness.calls.errors[0][1], storageError)
})

test('anonymous storage failure never implies successful storage or an AC delivery', async () => {
  const harness = createHarness({ storageError: new Error('Synthetic unavailable storage') })
  const response = await harness.post()
  assert.equal(response.status, 202)
  assert.deepEqual(await response.json(), { recorded: false, activeCampaignTracked: false })
  assert.equal(harness.calls.campaigns.length, 0)
})

test('OS acceptance Preview suppresses all persistence, authentication, rate-limit and marketing work', async () => {
  const harness = createHarness({ environment: { VERCEL_ENV: 'preview', INTELLIGENCE_OS_ADMIN_ENABLED: 'true' } })
  const response = await harness.route.POST({ json() { throw new Error('The Preview guard must run before parsing') } })
  assert.equal(response.status, 204)
  assert.equal(await response.text(), '')
  assert.deepEqual(harness.calls, { writes: [], campaigns: [], auth: 0, clients: 0, limits: [], errors: [] })
})

test('ordinary Preview and Production retain their existing event-storage behavior', async () => {
  for (const environment of [
    { VERCEL_ENV: 'preview', INTELLIGENCE_OS_ADMIN_ENABLED: 'false' },
    { VERCEL_ENV: 'production', INTELLIGENCE_OS_ADMIN_ENABLED: 'true' },
  ]) {
    const harness = createHarness({ environment })
    assert.equal((await harness.post()).status, 200)
    assert.equal(harness.calls.writes.length, 1)
  }
})

test('unsupported or oversized events are rejected before auth, storage, or marketing', async () => {
  for (const [body, headers, status] of [
    [{ event: 'synthetic-unsupported' }, {}, 400],
    [{ eventData: { oversized: 'x'.repeat(8192) } }, {}, 413],
    [{}, { 'content-length': '16385' }, 413],
  ]) {
    const harness = createHarness()
    assert.equal((await harness.post(body, headers)).status, status)
    assert.equal(harness.calls.auth, 0)
    assert.equal(harness.calls.clients, 0)
    assert.equal(harness.calls.writes.length, 0)
    assert.equal(harness.calls.campaigns.length, 0)
  }
})

test('browser requests cannot record paid lifecycle outcomes for anonymous or signed-in callers', async () => {
  for (const event of ['purchase', 'subscription_created', 'subscription_upgraded']) {
    for (const user of [null, { uid: 'synthetic-member', email: 'synthetic@example.test' }]) {
      const harness = createHarness({ user })
      const response = await harness.post({ event, eventData: { plan: 'Pro', value: 99 } })
      assert.equal(response.status, 400, event)
      assert.equal(harness.calls.auth, 0, event)
      assert.equal(harness.calls.clients, 0, event)
      assert.equal(harness.calls.writes.length, 0, event)
      assert.equal(harness.calls.campaigns.length, 0, event)
    }
  }
})

test('paid lifecycle names remain available to the existing authoritative server writers', () => {
  for (const event of ['purchase', 'subscription_created', 'subscription_upgraded']) {
    assert.equal(conversion.isConversionEventName(event), true)
  }
})

test('invalid client identifiers are omitted and cannot replace session-derived identity', async () => {
  const harness = createHarness()
  await harness.post({ clientEventId: 'invalid id', anonymousId: 'x'.repeat(161), sessionId: { forged: true } })
  const { row } = harness.calls.writes[0]
  assert.equal(row.client_event_id, null)
  assert.equal(row.anonymous_id, null)
  assert.equal(row.session_id, null)
  assert.equal(row.member_uid, null)
})

test('rate-limit rejection stops all downstream work and keeps the address out of the key', async () => {
  const rateLimitError = Object.assign(new Error('Rate limit exceeded'), { code: 'RATE_LIMIT_EXCEEDED' })
  const harness = createHarness({ rateLimitError })
  const response = await harness.post({}, { 'x-forwarded-for': '192.0.2.1' })
  assert.equal(response.status, 429)
  assert.match(harness.calls.limits[0], /^conversion:[a-f0-9]{24}$/)
  assert.equal(harness.calls.auth, 0)
  assert.equal(harness.calls.clients, 0)
  assert.equal(harness.calls.campaigns.length, 0)
})

test('rate-limit backend failure is temporary unavailability, not client throttling', async () => {
  const rateLimitError = Object.assign(new Error('Rate limit service unavailable'), {
    code: 'RATE_LIMIT_BACKEND_UNAVAILABLE',
  })
  const harness = createHarness({ rateLimitError })
  const response = await harness.post({}, { 'x-forwarded-for': '192.0.2.2' })

  assert.equal(response.status, 503)
  assert.equal(response.headers.get('retry-after'), '30')
  assert.deepEqual(await response.json(), { error: 'Request protection is temporarily unavailable' })
  assert.equal(harness.calls.auth, 0)
  assert.equal(harness.calls.clients, 0)
  assert.equal(harness.calls.writes.length, 0)
  assert.equal(harness.calls.campaigns.length, 0)
})
