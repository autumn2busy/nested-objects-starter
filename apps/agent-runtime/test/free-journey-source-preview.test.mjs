import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { previewFreeJourneySources, summarizeFreeJourneySourcePreview } from '../dist/sensors/free-journey-source-preview.js'

const now = '2026-09-21T12:00:00.000Z'
const member = '31800000-0000-4000-8000-000000000921'
const person = 'SyntheticPerson'
const cycle = 'SyntheticCycle'
const purpose = 'free_onboarding_and_conversion_email'
const eventName = 'lifecycle_email_consent_requested'
const snapshot = rows => ({ coverage: 'complete', observedAt: now, rows })
const hash = parts => createHash('sha256').update(JSON.stringify(parts)).digest('hex')
function input() {
  const membership = {
    sourceSystem: 'outseta', authoritative: true, identityState: 'verified', isCurrent: true,
    sourceRecordId: cycle, outsetaPersonUid: person, outsetaAccountUid: 'SyntheticAccount', subscriptionUid: cycle,
    tier: 'free', lifecycle: 'active', memberSince: '2026-08-01T12:00:00.000Z', cycleStartedAt: '2026-08-01T12:00:00.000Z',
  }
  return {
    onboarding: {
      outsetaPersonUid: person, now, maxSnapshotAgeMs: 300000,
      profiles: snapshot([{
        id: member, outseta_person_uid: person, headline: 'Inspection services', bio: 'Synthetic private profile',
        city: 'Atlanta', state: 'GA', experience_level: 'new', primary_services: 'Property Inspections',
        service_areas: ['Property Inspections'], updated_at: '2026-09-20T12:00:00.000Z',
      }]),
      completionEvents: snapshot([{
        id: '31800000-0000-4000-8000-000000000922',
        client_event_id: 'income_scenario_completed:v1:' + hash(['income_scenario_completed', 'v1', person, cycle]),
        event_name: 'income_scenario_completed', member_uid: person,
        source_page: '/tools/income-calculator', source: 'income_scenarios', occurred_at: '2026-09-20T11:00:00.000Z',
        event_data: { sourcePage: '/tools/income-calculator', source: 'income_scenarios', completionContract: 'v1', lifecycleCycleId: cycle },
      }]),
    },
    identities: snapshot([{
      canonicalMemberId: member, outsetaPersonUid: person, outsetaAccountUid: 'SyntheticAccount',
      subscriptionUid: cycle, activeCampaignContactId: '41', identityState: 'verified',
    }]),
    memberships: snapshot([membership]),
    consentRequests: snapshot([{
      id: '31800000-0000-4000-8000-000000000923',
      client_event_id: `${eventName}:v1:${hash([eventName, 'v1', person, cycle, purpose])}`,
      event_name: eventName, member_uid: person, source_page: '/welcome', source: 'member_consent',
      occurred_at: '2026-09-20T10:00:00.000Z',
      event_data: { sourcePage: '/welcome', source: 'member_consent', consentContract: 'v1', purpose, lifecycleCycleId: cycle },
    }]),
    audience: snapshot([{
      activeCampaignContactId: '41', internal: false, coworker: false, test: false, demo: false, hiringFirm: false,
    }]),
    contacts: snapshot([{ id: '41', bounced_hard: '0', bounced_soft: '0', deleted: '0' }]),
    contactLists: snapshot([{ contact: '41', list: '44', form: '99', status: '1' }]),
    consentAsset: { purpose, listId: '44', formId: '99', doubleOptInVerified: true, observedAt: now },
  }
}

test('exact fresh source evidence produces read-only writer-review readiness and no profile content', () => {
  const value = input(), before = structuredClone(value)
  const result = previewFreeJourneySources(value)
  assert.equal(result.status, 'ready_for_writer_review')
  assert.equal(result.consent, 'confirmed_scoped_doi')
  assert.equal(result.onboarding.status, 'complete')
  assert.equal(result.incomeScenarioStatus, 'accepted')
  assert.equal(result.consentRequest.eventName, eventName)
  assert.equal(result.attemptedWrites, 0)
  assert.equal(result.mutationAllowed, false)
  assert(!/Atlanta|Synthetic private profile|Inspection services/.test(JSON.stringify(result)))
  assert.deepEqual(value, before)
})

const held = [
  ['no dedicated asset', v => { v.consentAsset = null }],
  ['unverified DOI configuration', v => { v.consentAsset.doubleOptInVerified = false }],
  ['wrong consent purpose', v => { v.consentAsset.purpose = 'elite_opportunity_alerts' }],
  ['stale asset', v => { v.consentAsset.observedAt = '2026-09-20T12:00:00.000Z' }],
  ['profile mirror authority', v => { v.memberships.rows[0].sourceSystem = 'supabase_profiles' }],
  ['wrong account', v => { v.memberships.rows[0].outsetaAccountUid = 'DifferentAccount' }],
  ['wrong canonical profile', v => { v.identities.rows[0].canonicalMemberId = '31800000-0000-4000-8000-000000000924' }],
  ['paid member', v => { v.memberships.rows[0].tier = 'pro' }],
  ['inactive member', v => { v.memberships.rows[0].lifecycle = 'canceled' }],
  ['missing receipt', v => { v.consentRequests.rows = [] }],
  ['duplicated receipt', v => { v.consentRequests.rows.push(v.consentRequests.rows[0]) }],
  ['receipt wrong person', v => { v.consentRequests.rows[0].member_uid = 'DifferentPerson' }],
  ['receipt old cycle', v => { v.consentRequests.rows[0].event_data.lifecycleCycleId = 'OldCycle' }],
  ['receipt incorrect key', v => { v.consentRequests.rows[0].client_event_id = 'invented' }],
  ['receipt extra browser consent assertion', v => { v.consentRequests.rows[0].event_data.consent = true }],
  ['receipt before member cycle', v => { v.consentRequests.rows[0].occurred_at = '2026-07-01T12:00:00.000Z' }],
  ['receipt after observation', v => { v.consentRequests.rows[0].occurred_at = '2026-09-22T12:00:00.000Z' }],
  ['unknown audience', v => { delete v.audience.rows[0].coworker }],
  ['excluded demo', v => { v.audience.rows[0].demo = true }],
  ['wrong audience contact', v => { v.audience.rows[0].activeCampaignContactId = '42' }],
  ['bounce', v => { v.contacts.rows[0].bounced_hard = '1' }],
  ['unknown delivery', v => { delete v.contacts.rows[0].deleted }],
  ['wrong contact', v => { v.contacts.rows[0].id = '42' }],
  ['unsubscribed DOI relationship', v => { v.contactLists.rows[0].status = '2' }],
  ['wrong DOI form', v => { v.contactLists.rows[0].form = '88' }],
  ['wrong DOI contact', v => { v.contactLists.rows[0].contact = '42' }],
  ['no DOI relationship', v => { v.contactLists.rows = [] }],
  ['ambiguous DOI relationship', v => { v.contactLists.rows.push(v.contactLists.rows[0]) }],
  ['partial calculation lookup', v => { v.onboarding.completionEvents.coverage = 'partial' }],
  ['missing saved profile column', v => { delete v.onboarding.profiles.rows[0].state }],
]
for (const [label, change] of held) test(`withholds ${label}`, () => {
  const value = input(); change(value)
  const result = previewFreeJourneySources(value)
  assert.equal(result.status, 'withheld')
  assert.equal(result.consentRequest, null)
  assert.equal(result.incomeScenarioStatus, 'withheld')
  assert.equal(result.attemptedWrites, 0)
  assert.equal(result.mutationAllowed, false)
})

for (const source of ['identities', 'memberships', 'consentRequests', 'audience', 'contacts', 'contactLists']) {
  test(`${source}: partial, stale, future and missing reads remain withheld`, () => {
    for (const change of [s => { s.coverage = 'partial' }, s => { s.observedAt = '2026-09-20T12:00:00.000Z' },
      s => { s.observedAt = '2026-09-22T12:00:00.000Z' }, s => { s.rows = [] }]) {
      const value = input(); change(value[source])
      assert.equal(previewFreeJourneySources(value).status, 'withheld')
    }
  })
}

test('explicit incomplete profile is retained without declaring onboarding complete', () => {
  const value = input(); value.onboarding.profiles.rows[0].city = null
  const result = previewFreeJourneySources(value)
  assert.equal(result.status, 'ready_for_writer_review')
  assert.equal(result.onboarding.status, 'incomplete')
  assert.equal(result.onboarding.onboardingCompletion, null)
})

for (const incomplete of [false, true]) test(`fresh empty income lookup supports ${incomplete ? 'profile' : 'calculation'} needed without inventing milestones`, () => {
  const value = input()
  value.onboarding.completionEvents.rows = []
  if (incomplete) value.onboarding.profiles.rows[0].city = null
  const before = structuredClone(value)
  const result = previewFreeJourneySources(value)
  assert.equal(result.status, 'ready_for_writer_review')
  assert.equal(result.incomeScenarioStatus, 'missing')
  assert.equal(result.onboarding.status, 'incomplete')
  assert.equal(result.onboarding.profileInputs.geography, !incomplete)
  assert.equal(result.onboarding.activation, null)
  assert.equal(result.onboarding.onboardingCompletion, null)
  assert.equal(result.onboarding.sourceRecordIds.length, 1)
  assert(!JSON.stringify(result).includes('conversion_events:'))
  assert.equal(result.attemptedWrites, 0)
  assert.equal(result.mutationAllowed, false)
  assert.deepEqual(value, before)
})

test('early stages preserve unknown, identity, chronology, suppression and consent boundaries', () => {
  const changes = [
    ...held.filter(([name]) => name !== 'partial calculation lookup').map(([, change]) => change),
    v => { v.onboarding.profiles.rows = [] },
    v => { v.onboarding.profiles.rows.push(v.onboarding.profiles.rows[0]) },
    v => { v.onboarding.profiles.rows[0].outseta_person_uid = 'OtherPerson' },
    v => { v.onboarding.profiles.rows[0].updated_at = '2026-07-01T12:00:00.000Z' },
    v => { v.onboarding.profiles.rows[0].updated_at = '2026-09-22T12:00:00.000Z' },
    v => { v.onboarding.profiles.rows[0].service_areas = 'Property Inspections' },
  ]
  for (const source of ['profiles', 'completionEvents']) for (const mutate of [
    s => { s.coverage = 'partial' }, s => { s.coverage = 'unknown' },
    s => { s.observedAt = 'invalid' }, s => { s.observedAt = '2026-09-20T12:00:00.000Z' },
    s => { s.observedAt = '2026-09-22T12:00:00.000Z' }, s => { s.rows = null },
  ]) changes.push(v => mutate(v.onboarding[source]))
  for (const change of changes) {
    const value = input(); value.onboarding.completionEvents.rows = []; change(value)
    const result = previewFreeJourneySources(value)
    assert.equal(result.status, 'withheld', change.toString())
    assert.equal(result.incomeScenarioStatus, 'withheld')
    assert.equal(result.onboarding, null)
  }
})

test('nonempty invalid or ambiguous income receipts never become missing or an early stage', () => {
  for (const change of [
    v => { v.onboarding.completionEvents.rows[0].client_event_id = 'invalid' },
    v => { v.onboarding.completionEvents.rows[0].event_data.lifecycleCycleId = 'OldCycle' },
    v => { v.onboarding.completionEvents.rows.push(v.onboarding.completionEvents.rows[0]) },
    v => { v.onboarding.completionEvents.rows[0].occurred_at = '2026-09-22T12:00:00.000Z' },
  ]) {
    const value = input(); value.onboarding.profiles.rows[0].city = null; change(value)
    assert.equal(previewFreeJourneySources(value).status, 'withheld')
  }
})

test('aggregate counts redact identities; partial, oversized or duplicate cohort is unknown, not zero', () => {
  const value = input(), result = summarizeFreeJourneySourcePreview({ coverage: 'complete', candidates: [value] })
  assert.equal(result.readyForWriterReview, 1)
  assert.equal(result.reviewed, 1)
  assert(!/Synthetic|31800000|41|@/.test(JSON.stringify(result)))
  for (const cohort of [
    { coverage: 'partial', candidates: [] }, { coverage: 'unknown', candidates: [value] },
    { coverage: 'complete', candidates: [value, value] }, { coverage: 'complete', candidates: Array(101).fill(value) },
  ]) {
    const unknown = summarizeFreeJourneySourcePreview(cohort)
    assert.equal(unknown.readyForWriterReview, null)
    assert.equal(unknown.reviewed, null)
  }
  const empty = summarizeFreeJourneySourcePreview({ coverage: 'complete', candidates: [] })
  assert.equal(empty.reviewed, 0)
  const collision = input(); collision.onboarding.outsetaPersonUid = 'OtherPerson'
  assert.equal(summarizeFreeJourneySourcePreview({ coverage: 'complete', candidates: [value, collision] }).reviewed, null)
  value.consentAsset = null
  assert.deepEqual(summarizeFreeJourneySourcePreview({ coverage: 'complete', candidates: [value] }).reasons, { dedicated_consent_asset_unverified: 1 })
})

test('preview receipt and milestones retain compatibility with #375 without invoking its writer', () => {
  const writerSource = readFileSync(new URL('../../web-members/lib/active-campaign-free-journey.ts', import.meta.url), 'utf8')
  const context = { exports: {}, require: name => { assert.equal(name, 'node:crypto'); return { createHash } } }
  vm.runInNewContext(ts.transpileModule(writerSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context)
  const value = input(), preview = previewFreeJourneySources(value)
  const evidence = {
    now, evidenceObservedAt: now, maxEvidenceAgeMs: 300000,
    membership: { ...value.memberships.rows[0], ...value.identities.rows[0] }, audienceTraits: [],
    consentRequest: preview.consentRequest, profileInputs: preview.onboarding.profileInputs,
    incomeScenarioStatus: preview.incomeScenarioStatus, activation: preview.onboarding.activation,
    onboardingCompletion: preview.onboarding.onboardingCompletion,
  }
  assert.equal(context.exports.deriveFreeJourneyStage(evidence), 'conversion_eligible')
  evidence.membership.lifecycle = 'trialing'
  assert.equal(context.exports.deriveFreeJourneyStage(evidence), 'onboarding_complete')
  evidence.profileInputs.geography = false
  assert.equal(context.exports.deriveFreeJourneyStage(evidence), 'profile_needed')
  for (const incomplete of [false, true]) {
    const early = input(); early.onboarding.completionEvents.rows = []
    if (incomplete) early.onboarding.profiles.rows[0].headline = null
    const result = previewFreeJourneySources(early)
    assert.equal(context.exports.deriveFreeJourneyStage({ ...evidence,
      profileInputs: result.onboarding.profileInputs, incomeScenarioStatus: result.incomeScenarioStatus,
      activation: result.onboarding.activation, onboardingCompletion: result.onboarding.onboardingCompletion,
    }), incomplete ? 'profile_needed' : 'calculation_needed')
  }
})

test('malformed contexts are withheld and module has no writer or network dependency', () => {
  for (const value of [null, {}, { onboarding: { now: 'bad' } }]) assert.equal(previewFreeJourneySources(value).status, 'withheld')
  const source = readFileSync(new URL('../src/sensors/free-journey-source-preview.ts', import.meta.url), 'utf8')
  assert(!/\bfetch\s*\(|syncActiveCampaignFreeJourney|apiKey|process\.env/.test(source))
})
