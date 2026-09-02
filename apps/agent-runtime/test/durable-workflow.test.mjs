import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InMemoryDurableWorkflowStore,
  STAGING_DESTINATION_POLICY,
  StagingDestinationBindingError,
  assertReviewedStagingDestination,
  createStagingDestinationFingerprint,
  loadDurableRuntimeConfiguration,
} from '../dist/index.js'

const projectRef = 'syntheticstaging318'
const hostname = `${projectRef}.supabase.co`
const policy = {
  version: 'phase-c3-test',
  bindingKey: 'phase-c3-test-binding',
  reviewedProjectRefs: [projectRef],
  deniedProjectRefs: ['lzzghrjjsyzlvofpidis'],
}
const binding = {
  bindingKey: policy.bindingKey,
  policyVersion: policy.version,
  projectRef,
  hostname,
  destinationFingerprint: createStagingDestinationFingerprint({
    policyVersion: policy.version,
    projectRef,
    hostname,
  }),
}
const correlationId = '31800000-0000-5000-8000-000000000318'

test('committed staging policy denies Production and unreviewed runtime destinations', () => {
  assert.deepEqual(STAGING_DESTINATION_POLICY.reviewedProjectRefs, ['wqstirwszdbsygstnvbn'])
  assert.throws(
    () => assertReviewedStagingDestination({
      supabaseUrl: 'https://lzzghrjjsyzlvofpidis.supabase.co',
      configuredProjectRef: 'lzzghrjjsyzlvofpidis',
      runtimeEnvironment: 'preview',
      vercelEnvironment: 'preview',
    }),
    StagingDestinationBindingError,
  )
  assert.throws(
    () => assertReviewedStagingDestination({
      supabaseUrl: `https://${projectRef}.supabase.co`,
      configuredProjectRef: projectRef,
      runtimeEnvironment: 'preview',
      vercelEnvironment: 'preview',
    }),
    StagingDestinationBindingError,
  )
})

test('committed staging binding accepts the verified project only outside Production', () => {
  const input = {
    supabaseUrl: 'https://wqstirwszdbsygstnvbn.supabase.co',
    configuredProjectRef: 'wqstirwszdbsygstnvbn',
    runtimeEnvironment: 'preview',
    vercelEnvironment: 'preview',
  }
  assert.equal(
    assertReviewedStagingDestination(input).destinationFingerprint,
    'be8e4a36f85fbecf5109502e9acfc0830a4d4258a25c518cfdbf700d8b8f7954',
  )
  assert.throws(
    () => assertReviewedStagingDestination({ ...input, vercelEnvironment: 'production' }),
    StagingDestinationBindingError,
  )
  assert.throws(
    () => assertReviewedStagingDestination({ ...input, runtimeEnvironment: 'production' }),
    StagingDestinationBindingError,
  )
  assert.throws(
    () => assertReviewedStagingDestination({ ...input, configuredProjectRef: projectRef }),
    StagingDestinationBindingError,
  )
})

test('durable configuration accepts only a matching code-reviewed staging binding', () => {
  const configuration = loadDurableRuntimeConfiguration({
    AGENT_RUNTIME_ENV: 'preview',
    AGENT_RUNTIME_MODE: 'dry_run',
    AGENT_MUTATIONS_ENABLED: 'false',
    AGENT_MODEL_EXECUTION_ENABLED: 'false',
    AGENT_WORKFLOW_PROVIDER: 'vercel_workflow',
    AGENT_RUNTIME_VERSION: 'phase-c3-v1',
    AGENT_DURABLE_PERSISTENCE_ENABLED: 'true',
    AGENT_DURABLE_SYNTHETIC_ONLY: 'true',
    AGENT_STAGING_WORKFLOW_TOKEN: 'x'.repeat(32),
    AGENT_STAGING_PROJECT_REF: projectRef,
    SUPABASE_URL: `https://${hostname}`,
    SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_test_only',
    VERCEL_ENV: 'preview',
  }, policy)
  assert.deepEqual(configuration.binding, binding)
  assert.equal(configuration.persistenceEnabled, true)

  assert.throws(() => loadDurableRuntimeConfiguration({
    AGENT_RUNTIME_ENV: 'preview',
    AGENT_WORKFLOW_PROVIDER: 'vercel_workflow',
    AGENT_DURABLE_PERSISTENCE_ENABLED: 'true',
    AGENT_STAGING_WORKFLOW_TOKEN: 'x'.repeat(32),
    AGENT_STAGING_PROJECT_REF: projectRef,
    SUPABASE_URL: `https://differentstaging318.supabase.co`,
    SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_test_only',
  }, policy))
})

test('duplicate run deliveries converge and completed work is never reset', async () => {
  let currentTime = Date.parse('2026-08-27T12:00:00.000Z')
  const store = new InMemoryDurableWorkflowStore(binding, () => new Date(currentTime))
  const input = runInput({ fixture: 'synthetic' })

  const first = await store.claimRun(input)
  const duplicate = await store.claimRun({ ...input, workflowRunId: 'wrun_duplicate' })
  assert.equal(first.disposition, 'claimed')
  assert.equal(duplicate.disposition, 'busy')
  assert.equal(duplicate.run.runId, first.run.runId)

  const completed = await store.completeRun({
    runId: first.run.runId,
    output: { signalCount: 2, persistedSignalCount: 2 },
    toolCalls: [],
    inputTokens: null,
    outputTokens: null,
    estimatedCost: null,
    verificationSummary: { status: 'verified' },
    correlationId,
    causationId: null,
    traceId: 'trace-c3-test',
  })
  assert.equal(completed.status, 'succeeded')

  currentTime += 10_000
  const deliveredAfterCompletion = await store.claimRun({ ...input, workflowRunId: 'wrun_after_completion' })
  assert.equal(deliveredAfterCompletion.disposition, 'reused')
  assert.equal(deliveredAfterCompletion.run.runId, first.run.runId)
  assert.equal(deliveredAfterCompletion.run.attempt, 1)
  assert.deepEqual(deliveredAfterCompletion.run.output, { signalCount: 2, persistedSignalCount: 2 })

  await assert.rejects(
    () => store.claimRun({ ...input, input: { fixture: 'different' } }),
    /different input payload/,
  )
})

test('failed and stale work resumes within bounds while completed steps are reused', async () => {
  let currentTime = Date.parse('2026-08-27T13:00:00.000Z')
  const store = new InMemoryDurableWorkflowStore(binding, () => new Date(currentTime))
  const run = await store.claimRun(runInput({ fixture: 'resume' }))
  const stepInput = {
    runId: run.run.runId,
    stepKey: 'bounded-step',
    workflowStepId: 'step_first',
    input: { count: 1 },
    maxAttempts: 3,
    leaseSeconds: 30,
    correlationId,
    causationId: null,
    traceId: 'trace-c3-test',
  }
  const firstStep = await store.claimStep(stepInput)
  await store.failStep({
    runId: run.run.runId,
    stepKey: stepInput.stepKey,
    claimToken: firstStep.step.claimToken,
    error: operationalError('TRANSIENT'),
    retryAfter: new Date(currentTime + 2_000).toISOString(),
    correlationId,
    causationId: null,
    traceId: 'trace-c3-test',
  })
  const earlyRetry = await store.claimStep({ ...stepInput, workflowStepId: 'step_retry_too_early' })
  assert.equal(earlyRetry.disposition, 'busy')
  currentTime += 2_000
  const retry = await store.claimStep({ ...stepInput, workflowStepId: 'step_retry' })
  assert.equal(retry.disposition, 'claimed')
  assert.equal(retry.step.attempt, 2)
  await store.completeStep({
    runId: run.run.runId,
    stepKey: stepInput.stepKey,
    claimToken: retry.step.claimToken,
    output: { value: 7 },
    toolCalls: [],
    correlationId,
    causationId: null,
    traceId: 'trace-c3-test',
  })
  const resumed = await store.claimStep({ ...stepInput, workflowStepId: 'step_resume' })
  assert.equal(resumed.disposition, 'reused')
  assert.deepEqual(resumed.step.output, { value: 7 })
  assert.equal(resumed.step.attempt, 2)

  const staleRun = await store.claimRun(runInput({ fixture: 'stale' }, 'phase-c3:test:stale'))
  currentTime += 31_000
  assert.equal(await store.markStaleRuns(10), 1)
  const reclaimed = await store.claimRun(runInput({ fixture: 'stale' }, 'phase-c3:test:stale'))
  assert.equal(reclaimed.disposition, 'claimed')
  assert.equal(reclaimed.run.runId, staleRun.run.runId)
  assert.equal(reclaimed.run.attempt, 2)
})

function runInput(input, idempotencyKey = 'phase-c3:test:duplicate') {
  return {
    agentName: 'operations-orchestrator',
    workflowName: 'lifecycle-integrity-check',
    workflowVersion: 'phase-c3-v1',
    workflowRunId: 'wrun_first',
    runtimeVersion: 'phase-c3-v1',
    input,
    idempotencyKey,
    maxAttempts: 3,
    leaseSeconds: 30,
    requestedAt: '2026-08-27T12:00:00.000Z',
    correlationId,
    causationId: null,
    traceId: 'trace-c3-test',
    binding,
  }
}

function operationalError(code) {
  return {
    code,
    message: 'Synthetic transient failure.',
    retryable: true,
    details: {},
    occurredAt: '2026-08-27T13:00:00.000Z',
  }
}
