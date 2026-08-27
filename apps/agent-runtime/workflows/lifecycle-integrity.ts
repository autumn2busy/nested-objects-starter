import { FatalError, RetryableError, getStepMetadata, getWorkflowMetadata } from '@workflow/core'

import type {
  CorrelationContext,
  IntelligenceSignal,
  OperationalError,
  ToolCallSummary,
} from '../src/contracts.js'
import type { PreviewEvaluationRequest } from '../src/http/preview-contract.js'
import type {
  DurableClaimDisposition,
  DurableRunClaim,
  DurableRunSnapshot,
} from '../src/persistence/durable-workflow-store.js'
import { resolveDurableStepContext } from '../src/runtime/durable-step-context.js'
import type { StagingDestinationBinding } from '../src/runtime/staging-destination.js'
import { runPhaseCCore } from '../src/workflows/phase-c-core.js'

export const LIFECYCLE_INTEGRITY_WORKFLOW_NAME = 'lifecycle-integrity-check'
export const LIFECYCLE_INTEGRITY_WORKFLOW_VERSION = 'phase-c3-v1'
const RUN_LEASE_SECONDS = 300
const STEP_LEASE_SECONDS = 180
const MAX_RUN_ATTEMPTS = 3
const MAX_STEP_ATTEMPTS = 3

export interface LifecycleIntegrityStagingWorkflowInput {
  fixture: PreviewEvaluationRequest
  binding: StagingDestinationBinding
  idempotencyKey: string
  requestedAt: string
  correlation: CorrelationContext
}

export interface LifecycleIntegrityStagingWorkflowOutput {
  state: 'succeeded' | 'reused' | 'duplicate_in_progress' | 'exhausted'
  agentRunId: string
  durableWorkflowId: string
  durableWorkflowRunId: string | null
  signalCount: number
  persistedSignalCount: number
  metricCount: number
  verificationStatus: 'pending' | 'verified' | 'failed'
  correlationId: string
}

interface EvaluationStepOutput {
  disposition: DurableClaimDisposition
  signals: IntelligenceSignal[]
  signalCount: number
  metricCount: number
  projectionCount: number
  unmatchedConversionEventCount: number
  duplicateConversionEventCount: number
  toolCalls: ToolCallSummary[]
}

interface PersistenceStepOutput {
  disposition: DurableClaimDisposition
  persistedSignalCount: number
}

export async function lifecycleIntegrityStagingWorkflow(
  input: LifecycleIntegrityStagingWorkflowInput,
): Promise<LifecycleIntegrityStagingWorkflowOutput> {
  'use workflow'

  const { workflowRunId } = getWorkflowMetadata()
  const claim = await claimRunStep(input, workflowRunId)
  if (claim.disposition !== 'claimed') return summarizeExistingRun(claim, input.correlation)

  try {
    const evaluation = await evaluateLifecycleIntegrityStep(input, claim.run.runId)
    if (evaluation.disposition === 'busy') return inProgressOutput(claim.run, input.correlation)
    if (evaluation.disposition === 'exhausted') return exhaustedOutput(claim.run, input.correlation)

    const persistence = await persistLifecycleSignalsStep(
      input,
      claim.run.runId,
      evaluation.signals,
    )
    if (persistence.disposition === 'busy') return inProgressOutput(claim.run, input.correlation)
    if (persistence.disposition === 'exhausted') return exhaustedOutput(claim.run, input.correlation)

    const output = successfulOutput(claim.run, input.correlation, evaluation, persistence)
    const completed = await completeRunStep(input, claim.run.runId, output, evaluation.toolCalls)
    return {
      ...output,
      state: completed.status === 'succeeded' ? 'succeeded' : output.state,
      durableWorkflowRunId: completed.workflowRunId,
      verificationStatus: completed.verificationStatus,
    }
  } catch (error) {
    await recordRunFailureStep(input, claim.run.runId, toOperationalError(error))
    throw error
  }
}

export async function claimRunStep(
  input: LifecycleIntegrityStagingWorkflowInput,
  workflowRunId: string,
): Promise<DurableRunClaim> {
  'use step'

  const context = await resolveDurableStepContext(input.binding)
  return context.store.claimRun({
    agentName: 'operations-orchestrator',
    workflowName: LIFECYCLE_INTEGRITY_WORKFLOW_NAME,
    workflowVersion: LIFECYCLE_INTEGRITY_WORKFLOW_VERSION,
    workflowRunId,
    runtimeVersion: context.runtimeVersion,
    input: input.fixture as unknown as Record<string, unknown>,
    idempotencyKey: input.idempotencyKey,
    maxAttempts: MAX_RUN_ATTEMPTS,
    leaseSeconds: RUN_LEASE_SECONDS,
    requestedAt: input.requestedAt,
    correlationId: input.correlation.correlationId,
    causationId: input.correlation.causationId,
    traceId: input.correlation.traceId,
    binding: context.binding,
  })
}

export async function evaluateLifecycleIntegrityStep(
  input: LifecycleIntegrityStagingWorkflowInput,
  agentRunId: string,
): Promise<EvaluationStepOutput> {
  'use step'

  const metadata = getStepMetadata()
  const context = await resolveDurableStepContext(input.binding)
  const stepKey = 'evaluate-lifecycle-integrity'
  const claim = await context.store.claimStep({
    runId: agentRunId,
    stepKey,
    workflowStepId: metadata.stepId,
    input: fixtureSummary(input.fixture),
    maxAttempts: MAX_STEP_ATTEMPTS,
    leaseSeconds: STEP_LEASE_SECONDS,
    correlationId: input.correlation.correlationId,
    causationId: input.correlation.causationId,
    traceId: input.correlation.traceId,
  })
  if (claim.disposition === 'reused') return evaluationFromStoredStep(claim.step.output)
  if (claim.disposition !== 'claimed') return emptyEvaluation(claim.disposition)
  if (!claim.step.claimToken) throw new FatalError('The claimed evaluation step has no claim token')

  const startedAt = new Date().toISOString()
  try {
    const result = runPhaseCCore({
      metricDate: input.fixture.metricDate,
      profiles: input.fixture.profiles,
      conversionEvents: input.fixture.conversionEvents,
      activeCampaignContacts: input.fixture.activeCampaignContacts,
      marketingConfig: input.fixture.marketingConfig,
      productAccessByMemberId: input.fixture.productAccessByMemberId,
      activeCampaignMirrorByMemberId: input.fixture.activeCampaignMirrorByMemberId,
      correlation: input.correlation,
      sourceRunId: agentRunId,
    })
    if (result.signals.length > 50) throw new FatalError('Synthetic lifecycle workflow produced more than 50 signals')

    const completedAt = new Date().toISOString()
    const toolCalls: ToolCallSummary[] = [{
      toolName: 'deterministic.phase-c-core',
      callId: metadata.stepId,
      startedAt,
      completedAt,
      status: 'succeeded',
      inputSummary: fixtureSummary(input.fixture),
      outputSummary: {
        projectionCount: result.projections.length,
        metricCount: result.metrics.length,
        signalCount: result.signals.length,
      },
      errorCode: null,
    }]
    const output: EvaluationStepOutput = {
      disposition: 'claimed',
      signals: result.signals,
      signalCount: result.signals.length,
      metricCount: result.metrics.length,
      projectionCount: result.projections.length,
      unmatchedConversionEventCount: result.unmatchedConversionEventIds.length,
      duplicateConversionEventCount: result.duplicateConversionEventIds.length,
      toolCalls,
    }
    await context.store.completeStep({
      runId: agentRunId,
      stepKey,
      claimToken: claim.step.claimToken,
      output: output as unknown as Record<string, unknown>,
      toolCalls,
      correlationId: input.correlation.correlationId,
      causationId: input.correlation.causationId,
      traceId: input.correlation.traceId,
    })
    return output
  } catch (error) {
    const operationalError = toOperationalError(error)
    await context.store.failStep({
      runId: agentRunId,
      stepKey,
      claimToken: claim.step.claimToken,
      error: operationalError,
      retryAfter: retryAfterForAttempt(metadata.attempt),
      correlationId: input.correlation.correlationId,
      causationId: input.correlation.causationId,
      traceId: input.correlation.traceId,
    })
    throw workflowStepError(error, metadata.attempt)
  }
}

export async function persistLifecycleSignalsStep(
  input: LifecycleIntegrityStagingWorkflowInput,
  agentRunId: string,
  signals: IntelligenceSignal[],
): Promise<PersistenceStepOutput> {
  'use step'

  const metadata = getStepMetadata()
  const context = await resolveDurableStepContext(input.binding)
  const stepKey = 'persist-lifecycle-signals'
  const claim = await context.store.claimStep({
    runId: agentRunId,
    stepKey,
    workflowStepId: metadata.stepId,
    input: { signalCount: signals.length },
    maxAttempts: MAX_STEP_ATTEMPTS,
    leaseSeconds: STEP_LEASE_SECONDS,
    correlationId: input.correlation.correlationId,
    causationId: input.correlation.causationId,
    traceId: input.correlation.traceId,
  })
  if (claim.disposition === 'reused') {
    return persistenceFromStoredStep(claim.step.output)
  }
  if (claim.disposition !== 'claimed') {
    return { disposition: claim.disposition, persistedSignalCount: 0 }
  }
  if (!claim.step.claimToken) throw new FatalError('The claimed persistence step has no claim token')

  try {
    const persistedSignalCount = await context.store.persistSignals(agentRunId, signals)
    const output: PersistenceStepOutput = { disposition: 'claimed', persistedSignalCount }
    await context.store.completeStep({
      runId: agentRunId,
      stepKey,
      claimToken: claim.step.claimToken,
      output: output as unknown as Record<string, unknown>,
      toolCalls: [],
      correlationId: input.correlation.correlationId,
      causationId: input.correlation.causationId,
      traceId: input.correlation.traceId,
    })
    return output
  } catch (error) {
    await context.store.failStep({
      runId: agentRunId,
      stepKey,
      claimToken: claim.step.claimToken,
      error: toOperationalError(error),
      retryAfter: retryAfterForAttempt(metadata.attempt),
      correlationId: input.correlation.correlationId,
      causationId: input.correlation.causationId,
      traceId: input.correlation.traceId,
    })
    throw workflowStepError(error, metadata.attempt)
  }
}

export async function completeRunStep(
  input: LifecycleIntegrityStagingWorkflowInput,
  agentRunId: string,
  output: LifecycleIntegrityStagingWorkflowOutput,
  toolCalls: ToolCallSummary[],
): Promise<DurableRunSnapshot> {
  'use step'

  const metadata = getStepMetadata()
  const context = await resolveDurableStepContext(input.binding)
  const stepKey = 'verify-and-complete-run'
  const claim = await context.store.claimStep({
    runId: agentRunId,
    stepKey,
    workflowStepId: metadata.stepId,
    input: {
      signalCount: output.signalCount,
      persistedSignalCount: output.persistedSignalCount,
    },
    maxAttempts: MAX_STEP_ATTEMPTS,
    leaseSeconds: STEP_LEASE_SECONDS,
    correlationId: input.correlation.correlationId,
    causationId: input.correlation.causationId,
    traceId: input.correlation.traceId,
  })
  if (claim.disposition === 'busy') throw new RetryableError('Completion claim is busy', { retryAfter: '2s' })
  if (claim.disposition === 'exhausted') throw new FatalError('Completion claim attempts are exhausted')
  if (output.signalCount !== output.persistedSignalCount) {
    throw new FatalError('Persisted signal verification count does not match the evaluated signal count')
  }

  if (claim.disposition === 'claimed') {
    if (!claim.step.claimToken) throw new FatalError('The claimed completion step has no claim token')
    await context.store.completeStep({
      runId: agentRunId,
      stepKey,
      claimToken: claim.step.claimToken,
      output: { verified: true },
      toolCalls: [],
      correlationId: input.correlation.correlationId,
      causationId: input.correlation.causationId,
      traceId: input.correlation.traceId,
    })
  }

  return context.store.completeRun({
    runId: agentRunId,
    output: output as unknown as Record<string, unknown>,
    toolCalls,
    inputTokens: null,
    outputTokens: null,
    estimatedCost: null,
    verificationSummary: {
      status: 'verified',
      signalCount: output.signalCount,
      persistedSignalCount: output.persistedSignalCount,
    },
    correlationId: input.correlation.correlationId,
    causationId: input.correlation.causationId,
    traceId: input.correlation.traceId,
  })
}

export async function recordRunFailureStep(
  input: LifecycleIntegrityStagingWorkflowInput,
  agentRunId: string,
  error: OperationalError,
): Promise<DurableRunSnapshot> {
  'use step'

  const metadata = getStepMetadata()
  const context = await resolveDurableStepContext(input.binding)
  const stepKey = 'record-run-failure'
  const claim = await context.store.claimStep({
    runId: agentRunId,
    stepKey,
    workflowStepId: metadata.stepId,
    input: { errorCode: error.code },
    maxAttempts: MAX_STEP_ATTEMPTS,
    leaseSeconds: STEP_LEASE_SECONDS,
    correlationId: input.correlation.correlationId,
    causationId: input.correlation.causationId,
    traceId: input.correlation.traceId,
  })
  if (claim.disposition === 'busy') throw new RetryableError('Failure-record claim is busy', { retryAfter: '2s' })
  if (claim.disposition === 'exhausted') throw new FatalError('Failure-record claim attempts are exhausted')
  if (claim.disposition === 'claimed') {
    if (!claim.step.claimToken) throw new FatalError('The claimed failure-record step has no claim token')
    await context.store.completeStep({
      runId: agentRunId,
      stepKey,
      claimToken: claim.step.claimToken,
      output: { recorded: true, errorCode: error.code },
      toolCalls: [],
      correlationId: input.correlation.correlationId,
      causationId: input.correlation.causationId,
      traceId: input.correlation.traceId,
    })
  }
  return context.store.failRun({
    runId: agentRunId,
    error,
    retryAfter: null,
    correlationId: input.correlation.correlationId,
    causationId: input.correlation.causationId,
    traceId: input.correlation.traceId,
  })
}

function summarizeExistingRun(
  claim: DurableRunClaim,
  correlation: CorrelationContext,
): LifecycleIntegrityStagingWorkflowOutput {
  if (claim.disposition === 'reused' && claim.run.output) {
    const output = claim.run.output as unknown as LifecycleIntegrityStagingWorkflowOutput
    return {
      ...output,
      state: 'reused',
      durableWorkflowRunId: claim.run.workflowRunId,
      verificationStatus: claim.run.verificationStatus,
    }
  }
  if (claim.disposition === 'exhausted') return exhaustedOutput(claim.run, correlation)
  return inProgressOutput(claim.run, correlation)
}

function successfulOutput(
  run: DurableRunSnapshot,
  correlation: CorrelationContext,
  evaluation: EvaluationStepOutput,
  persistence: PersistenceStepOutput,
): LifecycleIntegrityStagingWorkflowOutput {
  return {
    state: 'succeeded',
    agentRunId: run.runId,
    durableWorkflowId: run.durableWorkflowId,
    durableWorkflowRunId: run.workflowRunId,
    signalCount: evaluation.signalCount,
    persistedSignalCount: persistence.persistedSignalCount,
    metricCount: evaluation.metricCount,
    verificationStatus: 'verified',
    correlationId: correlation.correlationId,
  }
}

function inProgressOutput(
  run: DurableRunSnapshot,
  correlation: CorrelationContext,
): LifecycleIntegrityStagingWorkflowOutput {
  return {
    state: 'duplicate_in_progress',
    agentRunId: run.runId,
    durableWorkflowId: run.durableWorkflowId,
    durableWorkflowRunId: run.workflowRunId,
    signalCount: 0,
    persistedSignalCount: 0,
    metricCount: 0,
    verificationStatus: run.verificationStatus,
    correlationId: correlation.correlationId,
  }
}

function exhaustedOutput(
  run: DurableRunSnapshot,
  correlation: CorrelationContext,
): LifecycleIntegrityStagingWorkflowOutput {
  return {
    ...inProgressOutput(run, correlation),
    state: 'exhausted',
    verificationStatus: 'failed',
  }
}

function emptyEvaluation(disposition: 'busy' | 'exhausted'): EvaluationStepOutput {
  return {
    disposition,
    signals: [],
    signalCount: 0,
    metricCount: 0,
    projectionCount: 0,
    unmatchedConversionEventCount: 0,
    duplicateConversionEventCount: 0,
    toolCalls: [],
  }
}

function evaluationFromStoredStep(value: Record<string, unknown> | null): EvaluationStepOutput {
  if (!value) throw new FatalError('Completed evaluation step has no reusable output')
  return { ...(value as unknown as EvaluationStepOutput), disposition: 'reused' }
}

function persistenceFromStoredStep(value: Record<string, unknown> | null): PersistenceStepOutput {
  if (!value) throw new FatalError('Completed persistence step has no reusable output')
  return { ...(value as unknown as PersistenceStepOutput), disposition: 'reused' }
}

function fixtureSummary(fixture: PreviewEvaluationRequest): Record<string, unknown> {
  return {
    metricDate: fixture.metricDate,
    profileCount: fixture.profiles.length,
    conversionEventCount: fixture.conversionEvents.length,
    activeCampaignContactCount: fixture.activeCampaignContacts.length,
    activeCampaignAssetCount: fixture.activeCampaignAssets.length,
  }
}

function retryAfterForAttempt(attempt: number): string {
  return new Date(Date.now() + Math.min(30, Math.max(1, attempt * attempt * 2)) * 1000).toISOString()
}

function workflowStepError(error: unknown, attempt: number): Error {
  if (error instanceof FatalError) return error
  const code = errorCode(error)
  if (
    code === 'STAGING_DESTINATION_BINDING_FAILED' ||
    code === 'DURABLE_RUNTIME_CONFIGURATION_FAILED' ||
    code === 'DURABLE_STEP_CONTEXT_FAILED'
  ) {
    return new FatalError('Durable workflow safety configuration failed closed')
  }
  return new RetryableError('Durable workflow step failed and may be retried safely', {
    retryAfter: Math.min(30_000, Math.max(1_000, attempt * attempt * 2_000)),
  })
}

function toOperationalError(error: unknown): OperationalError {
  return {
    code: errorCode(error),
    message: safeErrorMessage(error),
    retryable: !(error instanceof FatalError),
    details: {},
    occurredAt: new Date().toISOString(),
  }
}

function errorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) return String(error.code)
  return 'DURABLE_WORKFLOW_STEP_FAILED'
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof FatalError) return error.message.slice(0, 500)
  return 'A bounded durable workflow operation failed.'
}
