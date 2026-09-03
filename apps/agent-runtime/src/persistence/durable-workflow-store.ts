import type { IntelligenceSignal, OperationalError, ToolCallSummary } from '../contracts.js'
import { ContractValidationError } from '../contracts.js'
import { assertServerOnlyControlPlaneAccess } from './control-plane-store.js'
import type { StagingDestinationBinding } from '../runtime/staging-destination.js'

export type DurableClaimDisposition = 'claimed' | 'reused' | 'busy' | 'exhausted'
export type DurableRunVerificationStatus = 'pending' | 'verified' | 'failed'

export interface DurableRunSnapshot {
  runId: string
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'stale'
  attempt: number
  maxAttempts: number
  workflowRunId: string | null
  durableWorkflowId: string
  output: Record<string, unknown> | null
  verificationStatus: DurableRunVerificationStatus
  lastHeartbeatAt: string | null
  staleAfter: string | null
  retryAfter: string | null
}

export interface DurableRunClaim {
  disposition: DurableClaimDisposition
  run: DurableRunSnapshot
}

export interface DurableStepSnapshot {
  stepId: string
  runId: string
  stepKey: string
  workflowStepId: string
  claimToken: string | null
  status: 'running' | 'succeeded' | 'failed' | 'stale'
  attempt: number
  maxAttempts: number
  output: Record<string, unknown> | null
  toolCalls: ToolCallSummary[]
  retryAfter: string | null
}

export interface DurableStepClaim {
  disposition: DurableClaimDisposition
  step: DurableStepSnapshot
}

export interface ClaimDurableRunInput {
  agentName: string
  workflowName: string
  workflowVersion: string
  workflowRunId: string
  runtimeVersion: string
  input: Record<string, unknown>
  idempotencyKey: string
  maxAttempts: number
  leaseSeconds: number
  requestedAt: string
  correlationId: string
  causationId: string | null
  traceId: string | null
  binding: StagingDestinationBinding
}

export interface ClaimDurableStepInput {
  runId: string
  stepKey: string
  workflowStepId: string
  input: Record<string, unknown>
  maxAttempts: number
  leaseSeconds: number
  correlationId: string
  causationId: string | null
  traceId: string | null
}

export interface CompleteDurableStepInput {
  runId: string
  stepKey: string
  claimToken: string
  output: Record<string, unknown>
  toolCalls: ToolCallSummary[]
  correlationId: string
  causationId: string | null
  traceId: string | null
}

export interface FailDurableStepInput {
  runId: string
  stepKey: string
  claimToken: string
  error: OperationalError
  retryAfter: string | null
  correlationId: string
  causationId: string | null
  traceId: string | null
}

export interface CompleteDurableRunInput {
  runId: string
  output: Record<string, unknown>
  toolCalls: ToolCallSummary[]
  inputTokens: number | null
  outputTokens: number | null
  estimatedCost: number | null
  verificationSummary: Record<string, unknown>
  correlationId: string
  causationId: string | null
  traceId: string | null
}

export interface FailDurableRunInput {
  runId: string
  error: OperationalError
  retryAfter: string | null
  correlationId: string
  causationId: string | null
  traceId: string | null
}

export interface DurableWorkflowStore {
  verifyDestination(binding: StagingDestinationBinding): Promise<void>
  claimRun(input: ClaimDurableRunInput): Promise<DurableRunClaim>
  claimStep(input: ClaimDurableStepInput): Promise<DurableStepClaim>
  completeStep(input: CompleteDurableStepInput): Promise<DurableStepSnapshot>
  failStep(input: FailDurableStepInput): Promise<DurableStepSnapshot>
  persistSignals(runId: string, signals: IntelligenceSignal[]): Promise<number>
  completeRun(input: CompleteDurableRunInput): Promise<DurableRunSnapshot>
  failRun(input: FailDurableRunInput): Promise<DurableRunSnapshot>
  markStaleRuns(limit: number): Promise<number>
}

interface SupabaseErrorLike {
  message?: string
  code?: string
  details?: string
  hint?: string
}

interface SupabaseResponseLike<T> {
  data: T | null
  error: SupabaseErrorLike | null
}

interface SupabaseRpcClientLike {
  rpc(name: string, parameters: Record<string, unknown>): PromiseLike<SupabaseResponseLike<unknown>>
}

export async function createSupabaseDurableWorkflowStore(configuration: {
  url: string
  serviceRoleKey: string
}): Promise<DurableWorkflowStore> {
  assertServerOnlyControlPlaneAccess(configuration)
  const supabaseModule = (await import('@supabase/supabase-js')) as {
    createClient?: (url: string, key: string, options: Record<string, unknown>) => SupabaseRpcClientLike
  }
  if (typeof supabaseModule.createClient !== 'function') {
    throw new ContractValidationError('@supabase/supabase-js did not expose createClient')
  }
  const client = supabaseModule.createClient(configuration.url.trim(), configuration.serviceRoleKey.trim(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return new SupabaseDurableWorkflowStore(client)
}

export class SupabaseDurableWorkflowStore implements DurableWorkflowStore {
  constructor(private readonly client: SupabaseRpcClientLike) {}

  async verifyDestination(binding: StagingDestinationBinding): Promise<void> {
    const verified = await rpcValue<boolean>(this.client, 'verify_agent_runtime_destination', {
      p_binding_key: binding.bindingKey,
      p_policy_version: binding.policyVersion,
      p_project_ref: binding.projectRef,
      p_destination_fingerprint: binding.destinationFingerprint,
    })
    if (verified !== true) throw new DurableWorkflowPersistenceError('Database destination sentinel rejected the runtime binding')
  }

  claimRun(input: ClaimDurableRunInput): Promise<DurableRunClaim> {
    return rpcValue(this.client, 'claim_agent_workflow_run', {
      p_agent_name: input.agentName,
      p_workflow_name: input.workflowName,
      p_workflow_version: input.workflowVersion,
      p_workflow_run_id: input.workflowRunId,
      p_durable_workflow_id: `${input.workflowName}@${input.workflowVersion}`,
      p_runtime_version: input.runtimeVersion,
      p_input: input.input,
      p_idempotency_key: input.idempotencyKey,
      p_max_attempts: input.maxAttempts,
      p_lease_seconds: input.leaseSeconds,
      p_requested_at: input.requestedAt,
      p_correlation_id: input.correlationId,
      p_causation_id: input.causationId,
      p_trace_id: input.traceId,
      p_destination_fingerprint: input.binding.destinationFingerprint,
    })
  }

  claimStep(input: ClaimDurableStepInput): Promise<DurableStepClaim> {
    return rpcValue(this.client, 'claim_agent_workflow_step', {
      p_run_id: input.runId,
      p_step_key: input.stepKey,
      p_workflow_step_id: input.workflowStepId,
      p_input: input.input,
      p_max_attempts: input.maxAttempts,
      p_lease_seconds: input.leaseSeconds,
      p_correlation_id: input.correlationId,
      p_causation_id: input.causationId,
      p_trace_id: input.traceId,
    })
  }

  completeStep(input: CompleteDurableStepInput): Promise<DurableStepSnapshot> {
    return rpcValue(this.client, 'complete_agent_workflow_step', {
      p_run_id: input.runId,
      p_step_key: input.stepKey,
      p_claim_token: input.claimToken,
      p_output: input.output,
      p_tool_calls: input.toolCalls,
      p_correlation_id: input.correlationId,
      p_causation_id: input.causationId,
      p_trace_id: input.traceId,
    })
  }

  failStep(input: FailDurableStepInput): Promise<DurableStepSnapshot> {
    return rpcValue(this.client, 'fail_agent_workflow_step', {
      p_run_id: input.runId,
      p_step_key: input.stepKey,
      p_claim_token: input.claimToken,
      p_error: input.error,
      p_retry_after: input.retryAfter,
      p_correlation_id: input.correlationId,
      p_causation_id: input.causationId,
      p_trace_id: input.traceId,
    })
  }

  persistSignals(runId: string, signals: IntelligenceSignal[]): Promise<number> {
    if (signals.length > 50) {
      throw new ContractValidationError('A durable workflow step may persist at most 50 signals')
    }
    return rpcValue(this.client, 'persist_agent_workflow_signals', {
      p_run_id: runId,
      p_signals: signals.map(mapSignal),
    })
  }

  completeRun(input: CompleteDurableRunInput): Promise<DurableRunSnapshot> {
    return rpcValue(this.client, 'complete_agent_workflow_run', {
      p_run_id: input.runId,
      p_output: input.output,
      p_tool_calls: input.toolCalls,
      p_input_tokens: input.inputTokens,
      p_output_tokens: input.outputTokens,
      p_estimated_cost: input.estimatedCost,
      p_verification_summary: input.verificationSummary,
      p_correlation_id: input.correlationId,
      p_causation_id: input.causationId,
      p_trace_id: input.traceId,
    })
  }

  failRun(input: FailDurableRunInput): Promise<DurableRunSnapshot> {
    return rpcValue(this.client, 'fail_agent_workflow_run', {
      p_run_id: input.runId,
      p_error: input.error,
      p_retry_after: input.retryAfter,
      p_correlation_id: input.correlationId,
      p_causation_id: input.causationId,
      p_trace_id: input.traceId,
    })
  }

  markStaleRuns(limit: number): Promise<number> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new ContractValidationError('Stale-run sweep limit must be between 1 and 100')
    }
    return rpcValue(this.client, 'mark_stale_agent_workflow_runs', { p_limit: limit })
  }
}

export class InMemoryDurableWorkflowStore implements DurableWorkflowStore {
  readonly persistedSignals = new Map<string, IntelligenceSignal>()
  readonly runsById = new Map<string, DurableRunSnapshot>()
  readonly runsByKey = new Map<string, string>()
  readonly runInputsByKey = new Map<string, Record<string, unknown>>()
  readonly steps = new Map<string, DurableStepSnapshot>()
  readonly stepInputs = new Map<string, Record<string, unknown>>()

  constructor(
    private readonly acceptedBinding: StagingDestinationBinding,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async verifyDestination(binding: StagingDestinationBinding): Promise<void> {
    if (JSON.stringify(binding) !== JSON.stringify(this.acceptedBinding)) {
      throw new DurableWorkflowPersistenceError('In-memory destination sentinel rejected the runtime binding')
    }
  }

  async claimRun(input: ClaimDurableRunInput): Promise<DurableRunClaim> {
    await this.verifyDestination(input.binding)
    const existingId = this.runsByKey.get(input.idempotencyKey)
    if (existingId) {
      const existingInput = this.runInputsByKey.get(input.idempotencyKey)
      if (!existingInput || !sameJson(existingInput, input.input)) {
        throw new DurableWorkflowPersistenceError('Durable run idempotency key was reused with a different input payload')
      }
      const existing = requiredRun(this.runsById, existingId)
      if (existing.status === 'succeeded') return { disposition: 'reused', run: clone(existing) }
      if (existing.status === 'running' && !isExpired(existing.staleAfter, this.now())) {
        return { disposition: 'busy', run: clone(existing) }
      }
      if (existing.status === 'failed' && isFuture(existing.retryAfter, this.now())) {
        return { disposition: 'busy', run: clone(existing) }
      }
      if (existing.attempt >= existing.maxAttempts) return { disposition: 'exhausted', run: clone(existing) }
      const claimed = {
        ...existing,
        status: 'running' as const,
        attempt: existing.attempt + 1,
        lastHeartbeatAt: this.now().toISOString(),
        staleAfter: afterSeconds(this.now(), input.leaseSeconds),
        retryAfter: null,
      }
      this.runsById.set(claimed.runId, claimed)
      return { disposition: 'claimed', run: clone(claimed) }
    }

    const runId = crypto.randomUUID()
    const now = this.now()
    const run: DurableRunSnapshot = {
      runId,
      status: 'running',
      attempt: 1,
      maxAttempts: input.maxAttempts,
      workflowRunId: input.workflowRunId,
      durableWorkflowId: `${input.workflowName}@${input.workflowVersion}`,
      output: null,
      verificationStatus: 'pending',
      lastHeartbeatAt: now.toISOString(),
      staleAfter: afterSeconds(now, input.leaseSeconds),
      retryAfter: null,
    }
    this.runsById.set(runId, run)
    this.runsByKey.set(input.idempotencyKey, runId)
    this.runInputsByKey.set(input.idempotencyKey, clone(input.input))
    return { disposition: 'claimed', run: clone(run) }
  }

  async claimStep(input: ClaimDurableStepInput): Promise<DurableStepClaim> {
    const key = `${input.runId}:${input.stepKey}`
    const existing = this.steps.get(key)
    if (existing) {
      const existingInput = this.stepInputs.get(key)
      if (!existingInput || !sameJson(existingInput, input.input)) {
        throw new DurableWorkflowPersistenceError('Durable step key was reused with a different input payload')
      }
      if (existing.status === 'succeeded') return { disposition: 'reused', step: clone(existing) }
      if (existing.status === 'failed' && isFuture(existing.retryAfter, this.now())) {
        return { disposition: 'busy', step: clone(existing) }
      }
      const run = requiredRun(this.runsById, input.runId)
      const staleAfter = run.staleAfter
      if (existing.status === 'running' && !isExpired(staleAfter, this.now())) {
        return { disposition: 'busy', step: clone(existing) }
      }
      if (existing.attempt >= existing.maxAttempts) return { disposition: 'exhausted', step: clone(existing) }
      const claimed = {
        ...existing,
        workflowStepId: input.workflowStepId,
        claimToken: crypto.randomUUID(),
        status: 'running' as const,
        attempt: existing.attempt + 1,
        output: null,
        retryAfter: null,
      }
      this.steps.set(key, claimed)
      this.heartbeat(input.runId, input.leaseSeconds)
      return { disposition: 'claimed', step: clone(claimed) }
    }

    const step: DurableStepSnapshot = {
      stepId: crypto.randomUUID(),
      runId: input.runId,
      stepKey: input.stepKey,
      workflowStepId: input.workflowStepId,
      claimToken: crypto.randomUUID(),
      status: 'running',
      attempt: 1,
      maxAttempts: input.maxAttempts,
      output: null,
      toolCalls: [],
      retryAfter: null,
    }
    this.steps.set(key, step)
    this.stepInputs.set(key, clone(input.input))
    this.heartbeat(input.runId, input.leaseSeconds)
    return { disposition: 'claimed', step: clone(step) }
  }

  async completeStep(input: CompleteDurableStepInput): Promise<DurableStepSnapshot> {
    const key = `${input.runId}:${input.stepKey}`
    const step = requiredStep(this.steps, key)
    if (step.status === 'succeeded') return clone(step)
    assertClaimToken(step, input.claimToken)
    const completed: DurableStepSnapshot = {
      ...step,
      status: 'succeeded',
      claimToken: null,
      output: clone(input.output),
      toolCalls: clone(input.toolCalls),
      retryAfter: null,
    }
    this.steps.set(key, completed)
    this.heartbeat(input.runId, 300)
    return clone(completed)
  }

  async failStep(input: FailDurableStepInput): Promise<DurableStepSnapshot> {
    const key = `${input.runId}:${input.stepKey}`
    const step = requiredStep(this.steps, key)
    assertClaimToken(step, input.claimToken)
    const failed: DurableStepSnapshot = {
      ...step,
      status: 'failed',
      claimToken: null,
      retryAfter: input.retryAfter,
    }
    this.steps.set(key, failed)
    return clone(failed)
  }

  async persistSignals(_runId: string, signals: IntelligenceSignal[]): Promise<number> {
    if (signals.length > 50) throw new ContractValidationError('A durable workflow step may persist at most 50 signals')
    for (const signal of signals) this.persistedSignals.set(`${signal.producer}:${signal.fingerprint}`, clone(signal))
    return signals.length
  }

  async completeRun(input: CompleteDurableRunInput): Promise<DurableRunSnapshot> {
    const run = requiredRun(this.runsById, input.runId)
    if (run.status === 'succeeded') return clone(run)
    if (run.status !== 'running') throw new DurableWorkflowPersistenceError('Only a running workflow run can complete')
    const completed: DurableRunSnapshot = {
      ...run,
      status: 'succeeded',
      output: clone(input.output),
      verificationStatus: 'verified',
      lastHeartbeatAt: this.now().toISOString(),
      staleAfter: null,
      retryAfter: null,
    }
    this.runsById.set(run.runId, completed)
    return clone(completed)
  }

  async failRun(input: FailDurableRunInput): Promise<DurableRunSnapshot> {
    const run = requiredRun(this.runsById, input.runId)
    if (run.status === 'succeeded') return clone(run)
    const failed: DurableRunSnapshot = {
      ...run,
      status: 'failed',
      verificationStatus: 'failed',
      lastHeartbeatAt: this.now().toISOString(),
      staleAfter: null,
      retryAfter: input.retryAfter,
    }
    this.runsById.set(run.runId, failed)
    return clone(failed)
  }

  async markStaleRuns(limit: number): Promise<number> {
    let marked = 0
    for (const [runId, run] of this.runsById) {
      if (marked >= limit) break
      if (run.status === 'running' && isExpired(run.staleAfter, this.now())) {
        this.runsById.set(runId, { ...run, status: 'stale', verificationStatus: 'failed' })
        marked += 1
      }
    }
    return marked
  }

  private heartbeat(runId: string, leaseSeconds: number): void {
    const run = requiredRun(this.runsById, runId)
    const now = this.now()
    this.runsById.set(runId, {
      ...run,
      lastHeartbeatAt: now.toISOString(),
      staleAfter: afterSeconds(now, leaseSeconds),
    })
  }
}

async function rpcValue<T>(
  client: SupabaseRpcClientLike,
  name: string,
  parameters: Record<string, unknown>,
): Promise<T> {
  const response = await client.rpc(name, parameters)
  if (response.error) {
    throw new DurableWorkflowPersistenceError(response.error.message ?? `Supabase RPC ${name} failed`, {
      code: response.error.code,
      details: response.error.details,
      hint: response.error.hint,
      operation: name,
    })
  }
  if (response.data === null) throw new DurableWorkflowPersistenceError(`Supabase RPC ${name} returned no result`)
  return response.data as T
}

function mapSignal(signal: IntelligenceSignal): Record<string, unknown> {
  return {
    id: signal.id,
    signal_type: signal.signalType,
    domain: signal.domain,
    producer: signal.producer,
    title: signal.title,
    summary: signal.summary,
    evidence: signal.evidence,
    source_refs: signal.sourceRefs,
    confidence: signal.confidence,
    severity: signal.severity,
    priority: signal.priority,
    business_impact: signal.businessImpact,
    affected_entities: signal.affectedEntities,
    recommended_follow_up: signal.recommendedFollowUp,
    fingerprint: signal.fingerprint,
    idempotency_key: signal.idempotencyKey,
    status: signal.status,
    first_detected_at: signal.firstDetectedAt,
    last_detected_at: signal.lastDetectedAt,
    correlation_id: signal.correlation.correlationId,
    causation_id: signal.correlation.causationId,
  }
}

function requiredRun(store: Map<string, DurableRunSnapshot>, runId: string): DurableRunSnapshot {
  const run = store.get(runId)
  if (!run) throw new DurableWorkflowPersistenceError('Durable workflow run does not exist')
  return run
}

function requiredStep(store: Map<string, DurableStepSnapshot>, key: string): DurableStepSnapshot {
  const step = store.get(key)
  if (!step) throw new DurableWorkflowPersistenceError('Durable workflow step does not exist')
  return step
}

function assertClaimToken(step: DurableStepSnapshot, claimToken: string): void {
  if (step.status !== 'running' || step.claimToken !== claimToken) {
    throw new DurableWorkflowPersistenceError('Durable workflow step claim is stale or invalid')
  }
}

function isExpired(value: string | null, now: Date): boolean {
  return value !== null && Date.parse(value) <= now.getTime()
}

function isFuture(value: string | null, now: Date): boolean {
  return value !== null && Date.parse(value) > now.getTime()
}

function afterSeconds(now: Date, seconds: number): string {
  return new Date(now.getTime() + seconds * 1000).toISOString()
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function sameJson(left: Record<string, unknown>, right: Record<string, unknown>): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

export class DurableWorkflowPersistenceError extends Error {
  readonly code = 'DURABLE_WORKFLOW_PERSISTENCE_FAILED'
  readonly details: Record<string, unknown>

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'DurableWorkflowPersistenceError'
    this.details = details
  }
}
