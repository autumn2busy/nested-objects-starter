import { FatalError, RetryableError, getStepMetadata, getWorkflowMetadata } from '@workflow/core'

import type {
  AgentTask,
  CorrelationContext,
  ExperimentReference,
  IntelligenceSignal,
  MetricSnapshot,
  OperationalError,
  ProposedAction,
} from '../src/contracts.js'
import type { OperationsOrchestratorSpecialistInputs } from '../src/agents/operations-orchestrator.js'
import {
  runOperationsOrchestrator,
  type OperationsOrchestratorOutput,
} from '../src/agents/operations-orchestrator.js'
import type { IndustryResearchObservation } from '../src/agents/industry-intelligence-agent.js'
import type {
  OperatingReviewRecord,
  OperatingWorkflowArtifactBatch,
  OperatingWorkflowName,
  OperatingWorkflowPersistedCounts,
} from '../src/persistence/operating-workflow-store.js'
import type {
  DurableClaimDisposition,
  DurableRunClaim,
  DurableRunSnapshot,
} from '../src/persistence/durable-workflow-store.js'
import { resolveOperatingWorkflowContext } from '../src/runtime/operating-workflow-context.js'
import type { StagingDestinationBinding } from '../src/runtime/staging-destination.js'
import { stableUuid } from '../src/stable-id.js'

export const CONVERSION_REVIEW_WORKFLOW_NAME = 'conversion_review'
export const DAILY_BUSINESS_HEALTH_WORKFLOW_NAME = 'daily_business_health'
export const WEEKLY_OPERATING_REVIEW_WORKFLOW_NAME = 'weekly_operating_review'
export const OPERATING_WORKFLOW_VERSION = 'phase-c5-v1'
const MAX_ATTEMPTS = 3
const RUN_LEASE_SECONDS = 300
const STEP_LEASE_SECONDS = 180

export interface SourceHealthObservation {
  sourceId: string
  status: 'healthy' | 'degraded' | 'failed'
  lastObservedAt: string | null
  staleAfterHours: number
  collectorErrorCode: string | null
}

export interface OperatingReviewFixture {
  reviewDate: string
  metrics: MetricSnapshot[]
  lifecycleSignals: IntelligenceSignal[]
  sourceHealth: SourceHealthObservation[]
  industryObservations: IndustryResearchObservation[]
  persistedSignals: IntelligenceSignal[]
  experiments: ExperimentReference[]
  tasks: AgentTask[]
  priorActions: ProposedAction[]
  specialists: OperationsOrchestratorSpecialistInputs
}

export interface OperatingReviewWorkflowInput {
  fixture: OperatingReviewFixture
  binding: StagingDestinationBinding
  idempotencyKey: string
  requestedAt: string
  correlation: CorrelationContext
}

export interface OperatingWorkflowOutput {
  state: 'succeeded' | 'reused' | 'duplicate_in_progress' | 'exhausted'
  workflowName: OperatingWorkflowName
  workflowVersion: typeof OPERATING_WORKFLOW_VERSION
  agentRunId: string
  durableWorkflowRunId: string | null
  executiveSummary: string
  quiet: boolean
  notificationRequired: boolean
  priorityCount: number
  priorities: Array<Record<string, unknown>>
  autumnDecisions: Array<Record<string, unknown>>
  artifactCounts: OperatingWorkflowPersistedCounts | null
  verificationStatus: 'pending' | 'verified' | 'failed'
  correlationId: string
}

interface OperatingWorkflowEvaluation {
  disposition: DurableClaimDisposition
  orchestrator: OperationsOrchestratorOutput | null
  batch: OperatingWorkflowArtifactBatch | null
  output: OperatingWorkflowOutput
}

export async function conversionReviewWorkflow(
  input: OperatingReviewWorkflowInput,
): Promise<OperatingWorkflowOutput> {
  'use workflow'

  return runOperatingWorkflow(input, CONVERSION_REVIEW_WORKFLOW_NAME, getWorkflowMetadata().workflowRunId)
}

export async function dailyBusinessHealthWorkflow(
  input: OperatingReviewWorkflowInput,
): Promise<OperatingWorkflowOutput> {
  'use workflow'

  return runOperatingWorkflow(input, DAILY_BUSINESS_HEALTH_WORKFLOW_NAME, getWorkflowMetadata().workflowRunId)
}

export async function weeklyOperatingReviewWorkflow(
  input: OperatingReviewWorkflowInput,
): Promise<OperatingWorkflowOutput> {
  'use workflow'

  return runOperatingWorkflow(input, WEEKLY_OPERATING_REVIEW_WORKFLOW_NAME, getWorkflowMetadata().workflowRunId)
}

async function runOperatingWorkflow(
  input: OperatingReviewWorkflowInput,
  workflowName: OperatingWorkflowName,
  workflowRunId: string,
): Promise<OperatingWorkflowOutput> {
  const claim = await claimOperatingRunStep(input, workflowName, workflowRunId)
  if (claim.disposition !== 'claimed') return summarizeExistingRun(claim, workflowName, input.correlation)

  try {
    const evaluation = await evaluateOperatingReviewStep(input, workflowName, claim.run.runId)
    if (evaluation.disposition !== 'claimed' && evaluation.disposition !== 'reused') return evaluation.output
    if (!evaluation.batch) throw new FatalError('Operating review evaluation did not return a persistence batch')
    const persisted = await persistOperatingArtifactsStep(input, workflowName, claim.run.runId, evaluation.batch)
    const output: OperatingWorkflowOutput = {
      ...evaluation.output,
      artifactCounts: persisted,
      verificationStatus: 'verified',
    }
    const completed = await completeOperatingRunStep(input, workflowName, claim.run.runId, output, evaluation.batch)
    return {
      ...output,
      state: 'succeeded',
      durableWorkflowRunId: completed.workflowRunId,
      verificationStatus: completed.verificationStatus,
    }
  } catch (error) {
    await recordOperatingRunFailureStep(input, workflowName, claim.run.runId, toOperationalError(error))
    throw error
  }
}

export async function claimOperatingRunStep(
  input: OperatingReviewWorkflowInput,
  workflowName: OperatingWorkflowName,
  workflowRunId: string,
): Promise<DurableRunClaim> {
  'use step'

  assertWorkflowInput(input, workflowName)
  const context = await resolveOperatingWorkflowContext(input.binding)
  return context.durableStore.claimRun({
    agentName: 'operations-orchestrator',
    workflowName,
    workflowVersion: OPERATING_WORKFLOW_VERSION,
    workflowRunId,
    runtimeVersion: context.runtimeVersion,
    input: input.fixture as unknown as Record<string, unknown>,
    idempotencyKey: input.idempotencyKey,
    maxAttempts: MAX_ATTEMPTS,
    leaseSeconds: RUN_LEASE_SECONDS,
    requestedAt: input.requestedAt,
    correlationId: input.correlation.correlationId,
    causationId: input.correlation.causationId,
    traceId: input.correlation.traceId,
    binding: context.binding,
  })
}

export async function evaluateOperatingReviewStep(
  input: OperatingReviewWorkflowInput,
  workflowName: OperatingWorkflowName,
  runId: string,
): Promise<OperatingWorkflowEvaluation> {
  'use step'

  const metadata = getStepMetadata()
  const context = await resolveOperatingWorkflowContext(input.binding)
  const stepKey = `evaluate-${workflowName}`
  const claim = await context.durableStore.claimStep({
    runId,
    stepKey,
    workflowStepId: metadata.stepId,
    input: fixtureSummary(input.fixture),
    maxAttempts: MAX_ATTEMPTS,
    leaseSeconds: STEP_LEASE_SECONDS,
    correlationId: input.correlation.correlationId,
    causationId: input.correlation.causationId,
    traceId: input.correlation.traceId,
  })
  if (claim.disposition === 'reused') return storedEvaluation(claim.step.output)
  if (claim.disposition === 'busy') throw new RetryableError('Operating review evaluation claim is busy', { retryAfter: '2s' })
  if (claim.disposition === 'exhausted') return emptyEvaluation('exhausted', workflowName, runId, input.correlation)
  if (!claim.step.claimToken) throw new FatalError('Operating review evaluation claim has no token')

  try {
    const operatingSignals = signalsForWorkflow(input, workflowName)
    const specialists = specialistsForWorkflow(input.fixture.specialists, input.fixture.industryObservations, workflowName)
    const orchestrator = await runOperationsOrchestrator({
      workflowName,
      idempotencyKey: `${input.idempotencyKey}:orchestrator`,
      specialists,
      persistedSignals: operatingSignals,
      persistedMetrics: input.fixture.metrics,
      experiments: input.fixture.experiments,
      tasks: input.fixture.tasks,
      priorActions: input.fixture.priorActions,
      stateStore: context.operatingStore,
      correlation: input.correlation,
      observedAt: input.requestedAt,
      maximumPriorities: 3,
    })
    const output = outputFromOrchestrator(orchestrator, workflowName, runId, input.correlation)
    const review = reviewFromOutput(output, orchestrator, input, runId, workflowName)
    const batch: OperatingWorkflowArtifactBatch = {
      runId,
      workflowName,
      review,
      signals: orchestrator.signals.slice(0, 50),
      recommendations: orchestrator.recommendations.slice(0, 20),
      tasks: orchestrator.data.taskDrafts.slice(0, 10),
      experiments: orchestrator.data.experimentProposals.slice(0, 10),
      actions: orchestrator.proposedActions.slice(0, 10),
    }
    const evaluation: OperatingWorkflowEvaluation = { disposition: 'claimed', orchestrator, batch, output }
    await context.durableStore.completeStep({
      runId,
      stepKey,
      claimToken: claim.step.claimToken,
      output: evaluation as unknown as Record<string, unknown>,
      toolCalls: [],
      correlationId: input.correlation.correlationId,
      causationId: input.correlation.causationId,
      traceId: input.correlation.traceId,
    })
    return evaluation
  } catch (error) {
    await context.durableStore.failStep({
      runId,
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

export async function persistOperatingArtifactsStep(
  input: OperatingReviewWorkflowInput,
  workflowName: OperatingWorkflowName,
  runId: string,
  batch: OperatingWorkflowArtifactBatch,
): Promise<OperatingWorkflowPersistedCounts> {
  'use step'

  const metadata = getStepMetadata()
  const context = await resolveOperatingWorkflowContext(input.binding)
  const stepKey = `persist-${workflowName}`
  const expectedCounts = countsFor(batch)
  const claim = await context.durableStore.claimStep({
    runId,
    stepKey,
    workflowStepId: metadata.stepId,
    input: expectedCounts as unknown as Record<string, unknown>,
    maxAttempts: MAX_ATTEMPTS,
    leaseSeconds: STEP_LEASE_SECONDS,
    correlationId: input.correlation.correlationId,
    causationId: input.correlation.causationId,
    traceId: input.correlation.traceId,
  })
  if (claim.disposition === 'reused') return storedCounts(claim.step.output)
  if (claim.disposition === 'busy') throw new RetryableError('Operating artifact persistence claim is busy', { retryAfter: '2s' })
  if (claim.disposition === 'exhausted') throw new FatalError('Operating artifact persistence attempts are exhausted')
  if (!claim.step.claimToken) throw new FatalError('Operating artifact persistence claim has no token')

  try {
    const persisted = await context.operatingStore.persistArtifacts(batch)
    assertCountsEqual(expectedCounts, persisted)
    await context.durableStore.completeStep({
      runId,
      stepKey,
      claimToken: claim.step.claimToken,
      output: persisted as unknown as Record<string, unknown>,
      toolCalls: [],
      correlationId: input.correlation.correlationId,
      causationId: input.correlation.causationId,
      traceId: input.correlation.traceId,
    })
    return persisted
  } catch (error) {
    await context.durableStore.failStep({
      runId,
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

export async function completeOperatingRunStep(
  input: OperatingReviewWorkflowInput,
  workflowName: OperatingWorkflowName,
  runId: string,
  output: OperatingWorkflowOutput,
  batch: OperatingWorkflowArtifactBatch,
): Promise<DurableRunSnapshot> {
  'use step'

  if (!output.artifactCounts) throw new FatalError('Operating workflow cannot complete without artifact counts')
  assertCountsEqual(countsFor(batch), output.artifactCounts)
  const context = await resolveOperatingWorkflowContext(input.binding)
  return context.durableStore.completeRun({
    runId,
    output: output as unknown as Record<string, unknown>,
    toolCalls: [],
    inputTokens: null,
    outputTokens: null,
    estimatedCost: null,
    verificationSummary: {
      status: 'verified',
      workflowName,
      artifactCounts: output.artifactCounts,
      priorityCount: output.priorityCount,
      quiet: output.quiet,
    },
    correlationId: input.correlation.correlationId,
    causationId: input.correlation.causationId,
    traceId: input.correlation.traceId,
  })
}

export async function recordOperatingRunFailureStep(
  input: OperatingReviewWorkflowInput,
  workflowName: OperatingWorkflowName,
  runId: string,
  error: OperationalError,
): Promise<DurableRunSnapshot> {
  'use step'

  const context = await resolveOperatingWorkflowContext(input.binding)
  return context.durableStore.failRun({
    runId,
    error,
    retryAfter: null,
    correlationId: input.correlation.correlationId,
    causationId: input.correlation.causationId,
    traceId: input.correlation.traceId,
  })
}

function signalsForWorkflow(
  input: OperatingReviewWorkflowInput,
  workflowName: OperatingWorkflowName,
): IntelligenceSignal[] {
  const base = [...input.fixture.persistedSignals]
  if (workflowName === DAILY_BUSINESS_HEALTH_WORKFLOW_NAME) {
    base.push(...input.fixture.lifecycleSignals, ...sourceHealthSignals(input.fixture.sourceHealth, input))
  } else if (workflowName === CONVERSION_REVIEW_WORKFLOW_NAME) {
    base.push(...input.fixture.lifecycleSignals.filter((signal) => ['growth', 'revenue', 'marketing'].includes(signal.domain)))
  } else {
    base.push(...input.fixture.lifecycleSignals, ...sourceHealthSignals(input.fixture.sourceHealth, input))
  }
  return base.slice(0, 50)
}

function specialistsForWorkflow(
  specialists: OperationsOrchestratorSpecialistInputs,
  industryObservations: IndustryResearchObservation[],
  workflowName: OperatingWorkflowName,
): OperationsOrchestratorSpecialistInputs {
  if (workflowName === DAILY_BUSINESS_HEALTH_WORKFLOW_NAME) return {}
  if (workflowName === CONVERSION_REVIEW_WORKFLOW_NAME) {
    if (!specialists.revenue || !specialists.growth || !specialists.marketing) {
      throw new FatalError('conversion_review requires Revenue, Growth, and Marketing specialist inputs')
    }
    return {
      revenue: specialists.revenue,
      growth: specialists.growth,
      marketing: specialists.marketing,
    }
  }
  return {
    ...specialists,
    ...(specialists.industry ? {} : {
      industry: {
        observations: industryObservations,
        researchMode: 'deterministic_fixture',
        approvedReadOnlyToolConfigured: false,
      },
    }),
  }
}

function sourceHealthSignals(
  observations: SourceHealthObservation[],
  input: OperatingReviewWorkflowInput,
): IntelligenceSignal[] {
  return observations.flatMap((observation) => {
    const stale = isStale(observation, input.requestedAt)
    if (observation.status === 'healthy' && !stale && !observation.collectorErrorCode) return []
    const fingerprint = `source-health:${observation.sourceId}:${observation.status}:${stale}:${observation.collectorErrorCode ?? 'none'}`
    const severity = observation.status === 'failed' ? 'high' as const : 'medium' as const
    const priority = observation.status === 'failed' ? 85 : 70
    const sourceRef = {
      sourceSystem: observation.sourceId,
      sourceType: 'source_health',
      sourceId: observation.sourceId,
      observedAt: observation.lastObservedAt ?? input.requestedAt,
    }
    return [{
      id: stableUuid('operating-source-health-signal', fingerprint),
      signalType: observation.collectorErrorCode ? 'operations.collector_failure' : stale ? 'operations.source_stale' : 'operations.source_degraded',
      domain: 'operations' as const,
      producer: DAILY_BUSINESS_HEALTH_WORKFLOW_NAME,
      title: `${observation.sourceId} source health requires attention`,
      summary: `Source status is ${observation.status}; stale=${stale}; collector error=${observation.collectorErrorCode ?? 'none'}.`,
      evidence: [{
        evidenceType: 'observation' as const,
        summary: 'Bounded source-health observation.',
        sourceRef,
        value: observation,
        confidence: 1,
      }],
      sourceRefs: [sourceRef],
      confidence: 1,
      severity,
      priority,
      businessImpact: 'Operating conclusions may be incomplete or stale.',
      affectedEntities: [{ entityType: 'source', sourceId: observation.sourceId }],
      recommendedFollowUp: 'Restore or verify the collector before interpreting downstream metrics.',
      fingerprint,
      idempotencyKey: `signal:${fingerprint}`,
      status: 'new' as const,
      firstDetectedAt: input.requestedAt,
      lastDetectedAt: input.requestedAt,
      correlation: input.correlation,
    }]
  })
}

function outputFromOrchestrator(
  orchestrator: OperationsOrchestratorOutput,
  workflowName: OperatingWorkflowName,
  runId: string,
  correlation: CorrelationContext,
): OperatingWorkflowOutput {
  const quiet = orchestrator.status === 'quiet'
  const priorities = orchestrator.data.priorities.map((priority) => ({ ...priority }))
  const autumnDecisions = orchestrator.autumnDecisions.map((decision) => ({ ...decision }))
  return {
    state: 'succeeded',
    workflowName,
    workflowVersion: OPERATING_WORKFLOW_VERSION,
    agentRunId: runId,
    durableWorkflowRunId: null,
    executiveSummary: executiveSummary(workflowName, orchestrator),
    quiet,
    notificationRequired: !quiet && autumnDecisions.length > 0,
    priorityCount: priorities.length,
    priorities,
    autumnDecisions,
    artifactCounts: null,
    verificationStatus: 'pending',
    correlationId: correlation.correlationId,
  }
}

function reviewFromOutput(
  output: OperatingWorkflowOutput,
  orchestrator: OperationsOrchestratorOutput,
  input: OperatingReviewWorkflowInput,
  runId: string,
  workflowName: OperatingWorkflowName,
): OperatingReviewRecord {
  const idempotencyKey = `operating-review:${workflowName}:${input.idempotencyKey}`
  return {
    id: stableUuid('agent-operating-review', idempotencyKey),
    runId,
    workflowName,
    reviewDate: input.fixture.reviewDate,
    status: output.quiet ? 'quiet' : 'completed',
    executiveSummary: output.executiveSummary,
    priorities: output.priorities,
    autumnDecisions: orchestrator.autumnDecisions,
    output: {
      priorityCount: output.priorityCount,
      notificationRequired: output.notificationRequired,
      recommendationCount: orchestrator.recommendations.length,
      taskCount: orchestrator.data.taskDrafts.length,
      experimentCount: orchestrator.data.experimentProposals.length,
      proposedActionCount: orchestrator.proposedActions.length,
    },
    idempotencyKey,
    correlationId: input.correlation.correlationId,
    causationId: input.correlation.causationId,
  }
}

function executiveSummary(workflowName: OperatingWorkflowName, orchestrator: OperationsOrchestratorOutput): string {
  if (orchestrator.status === 'quiet') {
    return workflowName === DAILY_BUSINESS_HEALTH_WORKFLOW_NAME
      ? 'Daily business health is quiet: no meaningful lifecycle, identity, access, routing, source, collector, or tracking anomaly was detected.'
      : `${workflowName} completed with no material change requiring a priority or owner decision.`
  }
  return `${workflowName} identified ${orchestrator.data.priorities.length} priorities and ${orchestrator.autumnDecisions.length} decisions requiring Autumn.`
}

function summarizeExistingRun(
  claim: DurableRunClaim,
  workflowName: OperatingWorkflowName,
  correlation: CorrelationContext,
): OperatingWorkflowOutput {
  if (claim.disposition === 'reused' && claim.run.output) {
    return { ...(claim.run.output as unknown as OperatingWorkflowOutput), state: 'reused' }
  }
  return {
    state: claim.disposition === 'exhausted' ? 'exhausted' : 'duplicate_in_progress',
    workflowName,
    workflowVersion: OPERATING_WORKFLOW_VERSION,
    agentRunId: claim.run.runId,
    durableWorkflowRunId: claim.run.workflowRunId,
    executiveSummary: 'A durable delivery already owns this business idempotency key.',
    quiet: true,
    notificationRequired: false,
    priorityCount: 0,
    priorities: [],
    autumnDecisions: [],
    artifactCounts: null,
    verificationStatus: claim.disposition === 'exhausted' ? 'failed' : claim.run.verificationStatus,
    correlationId: correlation.correlationId,
  }
}

function emptyEvaluation(
  disposition: 'exhausted',
  workflowName: OperatingWorkflowName,
  runId: string,
  correlation: CorrelationContext,
): OperatingWorkflowEvaluation {
  return {
    disposition,
    orchestrator: null,
    batch: null,
    output: {
      ...summarizeExistingRun({
        disposition,
        run: {
          runId,
          status: 'failed',
          attempt: MAX_ATTEMPTS,
          maxAttempts: MAX_ATTEMPTS,
          workflowRunId: null,
          durableWorkflowId: `${workflowName}@${OPERATING_WORKFLOW_VERSION}`,
          output: null,
          verificationStatus: 'failed',
          lastHeartbeatAt: null,
          staleAfter: null,
          retryAfter: null,
        },
      }, workflowName, correlation),
      state: 'exhausted',
    },
  }
}

function storedEvaluation(value: Record<string, unknown> | null): OperatingWorkflowEvaluation {
  if (!value) throw new FatalError('Completed operating evaluation has no reusable output')
  return { ...(value as unknown as OperatingWorkflowEvaluation), disposition: 'reused' }
}

function storedCounts(value: Record<string, unknown> | null): OperatingWorkflowPersistedCounts {
  if (!value) throw new FatalError('Completed operating persistence step has no reusable output')
  return value as unknown as OperatingWorkflowPersistedCounts
}

function countsFor(batch: OperatingWorkflowArtifactBatch): OperatingWorkflowPersistedCounts {
  return {
    signalCount: batch.signals.length,
    recommendationCount: batch.recommendations.length,
    taskCount: batch.tasks.length,
    experimentCount: batch.experiments.length,
    actionCount: batch.actions.length,
    reviewCount: 1,
  }
}

function assertCountsEqual(
  expected: OperatingWorkflowPersistedCounts,
  actual: OperatingWorkflowPersistedCounts,
): void {
  for (const key of Object.keys(expected) as Array<keyof OperatingWorkflowPersistedCounts>) {
    if (expected[key] !== actual[key]) throw new FatalError(`Operating artifact verification failed for ${key}`)
  }
}

function assertWorkflowInput(input: OperatingReviewWorkflowInput, workflowName: OperatingWorkflowName): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fixture.reviewDate)) throw new FatalError('reviewDate must use YYYY-MM-DD')
  if (!input.idempotencyKey.startsWith(`phase-c5:${workflowName}:`)) {
    throw new FatalError(`Operating idempotency key must be namespaced to ${workflowName}`)
  }
  if (input.fixture.metrics.length > 25_000 || input.fixture.persistedSignals.length > 50) {
    throw new FatalError('Operating workflow fixture exceeds bounded inputs')
  }
}

function fixtureSummary(fixture: OperatingReviewFixture): Record<string, unknown> {
  return {
    reviewDate: fixture.reviewDate,
    metricCount: fixture.metrics.length,
    lifecycleSignalCount: fixture.lifecycleSignals.length,
    sourceHealthCount: fixture.sourceHealth.length,
    industryObservationCount: fixture.industryObservations.length,
    persistedSignalCount: fixture.persistedSignals.length,
    experimentCount: fixture.experiments.length,
    taskCount: fixture.tasks.length,
    priorActionCount: fixture.priorActions.length,
  }
}

function isStale(observation: SourceHealthObservation, now: string): boolean {
  if (!observation.lastObservedAt) return true
  const age = Date.parse(now) - Date.parse(observation.lastObservedAt)
  return !Number.isFinite(age) || age > observation.staleAfterHours * 3_600_000
}

function retryAfterForAttempt(attempt: number): string {
  return new Date(Date.now() + Math.min(30, Math.max(1, attempt * attempt * 2)) * 1000).toISOString()
}

function workflowStepError(error: unknown, attempt: number): Error {
  if (error instanceof FatalError) return error
  return new RetryableError('Operating workflow step failed and may be retried safely', {
    retryAfter: Math.min(30_000, Math.max(1_000, attempt * attempt * 2_000)),
  })
}

function toOperationalError(error: unknown): OperationalError {
  return {
    code: errorCode(error),
    message: error instanceof FatalError ? error.message.slice(0, 500) : 'A bounded operating workflow step failed.',
    retryable: !(error instanceof FatalError),
    details: {},
    occurredAt: new Date().toISOString(),
  }
}

function errorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) return String(error.code)
  return 'OPERATING_WORKFLOW_STEP_FAILED'
}
