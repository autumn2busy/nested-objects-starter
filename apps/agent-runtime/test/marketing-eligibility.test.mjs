import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyMarketingContact, classifyActiveCampaignAsset, evaluateMarketingJourneys, ActiveCampaignReadOnlyClient, readActiveCampaignCollection, runActiveCampaignReadOnlySensor, runPhaseCCore } from '../dist/index.js'

const now = '2026-09-06T12:00:00.000Z'
const correlation = { correlationId: '31800000-0000-5000-8000-000000000601', causationId: null, traceId: 'synthetic-ac' }
const dateAgo = days => new Date(Date.parse(now) - days * 86400000).toISOString()
const contact = () => ({
  contactId: 'synthetic-ac', email: 'member@example.com', tagNames: [], listNames: [], customFields: {},
  createdAt: dateAgo(200), updatedAt: now, lastOpenAt: null, lastClickAt: null, lastSiteVisitAt: null,
  bounced: false, unsubscribed: false, marketingConsent: 'granted',
})
const membership = () => ({
  memberId: 'synthetic-member', activeCampaignContactId: 'synthetic-ac', sourceSystem: 'outseta',
  email: 'old-address@example.com', membershipTier: 'free', membershipStatus: 'active', authoritative: true,
})
function classify(contactChanges = {}, membershipChanges = {}, config = {}) {
  return classifyMarketingContact({
    contact: { ...contact(), ...contactChanges },
    membership: membershipChanges === null ? null : { ...membership(), ...membershipChanges },
    config: { internalDomains: [], now, ...config }, correlation,
  })
}
function eligibility(changes = {}) {
  return {
    classification: classify(), now, memberSince: dateAgo(60), paidSince: null,
    lifecycleCycleId: 'synthetic-cycle', onboarding: 'complete',
    activation: { approved: true, sourceRecordId: 'synthetic-approved-first-value', occurredAt: dateAgo(40) },
    profileInputs: { profile: true, geography: true, experience: true, inspectionTypes: true },
    expressedNeed: 'pro', offerApproved: true, trialEligible: true, serviceDeliveryAllowed: true,
    meaningfulInactivityDays: 100,
    history: { complete: true, activeJourneys: [], enrollmentKeys: [], lastPromotionalAt: null, lastServiceAt: null },
    ...changes,
  }
}
const selected = input => evaluateMarketingJourneys(input).filter(d => d.eligible).map(d => d.journey)
const decision = (input, name) => evaluateMarketingJourneys(input).find(d => d.journey === name)

test('all six member tiers survive absent marketing tags and historical Wix/import sources', () => {
  for (const tier of ['free', 'starter', 'founders', 'pro', 'elite', 'agency']) {
    const c = classify({ tagNames: ['WIX', 'contacts.csv'] }, { membershipTier: tier }, { vercelContactIds: ['synthetic-ac'] })
    assert.equal(c.membershipTier, tier)
    assert.equal(c.classification, 'current_member')
    assert.deepEqual(c.sourceMarkers, ['cold_import', 'wix', 'vercel'])
    assert.equal(c.excludedFromMarketingAnalysis, false)
    assert.equal(JSON.stringify(c).includes('@'), false)
  }
})

test('email equality, mismatched stable IDs, conflicts and marketing mirrors cannot establish membership', () => {
  for (const changes of [
    { activeCampaignContactId: 'other', email: 'member@example.com' },
    { identityState: 'conflict' }, { sourceSystem: 'activecampaign' }, { sourceSystem: 'supabase_profiles' },
  ]) {
    const c = classify({}, changes)
    assert.equal(c.membershipTruthState, 'conflict')
    assert.equal(c.canonicalMemberId, null)
    assert.deepEqual(selected(eligibility({ classification: c })), [])
  }
  const c = classify({ tagNames: ['plan-pro', 'status-active'] }, null)
  assert.equal(c.membershipTier, 'unknown')
})

test('unknown lifecycle does not become current; inactive and canceling are distinct', () => {
  assert.equal(classify({}, { membershipStatus: null }).classification, 'unknown')
  assert.equal(classify({}, { membershipStatus: 'inactive' }).classification, 'inactive_member')
  assert.equal(classify({}, { membershipStatus: 'canceling' }).lifecycle, 'canceling')
  assert.equal(classify({}, { membershipStatus: 'expired' }).classification, 'churned_member')
})

test('stored Outseta identifiers cannot promote a Supabase projection to marketing authority', () => {
  const profile = { id: '31800000-0000-5000-8000-000000000611', user_email: 'member@example.com',
    ac_contact_id: 'synthetic-ac', outseta_person_uid: 'synthetic-person', outseta_account_id: 'synthetic-account',
    subscription_tier: 'free', subscription_status: 'active', created_at: dateAgo(60), updated_at: now }
  const input = { profiles: [profile], conversionEvents: [], activeCampaignContacts: [contact()],
    marketingConfig: { internalDomains: [], now }, metricDate: '2026-09-06', observedAt: now, correlation }
  const truth = { ...membership(), memberId: profile.id, membershipTier: 'elite', identityState: 'verified' }
  for (const records of [undefined, [], [truth, truth], [{ ...truth, sourceSystem: 'supabase_profiles' }],
    [{ ...truth, identityState: undefined }], [{ ...truth, activeCampaignContactId: 'unlinked' }]]) {
    const result = runPhaseCCore({ ...input, outsetaMembershipTruth: records })
    assert.equal(result.marketingClassifications[0].membershipTruthState, 'unknown')
  }
  const verified = runPhaseCCore({ ...input, outsetaMembershipTruth: [truth] }).marketingClassifications[0]
  assert.equal(verified.membershipTier, 'elite')
  assert.equal(verified.membershipTruthState, 'known')
})

test('paid internal, coworker, demo, test and hiring-firm contacts retain membership but are excluded', () => {
  const cases = [
    [{ email: 'member@activecampaign.com' }, {}, 'internal'],
    [{}, { coworkerContactIds: ['synthetic-ac'] }, 'coworker'],
    [{ tagNames: ['demo'] }, {}, 'demo'],
    [{ tagNames: ['test'] }, {}, 'test'],
    [{ tagNames: ['hiring firms'] }, {}, 'hiring_firm'],
  ]
  for (const [contactChanges, config, trait] of cases) {
    const c = classify(contactChanges, { membershipTier: 'agency' }, config)
    assert.equal(c.membershipTier, 'agency')
    assert.ok(c.audienceTraits.includes(trait))
    assert.deepEqual(selected(eligibility({ classification: c })), [])
  }
  assert.equal(classify({ email: 'contestant@example.com' }).audienceTraits.includes('test'), false)
  assert.deepEqual(classify({}, { membershipTier: 'agency' }).audienceTraits, [])
  assert.equal(classifyActiveCampaignAsset({ assetType: 'tag', externalId: '801', name: 'plan-agency' }).candidateScope, 'unknown')
})

test('recent meaningful activity outranks stale clicks and malformed timestamps stay unknown', () => {
  assert.equal(classify({ lastClickAt: dateAgo(120), lastSiteVisitAt: dateAgo(1) }).engagementState, 'visited')
  assert.equal(classify({ lastOpenAt: 'invalid' }).engagementState, 'unknown')
  assert.equal(classify({ lastOpenAt: dateAgo(-1) }).engagementState, 'unknown')
})

test('first 30 days permit onboarding but exclude promotions; membership age is independent of AC creation', () => {
  const input = eligibility({ memberSince: dateAgo(2), onboarding: 'not_started', activation: null })
  assert.deepEqual(selected(input), ['onboarding'])
  assert.ok(decision(input, 'free_to_pro').reasons.includes('first_30_days_or_unknown_member_age'))
  assert.equal(decision(eligibility({ memberSince: dateAgo(29.99) }), 'free_to_pro').eligible, false)
  assert.equal(decision(eligibility({ memberSince: dateAgo(30) }), 'free_to_pro').eligible, true)
})

test('promotion guards each fail closed without accidentally blocking necessary service', () => {
  for (const changes of [
    { onboarding: 'active' }, { onboarding: 'unknown' }, { memberSince: null },
    { activation: null }, { activation: { approved: false, sourceRecordId: 'x', occurredAt: dateAgo(2) } },
    { activation: { approved: true, sourceRecordId: '', occurredAt: dateAgo(2) } },
    { activation: { approved: true, sourceRecordId: 'x', occurredAt: dateAgo(-1) } },
    { classification: classify({ marketingConsent: 'unknown' }) },
    { classification: classify({ unsubscribed: true }) }, { classification: classify({ bounced: true }) },
    { profileInputs: { profile: true, geography: null, experience: true, inspectionTypes: true } },
    { lifecycleCycleId: null }, { now: 'invalid' }, { offerApproved: false },
  ]) assert.equal(decision(eligibility(changes), 'free_to_pro').eligible, false)
  const service = eligibility({ classification: classify({ unsubscribed: true }), memberSince: dateAgo(1), onboarding: 'active' })
  assert.deepEqual(selected(service), ['onboarding'])
  assert.deepEqual(selected({ ...service, serviceDeliveryAllowed: false }), [])
})

test('new-paid, trial, past-due and unknown paid age cannot receive promotional reengagement', () => {
  for (const status of ['trialing', 'past_due', 'paused', 'incomplete', 'unknown']) {
    const input = eligibility({ classification: classify({}, { membershipTier: 'pro', membershipStatus: status }), paidSince: dateAgo(100) })
    assert.equal(decision(input, 'reengagement').eligible, false)
  }
  for (const paidSince of [null, dateAgo(29), 'invalid', dateAgo(-1)]) {
    assert.equal(decision(eligibility({ classification: classify({}, { membershipTier: 'agency' }), paidSince }), 'reengagement').eligible, false)
  }
  assert.deepEqual(selected(eligibility({ classification: classify({}, { membershipStatus: 'past_due' }) })), ['payment_recovery'])
})

test('one journey wins, with bounded frequency and deterministic duplicate prevention', () => {
  const input = eligibility()
  assert.deepEqual(selected(input), ['free_to_pro'])
  const key = decision(input, 'free_to_pro').enrollmentKey
  const history = { ...input.history, enrollmentKeys: [key] }
  assert.ok(decision({ ...input, history }, 'free_to_pro').reasons.includes('already_enrolled_this_cycle'))
  for (const historyChanges of [
    { complete: false }, { activeJourneys: ['onboarding'] }, { lastPromotionalAt: dateAgo(6.99) },
    { lastPromotionalAt: 'invalid' }, { lastPromotionalAt: dateAgo(-1) },
  ]) assert.equal(decision({ ...input, history: { ...input.history, ...historyChanges } }, 'free_to_pro').eligible, false)
  assert.equal(decision({ ...input, history: { ...input.history, lastPromotionalAt: dateAgo(7) } }, 'free_to_pro').eligible, true)
})

test('Elite, trial, cancellation feedback and win-back require their own evidence', () => {
  assert.deepEqual(selected(eligibility({ expressedNeed: 'elite' })), ['free_to_elite'])
  assert.deepEqual(selected(eligibility({ expressedNeed: 'trial' })), ['trial_offer'])
  assert.equal(decision(eligibility({ expressedNeed: 'trial', trialEligible: null }), 'trial_offer').eligible, false)
  const canceled = eligibility({ classification: classify({}, { membershipTier: 'pro', membershipStatus: 'canceled' }), paidSince: dateAgo(200) })
  assert.deepEqual(selected(canceled), ['cancellation_feedback'])
  const feedbackKey = decision(canceled, 'cancellation_feedback').enrollmentKey
  assert.deepEqual(selected({ ...canceled, history: { ...canceled.history, enrollmentKeys: [feedbackKey] } }), ['win_back'])
})

function clientWith(pages) {
  const calls = []
  const client = new ActiveCampaignReadOnlyClient({
    baseUrl: 'https://synthetic.api-us1.com', apiToken: 'synthetic-credential-for-fixtures',
    allowlist: { reviewId: 'synthetic-review', reviewedBy: 'synthetic-owner', reviewedAt: now, accountId: 'synthetic-account',
      accountHostname: 'synthetic.api-us1.com', mutationAllowed: false,
      scopes: [{ resourceType: 'tag', externalId: 'collection', readAllowed: true }] },
    transport: async request => {
      calls.push(request)
      const value = pages.shift()
      if (value instanceof Error) throw value
      return { ok: true, status: 200, json: async () => value }
    },
  })
  return { client, calls }
}

test('sensor integrates eligibility without trusting caller classification or input ordering', () => {
  const makeObservation = id => ({
    contact: { ...contact(), contactId: id }, membership: { ...membership(), activeCampaignContactId: id, memberId: id },
    planLabel: 'Free', automationIds: [], onboardingEnteredAt: now, purchaseObservedAt: null,
    currentEngagementCount: null, priorEngagementCount: null, highIntentScore: null,
    journeyContext: { ...eligibility(), classification: classify({}, { membershipTier: 'elite' }) },
  })
  const input = { sensorRunId: 'synthetic-eligibility', provenanceMode: 'fixture', observedAt: now,
    contacts: [makeObservation('synthetic-b'), makeObservation('synthetic-a')], automations: [],
    marketingConfig: { internalDomains: [], now }, correlation,
    ownerAllowlist: { reviewId: 'synthetic-review', reviewedBy: 'synthetic-owner', reviewedAt: now,
      accountId: 'synthetic-account', accountHostname: 'synthetic.api-us1.com', mutationAllowed: false,
      scopes: [{ resourceType: 'contact_inventory', externalId: 'collection', readAllowed: true }] },
  }
  const first = runActiveCampaignReadOnlySensor(input)
  const reversed = runActiveCampaignReadOnlySensor({ ...input, contacts: [...input.contacts].reverse() })
  assert.equal(first.checksum, reversed.checksum)
  assert.equal(first.journeyEligibility[0].decisions.find(d => d.journey === 'free_to_pro').eligible, true)
  assert.ok(first.journeyEligibility.flatMap(row => row.decisions).every(d => d.mutationAllowed === false))
})
test('paginated GET inventory proves totals and reports partial failures without claiming absence', async () => {
  const { client, calls } = clientWith([{ tags: [{id:'1'}, {id:'2'}], meta:{total:'3'} }, { tags:[{id:'3'}], meta:{total:'3'} }])
  const result = await readActiveCampaignCollection(client, { resourceType:'tag', observedAt:now, pageSize:2 })
  assert.equal(result.state, 'complete')
  assert.equal(result.records.length, 3)
  assert.match(calls[1].url, /offset=2/)
  assert.ok(calls.every(c => c.method === 'GET'))
  for (const [second, reason] of [
    [new Error('private transport detail'), 'request_failed'],
    [{tags:[{id:'2'}], meta:{total:3}}, 'duplicate_id'],
    [{tags:[{id:'3'}], meta:{total:4}}, 'changed_total'],
    [{tags:[], meta:{total:3}}, 'early_end'],
    [{tags:[{id:'3'}]}, 'unknown_total'],
    [{unexpected:[]}, 'invalid_page'],
  ]) {
    const c = clientWith([{tags:[{id:'1'}, {id:'2'}], meta:{total:3}}, second]).client
    const partial = await readActiveCampaignCollection(c, {resourceType:'tag', observedAt:now, pageSize:2})
    assert.equal(partial.state, 'partial')
    assert.equal(partial.reason, reason)
    assert.equal(JSON.stringify(partial).includes('private transport'), false)
  }
  const bounded = await readActiveCampaignCollection(clientWith([{tags:[{id:'1'}], meta:{total:2}}]).client, {resourceType:'tag', observedAt:now, pageSize:1, maxPages:1})
  assert.equal(bounded.reason, 'page_budget')
  const unavailable = await readActiveCampaignCollection(clientWith([new Error('unavailable')]).client, {resourceType:'tag', observedAt:now})
  assert.equal(unavailable.state, 'unavailable')
  assert.equal(unavailable.expectedRecords, null)
})
