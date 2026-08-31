import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  ActiveCampaignReadOnlyClient,
  InMemorySensorObservationStore,
  SupabaseProjectionStore,
  adaptAiAeoReport,
  adaptContentBriefReport,
  adaptSeoContentReport,
  buildMemberProjectionBatch,
  runActiveCampaignReadOnlySensor,
  runPhaseCCore,
} from '../dist/index.js'

const fixedNow = '2026-08-27T16:00:00.000Z'
const correlation = {
  correlationId: '31800000-0000-5000-8000-000000000618',
  causationId: null,
  traceId: 'trace-phase-c6-sensors',
}

test('checked-in SEO/AEO/content reports remain compatible and are explicitly stale baselines', async () => {
  const seoReport = await report('../../web-members/content/seo-content-opportunities.json')
  const aeoReport = await report('../../web-members/content/ai-aeo-opportunities.json')
  const contentReport = await report('../../web-members/content/content-briefs.json')
  const options = { observedAt: fixedNow, correlation }
  const seo = adaptSeoContentReport({ sensorName: 'seo-content-monitor', provenanceMode: 'baseline', report: seoReport }, options)
  const aeo = adaptAiAeoReport({ sensorName: 'ai-aeo-monitor', provenanceMode: 'baseline', report: aeoReport }, options)
  const content = adaptContentBriefReport({ provenanceMode: 'baseline', report: contentReport }, options)

  assert.equal(seo.observations.length, seoReport.opportunities.length)
  assert.equal(aeo.observations.length, aeoReport.opportunities.length)
  assert.equal(content.observations.length, contentReport.briefs.length)
  assert.equal(seo.provenanceMode, 'baseline')
  assert.equal(aeo.healthStatus, 'stale')
  assert.ok(seo.signals.some((signal) => signal.signalType === 'operations.sensor_source_stale'))
  assert.ok(aeo.signals.some((signal) => signal.summary.includes('Provenance=baseline')))
  assert.ok(content.candidateActions.every((action) => (
    action.payload.mutationAllowed === false && action.payload.publishAllowed === false
  )))
  assert.equal(JSON.stringify(aeo.observations).includes('answerSnapshots'), false)
})

test('sensor observation persistence reuses identical reports and rejects changed payloads under one key', async () => {
  const seoReport = await report('../../web-members/content/seo-content-opportunities.json')
  const batch = adaptSeoContentReport({ sensorName: 'seo-content-monitor', provenanceMode: 'fixture', report: seoReport }, {
    observedAt: fixedNow,
    correlation,
  })
  const store = new InMemorySensorObservationStore()
  assert.equal((await store.persistBatch(batch)).disposition, 'created')
  assert.equal((await store.persistBatch({ ...batch, observedAt: '2026-08-27T17:00:00.000Z' })).disposition, 'reused')
  assert.equal(store.observations.size, batch.observations.length)

  const nextReport = structuredClone(seoReport)
  nextReport.generatedAt = '2026-08-28T16:00:00.000Z'
  const nextBatch = adaptSeoContentReport({
    sensorName: 'seo-content-monitor',
    provenanceMode: 'fixture',
    report: nextReport,
  }, {
    observedAt: '2026-08-28T16:00:00.000Z',
    correlation,
  })
  assert.equal((await store.persistBatch(nextBatch)).disposition, 'created')
  assert.notEqual(nextBatch.sensorRunId, batch.sensorRunId)
  assert.equal(store.observations.size, batch.observations.length + nextBatch.observations.length)

  const changed = structuredClone(batch)
  changed.observations[0].payload = { changed: true }
  await assert.rejects(
    store.persistBatch(changed),
    /observation idempotency key was reused with different content/,
  )
})

test('ActiveCampaign client permits only bounded GETs to owner-reviewed stable-ID scopes', async () => {
  const requests = []
  const allowlist = ownerAllowlist()
  const client = new ActiveCampaignReadOnlyClient({
    baseUrl: 'https://synthetic.api-us1.com',
    apiToken: 'synthetic-token-at-least-twenty-characters',
    allowlist,
    transport: async (request) => {
      requests.push(request)
      return { ok: true, status: 200, json: async () => ({ automations: [] }) }
    },
  })
  const page = await client.readPage({
    resourceType: 'automation',
    externalId: 'automation-101',
    limit: 25,
    offset: 0,
    observedAt: fixedNow,
  })
  assert.equal(requests[0].method, 'GET')
  assert.match(requests[0].url, /\/api\/3\/automations\/automation-101\?limit=25&offset=0/)
  assert.equal(page.sourceRef.metadata.mutationAllowed, false)
  await assert.rejects(
    client.readPage({ resourceType: 'automation', externalId: 'not-allowlisted', observedAt: fixedNow }),
    /not owner-allowlisted/,
  )
  await assert.rejects(
    client.readPage({ resourceType: 'automation', externalId: 'automation-101', limit: 101, observedAt: fixedNow }),
    /limit 1\.\.100/,
  )
  assert.throws(() => new ActiveCampaignReadOnlyClient({
    baseUrl: 'https://different.api-us1.com',
    apiToken: 'synthetic-token-at-least-twenty-characters',
    allowlist,
  }), /does not match the owner-reviewed account hostname/)
})

test('ActiveCampaign sensor identifies required lifecycle and hygiene cases without emitting PII or mutations', async () => {
  const input = activeCampaignFixture()
  const result = runActiveCampaignReadOnlySensor(input)
  const findingTypes = new Set(result.signals.map((signal) => signal.signalType))
  for (const required of [
    'marketing.paid_member_labeled_free',
    'marketing.canceled_member_in_paid_nurture',
    'marketing.free_member_in_paid_automation',
    'marketing.member_missing_onboarding',
    'marketing.upgrade_sequence_after_purchase',
    'marketing.overlapping_lifecycle_automations',
    'marketing.stale_automation',
    'marketing.engagement_decline',
    'marketing.deliverability_risk',
    'marketing.high_intent_segment',
    'marketing.cold_never_engaged_contact',
    'marketing.internal_activecampaign_contact',
  ]) assert.ok(findingTypes.has(required), `missing ${required}`)

  assert.equal(result.mutationAllowed, false)
  assert.equal(result.ingestionBatch.observations.length, input.contacts.length + input.automations.length)
  assert.equal(result.ingestionBatch.provenanceMode, 'fixture')
  assert.deepEqual(new Set(result.classifications.map((item) => item.classification)), new Set([
    'current_member',
    'churned_member',
    'legacy_wix_candidate',
    'cold_import',
    'internal',
    'test',
    'unknown',
  ]))
  const store = new InMemorySensorObservationStore()
  assert.equal((await store.persistBatch(result.ingestionBatch)).disposition, 'created')
  assert.equal((await store.persistBatch(result.ingestionBatch)).disposition, 'reused')
  assert.equal(store.observations.size, result.ingestionBatch.observations.length)
  assert.ok(result.proposedActions.length > 0)
  assert.ok(result.proposedActions.every((action) => (
    action.status === 'proposed'
    && action.approvalRequired
    && action.executorKey === null
    && action.executionStartedAt === null
    && action.executedAt === null
    && action.payload.mutationAllowed === false
  )))
  const serialized = JSON.stringify(result)
  for (const observation of input.contacts) {
    assert.equal(serialized.includes(observation.contact.email), false)
  }
  assert.ok(result.metrics.every((metric) => metric.domain === 'marketing' && metric.provenance.revenueAuthority === false))
})

test('Phase C contact authority joins by stored ActiveCampaign contact ID, never by email alone', () => {
  const base = profile({ ac_contact_id: 'ac-stable-7' })
  const result = runPhaseCCore({
    profiles: [base],
    conversionEvents: [],
    activeCampaignContacts: [
      contact('ac-stable-7', 'different@example.com'),
      contact('ac-unlinked', 'member@example.com'),
    ],
    marketingConfig: { internalDomains: ['activecampaign.com'], now: fixedNow },
    metricDate: '2026-08-27',
    correlation,
    observedAt: fixedNow,
  })
  assert.equal(result.marketingClassifications[0].classification, 'current_member')
  assert.equal(result.marketingClassifications[0].canonicalMemberId, base.id)
  assert.equal(result.marketingClassifications[1].classification, 'unknown')
  assert.equal(result.marketingClassifications[1].canonicalMemberId, null)

  const collision = buildMemberProjectionBatch({
    profiles: [base, profile({
      id: '22222222-2222-4222-8222-222222222222',
      user_email: 'second@example.com',
      outseta_person_uid: 'person-2',
      outseta_account_id: 'account-2',
      ac_contact_id: 'ac-stable-7',
    })],
    conversionEvents: [],
    correlation,
    observedAt: fixedNow,
  })
  assert.ok(collision.identityConflicts.some((conflict) => conflict.conflictType === 'activecampaign_contact_collision'))
  assert.ok(collision.projections.every((projection) => (
    !projection.identityLinks.some((link) => link.sourceSystem === 'activecampaign')
  )))
})

test('projection asset refresh uses the approval-preserving RPC rather than direct table upsert', async () => {
  const calls = []
  const store = new SupabaseProjectionStore({
    rpc(name, parameters) {
      calls.push({ name, parameters })
      return Promise.resolve({ data: 1, error: null })
    },
    from() {
      throw new Error('direct table access must not be used for recurring ActiveCampaign asset inventory')
    },
  })
  await store.persistAssetClassifications([{
    assetType: 'automation',
    externalId: 'automation-101',
    assetName: 'Synthetic onboarding',
    candidateScope: 'nested_objects',
    lifecycleStatus: 'active',
    readRecommended: true,
    mutationAllowed: false,
    confidence: 0.9,
    reasons: ['Synthetic fixture.'],
    requiresOwnerReview: true,
  }], fixedNow)
  assert.equal(calls[0].name, 'upsert_activecampaign_asset_inventory')
  const asset = calls[0].parameters.p_assets[0]
  assert.equal(asset.read_allowed, false)
  assert.equal(asset.mutation_allowed, false)
  assert.equal(asset.review_status, 'pending')
})

async function report(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, import.meta.url), 'utf8'))
}

function ownerAllowlist() {
  return {
    reviewId: 'synthetic-autumn-review-c6',
    reviewedBy: 'autumn-stable-subject-placeholder',
    reviewedAt: fixedNow,
    accountId: 'synthetic-activecampaign-account',
    accountHostname: 'synthetic.api-us1.com',
    mutationAllowed: false,
    scopes: [
      { resourceType: 'contact_inventory', externalId: 'collection', readAllowed: true },
      { resourceType: 'automation', externalId: 'automation-101', readAllowed: true },
      { resourceType: 'automation', externalId: 'automation-paid', readAllowed: true },
      { resourceType: 'automation', externalId: 'automation-free', readAllowed: true },
      { resourceType: 'automation', externalId: 'automation-upgrade', readAllowed: true },
      { resourceType: 'automation', externalId: 'automation-stale', readAllowed: true },
    ],
  }
}

function activeCampaignFixture() {
  const paidMembership = membership('member-paid', 'pro', 'active')
  const canceledMembership = membership('member-canceled', 'pro', 'canceled')
  const freeMembership = membership('member-free', 'free', 'active')
  return {
    sensorRunId: 'phase-c6-activecampaign-fixture',
    provenanceMode: 'fixture',
    observedAt: fixedNow,
    ownerAllowlist: ownerAllowlist(),
    marketingConfig: { internalDomains: ['activecampaign.com'], now: fixedNow },
    correlation,
    automations: [
      automation('automation-101', 'member_onboarding', ['ac-paid']),
      automation('automation-paid', 'paid_nurture', ['ac-paid', 'ac-canceled', 'ac-free']),
      automation('automation-free', 'free_nurture', ['ac-paid']),
      automation('automation-upgrade', 'upgrade_sequence', ['ac-paid']),
      { ...automation('automation-stale', 'reengagement', []), lastActivityAt: '2026-01-01T00:00:00.000Z' },
    ],
    contacts: [
      {
        contact: { ...contact('ac-paid', 'paid@example.com'), bounced: true },
        membership: paidMembership,
        planLabel: 'Free',
        automationIds: ['automation-101', 'automation-paid', 'automation-free', 'automation-upgrade'],
        onboardingEnteredAt: null,
        purchaseObservedAt: '2026-08-20T00:00:00.000Z',
        currentEngagementCount: 3,
        priorEngagementCount: 12,
        highIntentScore: 0.9,
      },
      {
        contact: contact('ac-canceled', 'canceled@example.com'),
        membership: canceledMembership,
        planLabel: 'Pro',
        automationIds: ['automation-paid'],
        onboardingEnteredAt: fixedNow,
        purchaseObservedAt: null,
        currentEngagementCount: 0,
        priorEngagementCount: 0,
        highIntentScore: null,
      },
      {
        contact: contact('ac-free', 'free@example.com'),
        membership: freeMembership,
        planLabel: 'Free',
        automationIds: ['automation-paid'],
        onboardingEnteredAt: fixedNow,
        purchaseObservedAt: null,
        currentEngagementCount: 1,
        priorEngagementCount: 1,
        highIntentScore: null,
      },
      {
        contact: { ...contact('ac-cold', 'cold@example.com'), tagNames: ['cold import'] },
        membership: null,
        planLabel: null,
        automationIds: [],
        onboardingEnteredAt: null,
        purchaseObservedAt: null,
        currentEngagementCount: 0,
        priorEngagementCount: 0,
        highIntentScore: null,
      },
      {
        contact: contact('ac-internal', 'coworker@activecampaign.com'),
        membership: null,
        planLabel: null,
        automationIds: [],
        onboardingEnteredAt: null,
        purchaseObservedAt: null,
        currentEngagementCount: 0,
        priorEngagementCount: 0,
        highIntentScore: null,
      },
      {
        contact: { ...contact('ac-wix', 'legacy@example.com'), tagNames: ['wix import'] },
        membership: null,
        planLabel: null,
        automationIds: [],
        onboardingEnteredAt: null,
        purchaseObservedAt: null,
        currentEngagementCount: 0,
        priorEngagementCount: 0,
        highIntentScore: null,
      },
      {
        contact: { ...contact('ac-test', 'test-fixture@example.com'), tagNames: ['demo test'] },
        membership: null,
        planLabel: null,
        automationIds: [],
        onboardingEnteredAt: null,
        purchaseObservedAt: null,
        currentEngagementCount: 0,
        priorEngagementCount: 0,
        highIntentScore: null,
      },
      {
        contact: contact('ac-unknown', 'unknown@example.com'),
        membership: null,
        planLabel: null,
        automationIds: [],
        onboardingEnteredAt: null,
        purchaseObservedAt: null,
        currentEngagementCount: 0,
        priorEngagementCount: 0,
        highIntentScore: null,
      },
    ],
  }
}

function profile(overrides = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    user_email: 'member@example.com',
    outseta_person_uid: 'outseta-person-1',
    outseta_account_id: 'outseta-account-1',
    subscription_tier: 'pro',
    subscription_status: 'active',
    subscription_start_date: '2026-08-01T00:00:00.000Z',
    plan_uid: 'pro-plan',
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: fixedNow,
    ...overrides,
  }
}

function contact(contactId, email) {
  return {
    contactId,
    email,
    tagNames: [],
    listNames: [],
    customFields: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: fixedNow,
    lastOpenAt: null,
    lastClickAt: null,
    lastSiteVisitAt: null,
    bounced: false,
    unsubscribed: false,
  }
}

function membership(memberId, membershipTier, membershipStatus) {
  return {
    memberId,
    email: `${memberId}@example.com`,
    membershipTier,
    membershipStatus,
    authoritative: true,
  }
}

function automation(automationId, lifecycleRole, contactIds) {
  return {
    automationId,
    lifecycleRole,
    active: true,
    lastActivityAt: fixedNow,
    contactIds,
  }
}
