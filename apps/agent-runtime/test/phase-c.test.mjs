import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildDailyBusinessMetrics,
  buildMemberProjectionBatch,
  buildProjectionWriteSet,
  classifyActiveCampaignAsset,
  classifyMarketingContact,
  evaluateLifecycleIntegrity,
  runPhaseCCore,
  stableUuid,
} from '../dist/index.js'

const correlation = { correlationId: crypto.randomUUID(), causationId: null, traceId: 'trace-phase-c' }
const profileId = '11111111-1111-4111-8111-111111111111'
const fixedNow = '2026-08-25T12:00:00.000Z'

function profile(overrides = {}) {
  return {
    id: profileId,
    outseta_person_uid: 'outseta-person-1',
    outseta_account_id: 'outseta-account-1',
    user_email: 'member@example.com',
    subscription_tier: 'pro',
    subscription_status: 'active',
    subscription_start_date: '2026-08-01T00:00:00.000Z',
    plan_uid: 'pro-plan',
    created_at: '2026-08-01T00:00:00.000Z',
    last_active_at: '2026-08-25T10:00:00.000Z',
    state: 'GA',
    service_areas: ['Gwinnett'],
    primary_services: ['occupancy'],
    experience_level: 'experienced',
    training_modules_completed: 2,
    training_modules_total: 8,
    ...overrides,
  }
}

function event(id, name, overrides = {}) {
  return {
    id,
    client_event_id: `client-${id}`,
    event_name: name,
    anonymous_id: 'anon-1',
    member_uid: 'outseta-person-1',
    member_email: 'member@example.com',
    occurred_at: '2026-08-25T09:00:00.000Z',
    event_data: {},
    ...overrides,
  }
}

test('projection stitches anonymous events to a canonical member and preserves authority', () => {
  const batch = buildMemberProjectionBatch({
    profiles: [profile()],
    conversionEvents: [
      event('event-1', 'pricing_view', { member_uid: null, member_email: null, occurred_at: '2026-08-24T09:00:00.000Z' }),
      event('event-2', 'signup_completed'),
      event('event-3', 'firm_view'),
    ],
    correlation,
    observedAt: fixedNow,
  })
  assert.equal(batch.projections.length, 1)
  const projection = batch.projections[0]
  assert.equal(projection.assignedEventIds.length, 3)
  assert.equal(projection.operationalProfile.firmViews, 1)
  assert.equal(projection.memberships[0].sourceSystem, 'outseta')
  assert.equal(projection.memberships[0].authorityRank, 100)
  assert.equal(projection.memberships[0].mrr, null)
  assert.equal(projection.memberships[0].revenueState, 'unknown')
  assert.ok(projection.identityLinks.some((link) => link.identifierType === 'anonymous_id'))
})

test('duplicate profile email creates a conflict instead of a silent merge', () => {
  const secondId = '22222222-2222-4222-8222-222222222222'
  const batch = buildMemberProjectionBatch({
    profiles: [profile(), profile({ id: secondId, outseta_person_uid: 'person-2', outseta_account_id: 'account-2' })],
    conversionEvents: [],
    correlation,
  })
  assert.equal(batch.identityConflicts[0].conflictType, 'email_collision')
  assert.equal(batch.projections[0].canonicalMember.identityStatus, 'conflict')
  assert.equal(batch.projections[0].canonicalMember.primaryEmail, null)
  assert.equal(batch.projections[0].identityLinks.some((link) => link.identifierType === 'email'), false)
})

test('duplicate conversion deliveries are deduplicated by client event id', () => {
  const batch = buildMemberProjectionBatch({
    profiles: [profile()],
    conversionEvents: [event('event-1', 'firm_view'), event('event-2', 'firm_view', { client_event_id: 'client-event-1' })],
    correlation,
  })
  assert.deepEqual(batch.duplicateEventIds, ['event-2'])
  assert.equal(batch.projections[0].operationalProfile.firmViews, 1)
})

test('internal-domain contacts are quarantined without changing ActiveCampaign', () => {
  const classification = classifyMarketingContact({
    contact: {
      contactId: 'ac-1',
      email: 'coworker@activecampaign.com',
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
    },
    membership: null,
    config: { internalDomains: ['activecampaign.com'], now: fixedNow },
    correlation,
  })
  assert.equal(classification.classification, 'internal')
  assert.equal(classification.excludedFromMarketingAnalysis, true)
  assert.equal(classification.recommendedDisposition, 'quarantine')
})

test('cold imports with no engagement become suppression candidates, not members', () => {
  const classification = classifyMarketingContact({
    contact: {
      contactId: 'ac-2',
      email: 'cold@example.com',
      tagNames: ['cold notary', 'lead:member-prospect'],
      listNames: ['Inspectors'],
      customFields: {},
      createdAt: '2025-09-01T00:00:00.000Z',
      updatedAt: fixedNow,
      lastOpenAt: null,
      lastClickAt: null,
      lastSiteVisitAt: null,
      bounced: false,
      unsubscribed: false,
    },
    membership: null,
    config: { internalDomains: ['activecampaign.com'], now: fixedNow },
    correlation,
  })
  assert.equal(classification.classification, 'cold_import')
  assert.equal(classification.engagementState, 'never_engaged')
  assert.equal(classification.recommendedDisposition, 'suppress_candidate')
})

test('authoritative membership wins over cold or Wix marketing markers', () => {
  const classification = classifyMarketingContact({
    contact: {
      contactId: 'ac-3',
      email: 'member@example.com',
      tagNames: ['WIX', 'cold notary'],
      listNames: ['Inspectors'],
      customFields: {},
      createdAt: '2025-05-01T00:00:00.000Z',
      updatedAt: fixedNow,
      lastOpenAt: null,
      lastClickAt: '2026-08-20T00:00:00.000Z',
      lastSiteVisitAt: null,
      bounced: false,
      unsubscribed: false,
    },
    membership: { memberId: profileId, email: 'member@example.com', membershipTier: 'pro', membershipStatus: 'active', authoritative: true },
    config: { internalDomains: ['activecampaign.com'], now: fixedNow },
    correlation,
  })
  assert.equal(classification.classification, 'current_member')
  assert.equal(classification.excludedFromMarketingAnalysis, false)
})

test('asset classifier defaults unknown and legacy assets to non-mutating quarantine or review', () => {
  const nested = classifyActiveCampaignAsset({ assetType: 'automation', externalId: '473', name: 'Welcome Series - New Members', active: true })
  const legacy = classifyActiveCampaignAsset({ assetType: 'list', externalId: '31', name: 'FlyNerd orphan contacts', active: true })
  const unknown = classifyActiveCampaignAsset({ assetType: 'field', externalId: '999', name: 'Mystery Field', active: true })
  assert.equal(nested.candidateScope, 'nested_objects')
  assert.equal(nested.mutationAllowed, false)
  assert.equal(legacy.lifecycleStatus, 'quarantined')
  assert.equal(unknown.readRecommended, false)
  assert.equal(unknown.requiresOwnerReview, true)
})

test('daily metrics preserve unknown revenue instead of inventing zero', () => {
  const metrics = buildDailyBusinessMetrics({
    metricDate: '2026-08-25',
    profiles: [profile()],
    conversionEvents: [
      event('event-1', 'signup_completed', { plan_name: 'Pro', source: 'browser' }),
      event('event-signup-webhook', 'signup_completed', { plan_name: 'Pro', source: 'outseta', source_page: 'outseta_webhook', client_event_id: 'outseta-signup-1' }),
      event('event-2', 'paywall_hit'),
    ],
    correlation,
    sourceRunId: 'run-1',
    observedAt: fixedNow,
  })
  assert.equal(metrics.find((metric) => metric.metricName === 'members.new.pro').value, 1)
  assert.equal(metrics.find((metric) => metric.metricName === 'product.paywall_hits').value, 1)
  const mrr = metrics.find((metric) => metric.metricName === 'revenue.mrr')
  assert.equal(mrr.valueState, 'unknown')
  assert.equal(mrr.value, null)
})

test('lifecycle integrity detects paid access and ActiveCampaign plan mismatches', () => {
  const projection = buildMemberProjectionBatch({
    profiles: [profile()],
    conversionEvents: [event('event-1', 'signup_completed')],
    correlation,
    observedAt: fixedNow,
  }).projections[0]
  const signals = evaluateLifecycleIntegrity({
    projection,
    productAccess: { memberId: profileId, accessTier: 'free', accessStatus: 'active', directoryAccess: false, observedAt: fixedNow },
    activeCampaignMirror: { contactId: 'ac-3', planName: 'Free', lifecycleStatus: 'active', onboardingEnteredAt: null, observedAt: fixedNow },
    marketingClassification: null,
    correlation,
    now: fixedNow,
  })
  assert.ok(signals.some((signal) => signal.signalType === 'lifecycle.paid_access_mismatch'))
  assert.ok(signals.some((signal) => signal.signalType === 'marketing.plan_state_conflict'))
  assert.ok(signals.every((signal) => signal.id === stableUuid('nested-objects-intelligence-signal', signal.fingerprint)))
})

test('tracking lag is detected only from contradictory activity timestamps', () => {
  const projection = buildMemberProjectionBatch({
    profiles: [profile({ last_active_at: '2026-08-25T10:00:00.000Z' })],
    conversionEvents: [event('event-1', 'signup_completed', { occurred_at: '2026-08-20T10:00:00.000Z' })],
    correlation,
    observedAt: fixedNow,
  }).projections[0]
  const signals = evaluateLifecycleIntegrity({
    projection,
    productAccess: null,
    activeCampaignMirror: null,
    marketingClassification: null,
    correlation,
    now: fixedNow,
    trackingLagHours: 24,
  })
  assert.ok(signals.some((signal) => signal.signalType === 'technical.conversion_tracking_lag'))
})

test('projection write set is idempotent and never invents billing values', () => {
  const projection = buildMemberProjectionBatch({
    profiles: [profile()],
    conversionEvents: [event('event-1', 'signup_completed')],
    correlation,
    observedAt: fixedNow,
  }).projections[0]
  const writes = buildProjectionWriteSet(projection)
  assert.equal(writes.canonicalMember.id, profileId)
  assert.ok(writes.identityLinks.every((row) => typeof row.idempotency_key === 'string'))
  assert.ok(writes.memberships.every((row) => row.mrr === null && row.arr === null && row.revenue_state === 'unknown'))
  assert.equal(writes.operationalProfile.member_id, profileId)
})

test('Phase C core surfaces unmatched and duplicate conversion deliveries without mutating sources', () => {
  const result = runPhaseCCore({
    profiles: [profile()],
    conversionEvents: [
      event('event-1', 'signup_completed'),
      event('event-2', 'signup_completed', { client_event_id: 'client-event-1' }),
      event('event-orphan', 'pricing_view', { client_event_id: 'client-orphan', member_uid: null, member_email: null, anonymous_id: 'orphan' }),
    ],
    activeCampaignContacts: [],
    marketingConfig: { internalDomains: ['activecampaign.com'], now: fixedNow },
    metricDate: '2026-08-25',
    correlation,
  })
  assert.ok(result.signals.some((signal) => signal.signalType === 'lifecycle.unmatched_conversion_events'))
  assert.ok(result.signals.some((signal) => signal.signalType === 'technical.duplicate_conversion_delivery'))
  assert.deepEqual(result.unmatchedConversionEventIds, ['event-orphan'])
  assert.deepEqual(result.duplicateConversionEventIds, ['event-2'])
})

test('conflicting Outseta identifiers are withheld from persistence-safe identity links', () => {
  const secondId = '22222222-2222-4222-8222-222222222222'
  const batch = buildMemberProjectionBatch({
    profiles: [
      profile(),
      profile({
        id: secondId,
        user_email: 'second@example.com',
        outseta_account_id: 'account-2',
      }),
    ],
    conversionEvents: [],
    correlation,
  })

  assert.ok(batch.identityConflicts.some((conflict) => conflict.conflictType === 'outseta_person_collision'))
  assert.ok(batch.projections.every((projection) =>
    projection.identityLinks.every((link) => link.identifierType !== 'person_uid'),
  ))
})

test('daily metric units and idempotency remain stable across projection reruns', () => {
  const first = buildDailyBusinessMetrics({
    metricDate: '2026-08-25',
    profiles: [profile()],
    conversionEvents: [],
    correlation,
    sourceRunId: 'run-1',
    observedAt: fixedNow,
  })
  const second = buildDailyBusinessMetrics({
    metricDate: '2026-08-25',
    profiles: [profile()],
    conversionEvents: [],
    correlation,
    sourceRunId: 'run-2',
    observedAt: fixedNow,
  })

  const firstMrr = first.find((metric) => metric.metricName === 'revenue.mrr')
  const secondMrr = second.find((metric) => metric.metricName === 'revenue.mrr')
  const cancellations = first.find((metric) => metric.metricName === 'members.cancellations')

  assert.equal(firstMrr.idempotencyKey, secondMrr.idempotencyKey)
  assert.equal(cancellations.unit, 'count')
  assert.equal(cancellations.valueState, 'unknown')
  assert.equal(cancellations.value, null)
})
