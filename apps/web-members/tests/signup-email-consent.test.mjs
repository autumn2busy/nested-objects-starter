import assert from 'node:assert/strict'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const clone = value => JSON.parse(JSON.stringify(value))
function load(path, imports, globals = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, Date, Error, Response, TextEncoder, Buffer, URL, ...globals,
    require(name) { assert.ok(Object.hasOwn(imports, name), `Unexpected import ${name}`); return imports[name] } })
  return exports
}
const conversion = load('../lib/conversion-events.ts', {})
const consent = load('../lib/signup-email-consent.ts', {
  'server-only': {}, crypto: { createHash }, '@/lib/conversion-events': conversion,
})
const security = load('../lib/security.ts', { crypto: { createHmac, timingSafeEqual } })
const free = 'SyntheticFree'
const now = Date.now()
const created = new Date(now - 30_000).toISOString()
const started = new Date(now - 29_000).toISOString()
const secret = 'a'.repeat(64)
function bundle() {
  return { Person: { Uid: 'SyntheticPerson', NoLifecycleEmailRequested: true, Created: created, Updated: created },
    Account: { Uid: 'SyntheticAccount', IsDemo: false, Created: created, Updated: created,
      CurrentSubscription: { Uid: 'SyntheticCycle' },
      PersonAccount: [{ IsPrimary: true, Person: { Uid: 'SyntheticPerson' }, Created: created, Updated: created }] },
    Subscription: { Uid: 'SyntheticCycle', Account: { Uid: 'SyntheticAccount' }, Plan: { Uid: free },
      Created: created, Updated: created, StartDate: started } }
}
function receipt() {
  const result = consent.evaluateSignupConsent(bundle(), free, now)
  assert.equal(result.status, 'accepted')
  return result.receipt
}
function row(input = receipt()) {
  return { client_event_id: input.clientEventId, event_name: input.eventName, member_uid: input.memberUid,
    occurred_at: input.occurredAt, event_data: clone(input.eventData) }
}
function welcomeRow() {
  return { client_event_id: consent.consentRequestId('v1', 'SyntheticPerson', 'SyntheticCycle'),
    event_name: consent.SIGNUP_CONSENT_EVENT, member_uid: 'SyntheticPerson', occurred_at: started,
    event_data: { sourcePage: '/welcome', source: 'member_consent', consentContract: 'v1',
      purpose: consent.SIGNUP_CONSENT_PURPOSE, lifecycleCycleId: 'SyntheticCycle' } }
}
function database({ rows = [], writeError = null, readError = null, noPersistence = false, resultRows } = {}) {
  const stored = new Map(rows.map(item => [item.client_event_id, clone(item)]))
  const calls = { writes: [], reads: [], clients: 0, auth: 0, journeys: [], limits: [] }
  const supabase = { from(table) { assert.equal(table, 'conversion_events'); return {
    async upsert(item, options) {
      calls.writes.push(clone({ item, options }))
      if (!writeError && !noPersistence && !stored.has(item.client_event_id)) stored.set(item.client_event_id, clone(item))
      return { error: writeError }
    },
    select(columns) {
      const filters = {}, query = {
        eq(key, value) { filters[key] = value; return query },
        in(key, value) { filters[key] = value; return query },
        limit(value) { filters.limit = value; return query },
        async single() {
          calls.reads.push(clone({ columns, filters }))
          return { data: stored.get(filters.client_event_id) ?? null, error: readError }
        },
        then(resolve, reject) {
          calls.reads.push(clone({ columns, filters }))
          return Promise.resolve({ data: resultRows === undefined ? [...stored.values()] : resultRows, error: readError }).then(resolve, reject)
        },
      }; return query
    },
  } } }
  return { supabase, stored, calls }
}
const next = { NextResponse: { json: (body, options) => Response.json(body, options) } }
function callbackHarness(options = {}) {
  const db = database(options)
  const route = load('../app/api/webhooks/outseta/signup-consent/route.ts', {
    'next/server': next, '@/lib/security': security, '@/lib/plan-config': { PLAN_UIDS: { FREE: free } },
    '@/lib/supabase-server': { createServiceRoleClient() { db.calls.clients++; return db.supabase } },
    '@/lib/signup-email-consent': consent,
    '@/lib/free-journey-operation-producer': { async emitFreeJourneySourceEvent(input) {
      db.calls.journeys.push(clone(input))
      if (options.routingError) throw new Error('Synthetic uncertainty')
      return options.routing ?? { status: 'disabled', code: 'producer_disabled', recoveryRequired: false }
    } },
  }, { process: { env: { OUTSETA_WEBHOOK_SECRET: secret, ...options.environment } } })
  async function post(payload = bundle(), { signature, raw, headers = {} } = {}) {
    const body = raw ?? JSON.stringify(payload)
    const signed = 'sha256=' + createHmac('sha256', Buffer.from(secret, 'hex')).update(body).digest('hex')
    return route.POST(new Request('http://synthetic.invalid/api/webhooks/outseta/signup-consent', {
      method: 'POST', headers: { 'x-hub-signature-256': signature ?? signed, ...headers }, body,
    }))
  }
  return { ...db, post }
}
function statusHarness({ user = { sub: 'SyntheticPerson', 'outseta:subscriptionUid': 'SyntheticCycle', 'outseta:planUid': free }, ...options } = {}) {
  const db = database(options)
  const route = load('../app/api/lifecycle-email-consent/route.ts', {
    'next/server': next, '@/lib/auth-server': { async getCurrentUser() { db.calls.auth++; return user } },
    '@/lib/plan-config': { PLAN_UIDS: { FREE: free } },
    '@/lib/supabase-server': { createServiceRoleClient() { db.calls.clients++; return db.supabase } },
    '@/lib/signup-email-consent': consent,
    crypto: { createHash },
    '@/lib/free-journey-operation-producer': { async emitFreeJourneySourceEvent(input) {
      db.calls.journeys.push(clone(input))
      return options.routing ?? { status: 'disabled', code: 'producer_disabled', recoveryRequired: false }
    } },
    '@/lib/rate-limit': { rateLimit: () => ({ async check(key) {
      db.calls.limits.push(key)
      if (options.rateLimitError) throw options.rateLimitError
    } }), isRateLimitExceededError: error => error?.code === 'RATE_LIMIT_EXCEEDED' },
  })
  return { ...db, get: route.GET, post: (headers = { origin: 'http://synthetic.invalid' }, body) => route.POST(new Request('http://synthetic.invalid/api/lifecycle-email-consent', {
    method: 'POST', headers, ...(body ? { body: JSON.stringify(body) } : {}),
  })) }
}

test('native registration records the exact choice and original completion time, not delivery time', () => {
  const saved = receipt()
  assert.equal(saved.occurredAt, started)
  assert.equal(saved.eventData.registrationOccurredAt, started)
  assert.equal(saved.eventData.consentProperty, 'NoLifecycleEmailRequested')
  assert.equal(saved.eventData.consentRequested, true)
  assert.equal(saved.eventData.consentText, consent.SIGNUP_CONSENT_TEXT)
  assert.equal(saved.eventData.sourcePage, '/outseta/signup')
  assert.equal(saved.eventData.evidenceKind, 'signed_signup_callback')
  assert.equal(Object.keys(saved.eventData).length, 11)
  assert.equal(saved.clientEventId, 'lifecycle_email_consent_requested:signup-v1:' + createHash('sha256')
    .update(JSON.stringify([consent.SIGNUP_CONSENT_EVENT, 'signup-v1', 'SyntheticPerson', 'SyntheticCycle', consent.SIGNUP_CONSENT_PURPOSE])).digest('hex'))
  assert.equal(Object.hasOwn(saved, 'memberEmail'), false)
})
test('bookmark or missing acquisition referrer does not determine consent', () => {
  for (const referer of [undefined, '', 'https://accounts.google.com/', 'https://nested-objects.outseta.com/auth']) {
    const payload = bundle(); payload.Person.Referer = referer
    assert.equal(consent.evaluateSignupConsent(payload, free, now).status, 'accepted')
  }
})
test('unchecked, absent and null choices are not requests', () => {
  for (const choice of [false, null, undefined]) {
    const payload = bundle(); payload.Person.NoLifecycleEmailRequested = choice
    const result = consent.evaluateSignupConsent(payload, free, now)
    assert.equal(result.status, 'ignored'); assert.equal(result.reason, 'not_requested')
  }
})
test('strings, numbers and objects cannot masquerade as affirmative checkbox choices', () => {
  for (const choice of ['true', 'false', 1, 0, {}, [], 'on']) {
    const payload = bundle(); payload.Person.NoLifecycleEmailRequested = choice
    assert.equal(consent.evaluateSignupConsent(payload, free, now).status, 'withheld')
  }
})
test('generic snapshots and first subscriptions on old accounts are withheld', () => {
  for (const part of ['Person', 'Account', 'Subscription']) {
    assert.equal(consent.evaluateSignupConsent(bundle()[part], free, now).status, 'withheld')
    const payload = bundle(); payload[part].Created = payload[part].Updated = new Date(now - 3 * 86400_000).toISOString()
    assert.equal(consent.evaluateSignupConsent(payload, free, now).status, 'withheld')
  }
})
test('later mutable true snapshots cannot backfill native signup consent', () => {
  for (const part of ['Person', 'Account', 'Subscription']) {
    const payload = bundle(); payload[part].Updated = started
    assert.equal(consent.evaluateSignupConsent(payload, free, now).status, 'withheld')
  }
})
test('ambiguous, conflicting or missing identity bindings are withheld', () => {
  const mutations = [p => { p.Person.Uid = '' }, p => { p.Subscription.Account.Uid = 'OtherAccount' },
    p => { p.Account.CurrentSubscription.Uid = 'OtherCycle' }, p => { p.Account.PersonAccount = [] },
    p => { p.Account.PersonAccount.push(clone(p.Account.PersonAccount[0])) },
    p => { p.Account.PersonAccount[0].Person.Uid = 'OtherPerson' },
    p => { p.Account.LatestSubscription = { Uid: 'OtherCycle' } },
    p => { p.Account.PersonAccount[0].Account = { Uid: 'OtherAccount' } }]
  for (const mutate of mutations) { const payload = bundle(); mutate(payload); assert.equal(consent.evaluateSignupConsent(payload, free, now).status, 'withheld') }
})
test('unknown or demo registration is withheld; other plans remain outside the Free journey', () => {
  for (const demo of [true, undefined, 'false']) { const payload = bundle(); payload.Account.IsDemo = demo
    assert.equal(consent.evaluateSignupConsent(payload, free, now).status, 'withheld') }
  const paid = bundle(); paid.Subscription.Plan.Uid = 'SyntheticPaid'
  assert.equal(consent.evaluateSignupConsent(paid, free, now).reason, 'outside_free_onboarding_scope')
})
test('missing, invalid, future and overly separated creation markers are withheld', () => {
  for (const value of [undefined, '', '2026-02-30T12:00:00Z', '2026-10-11', new Date(now + 1000).toISOString(), new Date(now - 120_000).toISOString()]) {
    const payload = bundle(); payload.Person.Created = payload.Person.Updated = value
    assert.equal(consent.evaluateSignupConsent(payload, free, now).status, 'withheld')
  }
})
test('documented full provider UTC values normalize without changing their instant', () => {
  const payload = bundle(); payload.Person.Created = payload.Person.Updated = created.replace(/Z$/, '')
  assert.equal(consent.evaluateSignupConsent(payload, free, now).receipt.occurredAt, started)
})
test('signed persistence is verified and retry does not overwrite the original request', async () => {
  const h = callbackHarness()
  const first = await h.post(), retry = await h.post()
  assert.equal(first.status, 200); assert.equal(retry.status, 200)
  assert.deepEqual(await first.json(), { recorded: true, activeCampaignTracked: false,
    routing: { status: 'disabled', code: 'producer_disabled', recoveryRequired: false, automaticRetry: false } })
  assert.equal(h.stored.size, 1); assert.equal(h.calls.reads.length, 2)
  assert.equal(h.calls.writes[0].options.ignoreDuplicates, true)
  assert.equal([...h.stored.values()][0].occurred_at, started)
  assert.equal(h.calls.journeys.length, 2)
  assert.deepEqual(h.calls.journeys[0], { kind: 'consent_recorded', occurredAt: started,
    outsetaPersonUid: 'SyntheticPerson', subscriptionUid: 'SyntheticCycle' })
})
test('missing or bad signing configuration cannot access storage', async () => {
  for (const options of [{ environment: { OUTSETA_WEBHOOK_SECRET: '' } }, {}]) {
    const h = callbackHarness(options), response = await h.post(bundle(), { signature: 'sha256=bad' })
    assert.equal(response.status, options.environment ? 503 : 401)
    assert.equal(h.calls.clients, 0); assert.equal(h.calls.writes.length, 0)
  }
})
test('unsigned callbacks and tampered bodies are rejected using real HMAC verification', async () => {
  for (const signature of ['', 'sha256=' + 'b'.repeat(64)]) {
    const h = callbackHarness(), response = await h.post(bundle(), { signature })
    assert.equal(response.status, 401); assert.equal(h.calls.clients, 0)
  }
})
test('malformed and oversized callback bodies never reach the private ledger', async () => {
  for (const [options, status] of [[{ raw: '{' }, 400], [{ raw: ' '.repeat(65537) }, 413],
    [{ raw: '界'.repeat(25000) }, 413], [{ headers: { 'content-length': '65537' } }, 413]]) {
    const h = callbackHarness(), response = await h.post(bundle(), options)
    assert.equal(response.status, status); assert.equal(h.calls.clients, 0)
  }
})
test('OS Preview collection-disabled 204 causes no write or false recorded claim', async () => {
  const h = callbackHarness({ environment: { VERCEL_ENV: 'preview', INTELLIGENCE_OS_ADMIN_ENABLED: 'true' } })
  const response = await h.post()
  assert.equal(response.status, 204); assert.equal(await response.text(), '')
  assert.equal(h.calls.clients, 0)
})
test('HTTP 200 ignored choices do not become receipts', async () => {
  const h = callbackHarness(), payload = bundle(); payload.Person.NoLifecycleEmailRequested = false
  const response = await h.post(payload)
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { recorded: false, reason: 'not_requested' })
  assert.equal(h.calls.clients, 0)
})
test('writer errors, lost writes and missing readback never claim successful persistence', async () => {
  for (const options of [{ writeError: { message: 'Synthetic failure' } }, { readError: { message: 'Synthetic failure' } }, { noPersistence: true }]) {
    const h = callbackHarness(options), response = await h.post()
    assert.equal(response.status, 503); assert.equal((await response.json()).recorded, false)
    assert.equal(h.calls.journeys.length, 0)
  }
})
test('reserved-key collisions and conflicting account evidence cannot be overwritten', async () => {
  for (const mutate of [r => { r.event_name = 'pricing_view' }, r => { r.event_data.outsetaAccountUid = 'OtherAccount' },
    r => { r.event_data.consentRequested = false }, r => { r.occurred_at = created }]) {
    const existing = row(); mutate(existing); const h = callbackHarness({ rows: [existing] })
    assert.equal((await h.post()).status, 503)
    assert.deepEqual([...h.stored.values()][0], existing)
  }
})
test('database timestamp serialization preserves native original-time evidence', async () => {
  const saved = row(); saved.occurred_at = saved.occurred_at.replace('Z', '+00:00')
  const h = callbackHarness({ rows: [saved] })
  assert.equal((await h.post()).status, 200)
  assert.equal((await consent.readConsentRequestStatus(h.supabase, 'SyntheticPerson', 'SyntheticCycle')).status, 'recorded')
})
test('request-status guard rejects anonymous, missing-cycle and non-Free sessions before storage', async () => {
  for (const [user, status] of [[null, 401], [{ uid: 'fallback' }, 401],
    [{ sub: 'SyntheticPerson', 'outseta:planUid': free }, 409],
    [{ sub: 'SyntheticPerson', 'outseta:planUid': 'Paid', 'outseta:subscriptionUid': 'SyntheticCycle' }, 403]]) {
    const h = statusHarness({ user }), response = await h.get()
    assert.equal(response.status, status); assert.equal(h.calls.clients, 0)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
  }
})
test('status reads only current signed identity and two deterministic keys and returns no PII', async () => {
  const h = statusHarness({ rows: [row()] }), response = await h.get(), result = await response.json()
  assert.equal(response.status, 200)
  assert.deepEqual(result, { status: 'recorded', recorded: true, source: 'signup', confirmationRequired: true })
  assert.equal(h.calls.reads[0].filters.member_uid, 'SyntheticPerson')
  assert.equal(h.calls.reads[0].filters.client_event_id.length, 2)
  assert.equal(h.calls.reads[0].filters.limit, 3)
  assert.equal(h.calls.writes.length, 0)
  assert.equal(JSON.stringify(result).includes('Synthetic'), false)
})
test('both independently valid contracts coalesce; existing welcome receipt remains valid', async () => {
  for (const [rows, source] of [[[welcomeRow()], 'welcome'], [[welcomeRow(), row()], 'signup'], [[row(), welcomeRow()], 'signup']]) {
    const result = await consent.readConsentRequestStatus(database({ rows }).supabase, 'SyntheticPerson', 'SyntheticCycle')
    assert.equal(result.status, 'recorded'); assert.equal(result.source, source)
  }
})
test('empty verified read alone is not_recorded; storage failure remains unavailable', async () => {
  assert.equal((await statusHarness().get()).status, 200)
  assert.equal((await (await statusHarness().get()).json()).status, 'not_recorded')
  const response = await statusHarness({ readError: { message: 'Unavailable' } }).get()
  assert.equal(response.status, 503); assert.equal((await response.json()).status, 'unavailable')
})
test('unknown, forged, cross-member/cycle and extra metadata remain unavailable', async () => {
  for (const mutate of [r => { r.member_uid = 'OtherPerson' }, r => { r.event_data.lifecycleCycleId = 'OtherCycle' },
    r => { r.event_data.extra = true }, r => { r.event_data.consentContract = 'unknown' },
    r => { r.event_data.registrationOccurredAt = created }, r => { r.event_data.consentProperty = 'OtherProperty' },
    r => { r.event_data.consentText = 'Different copy' }, r => { r.event_data.consentRequested = 'true' }]) {
    const saved = row(); mutate(saved)
    const response = await statusHarness({ rows: [saved] }).get()
    assert.equal(response.status, 503); assert.equal((await response.json()).recorded, false)
  }
})
test('no consent module directly invokes email, ActiveCampaign or subscription mutation', () => {
  for (const path of ['../lib/signup-email-consent.ts', '../app/api/webhooks/outseta/signup-consent/route.ts', '../app/api/lifecycle-email-consent/route.ts']) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8')
    assert.equal(/trackAC|active-campaign|fetch\(/.test(source), false)
  }
})
test('routing failure does not erase verified storage or automatically retry', async () => {
  const h = callbackHarness({ routingError: true }), response = await h.post()
  const result = await response.json()
  assert.equal(response.status, 200); assert.equal(result.recorded, true)
  assert.equal(result.routing.status, 'failed'); assert.equal(result.routing.automaticRetry, false)
  assert.equal(result.routing.recoveryRequired, true); assert.equal(h.stored.size, 1)
  assert.equal(h.calls.journeys.length, 1)
})
test('deliberate consent recheck requires same origin and signed Free/current-cycle identity', async () => {
  for (const origin of [undefined, 'https://attacker.example', 'null']) {
    const h = statusHarness({ rows: [row()] }), response = await h.post(origin ? { origin } : {})
    assert.equal(response.status, 403); assert.equal(h.calls.auth, 0); assert.equal(h.calls.journeys.length, 0)
  }
  for (const [user, status] of [[null, 401], [{ sub: 'SyntheticPerson', 'outseta:planUid': 'Paid' }, 403],
    [{ sub: 'SyntheticPerson', 'outseta:planUid': free }, 409]]) {
    const h = statusHarness({ user, rows: [row()] }), response = await h.post()
    assert.equal(response.status, status); assert.equal(h.calls.clients, 0); assert.equal(h.calls.journeys.length, 0)
  }
})
test('POST recheck uses trusted identity, writes no request and never claims confirmation', async () => {
  const h = statusHarness({ rows: [row()] }), response = await h.post(undefined, {
    memberUid: 'Forged', subscriptionUid: 'Forged', confirmed: true, event: 'signup',
  }), result = await response.json()
  assert.equal(response.status, 200)
  assert.deepEqual(result, { recorded: true, routing: {
    status: 'disabled', code: 'producer_disabled', recoveryRequired: false, automaticRetry: false,
  } })
  assert.equal(h.calls.journeys[0].kind, 'consent_check_requested')
  assert.equal(h.calls.journeys[0].outsetaPersonUid, 'SyntheticPerson')
  assert.equal(h.calls.journeys[0].subscriptionUid, 'SyntheticCycle')
  assert.ok(Date.parse(h.calls.journeys[0].occurredAt) >= now)
  assert.equal(h.calls.writes.length, 0)
  assert.equal(h.calls.limits[0].includes('Synthetic'), false)
})
test('missing or unavailable consent prevents re-evaluation', async () => {
  for (const [options, status] of [[{}, 409], [{ readError: { message: 'Unknown' } }, 503]]) {
    const h = statusHarness(options), response = await h.post()
    assert.equal(response.status, status); assert.equal(h.calls.journeys.length, 0)
    assert.equal(h.calls.writes.length, 0)
  }
})
test('throttle/backend failure stops re-evaluation before database reads', async () => {
  for (const [code, status] of [['RATE_LIMIT_EXCEEDED', 429], ['RATE_LIMIT_BACKEND_UNAVAILABLE', 503]]) {
    const h = statusHarness({ rows: [row()], rateLimitError: { code } }), response = await h.post()
    assert.equal(response.status, status); assert.equal(h.calls.clients, 0); assert.equal(h.calls.journeys.length, 0)
  }
})
test('accepted, withheld and uncertain Runtime rechecks remain distinct from confirmed consent', async () => {
  for (const status of ['delivered', 'withheld', 'failed']) {
    const h = statusHarness({ rows: [row()], routing: { status, code: 'synthetic', recoveryRequired: status === 'failed' } })
    const response = await h.post(), result = await response.json()
    assert.equal(response.status, status === 'failed' ? 503 : 200)
    assert.equal(result.recorded, true); assert.equal(result.routing.status, status)
    assert.equal(result.routing.automaticRetry, false)
    assert.equal(Object.hasOwn(result, 'confirmed'), false); assert.equal(Object.hasOwn(result, 'subscribed'), false)
    assert.equal(h.calls.journeys.length, 1)
  }
})
test('read-only GET never emits an operational event', async () => {
  const h = statusHarness({ rows: [row()] })
  await h.get(); await h.get()
  assert.equal(h.calls.journeys.length, 0); assert.equal(h.calls.limits.length, 0); assert.equal(h.calls.writes.length, 0)
})
test('duplicate versions, excess rows and malformed response cannot imply saved consent', async () => {
  for (const resultRows of [[row(), row()], [row(), welcomeRow(), row()], null, {}]) {
    const h = statusHarness({ resultRows }), response = await h.get()
    assert.equal(response.status, 503)
    assert.equal((await response.json()).status, 'unavailable')
  }
})
test('invalid internal receipt is rejected before writer access', async () => {
  const db = database(), invalid = receipt(); invalid.clientEventId = 'forged'
  await assert.rejects(consent.persistSignupConsent(db.supabase, invalid))
  assert.equal(db.calls.writes.length, 0)
})
test('status is scoped to the current cycle and never establishes email confirmation', async () => {
  const db = database({ rows: [row()] })
  const result = await consent.readConsentRequestStatus(db.supabase, 'SyntheticPerson', 'OtherCycle')
  assert.equal(result.status, 'unavailable')
  assert.equal(result.recorded, false)
  assert.equal(result.confirmationRequired, true)
})
