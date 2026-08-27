import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AGENT_REGISTRATIONS,
  ActionExecutionGuardError,
  ContractValidationError,
  InMemoryDurableWorkflowPort,
  InMemoryIdempotencyStore,
  LifecycleTransitionError,
  ModelExecutionDisabledError,
  OpenAiSpecialistAdapter,
  SENSOR_REGISTRATIONS,
  WORKFLOW_REGISTRATIONS,
  ServerOnlyAccessError,
  assertIntelligenceSignal,
  assertMetricSnapshot,
  assertServerOnlyControlPlaneAccess,
  childCorrelation,
  createAgentRun,
  createAgentTask,
  createApprovalRecord,
  createCorrelationContext,
  createMetricIdempotencyKey,
  createProposedAction,
  createUnknownMetric,
  evaluateActionPolicy,
  evaluateExperimentReadiness,
  executeApprovedAction,
  isRunStale,
  loadRuntimeConfiguration,
  resolveMembershipTruth,
  runIdempotently,
  transitionAction,
  transitionRun,
  transitionTask,
} from '../dist/index.js'

const fixedNow = '2026-08-25T12:00:00.000Z'

function operationalError(code = 'TEST_ERROR') {
  return {
    code,
    message: 'test failure',
    retryable: true,
    details: {},
    occurredAt: fixedNow,
  }
}

function legacyJwt(role) {
  const encode = (value) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role })}.signature`
}

test('runtime defaults are dry-run and mutation flags fail closed', () => {
  const configuration = loadRuntimeConfiguration({ AGENT_RUNTIME_ENV: 'test' })
  assert.equal(configuration.mode, 'dry_run')
  assert.equal(configuration.mutationsEnabled, false)
  assert.equal(configuration.model, null)

  assert.throws(
    () => loadRuntimeConfiguration({ AGENT_RUNTIME_ENV: 'test', AGENT_MUTATIONS_ENABLED: 'true' }),
    ContractValidationError,
  )
})

test('unknown and consequential actions require approval and cannot execute in Phase B', async () => {
  assert.deepEqual(
    evaluateActionPolicy('unknown.future_action'),
    {
      actionType: 'unknown.future_action',
      category: 'unknown',
      riskLevel: 'critical',
      approvalRequired: true,
      proposalAllowed: true,
      executionAvailableInPhaseB: false,
      reason: 'Unknown action types fail closed as critical and approval-required.',
      policyVersion: 'phase-b-v1',
    },
  )

  const correlation = createCorrelationContext()
  const proposed = createProposedAction({
    actionType: 'external.send_email',
    targetSystem: 'activecampaign',
    requestedByAgent: 'marketing-agent',
    payload: { draftId: 'draft-1' },
    conciseRationale: 'Send an approved lifecycle message.',
    idempotencyKey: 'action:email:draft-1',
    correlation,
    now: fixedNow,
  })
  assert.equal(proposed.approvalRequired, true)
  assert.equal(proposed.status, 'proposed')

  const fakeExecutor = {
    key: 'test-email-executor',
    actionType: 'external.send_email',
    async execute() {
      return { sent: true }
    },
  }

  await assert.rejects(() => executeApprovedAction(proposed, fakeExecutor), ActionExecutionGuardError)

  const awaiting = transitionAction(proposed, 'awaiting_approval', { now: fixedNow })
  assert.throws(() => transitionAction(awaiting, 'approved'), LifecycleTransitionError)

  const approval = createApprovalRecord({
    approvedBy: 'autumn',
    approvedAt: fixedNow,
    approvalContext: { authority: 'owner', channel: 'control-plane-review' },
  })
  const approved = transitionAction(awaiting, 'approved', { approval, now: fixedNow })
  assert.equal(approved.approval?.approvedBy, 'autumn')
  assert.throws(
    () => transitionAction(approved, 'executing', { executorKey: fakeExecutor.key }),
    LifecycleTransitionError,
  )
  await assert.rejects(
    () => executeApprovedAction(approved, fakeExecutor, { allowPhaseBInternalExecution: true }),
    ActionExecutionGuardError,
  )
})

test('safe internal action execution requires an explicitly injected capability', async () => {
  const action = createProposedAction({
    actionType: 'internal.calculate',
    targetSystem: 'agent-runtime',
    requestedByAgent: 'revenue-agent',
    payload: { left: 2, right: 3 },
    conciseRationale: 'Calculate an internal metric.',
    idempotencyKey: 'action:calculate:2:3',
    correlation: createCorrelationContext(),
    now: fixedNow,
  })
  const approved = transitionAction(action, 'approved', { now: fixedNow })
  const executor = {
    key: 'internal-calculator',
    actionType: 'internal.calculate',
    async execute({ payload }) {
      return { value: Number(payload.left) + Number(payload.right) }
    },
  }

  await assert.rejects(() => executeApprovedAction(approved, executor), ActionExecutionGuardError)
  const result = await executeApprovedAction(approved, executor, { allowPhaseBInternalExecution: true })
  assert.deepEqual(result, { value: 5 })
})

test('task and run lifecycles enforce valid transitions and retry limits', () => {
  const correlation = createCorrelationContext()
  const pending = createAgentTask({
    taskType: 'growth.analyze',
    assignedAgent: 'growth-agent',
    priority: 80,
    input: { period: 'weekly' },
    idempotencyKey: 'task:growth:2026-08-25',
    correlation,
    now: fixedNow,
  })
  assert.throws(() => transitionTask(pending, 'succeeded', { output: { ok: true } }), LifecycleTransitionError)
  const queued = transitionTask(pending, 'queued')
  const running = transitionTask(queued, 'running', { now: fixedNow })
  const succeeded = transitionTask(running, 'succeeded', {
    output: { findings: 2 },
    conciseRationale: 'Two material findings passed validation.',
    now: '2026-08-25T12:00:05.000Z',
  })
  assert.equal(succeeded.status, 'succeeded')
  assert.equal(succeeded.output?.findings, 2)

  const run = createAgentRun({
    agentName: 'growth-agent',
    workflowName: 'weekly-operating-review',
    runtimeVersion: 'phase-b-v1',
    input: { period: 'weekly' },
    maxAttempts: 2,
    staleAfter: '2026-08-25T12:05:00.000Z',
    idempotencyKey: 'run:growth:2026-08-25',
    correlation,
  })
  const active = transitionRun(run, 'running', { now: fixedNow })
  assert.equal(isRunStale(active, '2026-08-25T12:04:59.000Z'), false)
  assert.equal(isRunStale(active, '2026-08-25T12:05:00.000Z'), true)
  const stale = transitionRun(active, 'stale', {
    error: operationalError('STALE_RUN'),
    now: '2026-08-25T12:05:00.000Z',
  })
  const requeued = transitionRun(stale, 'queued')
  const retried = transitionRun(requeued, 'running')
  const failed = transitionRun(retried, 'failed', { error: operationalError() })
  assert.equal(failed.attempt, 2)
  assert.throws(() => transitionRun(failed, 'queued'), LifecycleTransitionError)
})

test('correlation IDs propagate through child work and durable workflow invocations', async () => {
  const parent = createCorrelationContext({ traceId: 'trace-1' })
  const cause = crypto.randomUUID()
  const child = childCorrelation(parent, cause)
  assert.equal(child.correlationId, parent.correlationId)
  assert.equal(child.causationId, cause)
  assert.equal(child.traceId, 'trace-1')

  const workflows = new InMemoryDurableWorkflowPort()
  workflows.register('daily-business-health', async (invocation) => ({
    observedCorrelationId: invocation.correlation.correlationId,
  }))
  const invocation = {
    workflowName: 'daily-business-health',
    workflowVersion: 'phase-b-v1',
    invocationId: crypto.randomUUID(),
    idempotencyKey: 'workflow:daily-business-health:2026-08-25',
    payload: { date: '2026-08-25' },
    requestedBy: 'cron-sensor',
    requestedAt: fixedNow,
    retryPolicy: {
      maxAttempts: 3,
      retryableCodes: ['TRANSIENT'],
      initialDelayMs: 1000,
      maximumDelayMs: 60000,
      backoffMultiplier: 2,
    },
    correlation: child,
  }
  const first = await workflows.start(invocation)
  const duplicate = await workflows.start(invocation)
  assert.equal(duplicate.workflowRunId, first.workflowRunId)
  assert.equal(first.correlation.correlationId, parent.correlationId)
  const snapshot = await workflows.get(first.workflowRunId)
  assert.equal(snapshot?.state, 'succeeded')
  assert.equal(snapshot?.result?.observedCorrelationId, parent.correlationId)
})

test('idempotency prevents repeated processing', async () => {
  const store = new InMemoryIdempotencyStore()
  let executions = 0
  const first = await runIdempotently(store, 'event:123', async () => {
    executions += 1
    return { accepted: true }
  })
  const second = await runIdempotently(store, 'event:123', async () => {
    executions += 1
    return { accepted: false }
  })
  assert.equal(executions, 1)
  assert.equal(first.duplicate, false)
  assert.equal(second.duplicate, true)
  assert.deepEqual(second.result, { accepted: true })
})

test('unknown metrics preserve null and experiments refuse premature conclusions', () => {
  const correlation = createCorrelationContext()
  const metric = createUnknownMetric({
    metricDate: '2026-08-25',
    metricName: 'revenue.mrr',
    domain: 'revenue',
    sourceSystem: 'outseta',
    reason: 'No billing-grade amount is available.',
    idempotencyKey: createMetricIdempotencyKey({
      metricDate: '2026-08-25',
      metricName: 'revenue.mrr',
      sourceSystem: 'outseta',
    }),
    correlation,
  })
  assert.equal(metric.value, null)
  assert.equal(metric.valueState, 'unknown')

  assert.throws(
    () => assertMetricSnapshot({ ...metric, value: 0 }),
    ContractValidationError,
  )

  const readiness = evaluateExperimentReadiness({
    id: crypto.randomUUID(),
    name: 'Free member upgrade prompt',
    status: 'running',
    primaryMetric: 'free_to_pro_rate',
    minimumSampleSize: 100,
    minimumDurationDays: 14,
    observedSampleSize: 12,
    observedDurationDays: 3,
    analysisState: 'insufficient_data',
    correlationId: correlation.correlationId,
  })
  assert.equal(readiness.mayConclude, false)
  assert.equal(readiness.missingSample, 88)
  assert.equal(readiness.missingDurationDays, 11)
})

test('signal validation requires evidence-safe confidence and correlation', () => {
  const correlation = createCorrelationContext()
  const signal = {
    id: crypto.randomUUID(),
    signalType: 'growth.signup_decline',
    domain: 'growth',
    producer: 'growth-agent',
    title: 'Free signups declined',
    summary: 'The normalized metric declined against the prior comparison window.',
    evidence: [
      {
        evidenceType: 'metric',
        summary: 'Daily free signup metric comparison.',
        sourceRef: { sourceSystem: 'business_metrics_daily', sourceType: 'metric', sourceId: 'metric-1' },
        confidence: 0.9,
      },
    ],
    sourceRefs: [{ sourceSystem: 'business_metrics_daily', sourceType: 'metric', sourceId: 'metric-1' }],
    confidence: 0.9,
    severity: 'high',
    priority: 90,
    businessImpact: 'Reduced top-of-funnel volume.',
    affectedEntities: [],
    recommendedFollowUp: 'Inspect acquisition and tracking completeness.',
    fingerprint: 'growth.signup_decline:2026-w35',
    idempotencyKey: 'signal:growth.signup_decline:2026-w35',
    status: 'new',
    firstDetectedAt: fixedNow,
    lastDetectedAt: fixedNow,
    correlation,
  }
  assert.doesNotThrow(() => assertIntelligenceSignal(signal))
  assert.throws(() => assertIntelligenceSignal({ ...signal, confidence: 1.2 }), ContractValidationError)
  assert.throws(
    () => assertIntelligenceSignal({ ...signal, lastDetectedAt: '2026-08-24T00:00:00.000Z' }),
    ContractValidationError,
  )
})

test('membership authority rejects ActiveCampaign ownership and surfaces plan conflicts', () => {
  const outseta = {
    sourceSystem: 'outseta',
    sourceRecordId: 'subscription-1',
    isAuthoritative: true,
    authorityRank: 100,
    membershipTier: 'free',
    membershipStatus: 'active',
    planUid: 'free-plan',
    subscriptionUid: 'subscription-1',
    mrr: null,
    arr: null,
    lifetimeRevenue: null,
    revenueState: 'unknown',
    observedAt: fixedNow,
  }
  const activeCampaign = {
    ...outseta,
    sourceSystem: 'activecampaign',
    sourceRecordId: 'contact-1',
    isAuthoritative: false,
    authorityRank: 0,
    membershipTier: 'pro',
    planUid: 'pro-plan',
  }
  const resolution = resolveMembershipTruth([outseta, activeCampaign])
  assert.equal(resolution.authoritative?.sourceSystem, 'outseta')
  assert.equal(resolution.paid, false)
  assert.equal(resolution.state, 'conflict')
  assert.ok(resolution.conflicts.some((conflict) => conflict.conflictType === 'tier_mismatch'))

  assert.throws(
    () => resolveMembershipTruth([{ ...activeCampaign, isAuthoritative: true, authorityRank: 100 }]),
    ContractValidationError,
  )

  const marketingOnly = resolveMembershipTruth([activeCampaign])
  assert.equal(marketingOnly.paid, null)
  assert.equal(marketingOnly.state, 'conflict')
})

test('Supabase control-plane access rejects browser and anon credentials', () => {
  const url = 'https://example.supabase.co'
  assert.throws(
    () => assertServerOnlyControlPlaneAccess({ url, serviceRoleKey: legacyJwt('service_role'), browserEnvironment: true }),
    ServerOnlyAccessError,
  )
  assert.throws(
    () => assertServerOnlyControlPlaneAccess({ url, serviceRoleKey: legacyJwt('anon'), browserEnvironment: false }),
    ServerOnlyAccessError,
  )
  assert.throws(
    () => assertServerOnlyControlPlaneAccess({ url, serviceRoleKey: 'sb_publishable_test', browserEnvironment: false }),
    ServerOnlyAccessError,
  )
  assert.doesNotThrow(() =>
    assertServerOnlyControlPlaneAccess({ url, serviceRoleKey: legacyJwt('service_role'), browserEnvironment: false }),
  )
  assert.doesNotThrow(() =>
    assertServerOnlyControlPlaneAccess({ url, serviceRoleKey: 'sb_secret_test', browserEnvironment: false }),
  )
})

test('agent and sensor registrations are explicit, disabled, and non-mutating by default', () => {
  assert.equal(AGENT_REGISTRATIONS.length, 11)
  assert.ok(AGENT_REGISTRATIONS.every((registration) => registration.enabledByDefault === false))
  assert.ok(AGENT_REGISTRATIONS.every((registration) => registration.riskBoundary !== 'read_write'))
  assert.equal(SENSOR_REGISTRATIONS.length, 6)
  assert.equal(WORKFLOW_REGISTRATIONS.length, 4)
  assert.ok(WORKFLOW_REGISTRATIONS.every((registration) => registration.status === 'implemented'))
  assert.ok(WORKFLOW_REGISTRATIONS.every((registration) => registration.enabledByDefault === false))
  assert.equal(
    SENSOR_REGISTRATIONS.find((registration) => registration.name === 'conversion-events-ledger')?.targetOutput,
    'normalized_metrics',
  )
})

test('OpenAI adapter refuses execution when model runtime is disabled', async () => {
  const registration = AGENT_REGISTRATIONS[0]
  assert.ok(registration)
  const adapter = new OpenAiSpecialistAdapter({
    registration,
    model: {
      provider: 'openai',
      model: 'test-model',
      maxTurns: 2,
      modelExecutionEnabled: false,
      persistPrivateReasoning: false,
    },
  })
  await assert.rejects(
    () =>
      adapter.run({
        taskId: crypto.randomUUID(),
        objective: 'Test disabled execution.',
        payload: {},
        evidence: [],
        sourceRefs: [],
        experiment: null,
        correlation: createCorrelationContext(),
      }),
    ModelExecutionDisabledError,
  )
})
