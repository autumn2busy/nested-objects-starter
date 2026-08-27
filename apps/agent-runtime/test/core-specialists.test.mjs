import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AGENT_REGISTRATIONS,
  ContractValidationError,
  InMemoryOperationsOrchestratorStateStore,
  runGrowthAgent,
  runIndustryIntelligenceAgent,
  runMarketingAgent,
  runOperationsOrchestrator,
  runRevenueAgent,
  stableUuid,
} from '../dist/index.js'

const fixedNow = '2026-08-27T16:00:00.000Z'
const correlation = {
  correlationId: '31800000-0000-5000-8000-000000000318',
  causationId: null,
  traceId: 'trace-c4-specialists',
}

test('core registrations point to implemented typed v1 contracts and remain disabled', () => {
  const core = AGENT_REGISTRATIONS.slice(0, 5)
  assert.deepEqual(core.map((registration) => registration.name), [
    'operations-orchestrator',
    'revenue-agent',
    'growth-agent',
    'industry-intelligence-agent',
    'marketing-agent',
  ])
  assert.ok(core.every((registration) => registration.implementationStatus === 'implemented'))
  assert.ok(core.every((registration) => registration.enabledByDefault === false))
  assert.ok(core.every((registration) => registration.inputContract !== 'SpecialistInput'))
  assert.ok(core.every((registration) => registration.outputContract !== 'SpecialistOutput'))
})

test('Revenue Agent preserves unknown financial values and rejects ActiveCampaign as financial truth', () => {
  const revenue = runRevenueAgent({
    currentMetrics: [
      metric('2026-08-27', 'subscriptions.upgraded.confirmed', 4, { domain: 'revenue' }),
      metric('2026-08-27', 'revenue.mrr', null, { domain: 'revenue', unit: 'USD', valueState: 'unknown', confidence: 0, completeness: 0 }),
      metric('2026-08-27', 'revenue.arr', 999_999, { domain: 'revenue', unit: 'USD', sourceSystem: 'activecampaign' }),
    ],
    comparisonMetrics: [
      metric('2026-08-20', 'subscriptions.upgraded.confirmed', 2, { domain: 'revenue' }),
      metric('2026-08-20', 'revenue.mrr', null, { domain: 'revenue', unit: 'USD', valueState: 'unknown', confidence: 0, completeness: 0 }),
      metric('2026-08-20', 'revenue.arr', 500_000, { domain: 'revenue', unit: 'USD', sourceSystem: 'activecampaign' }),
    ],
    correlation,
    observedAt: fixedNow,
  })
  const upgrades = revenue.data.assessments.find((assessment) => assessment.metric === 'subscriptions.upgraded.confirmed')
  const mrr = revenue.data.assessments.find((assessment) => assessment.metric === 'revenue.mrr')
  const arr = revenue.data.assessments.find((assessment) => assessment.metric === 'revenue.arr')

  assert.equal(upgrades.delta, 2)
  assert.equal(upgrades.dataQualityState, 'ready')
  assert.equal(mrr.currentValue, null)
  assert.equal(mrr.delta, null)
  assert.equal(arr.currentValue, null)
  assert.equal(arr.comparisonValue, null)
  assert.equal(arr.dataQualityState, 'non_authoritative')
  assert.equal(revenue.data.financialTruthSource, 'normalized_metrics_only')
  assert.equal(revenue.modelUsed, false)
  assert.equal(revenue.estimatedCost, null)
})

test('Growth Agent compares week, prior week, trailing four and twelve weeks and emits a durable anomaly', () => {
  const revenue = runRevenueAgent({ currentMetrics: [], comparisonMetrics: [], correlation, observedAt: fixedNow })
  const growth = runGrowthAgent({
    metrics: dailySeries('2026-08-27', 84, 'product.paywall_hits', (daysAgo) => daysAgo <= 6 ? 4 : 1),
    currentWeekEnd: '2026-08-27',
    revenue,
    minimumRelativeChange: 0.25,
    correlation,
    observedAt: fixedNow,
  })
  const comparison = growth.data.comparisons[0]
  const anomaly = growth.data.anomalies[0]

  assert.equal(comparison.currentWeek.value, 28)
  assert.equal(comparison.priorWeek.value, 7)
  assert.equal(comparison.trailingFourWeeks.value, 49)
  assert.equal(comparison.trailingTwelveWeeks.value, 105)
  assert.equal(anomaly.category, 'paywall')
  assert.equal(anomaly.direction, 'increase')
  assert.equal(growth.signals[0].id, anomaly.signalId)
  assert.equal(growth.data.financialTruthAgent, 'revenue-agent')
})

test('Industry Intelligence Agent normalizes provenance and routes high-value fixture evidence', () => {
  const industry = runIndustryIntelligenceAgent({
    observations: [industryObservation('high-value', 'high', 'medium'), industryObservation('low-value', 'low', 'low')],
    researchMode: 'deterministic_fixture',
    approvedReadOnlyToolConfigured: false,
    correlation,
    observedAt: fixedNow,
  })

  assert.equal(industry.data.events.length, 2)
  assert.equal(industry.data.routedSignalCount, 1)
  assert.equal(industry.data.liveResearchPerformed, false)
  assert.equal(industry.data.events[0].provenance.metadata.licensingCaveat, 'Summary and link only; do not republish source text.')
  assert.equal(industry.signals[0].domain, 'industry')
  assert.throws(
    () => runIndustryIntelligenceAgent({
      observations: [],
      researchMode: 'approved_read_only',
      approvedReadOnlyToolConfigured: false,
      correlation,
      observedAt: fixedNow,
    }),
    ContractValidationError,
  )
})

test('Marketing Agent consumes Revenue and Growth outputs but only drafts or proposes actions', () => {
  const revenue = runRevenueAgent({ currentMetrics: [], comparisonMetrics: [], correlation, observedAt: fixedNow })
  const growth = runGrowthAgent({
    metrics: dailySeries('2026-08-27', 84, 'product.paywall_hits', (daysAgo) => daysAgo <= 6 ? 4 : 1),
    currentWeekEnd: '2026-08-27',
    revenue,
    correlation,
    observedAt: fixedNow,
  })
  const lifecycle = signal('marketing.plan_state_conflict', 90, 'marketing')
  const marketing = runMarketingAgent({
    revenue,
    growth,
    marketingMetrics: [metric('2026-08-27', 'marketing.email_engagement', 0.42, { domain: 'marketing', unit: 'ratio' })],
    lifecycleSignals: [lifecycle],
    correlation,
    observedAt: fixedNow,
  })

  assert.equal(marketing.data.financialTruthAgent, 'revenue-agent')
  assert.equal(marketing.data.financialSuccessDeclared, false)
  assert.equal(marketing.data.activeCampaignMutationPerformed, false)
  assert.ok(marketing.data.audiences.every((audience) => audience.containsDirectIdentifiers === false))
  assert.ok(marketing.data.draftInternalCopy.every((draft) => draft.requiresApprovalBeforeExternalUse === true))
  const activeCampaignAction = marketing.proposedActions.find((action) => action.targetSystem === 'activecampaign')
  assert.equal(activeCampaignAction.status, 'proposed')
  assert.equal(activeCampaignAction.approvalRequired, true)
  assert.equal(activeCampaignAction.executorKey, null)
  assert.equal(activeCampaignAction.payload.mutationAllowed, false)
})

test('Operations Orchestrator invokes specialists, ranks at most three priorities, persists state, and reuses idempotently', async () => {
  const store = new InMemoryOperationsOrchestratorStateStore()
  const input = {
    workflowName: 'c4-specialist-integration',
    idempotencyKey: 'c4:orchestrator:integration',
    specialists: {
      revenue: { currentMetrics: [], comparisonMetrics: [], observedAt: fixedNow },
      growth: { metrics: [], currentWeekEnd: '2026-08-27', observedAt: fixedNow },
      industry: {
        observations: [industryObservation('orchestrated-industry', 'critical', 'high')],
        researchMode: 'deterministic_fixture',
        approvedReadOnlyToolConfigured: false,
        observedAt: fixedNow,
      },
      marketing: { marketingMetrics: [], lifecycleSignals: [], observedAt: fixedNow },
    },
    persistedSignals: [
      signal('operations.first', 100, 'operations'),
      signal('revenue.second', 95, 'revenue'),
      signal('growth.third', 90, 'growth'),
      signal('marketing.fourth', 85, 'marketing'),
    ],
    persistedMetrics: [],
    experiments: [],
    tasks: [existingTaskFor(signal('operations.first', 100, 'operations'))],
    priorActions: [],
    stateStore: store,
    correlation,
    observedAt: fixedNow,
    maximumPriorities: 10,
  }
  const first = await runOperationsOrchestrator(input)
  const duplicate = await runOperationsOrchestrator(input)

  assert.equal(first.status, 'completed')
  assert.equal(first.data.priorities.length, 3)
  assert.equal(first.data.taskDrafts.length, 2)
  assert.equal(first.data.persistenceDisposition, 'created')
  assert.equal(duplicate.data.persistenceDisposition, 'reused')
  assert.equal(store.states.size, 1)
  assert.equal(first.data.specialistOutputs.industry.data.routedSignalCount, 1)
  assert.ok(first.data.taskDrafts.every((task) => task.correlation.correlationId === correlation.correlationId))
  assert.ok(first.proposedActions.every((action) => action.executorKey === null && action.executedAt === null))
  assert.ok(first.autumnDecisions.length <= 3)
})

test('Operations Orchestrator stays quiet when no meaningful evidence exists', async () => {
  const result = await runOperationsOrchestrator({
    workflowName: 'c4-quiet',
    idempotencyKey: 'c4:orchestrator:quiet',
    specialists: {},
    persistedSignals: [],
    persistedMetrics: [],
    experiments: [],
    tasks: [],
    priorActions: [],
    stateStore: new InMemoryOperationsOrchestratorStateStore(),
    correlation,
    observedAt: fixedNow,
  })
  assert.equal(result.status, 'quiet')
  assert.equal(result.data.quiet, true)
  assert.equal(result.data.priorities.length, 0)
  assert.equal(result.autumnDecisions.length, 0)
})

function metric(date, name, value, overrides = {}) {
  const valueState = overrides.valueState ?? 'known'
  return {
    metricDate: date,
    metricName: name,
    domain: overrides.domain ?? 'growth',
    scopeKey: overrides.scopeKey ?? 'global',
    dimensions: overrides.dimensions ?? {},
    value,
    valueState,
    unit: overrides.unit ?? 'count',
    numerator: null,
    denominator: null,
    observedRecords: value === null ? null : Math.max(0, Math.floor(value)),
    expectedRecords: null,
    completeness: overrides.completeness ?? (value === null ? 0 : 1),
    confidence: overrides.confidence ?? (value === null ? 0 : 1),
    sourceSystem: overrides.sourceSystem ?? 'supabase',
    sourceRunId: 'run-c4-test',
    sourceRefs: [{
      sourceSystem: overrides.sourceSystem ?? 'supabase',
      sourceType: 'business_metric_daily',
      sourceId: `${date}:${name}`,
      observedAt: fixedNow,
    }],
    provenance: { fixture: true },
    idempotencyKey: `metric:${date}:${name}:${overrides.scopeKey ?? 'global'}:c4-test`,
    observedAt: fixedNow,
    correlation,
  }
}

function dailySeries(endDate, days, name, valueForDaysAgo) {
  const end = new Date(`${endDate}T00:00:00.000Z`)
  return Array.from({ length: days }, (_, daysAgo) => {
    const date = new Date(end.getTime() - daysAgo * 86_400_000).toISOString().slice(0, 10)
    return metric(date, name, valueForDaysAgo(daysAgo), { domain: 'product' })
  })
}

function industryObservation(id, relevance, risk) {
  return {
    observationId: id,
    title: `Synthetic ${id} industry event`,
    summary: 'Deterministic research fixture for the field-inspector market.',
    publicationDate: '2026-08-25',
    eventDate: '2026-08-24',
    source: {
      publisher: 'Synthetic Research Fixture',
      uri: `https://example.invalid/research/${id}`,
      sourceId: `synthetic-${id}`,
      checksum: `checksum-${id}`,
    },
    confidence: 0.9,
    businessRelevance: relevance,
    affectedSegment: 'field inspectors',
    risk,
    licensingCaveat: 'Summary and link only; do not republish source text.',
    recommendedFollowUp: 'Review the source and validate impact before proposing a response.',
  }
}

function signal(type, priority, domain) {
  const fingerprint = `c4-test:${type}`
  const sourceRef = {
    sourceSystem: 'synthetic-c4-fixture',
    sourceType: 'test_observation',
    sourceId: type,
    observedAt: fixedNow,
  }
  return {
    id: stableUuid('c4-specialist-test-signal', fingerprint),
    signalType: type,
    domain,
    producer: 'c4-specialist-test',
    title: `Synthetic ${type}`,
    summary: 'Synthetic evidence-backed signal.',
    evidence: [{ evidenceType: 'test', summary: 'Synthetic C4 test evidence.', sourceRef, confidence: 1 }],
    sourceRefs: [sourceRef],
    confidence: 0.95,
    severity: priority >= 95 ? 'critical' : priority >= 85 ? 'high' : 'medium',
    priority,
    businessImpact: 'Synthetic test impact.',
    affectedEntities: [],
    recommendedFollowUp: 'Review synthetic evidence.',
    fingerprint,
    idempotencyKey: `signal:${fingerprint}`,
    status: 'new',
    firstDetectedAt: fixedNow,
    lastDetectedAt: fixedNow,
    correlation,
  }
}

function existingTaskFor(sourceSignal) {
  return {
    id: stableUuid('c4-existing-task', sourceSignal.id),
    taskType: 'investigate_signal',
    assignedAgent: 'operations-orchestrator',
    status: 'pending',
    priority: sourceSignal.priority,
    input: {},
    output: null,
    conciseRationale: 'Existing synthetic task.',
    parentTaskId: null,
    signalId: sourceSignal.id,
    experimentId: null,
    idempotencyKey: `existing-task:${sourceSignal.id}`,
    attempts: 0,
    maxAttempts: 3,
    retryAfter: null,
    createdAt: fixedNow,
    startedAt: null,
    completedAt: null,
    error: null,
    correlation: sourceSignal.correlation,
  }
}
