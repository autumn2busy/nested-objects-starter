import type { IntelligenceSignal, MetricSnapshot } from '../src/contracts.js'
import { SPECIALIST_REVIEW_SCENARIO, type AdminTriggerRequest } from '../src/http/admin-contracts.js'
import { stableUuid } from '../src/stable-id.js'
import type { OperatingReviewFixture } from './operating-reviews.js'

export function createSyntheticOperatingFixture(input: {
  trigger: AdminTriggerRequest
  requestedAt: string
  correlationId: string
}): OperatingReviewFixture {
  if (input.trigger.triggerCategory === 'weekly' && input.trigger.fixtureScenario === SPECIALIST_REVIEW_SCENARIO) {
    return createSpecialistReviewFixture(input)
  }
  const reviewDate = input.requestedAt.slice(0, 10)
  const lifecycleSignals = input.trigger.triggerCategory === 'event'
    ? [eventSignal(input.trigger.eventType, input.trigger.sourceEventId, input)]
    : []
  const sourceHealth = input.trigger.triggerCategory === 'daily'
    ? [{
      sourceId: 'synthetic-c7-healthy-source',
      status: 'healthy' as const,
      lastObservedAt: input.requestedAt,
      staleAfterHours: 24,
      collectorErrorCode: null,
    }]
    : []

  return {
    reviewDate,
    metrics: [],
    lifecycleSignals,
    sourceHealth,
    industryObservations: [],
    persistedSignals: [],
    experiments: [],
    tasks: [],
    priorActions: [],
    sensorReports: [],
    specialists: input.trigger.triggerCategory === 'event' || (
      input.trigger.triggerCategory === 'manual'
      && input.trigger.workflowName === 'conversion_review'
    )
      ? {
        revenue: { currentMetrics: [], comparisonMetrics: [] },
        growth: { metrics: [], currentWeekEnd: reviewDate },
        marketing: { marketingMetrics: [], lifecycleSignals },
      }
      : {},
  }
}

function createSpecialistReviewFixture(input: {
  requestedAt: string
  correlationId: string
}): OperatingReviewFixture {
  const reviewDate = input.requestedAt.slice(0, 10)
  const dateBefore = (days: number) => new Date(Date.parse(input.requestedAt) - days * 86_400_000).toISOString().slice(0, 10)
  const correlation = { correlationId: input.correlationId, causationId: null, traceId: `synthetic-${SPECIALIST_REVIEW_SCENARIO}` }
  const metric = (date: string, name: string, value: number | null, domain: MetricSnapshot['domain'], unit = 'count'): MetricSnapshot => ({
    metricDate: date,
    metricName: name,
    domain,
    // Specialist artifact identities include metric scope. Isolate synthetic
    // review runs from each other and from any future real global metric.
    scopeKey: `synthetic:${SPECIALIST_REVIEW_SCENARIO}:${input.correlationId}`,
    dimensions: {},
    value,
    valueState: value === null ? 'unknown' : 'known',
    unit,
    numerator: null,
    denominator: null,
    observedRecords: value === null ? 0 : 1,
    expectedRecords: 1,
    completeness: value === null ? 0 : 1,
    confidence: value === null ? 0 : 1,
    sourceSystem: 'synthetic-owner-review',
    sourceRunId: `synthetic-${input.correlationId}`,
    sourceRefs: [{
      sourceSystem: 'synthetic-owner-review',
      sourceType: 'fixture_aggregate',
      sourceId: `${SPECIALIST_REVIEW_SCENARIO}:${input.correlationId}:${date}:${name}`,
      observedAt: input.requestedAt,
      metadata: { fixture: true, scenario: SPECIALIST_REVIEW_SCENARIO, notLiveBusinessEvidence: true },
    }],
    provenance: { fixture: true, scenario: SPECIALIST_REVIEW_SCENARIO, notLiveBusinessEvidence: true },
    idempotencyKey: `metric:${SPECIALIST_REVIEW_SCENARIO}:${input.correlationId}:${date}:${name}`,
    observedAt: input.requestedAt,
    correlation,
  })
  const growthMetrics = Array.from({ length: 84 }, (_, daysAgo) => (
    metric(dateBefore(daysAgo), 'product.paywall_hits', daysAgo < 7 ? 4 : 1, 'product')
  ))
  const currentMetrics = [
    metric(reviewDate, 'subscriptions.upgraded.confirmed', 4, 'revenue'),
    metric(reviewDate, 'revenue.mrr', null, 'revenue', 'USD'),
  ]
  const comparisonMetrics = [
    metric(dateBefore(7), 'subscriptions.upgraded.confirmed', 2, 'revenue'),
    metric(dateBefore(7), 'revenue.mrr', null, 'revenue', 'USD'),
  ]

  return {
    reviewDate,
    metrics: growthMetrics,
    lifecycleSignals: [],
    sourceHealth: [],
    industryObservations: [{
      observationId: `synthetic-${SPECIALIST_REVIEW_SCENARIO}:${input.correlationId}`,
      title: 'Synthetic field-inspector research fixture — not a current industry finding',
      summary: 'Invented aggregate research evidence solely for owner-review acceptance; no firm or person is represented.',
      publicationDate: dateBefore(1),
      eventDate: dateBefore(2),
      source: {
        publisher: 'Synthetic Owner Review Fixture',
        uri: `https://example.invalid/fixtures/${SPECIALIST_REVIEW_SCENARIO}/${reviewDate}`,
        sourceId: `synthetic-${SPECIALIST_REVIEW_SCENARIO}:${input.correlationId}`,
      },
      confidence: 0.9,
      businessRelevance: 'high',
      affectedSegment: 'Synthetic field-inspector cohort; no member records',
      risk: 'medium',
      licensingCaveat: 'Original invented test content; no third-party text or permission to publish a real finding.',
      recommendedFollowUp: 'Inspect this synthetic trace only; do not publish or contact anyone.',
    }],
    persistedSignals: [],
    experiments: [],
    tasks: [],
    priorActions: [],
    sensorReports: [],
    specialists: {
      revenue: { currentMetrics, comparisonMetrics },
      growth: { metrics: growthMetrics, currentWeekEnd: reviewDate },
      marketing: {
        marketingMetrics: [metric(reviewDate, 'marketing.email_engagement', 0.42, 'marketing', 'ratio')],
        lifecycleSignals: [],
      },
    },
  }
}

function eventSignal(
  eventType: string,
  sourceEventId: string,
  input: { requestedAt: string; correlationId: string },
): IntelligenceSignal {
  const fingerprint = `synthetic-c7-trigger:${eventType}:${sourceEventId}`
  const sourceRef = {
    sourceSystem: 'synthetic-c7-trigger',
    sourceType: eventType,
    sourceId: sourceEventId,
    observedAt: input.requestedAt,
  }
  return {
    id: stableUuid('synthetic-c7-event-signal', fingerprint),
    signalType: `operations.event.${eventType}`,
    domain: 'growth',
    producer: 'synthetic-c7-trigger',
    title: `Synthetic ${eventType.replaceAll('_', ' ')} trigger`,
    summary: 'Deterministic synthetic event used to validate the protected event-trigger contract.',
    evidence: [{
      evidenceType: 'test',
      summary: 'Synthetic C7 trigger fixture; no customer record or external mutation.',
      sourceRef,
      confidence: 1,
    }],
    sourceRefs: [sourceRef],
    confidence: 1,
    severity: eventType === 'critical_integration_failure' ? 'high' : 'medium',
    priority: eventType === 'critical_integration_failure' ? 90 : 65,
    businessImpact: 'Validates one shared event-driven decision path without creating an independent agent cron.',
    affectedEntities: [],
    recommendedFollowUp: 'Review the synthetic workflow trace only.',
    fingerprint,
    idempotencyKey: `signal:${fingerprint}`,
    status: 'new',
    firstDetectedAt: input.requestedAt,
    lastDetectedAt: input.requestedAt,
    correlation: {
      correlationId: input.correlationId,
      causationId: stableUuid('synthetic-c7-source-event', sourceEventId),
      traceId: 'synthetic-c7-protected-trigger',
    },
  }
}
