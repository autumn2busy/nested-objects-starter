import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { previewFreeJourneySources, summarizeFreeJourneySourcePreview } from '../dist/sensors/free-journey-source-preview.js'
import * as consentReceiptModule from '../dist/sensors/free-journey-consent-receipt.js'
import { previewActiveCampaignFreeJourney } from '../dist/operations/active-campaign-free-journey.js'

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
    contacts: snapshot([{ id: '41', email: 'synthetic@example.com', bounced_hard: '0', bounced_soft: '0', deleted: '0' }]),
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
  const writerSource = readFileSync(new URL('../src/operations/active-campaign-free-journey.ts', import.meta.url), 'utf8')
  const context = { exports: {}, require: name => { assert.equal(name, '../sensors/free-journey-consent-receipt.js'); return consentReceiptModule } }
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

function historicalInput() {
  const value = input()
  value.consentAsset = null
  value.consentRequests.rows = []
  value.contactLists.rows = []
  value.historicalConsentDecisionRef = 'synthetic:historical-signup-policy:v1'
  value.historicalConsent = {
    evidenceType: 'owner_attested_historical_signup_permission',
    policyDecisionRef: value.historicalConsentDecisionRef,
    attestedAt: '2026-09-20T12:00:00.000Z', cohortCutoffAt: '2026-09-19T12:00:00.000Z',
    source: 'outseta_signup_form', purpose, outsetaPersonUid: person,
    outsetaAccountUid: 'SyntheticAccount', subscriptionUid: cycle,
    memberSince: value.memberships.rows[0].memberSince,
    laterSuppression: { observedAt: now, outsetaHasUnsubscribed: false,
      activeCampaignBounced: false, activeCampaignDeleted: false, activeCampaignSuppressed: false },
  }
  return value
}

test('historical permission retains provenance without manufacturing a request or DOI', () => {
  const value = historicalInput(), before = structuredClone(value)
  const result = previewFreeJourneySources(value)
  assert.equal(result.status, 'historical_consent_preview_only')
  assert.equal(result.consent, 'historical_owner_attestation')
  assert.deepEqual(result.historicalConsent, value.historicalConsent)
  assert.equal(result.consentRequest, null)
  assert.equal(result.onboarding.status, 'complete')
  assert.equal(result.incomeScenarioStatus, 'accepted')
  assert.equal(result.attemptedWrites, 0)
  assert.equal(result.mutationAllowed, false)
  assert(!/Atlanta|Synthetic private profile|Inspection services|confirmed_scoped_doi/.test(JSON.stringify(result)))
  assert.deepEqual(value, before)
  const aggregate = summarizeFreeJourneySourcePreview({ coverage: 'complete', candidates: [value] })
  assert.equal(aggregate.historicalPreviewOnly, 1)
  assert.equal(aggregate.readyForWriterReview, 0)
  assert.equal(aggregate.withheld, 0)
  assert(!/Synthetic|31800000|@/.test(JSON.stringify(aggregate)))
})

test('historical preview rejects wrong policy, mixed receipts, stale evidence and suppression conflicts', () => {
  const changes = [
    v => { delete v.historicalConsentDecisionRef },
    v => { v.historicalConsentDecisionRef = 'wrong-policy' },
    v => { v.historicalConsent = false },
    v => { v.historicalConsent.source = 'activecampaign_tag' },
    v => { v.historicalConsent.purpose = 'elite_opportunity_alerts' },
    v => { v.historicalConsent.extra = true },
    v => { v.historicalConsent.outsetaPersonUid = 'OtherPerson' },
    v => { v.historicalConsent.outsetaAccountUid = 'OtherAccount' },
    v => { v.historicalConsent.subscriptionUid = 'OldCycle' },
    v => { v.historicalConsent.memberSince = '2026-08-02T12:00:00.000Z' },
    v => { v.historicalConsent.cohortCutoffAt = '2026-07-01T12:00:00.000Z' },
    v => { v.historicalConsent.cohortCutoffAt = now },
    v => { v.historicalConsent.attestedAt = '2026-09-22T12:00:00.000Z' },
    v => { v.historicalConsent.laterSuppression.observedAt = '2026-09-20T12:00:00.000Z' },
    v => { v.historicalConsent.laterSuppression.observedAt = '2026-09-22T12:00:00.000Z' },
    v => { v.contacts.observedAt = '2026-09-21T11:59:00.000Z' },
    v => { v.consentRequests.rows = input().consentRequests.rows },
    v => { v.contacts.rows[0].bounced_soft = '1' },
    v => { v.contacts.rows[0].deleted = '1' },
    v => { v.contacts.rows[0].id = '42' },
    v => { v.contactLists.rows = [{ contact: '41', list: '44', status: '2' }] },
    v => { v.contactLists.rows = [{ contact: '42', list: '44', status: '1' }] },
    v => { v.contactLists.rows = [{ contact: '41', list: '44', status: '1' }, { contact: '41', list: '44', status: '1' }] },
    v => { v.memberships.rows[0].tier = 'pro' },
    v => { v.audience.rows[0].test = true },
    v => { v.onboarding.completionEvents.coverage = 'unknown' },
  ]
  for (const field of ['outsetaHasUnsubscribed', 'activeCampaignBounced', 'activeCampaignDeleted', 'activeCampaignSuppressed']) {
    changes.push(v => { v.historicalConsent.laterSuppression[field] = true })
    changes.push(v => { delete v.historicalConsent.laterSuppression[field] })
  }
  for (const source of ['identities', 'memberships', 'consentRequests', 'audience', 'contacts', 'contactLists']) {
    changes.push(v => { v[source].coverage = 'partial' })
  }
  for (const change of changes) {
    const value = historicalInput(); change(value)
    const result = previewFreeJourneySources(value)
    assert.equal(result.status, 'withheld', change.toString())
    assert.equal(result.historicalConsent, null)
    assert.equal(result.consentRequest, null)
    assert.equal(result.consent, 'unverified')
    assert.equal(result.attemptedWrites, 0)
  }
})

test('fresh suppression before attestation is withheld; equal timestamps remain preview-only', () => {
  const value = historicalInput()
  value.historicalConsent.attestedAt = '2026-09-21T11:59:00.000Z'
  value.historicalConsent.laterSuppression.observedAt = '2026-09-21T11:58:00.000Z'
  const held = previewFreeJourneySources(value)
  assert.equal(held.status, 'withheld')
  assert.equal(held.historicalConsent, null)
  assert.equal(held.attemptedWrites, 0)
  value.historicalConsent.laterSuppression.observedAt = value.historicalConsent.attestedAt
  assert.equal(previewFreeJourneySources(value).status, 'historical_consent_preview_only')
})

test('historical source output passes the actual writer preview boundary with zero provider calls for every stage', async () => {
  const writerSource = readFileSync(new URL('../src/operations/active-campaign-free-journey.ts', import.meta.url), 'utf8')
  const context = { exports: {}, URL, Intl, require: name => { assert.equal(name, '../sensors/free-journey-consent-receipt.js'); return consentReceiptModule } }
  vm.runInNewContext(ts.transpileModule(writerSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context)
  for (const stage of ['profile_needed', 'calculation_needed', 'onboarding_complete', 'conversion_eligible']) {
    const value = historicalInput()
    // Explicit synthetic policy compatible with the writer's date-only expiry; not a live freshness SLA.
    value.onboarding.maxSnapshotAgeMs = 86_400_000
    if (['profile_needed', 'calculation_needed'].includes(stage)) value.onboarding.completionEvents.rows = []
    if (stage === 'profile_needed') value.onboarding.profiles.rows[0].headline = null
    if (stage === 'onboarding_complete') value.memberships.rows[0].lifecycle = 'trialing'
    const preview = previewFreeJourneySources(value)
    assert.equal(preview.status, 'historical_consent_preview_only')
    let requests = 0
    const result = await context.exports.syncActiveCampaignFreeJourney({
      now, evidenceObservedAt: now, evidenceExpiresAt: '2026-09-22', maxEvidenceAgeMs: value.onboarding.maxSnapshotAgeMs,
      membership: { ...value.memberships.rows[0], ...value.identities.rows[0], email: 'synthetic@example.com' },
      consentRequest: preview.consentRequest, historicalConsent: preview.historicalConsent,
      audienceTraits: [], profileInputs: preview.onboarding.profileInputs,
      incomeScenarioStatus: preview.incomeScenarioStatus, activation: preview.onboarding.activation,
      onboardingCompletion: preview.onboarding.onboardingCompletion,
    }, { apiUrl: 'https://synthetic.api-us1.com', apiKey: 'synthetic-key', consentListId: '44',
      consentFormId: '99', accountTimeZone: 'America/New_York',
      historicalConsentDecisionRef: value.historicalConsentDecisionRef,
    }, async () => { requests++; throw new Error('Provider access forbidden in preview') })
    assert.equal(result.status, 'withheld')
    assert.equal(result.desiredStage, stage)
    assert.equal(result.consentProvenance, 'historical_owner_attestation')
    assert.equal(result.steps.at(-1).code, 'historical_consent_preview_only')
    assert.equal(result.attemptedWrites, 0)
    assert.equal(result.confirmedWrites, 0)
    assert.equal(requests, 0)
  }
})

test('malformed contexts are withheld and module has no writer or network dependency', () => {
  for (const value of [null, {}, { onboarding: { now: 'bad' } }]) assert.equal(previewFreeJourneySources(value).status, 'withheld')
  const source = readFileSync(new URL('../src/sensors/free-journey-source-preview.ts', import.meta.url), 'utf8')
  assert(!/\bfetch\s*\(|syncActiveCampaignFreeJourney|apiKey|process\.env/.test(source))
})

function signupReceipt(value) {
  const original = value.consentRequests.rows[0]
  return {
    ...original, source_page: '/outseta/signup', source: 'outseta_signup_form',
    client_event_id: `${eventName}:signup-v1:${hash([eventName, 'signup-v1', person, cycle, purpose])}`,
    event_data: {
      sourcePage: '/outseta/signup', source: 'outseta_signup_form', consentContract: 'signup-v1',
      purpose, lifecycleCycleId: cycle, outsetaAccountUid: 'SyntheticAccount',
      consentProperty: 'NoLifecycleEmailRequested', evidenceKind: 'signed_signup_callback',
      consentText: 'Email me getting-started guidance and occasional membership offers from Nested Objects. I can unsubscribe anytime.',
      consentRequested: true, registrationOccurredAt: original.occurred_at,
    },
  }
}

test('signed signup provenance reaches actual onboarding readiness without relabeling it as welcome', () => {
  const value = input()
  value.consentRequests.rows = [signupReceipt(value)]
  const result = previewFreeJourneySources(value)
  assert.equal(result.status, 'ready_for_writer_review')
  assert.equal(result.consentRequest.eventData.sourcePage, '/outseta/signup')
  assert.equal(result.consentRequest.eventData.consentContract, 'signup-v1')
  assert.equal(result.onboarding.status, 'complete')
  assert.equal(result.attemptedWrites, 0)
  assert.equal(result.mutationAllowed, false)
})

test('signup registration timestamp accepts equivalent database UTC serialization', () => {
  const value = input()
  const receipt = signupReceipt(value)
  receipt.occurred_at = receipt.occurred_at.replace('Z', '+00:00')
  value.consentRequests.rows = [receipt]
  assert.equal(previewFreeJourneySources(value).status, 'ready_for_writer_review')
})

test('welcome and signup requests coalesce only after both contracts validate; input order is immaterial', () => {
  const value = input(), welcome = value.consentRequests.rows[0], signup = signupReceipt(value)
  signup.id = '31800000-0000-4000-8000-000000000925'
  signup.occurred_at = '2026-09-19T10:00:00.000Z'
  signup.event_data.registrationOccurredAt = signup.occurred_at
  for (const rows of [[welcome, signup], [signup, welcome]]) {
    value.consentRequests.rows = rows
    const result = previewFreeJourneySources(value)
    assert.equal(result.status, 'ready_for_writer_review')
    assert.equal(result.consentRequest.eventData.consentContract, 'signup-v1')
    assert.equal(result.consentRequest.occurredAt, signup.occurred_at)
  }
  value.consentRequests.rows = [welcome, { ...signup, member_uid: 'OtherPerson' }]
  assert.equal(previewFreeJourneySources(value).status, 'withheld')
})

for (const [label, change] of [
  ['declined choice', r => { r.event_data.consentRequested = false }],
  ['string choice', r => { r.event_data.consentRequested = 'true' }],
  ['missing choice', r => { delete r.event_data.consentRequested }],
  ['wrong property', r => { r.event_data.consentProperty = 'SavedMarketingFlag' }],
  ['changed wording', r => { r.event_data.consentText = 'All marketing emails' }],
  ['generic account callback', r => { r.event_data.evidenceKind = 'signed_account_created' }],
  ['wrong account', r => { r.event_data.outsetaAccountUid = 'OtherAccount' }],
  ['wrong person', r => { r.member_uid = 'OtherPerson' }],
  ['old cycle', r => { r.event_data.lifecycleCycleId = 'OldCycle' }],
  ['legacy key', r => { r.client_event_id = input().consentRequests.rows[0].client_event_id }],
  ['wrong registration time', r => { r.event_data.registrationOccurredAt = now }],
  ['extra browser assertion', r => { r.event_data.browserConsent = true }],
  ['wrong top-level source', r => { r.source_page = '/welcome' }],
  ['before cycle', r => { r.occurred_at = r.event_data.registrationOccurredAt = '2026-07-01T12:00:00.000Z' }],
  ['future registration', r => { r.occurred_at = r.event_data.registrationOccurredAt = '2026-09-22T12:00:00.000Z' }],
]) test(`signup receipt withholds ${label}`, () => {
  const value = input(), receipt = signupReceipt(value)
  change(receipt)
  value.consentRequests.rows = [receipt]
  const result = previewFreeJourneySources(value)
  assert.equal(result.status, 'withheld')
  assert.equal(result.consentRequest, null)
  assert.equal(result.attemptedWrites, 0)
})

test('duplicate signup versions and oversized request sets remain ambiguous', () => {
  const value = input(), signup = signupReceipt(value)
  for (const rows of [[signup, signup], [signup, { ...signup, id: '31800000-0000-4000-8000-000000000925' }],
    [signup, signup, value.consentRequests.rows[0]]]) {
    value.consentRequests.rows = rows
    assert.equal(previewFreeJourneySources(value).status, 'withheld')
  }
})

test('signup request still requires confirmed consent, audience exclusions and a complete lookup', () => {
  for (const change of [v => { v.contactLists.rows = [] }, v => { v.contactLists.rows[0].status = '2' },
    v => { v.audience.rows[0].test = true }, v => { v.contacts.rows[0].bounced_hard = '1' },
    v => { v.consentRequests.coverage = 'partial' }]) {
    const value = input()
    value.consentRequests.rows = [signupReceipt(value)]
    change(value)
    assert.equal(previewFreeJourneySources(value).status, 'withheld')
  }
})

test('actual writer preview accepts signup provenance, requires inactive automation and makes only GETs', async () => {
  const value = input()
  value.consentRequests.rows = [signupReceipt(value)]
  const preview = previewFreeJourneySources(value)
  const evidence = {
    now, evidenceObservedAt: now, evidenceExpiresAt: '2026-09-22', maxEvidenceAgeMs: 86400000,
    membership: { ...value.memberships.rows[0], ...value.identities.rows[0], email: 'synthetic@example.com' },
    consentRequest: preview.consentRequest, audienceTraits: [], profileInputs: preview.onboarding.profileInputs,
    incomeScenarioStatus: preview.incomeScenarioStatus, activation: preview.onboarding.activation,
    onboardingCompletion: preview.onboarding.onboardingCompletion,
  }
  const config = { apiUrl: 'https://synthetic.api-us1.com', apiKey: 'synthetic-key',
    consentListId: '44', consentFormId: '99', accountTimeZone: 'America/New_York' }
  for (const [listStatus, automationStatus] of [['1', '2'], ['2', '2'], ['1', '1']]) {
    const calls = []
    const result = await previewActiveCampaignFreeJourney(evidence, config, async (url, options) => {
      calls.push({ url, method: options.method })
      const path = new URL(url).pathname
      const data = path.endsWith('/contactLists') ? { contactLists: [{ contact: '41', list: '44', form: '99', status: listStatus }] }
        : path.endsWith('/automations/527') ? { automation: { id: '527', status: automationStatus } }
          : path.endsWith('/fieldValues') ? { fieldValues: [] }
            : { contact: { id: '41', email: 'synthetic@example.com', bounced_hard: '0', bounced_soft: '0', deleted: '0' } }
      return new Response(JSON.stringify(data))
    })
    assert.equal(result.status, listStatus === '1' && automationStatus === '2' ? 'ready' : 'withheld')
    assert.equal(result.attemptedWrites, 0)
    assert.equal(result.confirmedWrites, 0)
    assert(calls.length > 0 && calls.every(call => call.method === 'GET'))
  }
  const invalid = structuredClone(evidence)
  invalid.consentRequest.eventData.consentRequested = false
  let calls = 0
  const held = await previewActiveCampaignFreeJourney(invalid, config, async () => { calls++; throw new Error('Forbidden') })
  assert.equal(held.status, 'withheld')
  assert.equal(calls, 0)
})
