import { createHash } from 'node:crypto'
import { z } from 'zod'

import type { OperationalError } from '../contracts.js'
import type {
  DurableRunClaim,
  DurableWorkflowStore,
} from '../persistence/durable-workflow-store.js'
import type { DurableDestinationBinding } from '../runtime/staging-destination.js'
import { stableUuid } from '../stable-id.js'
import {
  runFreeJourneyOperation,
  type FreeJourneyOperationInput,
  type FreeJourneyOperationResult,
} from './free-journey-operation.js'

const VERSION = 'free-journey-durable-v1'
const WORKFLOW_NAME = 'free_journey_operation'
const AGENT_NAME = 'activecampaign-lifecycle'
const timestamp = z.string().datetime({ offset: true })
const eventSchema = z.object({
  contractVersion: z.literal('free_journey_event_v1'),
  kind: z.enum(['signup', 'profile_saved', 'income_scenario_completed', 'day_30']),
  idempotencyKey: z.string().min(1).max(240),
  occurredAt: timestamp,
}).passthrough()
const approvalSchema = z.object({
  approvalRef: z.string().min(1).max(160),
  sourceReviewRef: z.string().min(1).max(160),
  activeCampaignContactId: z.string().regex(/^\d+$/),
}).passthrough()
const writerStepSchema = z.object({
  step: z.string().min(1).max(100),
  state: z.enum(['succeeded', 'skipped', 'failed', 'blocked']),
  code: z.string().min(1).max(160).optional(),
  httpStatus: z.number().int().min(100).max(599).optional(),
}).strict()
const writerResultSchema = z.object({
  status: z.enum(['withheld', 'ready', 'unchanged', 'updated', 'partial', 'failed']),
  sourceStatus: z.enum(['ready_for_writer_review', 'historical_consent_preview_only', 'withheld']),
  desiredStage: z.enum(['profile_needed', 'calculation_needed', 'onboarding_complete', 'conversion_eligible', 'withheld']).nullable(),
  consentProvenance: z.enum(['current_cycle_doi', 'historical_owner_attestation']).nullable(),
  attemptedWrites: z.number().int().nonnegative(),
  confirmedWrites: z.number().int().nonnegative(),
  recoveryRequired: z.boolean(),
  automaticRetry: z.literal(false),
  reasons: z.array(z.string().min(1).max(200)).max(100),
  steps: z.array(writerStepSchema).max(100),
}).strict()
const durableResultSchema = z.object({
  state: z.enum(['completed', 'reused', 'held', 'duplicate_in_progress', 'exhausted', 'recovery_required']),
  runId: z.string().uuid().nullable(),
  status: writerResultSchema.shape.status.nullable(),
  desiredStage: writerResultSchema.shape.desiredStage,
  attemptedWrites: z.number().int().nonnegative(),
  confirmedWrites: z.number().int().nonnegative(),
  recoveryRequired: z.boolean(),
  automaticRetry: z.literal(false),
  reasons: writerResultSchema.shape.reasons,
  steps: writerResultSchema.shape.steps,
}).strict()

export interface DurableFreeJourneyContext {
  store: DurableWorkflowStore
  binding: DurableDestinationBinding
  runtimeVersion: string
  workflowRunId?: string
  fetch?: typeof fetch
}

export interface DurableFreeJourneyResult extends Record<string, unknown> {
  state: 'completed' | 'reused' | 'held' | 'duplicate_in_progress' | 'exhausted' | 'recovery_required'
  runId: string | null
  status: FreeJourneyOperationResult['status'] | null
  desiredStage: FreeJourneyOperationResult['desiredStage']
  attemptedWrites: number
  confirmedWrites: number
  recoveryRequired: boolean
  automaticRetry: false
  reasons: string[]
  steps: FreeJourneyOperationResult['steps']
}

interface FieldExecution {
  state: 'completed' | 'reused' | 'duplicate_in_progress' | 'exhausted' | 'recovery_required'
  result: FreeJourneyOperationResult | null
}

export async function runDurableFreeJourneyOperation(
  input: FreeJourneyOperationInput,
  context: DurableFreeJourneyContext,
): Promise<DurableFreeJourneyResult> {
  const event = eventSchema.safeParse(input.sourceEvent)
  const approval = approvalSchema.safeParse(input.writeApproval)
  if (input.mode !== 'write' || input.executionPhase !== 'operational' || input.writeStep !== undefined
    || !event.success || !approval.success) return held(['durable_operation_input_invalid'])
  const sourceEvent = event.data
  const writeApproval = approval.data

  try {
    await context.store.verifyFreeJourneyDestination(context.binding)
  } catch {
    return held(['durable_destination_not_approved'])
  }

  const preview = await runFreeJourneyOperation({ ...input, mode: 'preview', writeApproval: undefined }, context.fetch)
  if (preview.status !== 'ready' || preview.desiredStage === null || preview.recoveryRequired) {
    return { ...held(preview.reasons.length ? preview.reasons : ['durable_preview_not_ready']),
      status: preview.status, desiredStage: preview.desiredStage, steps: preview.steps }
  }

  const operationKey = durableOperationKey(sourceEvent.idempotencyKey, writeApproval.approvalRef)
  const correlationId = stableUuid(VERSION, operationKey)
  const ids = { correlationId, causationId: null, traceId: VERSION }
  const runInput = {
    sourceEventKey: sourceEvent.idempotencyKey,
    sourceEventKind: sourceEvent.kind,
    approvalRef: writeApproval.approvalRef,
    sourceReviewRef: writeApproval.sourceReviewRef,
    contactDigest: digest(writeApproval.activeCampaignContactId),
    desiredStage: preview.desiredStage,
    evidenceExpiresAt: input.evidenceExpiresAt,
  }
  let claim: DurableRunClaim
  try {
    claim = await context.store.claimFreeJourneyRun({
      agentName: AGENT_NAME,
      workflowName: WORKFLOW_NAME,
      workflowVersion: VERSION,
      workflowRunId: context.workflowRunId ?? `free-journey-${correlationId}`,
      runtimeVersion: context.runtimeVersion,
      input: runInput,
      idempotencyKey: operationKey,
      maxAttempts: 3,
      leaseSeconds: 300,
      requestedAt: sourceEvent.occurredAt,
      binding: context.binding,
      ...ids,
    })
  } catch {
    return held(['durable_claim_failed_or_conflicted'])
  }
  if (claim.disposition === 'reused') return reused(claim)
  if (claim.disposition === 'busy') return occupied('duplicate_in_progress', claim.run.runId)
  if (claim.disposition === 'exhausted') return occupied('exhausted', claim.run.runId)

  const expiry = await executeField('expiry', claim.run.runId)
  if (!['completed', 'reused'].includes(expiry.state)) return fieldFailure(expiry, claim.run.runId)
  const stage = await executeField('stage', claim.run.runId)
  if (!['completed', 'reused'].includes(stage.state)) {
    return fieldFailure(stage, claim.run.runId, expiry.result)
  }
  const combined = combine(expiry.result, stage.result, claim.run.runId, 'completed')
  try {
    const completed = await context.store.completeRun({
      runId: claim.run.runId,
      output: combined,
      toolCalls: [],
      inputTokens: null,
      outputTokens: null,
      estimatedCost: null,
      verificationSummary: {
        field194ConfirmedBefore193: true,
        providerWritesBounded: true,
        automaticRetry: false,
      },
      ...ids,
    })
    return parseSaved(completed.output, 'completed') ?? recovery(claim.run.runId, combined)
  } catch {
    // The database completion response is uncertain. The run/step keys remain occupied;
    // never repeat a provider write automatically to compensate for a missing response.
    return recovery(claim.run.runId, combined)
  }

  async function executeField(field: 'expiry' | 'stage', runId: string): Promise<FieldExecution> {
    const fieldId = field === 'expiry' ? '194' : '193'
    const stepKey = `activecampaign-field-${fieldId}`
    let step
    try {
      step = await context.store.claimStep({
        runId,
        stepKey,
        workflowStepId: `${context.workflowRunId ?? `free-journey-${correlationId}`}:${stepKey}`,
        input: {
          fieldId,
          desiredValueDigest: digest(field === 'expiry' ? input.evidenceExpiresAt : preview.desiredStage!),
          sourceEventKey: sourceEvent.idempotencyKey,
        },
        maxAttempts: 1,
        leaseSeconds: 120,
        ...ids,
      })
    } catch {
      return { state: 'recovery_required', result: null }
    }
    if (step.disposition === 'busy') return { state: 'duplicate_in_progress', result: null }
    if (step.disposition === 'exhausted') return { state: 'exhausted', result: null }
    if (step.disposition === 'reused') {
      const saved = parseWriter(step.step.output)
      return saved ? { state: 'reused', result: saved } : { state: 'recovery_required', result: null }
    }
    const claimToken = step.step.claimToken
    if (!claimToken) return { state: 'recovery_required', result: null }
    const writer = await runFreeJourneyOperation({ ...input, writeStep: field }, context.fetch)
    if (!successfulFieldResult(writer, field)) {
      await context.store.failStep({
        runId,
        stepKey,
        claimToken,
        error: operationError(field, writer, input.now),
        retryAfter: null,
        ...ids,
      }).catch(() => undefined)
      return { state: 'recovery_required', result: writer }
    }
    try {
      const completed = await context.store.completeStep({
        runId,
        stepKey,
        claimToken,
        output: { ...writer },
        toolCalls: [],
        ...ids,
      })
      const saved = parseWriter(completed.output)
      return saved ? { state: 'completed', result: saved } : { state: 'recovery_required', result: writer }
    } catch {
      return { state: 'recovery_required', result: writer }
    }
  }
}

function successfulFieldResult(result: FreeJourneyOperationResult, field: 'expiry' | 'stage') {
  const step = result.steps.find(candidate => candidate.step === `field_${field}`)
  return ['updated', 'unchanged'].includes(result.status)
    && result.recoveryRequired === false
    && !!step
    && ['succeeded', 'skipped'].includes(step.state)
}

function durableOperationKey(sourceEventKey: string, approvalRef: string) {
  return `free-journey-operation:${digest(JSON.stringify([VERSION, sourceEventKey, approvalRef]))}`
}

function digest(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function operationError(field: string, result: FreeJourneyOperationResult, occurredAt: string): OperationalError {
  return {
    code: `FREE_JOURNEY_${field.toUpperCase()}_WRITE_UNCONFIRMED`,
    message: 'Free journey field write stopped for exact-state reconciliation.',
    retryable: false,
    details: {
      status: result.status,
      attemptedWrites: result.attemptedWrites,
      confirmedWrites: result.confirmedWrites,
    },
    occurredAt,
  }
}

function combine(
  expiry: FreeJourneyOperationResult | null,
  stage: FreeJourneyOperationResult | null,
  runId: string,
  state: DurableFreeJourneyResult['state'],
): DurableFreeJourneyResult {
  const latest = stage ?? expiry
  return {
    state,
    runId,
    status: latest?.status ?? null,
    desiredStage: latest?.desiredStage ?? null,
    attemptedWrites: (expiry?.attemptedWrites ?? 0) + (stage?.attemptedWrites ?? 0),
    confirmedWrites: (expiry?.confirmedWrites ?? 0) + (stage?.confirmedWrites ?? 0),
    recoveryRequired: state === 'recovery_required' || !!expiry?.recoveryRequired || !!stage?.recoveryRequired,
    automaticRetry: false,
    reasons: [...new Set([...(expiry?.reasons ?? []), ...(stage?.reasons ?? [])])],
    steps: [...(expiry?.steps ?? []), ...(stage?.steps ?? [])],
  }
}

function fieldFailure(execution: FieldExecution, runId: string, prior: FreeJourneyOperationResult | null = null) {
  if (execution.state === 'duplicate_in_progress' || execution.state === 'exhausted') {
    return occupied(execution.state, runId)
  }
  return recovery(runId, combine(prior, execution.result, runId, 'recovery_required'))
}

function held(reasons: string[]): DurableFreeJourneyResult {
  return {
    state: 'held', runId: null, status: null, desiredStage: null,
    attemptedWrites: 0, confirmedWrites: 0, recoveryRequired: false,
    automaticRetry: false, reasons, steps: [],
  }
}

function occupied(state: 'duplicate_in_progress' | 'exhausted', runId: string): DurableFreeJourneyResult {
  return {
    ...held([]), state, runId, recoveryRequired: state === 'exhausted',
    reasons: [state === 'exhausted' ? 'durable_attempts_exhausted' : 'durable_operation_in_progress'],
  }
}

function recovery(runId: string, prior?: DurableFreeJourneyResult): DurableFreeJourneyResult {
  return {
    ...(prior ?? held([])), state: 'recovery_required', runId, recoveryRequired: true,
    automaticRetry: false,
    reasons: [...new Set([...(prior?.reasons ?? []), 'exact_state_reconciliation_required'])],
  }
}

function reused(claim: DurableRunClaim): DurableFreeJourneyResult {
  return parseSaved(claim.run.output, 'reused') ?? recovery(claim.run.runId)
}

function parseSaved(value: Record<string, unknown> | null, state: 'completed' | 'reused') {
  const parsed = durableResultSchema.safeParse(value)
  if (!parsed.success || parsed.data.recoveryRequired !== false) return null
  return { ...parsed.data, state } as DurableFreeJourneyResult
}

function parseWriter(value: Record<string, unknown> | null): FreeJourneyOperationResult | null {
  const parsed = writerResultSchema.safeParse(value)
  return parsed.success ? parsed.data as FreeJourneyOperationResult : null
}
