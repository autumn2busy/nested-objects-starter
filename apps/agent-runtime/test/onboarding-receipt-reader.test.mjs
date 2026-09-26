import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { OnboardingReceiptReadOnlyClient } from '../dist/sensors/onboarding-receipt-reader.js'
import { adaptFreeOnboardingCompletion } from '../dist/sensors/free-onboarding-evidence.js'
import { previewFreeJourneySources } from '../dist/sensors/free-journey-source-preview.js'

const now = '2026-09-26T12:00:00.000Z'
const policy = () => ({ reviewRef: 'synthetic-review-only', reviewedAt: '2026-09-26T11:00:00.000Z',
  expiresAt: '2026-09-26T13:00:00.000Z', projectRef: 'abcdefghijklmnopqrst',
  outsetaPersonUid: 'SyntheticPerson', subscriptionUid: 'SyntheticCycle', timeoutMs: 1000 })
const profile = () => ({ id: '31800000-0000-4000-8000-000000000926', outseta_person_uid: 'SyntheticPerson',
  headline: 'Synthetic private headline', bio: 'Synthetic private biography', city: 'Atlanta', state: 'GA',
  experience_level: 'new', primary_services: 'Property Inspections', service_areas: ['Property Inspections'],
  updated_at: '2026-09-26T10:00:00.000Z' })
function receipt(event = 'income_scenario_completed') {
  const income = event === 'income_scenario_completed'
  const purpose = 'free_onboarding_and_conversion_email'
  const parts = [event, 'v1', 'SyntheticPerson', 'SyntheticCycle', ...(income ? [] : [purpose])]
  const page = income ? '/tools/income-calculator' : '/welcome'
  const source = income ? 'income_scenarios' : 'member_consent'
  return { id: '31800000-0000-4000-8000-000000000927',
    client_event_id: `${event}:v1:${createHash('sha256').update(JSON.stringify(parts)).digest('hex')}`,
    event_name: event, member_uid: 'SyntheticPerson', source_page: page, source, occurred_at: '2026-09-26T09:00:00.000Z',
    event_data: { sourcePage: page, source, lifecycleCycleId: 'SyntheticCycle',
      ...(income ? { completionContract: 'v1' } : { consentContract: 'v1', purpose }) } }
}
function response(request) {
  const url = new URL(request.url)
  return { status: 200, preferenceApplied: 'count=exact', contentRange: '0-0/1', body: [
    url.pathname.endsWith('/profiles') ? profile() : receipt(url.searchParams.get('event_name').slice(3)),
  ] }
}
function setup(change = r => r, extra = {}) {
  const calls = []
  const client = new OnboardingReceiptReadOnlyClient({ policy: policy(), mode: 'fixture', now: () => now,
    transport: async request => { calls.push(request); return change(response(request), request) }, ...extra })
  return { client, calls }
}

test('exact-count reads use only fixed GET fields, member/cycle filters and three-request budget', async () => {
  const { client, calls } = setup()
  const result = await client.collect()
  assert.equal(result.profiles.coverage, 'complete')
  assert.equal(result.completionEvents.coverage, 'complete')
  assert.equal(result.consentRequests.coverage, 'complete')
  assert.equal(result.attemptedWrites, 0)
  assert.equal(result.mutationAllowed, false)
  assert.equal(calls.length, 3)
  for (const request of calls) {
    const url = new URL(request.url)
    assert.equal(request.method, 'GET')
    assert.equal(request.redirect, 'error')
    assert.equal(request.cache, 'no-store')
    assert.equal(url.hostname, 'abcdefghijklmnopqrst.supabase.co')
    assert.equal(url.searchParams.get('limit'), '2')
    assert.equal(url.searchParams.get('offset'), '0')
    assert.equal(request.headers.Prefer, 'count=exact')
    assert(!/email|phone|address|\*/.test(url.searchParams.get('select')))
    if (url.pathname.endsWith('/conversion_events')) {
      assert.equal(url.searchParams.get('member_uid'), 'eq.SyntheticPerson')
      assert.equal(url.searchParams.get('event_data->>lifecycleCycleId'), 'eq.SyntheticCycle')
    } else assert.equal(url.searchParams.get('outseta_person_uid'), 'eq.SyntheticPerson')
  }
  await assert.rejects(client.collect(), /budget exhausted/)
  assert.equal(calls.length, 3)
})

for (const status of [200, 206]) test(`exact empty lookup is complete under HTTP ${status}`, async () => {
  const { client } = setup(r => ({ ...r, status, contentRange: '*/0', body: [] }))
  const result = await client.collect()
  assert.deepEqual(result.completionEvents, { coverage: 'complete', observedAt: now, rows: [] })
})

const failures = [
  ['missing count', r => ({ ...r, contentRange: null })],
  ['unknown count', r => ({ ...r, contentRange: '0-0/*' })],
  ['unconfirmed exact preference', r => ({ ...r, preferenceApplied: null })],
  ['estimated preference', r => ({ ...r, preferenceApplied: 'count=estimated' })],
  ['nonzero offset', r => ({ ...r, contentRange: '1-1/2' })],
  ['conflicting total', r => ({ ...r, contentRange: '0-0/0' })],
  ['incorrect range size', r => ({ ...r, contentRange: '0-1/2' })],
  ['unsafe count', r => ({ ...r, contentRange: '0-0/9007199254740992' })],
  ['empty array without exact count', r => ({ ...r, contentRange: '*/*', body: [] })],
  ['empty array with nonzero total', r => ({ ...r, contentRange: '*/1', body: [] })],
  ['duplicate rows', r => ({ ...r, contentRange: '0-1/2', body: [r.body[0], r.body[0]] })],
  ['ignored row limit', r => ({ ...r, body: [r.body[0], r.body[0], r.body[0]] })],
  ['invalid JSON shape', r => ({ ...r, body: { records: r.body } })],
  ['HTTP failure', r => ({ ...r, status: 500, body: { private: 'must not escape' } })],
  ['redirect', r => ({ ...r, status: 307 })],
  ['scope mismatch', r => ({ ...r, body: [{ ...r.body[0], member_uid: 'OtherPerson', outseta_person_uid: 'OtherPerson' }] })],
]
for (const [name, change] of failures) test(`${name} stays unknown, never missing or complete`, async () => {
  const result = await setup(change).client.collect()
  for (const key of ['profiles', 'completionEvents', 'consentRequests']) {
    assert.equal(result[key].coverage, 'unknown')
    assert.deepEqual(result[key].rows, [])
  }
  assert(!JSON.stringify(result).includes('must not escape'))
})

test('truncated exact lookup stays partial without selecting a winner', async () => {
  const result = await setup(r => ({ ...r, contentRange: '0-0/3', status: 206 })).client.collect()
  assert.equal(result.completionEvents.coverage, 'partial')
  assert.deepEqual(result.completionEvents.rows, [])
})

test('two distinct complete rows retain ambiguity for the existing adapter', async () => {
  const result = await setup(r => ({ ...r, contentRange: '0-1/2', body: [r.body[0],
    { ...r.body[0], id: '31800000-0000-4000-8000-000000000928' }] })).client.collect()
  assert.equal(result.profiles.coverage, 'complete')
  assert.equal(result.profiles.rows.length, 2)
})

test('wrong cycle or event cannot escape the scoped event query', async () => {
  for (const field of ['cycle', 'event']) {
    const result = await setup(r => {
      if (r.body[0].event_data) {
        if (field === 'cycle') r.body[0].event_data.lifecycleCycleId = 'OldCycle'
        else r.body[0].event_name = 'profile_completed'
      }
      return r
    }).client.collect()
    assert.equal(result.completionEvents.coverage, 'unknown')
  }
})

test('extra profile PII is stripped; unexpected event metadata withholds the receipt', async () => {
  const result = await setup(r => {
    r.body[0].email = 'synthetic-private-value'
    if (r.body[0].event_data) r.body[0].event_data.privateValue = 'synthetic-private-value'
    return r
  }).client.collect()
  assert.equal(result.profiles.coverage, 'complete')
  assert.equal(result.completionEvents.coverage, 'unknown')
  assert(!JSON.stringify(result).includes('synthetic-private-value'))
})

test('transport errors are redacted and do not become absent records', async () => {
  const result = await setup(() => { throw new Error('private credential and member content') }).client.collect()
  assert.equal(result.profiles.coverage, 'unknown')
  assert(!JSON.stringify(result).includes('private credential'))
})

test('timeout aborts a compliant transport and withholds its result', async () => {
  const result = await setup(undefined, { policy: { ...policy(), timeoutMs: 1 }, transport: async request => {
    await new Promise(resolve => request.signal.addEventListener('abort', resolve, { once: true }))
    return response(request)
  } }).client.collect()
  assert.equal(result.profiles.coverage, 'unknown')
  assert.equal(result.reads[0].reason, 'read_timeout')
})

test('review expiration during a read withholds it and prevents subsequent requests', async () => {
  let clock = now
  const { client, calls } = setup(r => { clock = '2026-09-26T14:00:00.000Z'; return r }, { now: () => clock })
  const result = await client.collect()
  assert.equal(calls.length, 1)
  assert.equal(result.profiles.coverage, 'unknown')
  assert.equal(result.completionEvents.coverage, 'unknown')
})

test('disabled live, credentialed fixtures and malformed policy make no requests', () => {
  for (const extra of [
    { mode: 'approved_live' }, { serviceRoleKey: 'must-not-be-used' }, { mode: 'invalid' },
    { policy: { ...policy(), outsetaPersonUid: 'x,or(y)' } },
    { policy: { ...policy(), projectRef: 'example.com/private' } },
    { policy: { ...policy(), expiresAt: now } },
    { policy: { ...policy(), reviewedAt: '2026-09-26T13:00:00.000Z' } },
    { mode: 'approved_live', liveReadsEnabled: true, serviceRoleKey: 'anon-key-not-server-secret' },
  ]) assert.throws(() => setup(undefined, extra))
})

test('stored reads compose with the actual onboarding adapter without claiming membership or consent', async () => {
  const stored = await setup().client.collect()
  const membership = { sourceSystem: 'outseta', authoritative: true, identityState: 'verified', isCurrent: true,
    sourceRecordId: 'SyntheticCycle', outsetaPersonUid: 'SyntheticPerson', subscriptionUid: 'SyntheticCycle',
    memberSince: '2026-09-01T00:00:00.000Z', cycleStartedAt: '2026-09-01T00:00:00.000Z' }
  const args = { outsetaPersonUid: 'SyntheticPerson', now, maxSnapshotAgeMs: 1000,
    profiles: stored.profiles, completionEvents: stored.completionEvents,
    currentMemberships: { coverage: 'complete', observedAt: now, rows: [membership] } }
  assert.equal(adaptFreeOnboardingCompletion(args).status, 'complete')
  args.currentMemberships.rows[0].authoritative = false
  assert.equal(adaptFreeOnboardingCompletion(args).status, 'withheld')
  assert.equal(stored.consentRequests.rows[0].event_name, 'lifecycle_email_consent_requested')
  assert(!Object.hasOwn(stored, 'consent'))
  assert(!Object.hasOwn(stored, 'membership'))
})

for (const missingCount of [false, true]) test(`reader-to-source-preview preserves ${missingCount ? 'unknown' : 'verified empty'} calculator lookup`, async () => {
  const stored = await setup((r, request) => {
    if (new URL(request.url).searchParams.get('event_name') === 'eq.income_scenario_completed') {
      return { ...r, body: [], contentRange: missingCount ? '*/*' : '*/0' }
    }
    return r
  }).client.collect()
  const snap = rows => ({ coverage: 'complete', observedAt: now, rows })
  const membership = { sourceSystem: 'outseta', authoritative: true, identityState: 'verified', isCurrent: true,
    sourceRecordId: 'SyntheticCycle', outsetaPersonUid: 'SyntheticPerson', outsetaAccountUid: 'SyntheticAccount',
    subscriptionUid: 'SyntheticCycle', tier: 'free', lifecycle: 'active',
    memberSince: '2026-09-01T00:00:00.000Z', cycleStartedAt: '2026-09-01T00:00:00.000Z' }
  const result = previewFreeJourneySources({
    onboarding: { outsetaPersonUid: 'SyntheticPerson', now, maxSnapshotAgeMs: 1000,
      profiles: stored.profiles, completionEvents: stored.completionEvents },
    identities: snap([{ canonicalMemberId: profile().id, outsetaPersonUid: 'SyntheticPerson',
      outsetaAccountUid: 'SyntheticAccount', subscriptionUid: 'SyntheticCycle', activeCampaignContactId: '41', identityState: 'verified' }]),
    memberships: snap([membership]), consentRequests: stored.consentRequests,
    audience: snap([{ activeCampaignContactId: '41', internal: false, coworker: false, test: false, demo: false, hiringFirm: false }]),
    contacts: snap([{ id: '41', bounced_hard: '0', bounced_soft: '0', deleted: '0' }]),
    contactLists: snap([{ contact: '41', list: '44', form: '99', status: '1' }]),
    consentAsset: { purpose: 'free_onboarding_and_conversion_email', listId: '44', formId: '99', doubleOptInVerified: true, observedAt: now },
  })
  assert.equal(result.status, missingCount ? 'withheld' : 'ready_for_writer_review')
  assert.equal(result.incomeScenarioStatus, missingCount ? 'withheld' : 'missing')
  assert.equal(result.attemptedWrites, 0)
  if (!missingCount) assert.equal(result.onboarding.onboardingCompletion, null)
})

test('default transport enforces size and JSON limits without leaking response bodies', async () => {
  const previous = globalThis.fetch
  try {
    for (const body of ['not-json-private', 'x'.repeat(200001)]) {
      let calls = 0
      globalThis.fetch = async (url, request) => {
        calls++
        assert.equal(request.method, 'GET')
        assert.equal(request.redirect, 'error')
        return new Response(body, { headers: { 'content-range': '0-0/1', 'preference-applied': 'count=exact' } })
      }
      const client = new OnboardingReceiptReadOnlyClient({ policy: policy(), mode: 'approved_live',
        liveReadsEnabled: true, serviceRoleKey: 'sb_secret_synthetic_not_real', now: () => now })
      const result = await client.collect()
      assert.equal(calls, 3)
      assert.equal(result.profiles.coverage, 'unknown')
      assert(!JSON.stringify(result).includes('not-json-private'))
    }
  } finally { globalThis.fetch = previous }
})
