import type { IntelligenceSignal } from '../src/contracts.js'
import type { AdminTriggerRequest } from '../src/http/admin-contracts.js'
import { stableUuid } from '../src/stable-id.js'
import type { OperatingReviewFixture } from './operating-reviews.js'

export function createSyntheticOperatingFixture(input: {
  trigger: AdminTriggerRequest
  requestedAt: string
  correlationId: string
}): OperatingReviewFixture {
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
