import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { start } from 'workflow/api'

import type { CorrelationContext, IntelligenceSignal, MetricSnapshot } from '../src/contracts.js'
import { InMemoryDurableWorkflowStore } from '../src/persistence/durable-workflow-store.js'
import { InMemoryOperatingWorkflowStore } from '../src/persistence/operating-workflow-store.js'
import { InMemorySensorObservationStore } from '../src/persistence/sensor-observation-store.js'
import { installOperatingWorkflowTestContext } from '../src/runtime/operating-workflow-context.js'
import { createStagingDestinationFingerprint } from '../src/runtime/staging-destination.js'
import { stableUuid } from '../src/stable-id.js'
import type { AdminTriggerRequest } from '../src/http/admin-contracts.js'
import { parseAdminTriggerRequest, syntheticRequestedAtForKey, syntheticWorkflowIdempotencyKey } from '../src/http/admin-contracts.js'
import type { OperationsOrchestratorOutput } from '../src/agents/operations-orchestrator.js'
import {
  conversionReviewWorkflow,
  dailyBusinessHealthWorkflow,
  weeklyOperatingReviewWorkflow,
  type OperatingReviewWorkflowInput,
} from './operating-reviews.js'
import { createSyntheticOperatingFixture } from './synthetic-operating-fixtures.js'

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
  let sensorStore: InMemorySensorObservationStore

  beforeEach(() => {
    process.env.VITEST = 'true'
    durableStore = new InMemoryDurableWorkflowStore(binding)
    operatingStore = new InMemoryOperatingWorkflowStore()
    sensorStore = new InMemorySensorObservationStore()
    cleanup = installOperatingWorkflowTestContext({
      durableStore,
      operatingStore,
      sensorStore,
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
    const traceLinks = [...operatingStore.traceLinks.values()]
    expect(traceLinks.some((link) => link.relationship === 'observation_produced_signal')).toBe(true)
    expect(traceLinks.some((link) => link.relationship === 'signal_created_investigation')).toBe(true)
    expect(traceLinks.some((link) => link.relationship === 'signal_supported_recommendation')).toBe(true)
    expect(traceLinks.some((link) => link.relationship === 'signal_proposed_action')).toBe(true)
    expect(traceLinks.every((link) => link.correlation.correlationId === correlation.correlationId)).toBe(true)
    const firstTraceCount = operatingStore.traceLinks.size
    const firstSignalCount = operatingStore.signals.size
    const firstActionCount = operatingStore.actions.size

    const duplicateRun = await start(conversionReviewWorkflow, [input])
    const duplicate = await duplicateRun.returnValue
    expect(duplicate.state).toBe('reused')
    expect(duplicate.agentRunId).toBe(first.agentRunId)
    expect(durableStore.runsById.size).toBe(1)
    expect(operatingStore.reviews.size).toBe(1)
    expect(operatingStore.traceLinks.size).toBe(firstTraceCount)
    expect(operatingStore.signals.size).toBe(firstSignalCount)
    expect(operatingStore.actions.size).toBe(firstActionCount)
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

  it('weekly_operating_review consumes and durably reuses live SEO/AEO sensor observations', async () => {
    const input = workflowInput('weekly_operating_review', {
      sensorReports: [seoSensorReport(), aeoSensorReport()],
      persistedSignals: [],
    })
    const run = await start(weeklyOperatingReviewWorkflow, [input])
    const result = await run.returnValue

    expect(result.state).toBe('succeeded')
    expect(result.sensorRunCount).toBe(2)
    expect(result.sensorObservationCount).toBe(2)
    expect(result.sensorProvenanceModes).toEqual(['live'])
    expect(result.sensorPersistenceVerified).toBe(true)
    expect(sensorStore.runs.size).toBe(2)
    expect(sensorStore.observations.size).toBe(2)
    expect([...operatingStore.signals.values()].some((signal) => signal.producer === 'seo-content-monitor')).toBe(true)
    expect([...operatingStore.signals.values()].some((signal) => signal.producer === 'ai-aeo-monitor')).toBe(true)

    const duplicateRun = await start(weeklyOperatingReviewWorkflow, [input])
    const duplicate = await duplicateRun.returnValue
    expect(duplicate.state).toBe('reused')
    expect(duplicate.sensorRunCount).toBe(2)
    expect(duplicate.sensorObservationCount).toBe(2)
    expect(duplicate.sensorProvenanceModes).toEqual(['live'])
    expect(duplicate.sensorPersistenceVerified).toBe(true)
    expect(sensorStore.runs.size).toBe(2)
    expect(sensorStore.observations.size).toBe(2)
  })

  it('protected C7 fixtures route event, daily, and weekly triggers through the shared durable workflows', async () => {
    const cases: Array<{
      trigger: AdminTriggerRequest
      workflow: typeof conversionReviewWorkflow
      workflowName: 'conversion_review' | 'daily_business_health' | 'weekly_operating_review'
    }> = [
      {
        trigger: {
          triggerCategory: 'event',
          eventType: 'payment_failure',
          sourceEventId: 'synthetic-event:payment-failure-001',
          businessKey: 'synthetic-business:payment-failure-001',
          fixtureMode: 'synthetic',
        },
        workflow: conversionReviewWorkflow,
        workflowName: 'conversion_review',
      },
      {
        trigger: {
          triggerCategory: 'daily',
          workflowName: 'daily_business_health',
          businessKey: 'synthetic-daily:2026-08-27',
          fixtureMode: 'synthetic',
        },
        workflow: dailyBusinessHealthWorkflow,
        workflowName: 'daily_business_health',
      },
      {
        trigger: {
          triggerCategory: 'weekly',
          workflowName: 'weekly_operating_review',
          businessKey: 'synthetic-weekly:2026-w35',
          fixtureMode: 'synthetic',
        },
        workflow: weeklyOperatingReviewWorkflow,
        workflowName: 'weekly_operating_review',
      },
    ]

    for (const [index, item] of cases.entries()) {
      const correlationId = stableUuid('phase-c7-protected-trigger-test', item.trigger.businessKey)
      const run = await start(item.workflow, [{
        fixture: createSyntheticOperatingFixture({
          trigger: item.trigger,
          requestedAt: fixedNow,
          correlationId,
        }),
        binding,
        idempotencyKey: `phase-c5:${item.workflowName}:${item.trigger.businessKey}`,
        requestedAt: fixedNow,
        correlation: {
          correlationId,
          causationId: null,
          traceId: `phase-c7-protected-trigger-${index}`,
        },
      }])
      const result = await run.returnValue
      expect(result.state).toBe('succeeded')
      expect(result.workflowName).toBe(item.workflowName)
    }

    expect(durableStore.runsById.size).toBe(3)
    expect([...operatingStore.actions.values()].every((action) => (
      action.executorKey === null && action.executionStartedAt === null && action.executedAt === null
    ))).toBe(true)
    expect([...operatingStore.signals.values()].some((signal) => (
      signal.signalType === 'operations.event.payment_failure'
    ))).toBe(true)
  })

  it('opt-in owner review persists substantive four-specialist evidence without changing quiet baseline or repeating artifacts', async () => {
    const baseline = parseAdminTriggerRequest({
      triggerCategory: 'weekly',
      workflowName: 'weekly_operating_review',
      businessKey: 'synthetic-weekly:2026-08-27:owner-acceptance',
      fixtureMode: 'synthetic',
    })
    const scenario = parseAdminTriggerRequest({ ...baseline, fixtureScenario: 'specialist-review-v1' })
    const protectedInput = (trigger: AdminTriggerRequest): OperatingReviewWorkflowInput => {
      const idempotencyKey = syntheticWorkflowIdempotencyKey(trigger)
      const correlationId = stableUuid('phase-c7-protected-trigger', idempotencyKey)
      const requestedAt = syntheticRequestedAtForKey(trigger.businessKey)
      return {
        fixture: createSyntheticOperatingFixture({ trigger, requestedAt, correlationId }),
        binding,
        idempotencyKey,
        requestedAt,
        correlation: { correlationId, causationId: null, traceId: 'phase-c7-protected-trigger' },
      }
    }
    const baselineInput = protectedInput(baseline)
    expect(baselineInput.fixture).toEqual({
      reviewDate: '2026-08-27', metrics: [], lifecycleSignals: [], sourceHealth: [],
      industryObservations: [], persistedSignals: [], experiments: [], tasks: [],
      priorActions: [], sensorReports: [], specialists: {},
    })
    const baselineRun = await start(weeklyOperatingReviewWorkflow, [baselineInput])
    const baselineResult = await baselineRun.returnValue
    expect(baselineResult.quiet).toBe(true)
    expect(baselineResult.artifactCounts?.signalCount).toBe(0)

    const input = protectedInput(scenario)
    expect(input).toEqual(protectedInput(scenario))
    expect(input.idempotencyKey).not.toBe(baselineInput.idempotencyKey)
    expect(input.fixture.metrics).toHaveLength(84)
    expect(input.fixture.metrics.every((item) => item.provenance.notLiveBusinessEvidence === true)).toBe(true)
    const run = await start(weeklyOperatingReviewWorkflow, [input])
    const result = await run.returnValue
    expect(result.state).toBe('succeeded')
    expect(result.verificationStatus).toBe('verified')
    expect(result.agentRunId).not.toBe(baselineResult.agentRunId)
    expect(result.quiet).toBe(false)
    expect(result.priorityCount).toBeGreaterThan(0)
    expect(result.priorityCount).toBeLessThanOrEqual(3)
    expect(result.autumnDecisions.length).toBeLessThanOrEqual(3)
    expect(result.sensorRunCount).toBe(0)
    expect(sensorStore.runs.size).toBe(0)

    const evaluation = durableStore.steps.get(`${result.agentRunId}:evaluate-weekly_operating_review`)?.output
    const orchestrator = evaluation?.orchestrator as OperationsOrchestratorOutput
    expect(orchestrator).toBeDefined()
    const { revenue, growth, industry, marketing } = orchestrator.data.specialistOutputs
    expect(revenue?.data.assessments.find((item) => item.metric === 'subscriptions.upgraded.confirmed')?.delta).toBe(2)
    expect(revenue?.data.assessments.find((item) => item.metric === 'revenue.mrr')).toMatchObject({
      currentValue: null, comparisonValue: null, delta: null, dataQualityState: 'unknown',
    })
    const paywall = growth?.data.comparisons.find((item) => item.metric === 'product.paywall_hits')
    expect(paywall?.currentWeek.value).toBe(28)
    expect(paywall?.priorWeek.value).toBe(7)
    expect(paywall?.trailingFourWeeks.value).toBe(49)
    expect(paywall?.trailingTwelveWeeks.value).toBe(105)
    expect(growth?.data.anomalies.length).toBeGreaterThan(0)
    expect(industry?.data.routedSignalCount).toBe(1)
    expect(industry?.data.events[0]).toMatchObject({ publicationDate: '2026-08-26', eventDate: '2026-08-25' })
    expect(industry?.data.events[0]?.source.uri).toMatch(/^https:\/\/example\.invalid\/fixtures\//)
    expect(industry?.data.events[0]?.licensingCaveat).toContain('Original invented test content')
    expect(industry?.data.liveResearchPerformed).toBe(false)
    expect(marketing?.data.experiments.length).toBeGreaterThan(0)
    expect(marketing?.data.draftInternalCopy.length).toBeGreaterThan(0)
    expect(marketing?.data.activeCampaignMutationPerformed).toBe(false)
    expect(marketing?.data.financialSuccessDeclared).toBe(false)
    expect(marketing?.data.audiences.every((item) => item.containsDirectIdentifiers === false)).toBe(true)
    expect(marketing?.data.draftInternalCopy.every((item) => item.requiresApprovalBeforeExternalUse)).toBe(true)
    for (const output of [orchestrator, revenue, growth, industry, marketing]) {
      expect(output).toMatchObject({ modelUsed: false, mutationsPerformed: false, toolCalls: [], inputTokens: null, outputTokens: null, estimatedCost: null })
      expect(output?.evidence.length).toBeGreaterThan(0)
      expect(output?.sourceRefs.length).toBeGreaterThan(0)
    }

    const signals = [...operatingStore.signals.values()]
    // Growth and Marketing describe the same paywall metric; the Orchestrator
    // deliberately retains one ranked signal rather than double-counting it.
    expect(new Set(signals.map((item) => item.producer))).toEqual(new Set([
      'revenue-agent', 'growth-agent', 'industry-intelligence-agent',
    ]))
    expect(marketing?.signals.length).toBeGreaterThan(0)
    expect(operatingStore.experiments.size).toBeGreaterThan(0)
    expect(signals.every((item) => item.sourceRefs.length > 0 && item.evidence.length > 0)).toBe(true)
    const traceLinks = [...operatingStore.traceLinks.values()]
      .filter((item) => item.correlation.correlationId === input.correlation.correlationId)
    for (const signal of signals) {
      expect(traceLinks.some((link) => link.relationship === 'observation_produced_signal' && link.toId === signal.id)).toBe(true)
    }
    expect(operatingStore.actions.size).toBeGreaterThan(0)
    expect([...operatingStore.actions.values()].every((action) => (
      action.actionType === 'internal.record_recommendation' && action.targetSystem === 'intelligence-os'
      && action.status === 'proposed' && action.approvalRequired === false && action.payload.mutationAllowed === false
      && action.executorKey === null && action.executionStartedAt === null && action.executedAt === null
    ))).toBe(true)
    const countArtifacts = () => ({
      runs: durableStore.runsById.size, steps: durableStore.steps.size,
      reviews: operatingStore.reviews.size, states: operatingStore.states.size,
      signals: operatingStore.signals.size, recommendations: operatingStore.recommendations.size,
      tasks: operatingStore.tasks.size, experiments: operatingStore.experiments.size,
      actions: operatingStore.actions.size, traceLinks: operatingStore.traceLinks.size,
    })
    const beforeDuplicate = countArtifacts()
    const duplicateRun = await start(weeklyOperatingReviewWorkflow, [protectedInput(scenario)])
    const duplicate = await duplicateRun.returnValue
    expect(duplicate.state).toBe('reused')
    expect(duplicate.agentRunId).toBe(result.agentRunId)
    expect(duplicate.artifactCounts).toEqual(result.artifactCounts)
    expect(countArtifacts()).toEqual(beforeDuplicate)
    expect(durableStore.runsById.size).toBe(2)
    expect(operatingStore.reviews.size).toBe(2)

    // A different review key must not overwrite the first synthetic review's
    // signals or collide with its immutable recommendations/actions.
    const priorSignals = structuredClone([...operatingStore.signals.values()])
    const priorActions = structuredClone([...operatingStore.actions.values()])
    const nextInput = protectedInput(parseAdminTriggerRequest({
      ...scenario,
      businessKey: 'synthetic-weekly:2026-08-27:owner-acceptance-second',
    }))
    expect(nextInput.fixture.metrics[0]?.scopeKey).not.toBe(input.fixture.metrics[0]?.scopeKey)
    const nextRun = await start(weeklyOperatingReviewWorkflow, [nextInput])
    expect((await nextRun.returnValue).state).toBe('succeeded')
    expect(durableStore.runsById.size).toBe(3)
    expect(operatingStore.reviews.size).toBe(3)
    expect([...operatingStore.signals.values()].filter((item) => (
      item.correlation.correlationId === input.correlation.correlationId
    ))).toEqual(priorSignals)
    expect([...operatingStore.actions.values()].filter((item) => (
      item.correlation.correlationId === input.correlation.correlationId
    ))).toEqual(priorActions)
    expect([...operatingStore.signals.values()].some((item) => (
      item.correlation.correlationId === nextInput.correlation.correlationId
    ))).toBe(true)
    const afterSecondReview = countArtifacts()
    const secondDuplicate = await start(weeklyOperatingReviewWorkflow, [nextInput])
    expect((await secondDuplicate.returnValue).state).toBe('reused')
    expect(countArtifacts()).toEqual(afterSecondReview)
  })
})

function seoSensorReport(): OperatingReviewWorkflowInput['fixture']['sensorReports'][number] {
  return {
    sensorName: 'seo-content-monitor',
    provenanceMode: 'live',
    report: {
      generatedAt: fixedNow,
      cadence: 'weekly',
      workflowBoundary: 'Candidate opportunities only; no publishing.',
      dataSources: [{ name: 'Google Search Console', status: 'configured', detail: 'Synthetic fixture.', count: 1 }],
      opportunities: [{
        id: 'seo-synthetic-field-inspection',
        title: 'Synthetic field inspection search opportunity',
        angle: 'Answer one bounded search intent with reviewed evidence.',
        category: 'field-inspection',
        priority: 'high',
        score: 88,
        recommendedSurface: 'blog_supporting_article',
        workflowStatus: 'candidate',
        targetKeywords: ['synthetic field inspection query'],
        internalLinks: [{ label: 'Field inspection guide', href: '/guides/how-to-become-a-field-inspector' }],
        rationale: 'Synthetic Search Console evidence shows a documented opportunity.',
        sourceSignals: ['synthetic Search Console row'],
      }],
    },
  }
}

function aeoSensorReport(): OperatingReviewWorkflowInput['fixture']['sensorReports'][number] {
  return {
    sensorName: 'ai-aeo-monitor',
    provenanceMode: 'live',
    report: {
      generatedAt: fixedNow,
      cadence: 'weekly',
      workflowBoundary: 'Visibility evidence only; no publishing.',
      dataSources: [{ name: 'AEO snapshot webhook', status: 'configured', detail: 'Synthetic fixture.', count: 1 }],
      promptSet: [],
      answerSnapshots: [],
      opportunities: [{
        id: 'aeo-synthetic-field-inspection',
        prompt: 'What is a synthetic field inspection?',
        intent: 'career_research',
        priority: 'medium',
        score: 76,
        recommendedAction: 'owned_answer_refresh',
        targetPage: '/guides/how-to-become-a-field-inspector',
        answerGap: 'The synthetic answer snapshot omitted one owned entity.',
        recommendedAnswerElements: ['plain-language definition'],
        internalLinks: [{ label: 'Field inspection guide', href: '/guides/how-to-become-a-field-inspector' }],
        observedBrands: [],
        workflowStatus: 'candidate',
      }],
    },
  }
}

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
    sensorReports: [],
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
