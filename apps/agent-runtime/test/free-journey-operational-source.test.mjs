import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'

import {
  FreeJourneyOperationalSourceCollector,
  previewFreeJourneySources,
} from '../dist/index.js'

const now = '2026-10-10T12:00:00.000Z'
const person = 'SyntheticPerson'
const account = 'SyntheticAccount'
const cycle = 'SyntheticCycle'
const member = '31800000-0000-4000-8000-000000001111'
const purpose = 'free_onboarding_and_conversion_email'

const snapshot = rows => ({ coverage: 'complete', observedAt: now, rows })
const hash = parts => createHash('sha256').update(JSON.stringify(parts)).digest('hex')

function profile() {
  return {
    id: member,
    outseta_person_uid: person,
    outseta_account_id: account,
    ac_contact_id: '41',
    user_email: 'member@example.com',
    email: 'member@example.com',
    headline: 'Inspection services',
    bio: 'Synthetic profile',
    city: 'Atlanta',
    state: 'GA',
    experience_level: 'new',
    primary_services: 'Property Inspections',
    service_areas: ['Property Inspections'],
    updated_at: '2026-10-10T10:00:00.000Z',
  }
}

function consentReceipt() {
  return {
    id: '31800000-0000-4000-8000-000000001112',
    client_event_id: `lifecycle_email_consent_requested:v1:${hash([
      'lifecycle_email_consent_requested', 'v1', person, cycle, purpose,
    ])}`,
    event_name: 'lifecycle_email_consent_requested',
    member_uid: person,
    source_page: '/welcome',
    source: 'member_consent',
    occurred_at: '2026-10-10T09:00:00.000Z',
    event_data: {
      sourcePage: '/welcome', source: 'member_consent', consentContract: 'v1', purpose,
      lifecycleCycleId: cycle,
    },
  }
}

function incomeReceipt() {
  return {
    id: '31800000-0000-4000-8000-000000001113',
    client_event_id: `income_scenario_completed:v1:${hash(['income_scenario_completed', 'v1', person, cycle])}`,
    event_name: 'income_scenario_completed',
    member_uid: person,
    source_page: '/tools/income-calculator',
    source: 'income_scenarios',
    occurred_at: '2026-10-10T10:30:00.000Z',
    event_data: {
      sourcePage: '/tools/income-calculator', source: 'income_scenarios', completionContract: 'v1',
      lifecycleCycleId: cycle,
    },
  }
}

function storedSources(profileRow = profile()) {
  return {
    profiles: snapshot([profileRow]),
    completionEvents: snapshot([incomeReceipt()]),
    consentRequests: snapshot([consentReceipt()]),
    reads: [
      { resource: 'profile', reason: 'exact_filtered_lookup' },
      { resource: 'income', reason: 'exact_filtered_lookup' },
      { resource: 'consent_request', reason: 'exact_filtered_lookup' },
    ],
    reviewRef: 'issue318-synthetic',
    mode: 'approved_live',
    mutationAllowed: false,
    attemptedWrites: 0,
  }
}

function policy(overrides = {}) {
  return {
    reviewRef: 'issue318-synthetic-source',
    reviewedAt: '2026-10-10T11:00:00.000Z',
    expiresAt: '2026-10-10T13:00:00.000Z',
    outsetaHostname: 'nested-objects.outseta.com',
    activeCampaignHostname: 'synthetic.api-us1.com',
    pageSize: 1,
    maxPages: 5,
    maxRequests: 20,
    timeoutMs: 1000,
    consentAsset: {
      purpose,
      listId: '34',
      formId: '90',
      doubleOptInVerified: true,
    },
    exclusionPolicy: {
      internalDomains: ['nestedobjects.com'],
      approvedInternalMemberEmails: [],
      coldTagPatterns: ['cold', 'import'],
      wixTagPatterns: ['wix'],
      testPatterns: ['test'],
      coworkerContactIds: [],
      demoContactIds: [],
      hiringFirmContactIds: [],
    },
    ...overrides,
  }
}

function accountBody(changes = {}) {
  return {
    Uid: account,
    IsDemo: false,
    AccountStage: 3,
    AccountStageLabel: 'Active',
    Created: '2026-09-01T12:00:00.000Z',
    CurrentSubscription: {
      Uid: cycle,
      StartDate: '2026-09-01T12:00:00.000Z',
      Plan: { Uid: 'L9nbKV9Z', Name: 'Free' },
    },
    PersonAccount: [{ IsPrimary: true, Person: { Uid: person, Email: 'member@example.com' } }],
    ...changes,
  }
}

function transport(options = {}) {
  const calls = []
  const fn = async request => {
    calls.push(request)
    assert.equal(request.method, 'GET')
    assert.equal(request.redirect, 'error')
    assert.equal(request.cache, 'no-store')
    if (options.httpFailure?.provider === request.provider) {
      return { status: options.httpFailure.status, body: { sensitive: 'must-not-appear@example.com' } }
    }
    const url = new URL(request.url)
    if (request.provider === 'outseta') {
      assert.equal(url.hostname, 'nested-objects.outseta.com')
      assert.equal(url.pathname, `/api/v1/crm/accounts/${account}`)
      assert.match(url.searchParams.get('fields'), /CurrentSubscription\.Plan\.Uid/)
      return { status: 200, body: accountBody(options.account) }
    }
    assert.equal(url.hostname, 'synthetic.api-us1.com')
    if (url.pathname === '/api/3/contacts/41') return { status: 200, body: { contact: {
      id: '41', email: options.contactEmail ?? 'member@example.com',
      bounced_hard: options.bouncedHard ?? '0', bounced_soft: '0', deleted: '0',
      cdate: '2026-09-01T12:00:00.000Z', udate: '2026-10-10T11:00:00.000Z',
    } } }
    if (url.pathname.endsWith('/contactLists')) {
      const offset = Number(url.searchParams.get('offset'))
      const rows = options.noDoi
        ? [{ id: '700', contact: '41', list: '12', form: '0', status: '1' }]
        : [
          { id: '700', contact: '41', list: '12', form: '0', status: '1' },
          { id: '701', contact: '41', list: '34', form: '90', status: options.doiStatus ?? '1' },
        ]
      const total = options.changedTotal && offset > 0 ? rows.length + 1 : rows.length
      return { status: 200, body: { contactLists: rows.slice(offset, offset + 1), meta: { total: String(total) } } }
    }
    if (url.pathname.endsWith('/contactTags')) {
      const tags = options.tags ?? [{ id: '900', contact: '41', tag: '800' }]
      const offset = Number(url.searchParams.get('offset'))
      const relation = tags.slice(offset, offset + 1)
      return { status: 200, body: {
        contactTags: relation,
        tags: relation.map(value => ({ id: value.tag, tag: options.tagName ?? 'plan-free' })),
        meta: { total: String(tags.length) },
      } }
    }
    throw new Error(`Unexpected read ${url.pathname}`)
  }
  return { calls, fn }
}

async function collect(options = {}, policyOverrides = {}, stored = storedSources()) {
  const source = transport(options)
  const collector = new FreeJourneyOperationalSourceCollector({
    policy: policy(policyOverrides),
    mode: 'fixture',
    transport: source.fn,
    now: () => now,
  })
  return { result: await collector.collect({ storedSources: stored, outsetaPersonUid: person, subscriptionUid: cycle }), ...source }
}

test('exact stable links and complete relationship pagination produce one server-built source context', async () => {
  const { result, calls } = await collect()
  assert.equal(result.status, 'ready')
  assert.deepEqual(result.coverage, {
    outsetaAccounts: 1, activeCampaignContacts: 1, contactLists: 2, contactTags: 1,
  })
  assert.equal(result.external.identities.rows[0].activeCampaignContactId, '41')
  assert.equal(result.external.memberships.rows[0].tier, 'free')
  assert.equal(result.external.memberships.rows[0].lifecycle, 'active')
  assert.equal(result.external.audience.rows[0].test, false)
  assert.equal(result.external.contactLists.rows.length, 2)
  assert.equal(result.attemptedWrites, 0)
  assert(calls.every(call => call.method === 'GET'))
  assert.equal(calls.filter(call => new URL(call.url).pathname.endsWith('/contactLists')).length, 2)
})

test('missing or contradictory stable authority withholds before downstream use', async () => {
  const cases = [
    [{ account: { PersonAccount: [{ IsPrimary: true, Person: { Uid: 'OtherPerson', Email: 'member@example.com' } }] } }, 'outseta_primary_person_conflict'],
    [{ account: { CurrentSubscription: { Uid: 'OtherCycle', StartDate: '2026-09-01T12:00:00.000Z', Plan: { Uid: 'L9nbKV9Z', Name: 'Free' } } } }, 'outseta_current_subscription_conflict'],
    [{ account: { AccountStage: 3, AccountStageLabel: 'Past Due' } }, 'outseta_lifecycle_unknown_or_conflicting'],
    [{ contactEmail: 'other@example.com' }, 'activecampaign_contact_link_conflict'],
  ]
  for (const [options, reason] of cases) {
    const { result } = await collect(options)
    assert.equal(result.status, 'withheld')
    assert.equal(result.reason, reason)
    assert.equal(result.attemptedWrites, 0)
  }
  const missingLink = profile(); missingLink.ac_contact_id = null
  const { result } = await collect({}, {}, storedSources(missingLink))
  assert.equal(result.status, 'withheld')
  assert.equal(result.reason, 'profile_stable_link_invalid')
})

test('Outseta full timestamps normalize as UTC without weakening identity or journey gates', async () => {
  for (const start of [
    '2026-09-01T12:00:00', '2026-09-01T12:00:00.0000000',
    '2026-09-01T12:00:00Z', '2026-09-01T08:00:00-04:00',
  ]) {
    const subscription = { ...accountBody().CurrentSubscription, StartDate: start }
    const { result } = await collect({ account: { Created: '2026-09-01T12:00:00', CurrentSubscription: subscription } })
    assert.equal(result.status, 'ready')
    assert.equal(result.external.memberships.rows[0].cycleStartedAt, '2026-09-01T12:00:00.000Z')
    const preview = previewFreeJourneySources({
      onboarding: {
        outsetaPersonUid: person, now, maxSnapshotAgeMs: 60_000,
        profiles: storedSources().profiles, completionEvents: storedSources().completionEvents,
      }, ...result.external, consentRequests: storedSources().consentRequests,
    })
    assert.equal(preview.status, 'ready_for_writer_review')
    assert.equal(preview.attemptedWrites, 0)
  }
  const { result } = await collect({ account: {
    CurrentSubscription: { ...accountBody().CurrentSubscription, Uid: 'OtherCycle', StartDate: '2026-09-01T12:00:00' },
  } })
  assert.equal(result.reason, 'outseta_current_subscription_conflict')
})

test('invalid Outseta timestamp calendars and unknown shapes withhold before AC reads', async () => {
  for (const value of [
    '2026-09-01', '2026-02-29T12:00:00', '2024-02-30T12:00:00', '0000-01-01T00:00:00',
    '2026-13-01T12:00:00', '2026-01-00T12:00:00', '2026-01-01T24:00:00',
    '2026-01-01T12:60:00', '2026-01-01T12:00:60', '2026-01-01T12:00:00+24:00',
    '2026-01-01T12:00:00+01:60', '2026-09-01 12:00:00', '2026-09-01T12:00:00.12345678',
    'private-value@example.com',
  ]) {
    for (const field of ['created', 'start']) {
      const changes = field === 'created' ? { Created: value }
        : { CurrentSubscription: { ...accountBody().CurrentSubscription, StartDate: value } }
      const { result, calls } = await collect({ account: changes })
      assert.equal(result.reason, field === 'created' ? 'outseta_account_created_invalid' : 'outseta_subscription_start_invalid')
      assert.equal(result.status, 'withheld')
      assert.equal(result.coverage, null)
      assert.equal(result.attemptedWrites, 0)
      assert.equal(calls.length, 1)
      assert.equal(JSON.stringify(result).includes(value), false)
    }
  }
  const { result } = await collect({ account: { PersonAccount: null } })
  assert.equal(result.reason, 'outseta_account_person_links_invalid')
})

test('normalized future subscription start still withholds journey eligibility', async () => {
  const { result } = await collect({ account: {
    CurrentSubscription: { ...accountBody().CurrentSubscription, StartDate: '2026-10-11T12:00:00' },
  } })
  assert.equal(result.status, 'ready')
  const preview = previewFreeJourneySources({
    onboarding: {
      outsetaPersonUid: person, now, maxSnapshotAgeMs: 60_000,
      profiles: storedSources().profiles, completionEvents: storedSources().completionEvents,
    }, ...result.external, consentRequests: storedSources().consentRequests,
  })
  assert.equal(preview.status, 'withheld')
  assert.equal(preview.attemptedWrites, 0)
})

test('invalid source metadata reports allowlisted field diagnostics without values', async () => {
  for (const [changes, reason] of [
    [{ AccountStageLabel: 3 }, 'outseta_account_stage_label_invalid'],
    [{ AccountStage: 'private-value@example.com' }, 'outseta_account_stage_invalid'],
    [{ IsDemo: 'private-value@example.com' }, 'outseta_account_demo_flag_invalid'],
    [{ Uid: null }, 'outseta_account_schema_invalid'],
  ]) {
    const { result, calls } = await collect({ account: changes })
    assert.equal(result.reason, reason)
    assert.equal(calls.length, 1)
    assert.equal(result.attemptedWrites, 0)
    assert.equal(JSON.stringify(result).includes('private-value@example.com'), false)
  }
})

test('provider HTTP failures report only safe status evidence and stop downstream reads', async () => {
  for (const provider of ['outseta', 'activecampaign']) {
    for (const status of [401, 403, 404, 429, 503]) {
      const { result, calls } = await collect({ httpFailure: { provider, status } })
      assert.equal(result.status, 'withheld')
      assert.equal(result.reason, `${provider}_http_failure_${status}`)
      assert.equal(result.coverage, null)
      assert.equal(result.attemptedWrites, 0)
      assert.equal(result.mutationAllowed, false)
      assert.equal('external' in result, false)
      assert.equal(calls.length, provider === 'outseta' ? 1 : 2)
      assert.equal(JSON.stringify(result).includes('must-not-appear'), false)
    }
  }
  for (const status of [0, 600, 401.5]) {
    const { result } = await collect({ httpFailure: { provider: 'outseta', status } })
    assert.equal(result.reason, 'source_http_failure')
  }
})

test('default transport discards failed HTTP bodies before JSON parsing', async t => {
  let canceled = false
  t.mock.method(globalThis, 'fetch', async () => new Response(new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode('private non-JSON error body')) },
    cancel() { canceled = true },
  }), { status: 401 }))
  const collector = new FreeJourneyOperationalSourceCollector({
    policy: policy(), mode: 'approved_live', liveReadsEnabled: true, now: () => now,
    credentials: {
      outsetaApiKey: 'synthetic-key-only', outsetaApiSecret: 'synthetic-secret-only',
      activeCampaignApiKey: 'synthetic-ac-key-only-123',
    },
  })
  const result = await collector.collect({ storedSources: storedSources(), outsetaPersonUid: person, subscriptionUid: cycle })
  assert.equal(result.reason, 'outseta_http_failure_401')
  assert.equal(result.status, 'withheld')
  assert.equal(result.coverage, null)
  assert.equal(result.attemptedWrites, 0)
  assert.equal(canceled, true)
})

test('changed relationship totals are incomplete evidence, never an empty or complete list', async () => {
  const { result } = await collect({ changedTotal: true })
  assert.equal(result.status, 'withheld')
  assert.equal(result.reason, 'activecampaign_relationship_total_changed')
  assert.equal(result.attemptedWrites, 0)
})

async function collectWholeRelationships(overrides = {}) {
  const source = transport()
  const relationshipCalls = []
  const listBody = overrides.listBody ?? { contactLists: [
    { id: '700', contact: '41', list: '12', form: '0', status: '1' },
    { id: '701', contact: '41', list: '34', form: '90', status: '1' },
  ] }
  const tagBody = overrides.tagBody ?? { contactTags: [
    { id: '900', contact: '41', tag: '800' },
    { id: '901', contact: '41', tag: '801' },
  ] }
  const collector = new FreeJourneyOperationalSourceCollector({
    policy: policy({ pageSize: 100, ...overrides.policy }), mode: 'fixture', now: () => now,
    transport: async request => {
      assert.equal(request.method, 'GET')
      const url = new URL(request.url)
      if (request.provider !== 'activecampaign' || url.pathname === '/api/3/contacts/41') return source.fn(request)
      relationshipCalls.push(url)
      if (url.pathname === '/api/3/contacts/41/contactLists') return { status: 200, body: listBody }
      if (url.pathname === '/api/3/contacts/41/contactTags') return { status: 200, body: tagBody }
      if (url.pathname === '/api/3/tags/800') return { status: 200, body: { tag: { id: overrides.tagId ?? '800', tag: 'plan-free' } } }
      if (url.pathname === '/api/3/tags/801') return { status: 200, body: { tag: { id: '801', tag: 'wix historical import' } } }
      throw new Error('Unexpected scoped relationship read')
    },
  })
  return { result: await collector.collect({ storedSources: storedSources(), outsetaPersonUid: person, subscriptionUid: cycle }), relationshipCalls }
}

test('documented per-contact collections without meta resolve exact tag definitions with one relationship read each', async () => {
  const { result, relationshipCalls } = await collectWholeRelationships()
  assert.equal(result.status, 'ready')
  assert.equal(result.coverage.contactLists, 2)
  assert.equal(result.coverage.contactTags, 2)
  assert.equal(result.external.memberships.rows[0].tier, 'free')
  assert.equal(result.external.audience.rows[0].test, false)
  assert.equal(result.external.audience.rows[0].hiringFirm, false)
  assert.equal(result.attemptedWrites, 0)
  assert.deepEqual(relationshipCalls.map(url => url.pathname), [
    '/api/3/contacts/41/contactLists', '/api/3/contacts/41/contactTags', '/api/3/tags/800', '/api/3/tags/801',
  ])
  assert(relationshipCalls.filter(url => url.pathname.includes('/contacts/')).every(url => url.searchParams.get('offset') === '0'))
})

test('complete empty relationship responses never establish lifecycle email consent', async () => {
  const { result } = await collectWholeRelationships({ listBody: { contactLists: [] }, tagBody: { contactTags: [] } })
  assert.equal(result.status, 'ready')
  assert.equal(result.coverage.contactLists, 0)
  const preview = previewFreeJourneySources({
    onboarding: {
      outsetaPersonUid: person, now, maxSnapshotAgeMs: 60_000,
      profiles: storedSources().profiles, completionEvents: storedSources().completionEvents,
    }, ...result.external, consentRequests: storedSources().consentRequests,
  })
  assert.equal(preview.status, 'withheld')
  assert(preview.reasons.includes('doi_relationship_missing_or_ambiguous'))
  assert.equal(preview.attemptedWrites, 0)
})

test('unpaginated contact relations reject malformed roots, pagination hints, exact bounds and ambiguous identities', async () => {
  const valid = { id: '700', contact: '41', list: '12', form: '0', status: '1' }
  for (const [listBody, reason] of [
    [[], 'activecampaign_relationship_payload_invalid'],
    [{ contactLists: null }, 'activecampaign_relationship_rows_invalid'],
    [{ contactLists: [valid], meta: null }, 'activecampaign_relationship_coverage_unavailable'],
    [{ contactLists: [valid], meta: { total: 'invalid' } }, 'activecampaign_relationship_coverage_unavailable'],
    [{ contactLists: [valid], links: { next: 'unreviewed' } }, 'activecampaign_relationship_coverage_unavailable'],
    [{ contactLists: [valid], next: 'unreviewed' }, 'activecampaign_relationship_coverage_unavailable'],
    [{ contactLists: [valid], pagination: {} }, 'activecampaign_relationship_coverage_unavailable'],
    [{ contactLists: Array.from({ length: 100 }, (_, i) => ({ ...valid, id: String(700 + i) })) }, 'activecampaign_relationship_coverage_unavailable'],
    [{ contactLists: Array.from({ length: 101 }, (_, i) => ({ ...valid, id: String(700 + i) })) }, 'activecampaign_relationship_rows_invalid'],
    [{ contactLists: [{ ...valid, contact: '42' }] }, 'activecampaign_relationship_identity_conflict'],
    [{ contactLists: [valid, valid] }, 'activecampaign_relationship_identity_conflict'],
  ]) {
    const { result, relationshipCalls } = await collectWholeRelationships({ listBody })
    assert.equal(result.status, 'withheld')
    assert.equal(result.reason, reason)
    assert.equal(result.attemptedWrites, 0)
    assert.equal(relationshipCalls.length, 1)
  }
  for (const tagBody of [
    { contactTags: [{ id: '900', contact: '42', tag: '800' }] },
    { contactTags: [{ id: '900', contact: '41', tag: '800' }, { id: '900', contact: '41', tag: '801' }] },
  ]) {
    const { result, relationshipCalls } = await collectWholeRelationships({ tagBody })
    assert.equal(result.reason, 'activecampaign_relationship_identity_conflict')
    assert.equal(relationshipCalls.length, 2)
  }
  const { result } = await collectWholeRelationships({ tagId: '802' })
  assert.equal(result.reason, 'activecampaign_tag_identity_conflict')
})

test('a later paginated page lacking meta cannot switch to the per-contact whole collection contract', async () => {
  const source = transport()
  const collector = new FreeJourneyOperationalSourceCollector({
    policy: policy(), mode: 'fixture', now: () => now,
    transport: async request => {
      const response = await source.fn(request)
      const url = new URL(request.url)
      if (url.pathname.endsWith('/contactLists') && url.searchParams.get('offset') === '1') delete response.body.meta
      return response
    },
  })
  const result = await collector.collect({ storedSources: storedSources(), outsetaPersonUid: person, subscriptionUid: cycle })
  assert.equal(result.reason, 'activecampaign_relationship_coverage_unavailable')
  assert.equal(result.attemptedWrites, 0)
})

test('complete tag reads preserve source tags while excluding explicit test audiences', async () => {
  const { result } = await collect({ tagName: 'test-contact' })
  assert.equal(result.status, 'ready')
  assert.equal(result.external.audience.rows[0].test, true)
  const preview = previewFreeJourneySources({
    onboarding: {
      outsetaPersonUid: person, now, maxSnapshotAgeMs: 60_000,
      profiles: storedSources().profiles, completionEvents: storedSources().completionEvents,
    },
    ...result.external,
    consentRequests: storedSources().consentRequests,
  })
  assert.equal(preview.status, 'withheld')
  assert.deepEqual(preview.reasons, ['excluded_audience'])
})

test('delayed double opt-in can move the same stored event from withheld to ready without a write', async () => {
  const first = (await collect({ noDoi: true })).result
  const second = (await collect()).result
  assert.equal(first.status, 'ready')
  assert.equal(second.status, 'ready')
  const input = external => previewFreeJourneySources({
    onboarding: {
      outsetaPersonUid: person, now, maxSnapshotAgeMs: 60_000,
      profiles: storedSources().profiles, completionEvents: storedSources().completionEvents,
    },
    ...external,
    consentRequests: storedSources().consentRequests,
  })
  const before = input(first.external)
  const after = input(second.external)
  assert.equal(before.status, 'withheld')
  assert.deepEqual(before.reasons, ['doi_relationship_missing_or_ambiguous'])
  assert.equal(after.status, 'ready_for_writer_review')
  assert.equal(before.attemptedWrites + after.attemptedWrites, 0)
})

test('missing reviewed exclusion policy prevents construction before any read', () => {
  const value = policy(); delete value.exclusionPolicy
  const source = transport()
  assert.throws(() => new FreeJourneyOperationalSourceCollector({
    policy: value,
    mode: 'fixture',
    transport: source.fn,
    now: () => now,
  }))
  assert.equal(source.calls.length, 0)
})

test('invalid mode and a transport that ignores abort remain bounded and fail closed', async () => {
  assert.throws(() => new FreeJourneyOperationalSourceCollector({
    policy: policy(), mode: 'invalid', transport: transport().fn, now: () => now,
  }))
  const collector = new FreeJourneyOperationalSourceCollector({
    policy: policy({ timeoutMs: 1 }),
    mode: 'fixture',
    transport: async () => new Promise(() => {}),
    now: () => now,
  })
  const started = Date.now()
  const result = await collector.collect({ storedSources: storedSources(), outsetaPersonUid: person, subscriptionUid: cycle })
  assert.equal(result.status, 'withheld')
  assert.equal(result.reason, 'source_timeout')
  assert(Date.now() - started < 1000)
})
