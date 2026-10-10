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

test('changed relationship totals are incomplete evidence, never an empty or complete list', async () => {
  const { result } = await collect({ changedTotal: true })
  assert.equal(result.status, 'withheld')
  assert.equal(result.reason, 'activecampaign_relationship_total_changed')
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
