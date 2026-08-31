import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { start } from 'workflow/api'

import type { CorrelationContext, IntelligenceSignal, MetricSnapshot } from '../src/contracts.js'
import { InMemoryDurableWorkflowStore } from '../src/persistence/durable-workflow-store.js'
import { InMemoryOperatingWorkflowStore } from '../src/persistence/operating-workflow-store.js'
import { installOperatingWorkflowTestContext } from '../src/runtime/operating-workflow-context.js'
import { createStagingDestinationFingerprint } from '../src/runtime/staging-destination.js'
import { stableUuid } from '../src/stable-id.js'
import {
  conversionReviewWorkflow,
  dailyBusinessHealthWorkflow,
  weeklyOperatingReviewWorkflow,
  type OperatingReviewWorkflowInput,
} from './operating-reviews.js'

const fixedNow = '2026-08-27T16:00:00.000Z'
const projectRef = 'syntheticstaging318'
const hostname = `${projectRef}.supabase.co`
const binding = {
  bindingKey: 'phase-c5-workflow-test',
  policyVersion: 'phase-c5-test',
  projectRef,
  hostname,
  destinationFingerprint: createStagingDestinationFingerprint({
    policyVersion: 'phase-c5-test',
    projectRef,
    hostname,
  }),
}
const correlation: CorrelationContext = {
  correlationId: '31800000-0000-5000-8000-000000000318',
  causationId: null,
  traceId: 'trace-phase-c5-workflow-test',
}

describe('Phase C5 operating workflows', () => {
  let cleanup: (() => void) | null = null
  let durableStore: InMemoryDurableWorkflowStore
  let operatingStore: InMemoryOperatingWorkflowStore

  beforeEach(() => {
    process.env.VITEST = 'true'
    durableStore = new InMemoryDurableWorkflowStore(binding)
    operatingStore = new InMemoryOperatingWorkflowStore()
    cleanup = installOperatingWorkflowTestContext({
      durableStore,
      operatingStore,
      binding,
      runtimeVersion: 'phase-c5-test',
    })
  })

  afterEach(() => {
    cleanup?.()
    cleanup = null
  })

  it('conversion_review persists a verified specialist trace and reuses duplicate delivery', async () => {
    const input = workflowInput('conversion_review')
    const firstRun = await start(conversionReviewWorkflow, [input])
    const first = await firstRun.returnValue

    expect(first.state).toBe('succeeded')
    expect(first.verificationStatus).toBe('verified')
    expect(first.artifactCounts?.reviewCount).toBe(1)
    expect(first.artifactCounts?.signalCount).toBeGreaterThan(0)
    expect(operatingStore.reviews.size).toBe(1)
    expect(operatingStore.states.size).toBe(1)
    expect([...operatingStore.actions.values()].every((action) => (
      action.status === 'proposed' && action.executorKey === null && action.executedAt === null
    ))).toBe(true)

    const duplicateRun = await start(conversionReviewWorkflow, [input])
    const duplicate = await duplicateRun.returnValue
    expect(duplicate.state).toBe('reused')
    expect(duplicate.agentRunId).toBe(first.agentRunId)
    expect(durableStore.runsById.size).toBe(1)
    expect(operatingStore.reviews.size).toBe(1)
  })

  it('daily_business_health completes quietly with no notification or signal when healthy', async () => {
    const input = workflowInput('daily_business_health', {
      specialists: {},
      metrics: [],
      lifecycleSignals: [],
      persistedSignals: [],
      sourceHealth: [{
        sourceId: 'synthetic-healthy-collector',
        status: 'healthy',
        lastObservedAt: fixedNow,
        staleAfterHours: 24,
        collectorErrorCode: null,
      }],
      industryObservations: [],
    })
    const run = await start(dailyBusinessHealthWorkflow, [input])
    const result = await run.returnValue

    expect(result.state).toBe('succeeded')
    expect(result.quiet).toBe(true)
    expect(result.notificationRequired).toBe(false)
    expect(result.priorityCount).toBe(0)
    expect(result.autumnDecisions).toHaveLength(0)
    expect(result.artifactCounts?.signalCount).toBe(0)
    expect([...operatingStore.reviews.values()][0]?.status).toBe('quiet')
  })

  it('weekly_operating_review ranks no more than three priorities and surfaces only proposed Autumn decisions', async () => {
    const input = workflowInput('weekly_operating_review', {
      industryObservations: [industryObservation()],
      persistedSignals: [
        signal('operations.synthetic_first', 100, 'operations'),
        signal('revenue.synthetic_second', 95, 'revenue'),
        signal('growth.synthetic_third', 90, 'growth'),
        signal('product.synthetic_fourth', 85, 'product'),
      ],
    })
    const run = await start(weeklyOperatingReviewWorkflow, [input])
    const result = await run.returnValue

    expect(result.state).toBe('succeeded')
    expect(result.priorityCount).toBeLessThanOrEqual(3)
    expect(result.priorities).toHaveLength(3)
    expect(result.autumnDecisions.length).toBeLessThanOrEqual(3)
    expect(result.artifactCounts?.reviewCount).toBe(1)
    expect([...operatingStore.actions.values()].every((action) => (
      action.status === 'proposed' && action.executionStartedAt === null
    ))).toBe(true)
    expect([...operatingStore.reviews.values()][0]?.priorities).toHaveLength(3)
  })
})

function workflowInput(
  workflowName: 'conversion_review' | 'daily_business_health' | 'weekly_operating_review',
  overrides: Partial<OperatingReviewWorkflowInput['fixture']> = {},
): OperatingReviewWorkflowInput {
  const growthMetrics = dailySeries('2026-08-27', 84, 'product.paywall_hits', (daysAgo) => daysAgo <= 6 ? 4 : 1)
  const lifecycle = signal('marketing.plan_state_conflict', 90, 'marketing')
  const fixture: OperatingReviewWorkflowInput['fixture'] = {
    reviewDate: '2026-08-27',
    metrics: growthMetrics,
    lifecycleSignals: [lifecycle],
    sourceHealth: [],
    industryObservations: [],
    persistedSignals: [],
    experiments: [],
    tasks: [],
    priorActions: [],
    specialists: {
      revenue: {
        currentMetrics: [metric('2026-08-27', 'subscriptions.upgraded.confirmed', 4, 'revenue')],
        comparisonMetrics: [metric('2026-08-20', 'subscriptions.upgraded.confirmed', 2, 'revenue')],
      },
      growth: { metrics: growthMetrics, currentWeekEnd: '2026-08-27' },
      marketing: { marketingMetrics: [], lifecycleSignals: [lifecycle] },
    },
    ...overrides,
  }
  return {
    fixture,
    binding,
    idempotencyKey: `phase-c5:${workflowName}:synthetic-2026-08-27`,
    requestedAt: fixedNow,
    correlation,
  }
}

function metric(
  date: string,
  name: string,
  value: number,
  domain: MetricSnapshot['domain'] = 'product',
): MetricSnapshot {
  return {
    metricDate: date,
    metricName: name,
    domain,
    scopeKey: 'global',
    dimensions: {},
    value,
    valueState: 'known',
    unit: 'count',
    numerator: null,
    denominator: null,
    observedRecords: value,
    expectedRecords: null,
    completeness: 1,
    confidence: 1,
    sourceSystem: 'synthetic-supabase-fixture',
    sourceRunId: 'run-c5-fixture',
    sourceRefs: [{
      sourceSystem: 'synthetic-supabase-fixture',
      sourceType: 'business_metric_daily',
      sourceId: `${date}:${name}`,
      observedAt: fixedNow,
    }],
    provenance: { fixture: true },
    idempotencyKey: `metric:${date}:${name}:global:c5-fixture`,
    observedAt: fixedNow,
    correlation,
  }
}

function dailySeries(
  endDate: string,
  days: number,
  name: string,
  valueForDaysAgo: (daysAgo: number) => number,
): MetricSnapshot[] {
  const end = new Date(`${endDate}T00:00:00.000Z`)
  return Array.from({ length: days }, (_, daysAgo) => {
    const date = new Date(end.getTime() - daysAgo * 86_400_000).toISOString().slice(0, 10)
    return metric(date, name, valueForDaysAgo(daysAgo))
  })
}

function signal(type: string, priority: number, domain: IntelligenceSignal['domain']): IntelligenceSignal {
  const fingerprint = `phase-c5-test:${type}`
  const sourceRef = {
    sourceSystem: 'synthetic-c5-fixture',
    sourceType: 'test_observation',
    sourceId: type,
    observedAt: fixedNow,
  }
  return {
    id: stableUuid('phase-c5-test-signal', fingerprint),
    signalType: type,
    domain,
    producer: 'phase-c5-test',
    title: `Synthetic ${type}`,
    summary: 'Synthetic C5 evidence-backed signal.',
    evidence: [{ evidenceType: 'test', summary: 'Synthetic C5 evidence.', sourceRef, confidence: 1 }],
    sourceRefs: [sourceRef],
    confidence: 0.95,
    severity: priority >= 95 ? 'critical' : priority >= 85 ? 'high' : 'medium',
    priority,
    businessImpact: 'Synthetic operating-review impact.',
    affectedEntities: [],
    recommendedFollowUp: 'Review the synthetic evidence.',
    fingerprint,
    idempotencyKey: `signal:${fingerprint}`,
    status: 'new',
    firstDetectedAt: fixedNow,
    lastDetectedAt: fixedNow,
    correlation,
  }
}

function industryObservation() {
  return {
    observationId: 'synthetic-weekly-industry',
    title: 'Synthetic weekly industry event',
    summary: 'A deterministic high-value field-inspector research fixture.',
    publicationDate: '2026-08-25',
    eventDate: '2026-08-24',
    source: {
      publisher: 'Synthetic Research Fixture',
      uri: 'https://example.invalid/research/weekly-industry',
      sourceId: 'synthetic-weekly-industry',
      checksum: 'synthetic-checksum',
    },
    confidence: 0.9,
    businessRelevance: 'high' as const,
    affectedSegment: 'field inspectors',
    risk: 'medium' as const,
    licensingCaveat: 'Summary and link only; do not republish source text.',
    recommendedFollowUp: 'Validate the source before proposing a response.',
  }
}
