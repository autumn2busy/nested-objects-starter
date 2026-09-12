import type {
  AgentRun,
  AgentTask,
  IntelligenceSignal,
  ProposedAction,
} from '../contracts.js'
import { assertIntelligenceSignal, ContractValidationError } from '../contracts.js'

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

interface SupabaseQueryLike<T extends Record<string, unknown> = Record<string, unknown>> {
  eq?(column: string, value: string): SupabaseQueryLike<T>
  select?(columns: string): SupabaseQueryLike<T>
  single?(): Promise<SupabaseResponseLike<T>>
  then?: Promise<SupabaseResponseLike<T>>['then']
}

interface SupabaseClientLike {
  from(table: string): {
    select?(columns: string): SupabaseQueryLike
    upsert(values: unknown, options?: Record<string, unknown>): SupabaseQueryLike
    insert(values: unknown): SupabaseQueryLike
    update(values: unknown): SupabaseQueryLike
  }
}

export interface ImmutableProposalStore {
  persistProposedActionOnce(action: ProposedAction): Promise<{ id: string; disposition: 'created' | 'reused' }>
}

export interface ControlPlaneStore {
  upsertSignal(signal: IntelligenceSignal): Promise<string>
  createTask(task: AgentTask): Promise<string>
  createAction(action: ProposedAction): Promise<string>
  createRun(run: AgentRun): Promise<string>
  updateTask(task: AgentTask): Promise<void>
  updateAction(action: ProposedAction): Promise<void>
  updateRun(run: AgentRun): Promise<void>
}

export interface SupabaseControlPlaneConfiguration {
  url: string
  serviceRoleKey: string
  browserEnvironment?: boolean
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

function isSecureOrLoopbackUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    if (parsed.protocol === 'https:') return true
    if (parsed.protocol !== 'http:') return false
    return LOOPBACK_HOSTS.has(parsed.hostname.toLowerCase())
  } catch {
    return false
  }
}

export function assertServerOnlyControlPlaneAccess(
  configuration: SupabaseControlPlaneConfiguration,
): void {
  const browserEnvironment =
    configuration.browserEnvironment ?? typeof (globalThis as { window?: unknown }).window !== 'undefined'
  const url = configuration.url.trim()
  const serviceRoleKey = configuration.serviceRoleKey.trim()

  if (browserEnvironment) {
    throw new ServerOnlyAccessError('The agent control-plane store cannot be created in a browser runtime')
  }
  if (!url || !serviceRoleKey) {
    throw new ServerOnlyAccessError('Supabase URL and service-role credentials are required')
  }
  if (!isSecureOrLoopbackUrl(url)) {
    throw new ServerOnlyAccessError(
      'Supabase URL must use HTTPS unless it targets localhost or another loopback address for local development',
    )
  }
  if (serviceRoleKey.startsWith('sb_publishable_')) {
    throw new ServerOnlyAccessError('A Supabase publishable key cannot mutate the private agent control plane')
  }

  if (serviceRoleKey.startsWith('sb_secret_')) return

  const segments = serviceRoleKey.split('.')
  if (segments.length !== 3) {
    throw new ServerOnlyAccessError('Service-role credential is neither a Supabase secret key nor a valid legacy JWT')
  }

  const payload = decodeJwtPayload(segments[1] ?? '')
  if (payload.role !== 'service_role') {
    throw new ServerOnlyAccessError('Supabase JWT must have role=service_role', { role: payload.role })
  }
}

export async function createSupabaseControlPlaneStore(
  configuration: SupabaseControlPlaneConfiguration,
): Promise<ControlPlaneStore & ImmutableProposalStore> {
  assertServerOnlyControlPlaneAccess(configuration)
  const supabaseModule = (await import('@supabase/supabase-js')) as unknown as {
    createClient?: (
      url: string,
      key: string,
      options: Record<string, unknown>,
    ) => SupabaseClientLike
  }

  if (typeof supabaseModule.createClient !== 'function') {
    throw new ContractValidationError('@supabase/supabase-js did not expose createClient')
  }

  const client = supabaseModule.createClient(
    configuration.url.trim(),
    configuration.serviceRoleKey.trim(),
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  )
  return new SupabaseControlPlaneStore(client)
}

export class SupabaseControlPlaneStore implements ControlPlaneStore, ImmutableProposalStore {
  constructor(private readonly client: SupabaseClientLike) {}

  async upsertSignal(signal: IntelligenceSignal): Promise<string> {
    assertIntelligenceSignal(signal)
    const response = await resolveQuery<{ id: string }>(
      this.client
        .from('intelligence_signals')
        .upsert(mapSignal(signal), { onConflict: 'producer,fingerprint' }),
      true,
    )
    return response.id
  }

  async createTask(task: AgentTask): Promise<string> {
    const response = await resolveQuery<{ id: string }>(
      this.client.from('agent_tasks').insert(mapTask(task)),
      true,
    )
    return response.id
  }

  async createAction(action: ProposedAction): Promise<string> {
    const response = await resolveQuery<{ id: string }>(
      this.client.from('agent_actions').insert(mapAction(action)),
      true,
    )
    return response.id
  }

  // A bounded insert followed by readback. Never upsert: a retry must not clear
  // owner decisions or execution state, even after the insert acknowledgment is lost.
  async persistProposedActionOnce(action: ProposedAction): Promise<{ id: string; disposition: 'created' | 'reused' }> {
    if (action.status !== 'proposed' || action.approval !== null || action.rejection !== null
      || action.executorKey !== null || action.executionStartedAt !== null || action.executedAt !== null
      || action.executionResult !== null || action.verificationStatus !== 'not_started' || action.verifiedAt !== null) {
      throw new ContractValidationError('Immutable proposal persistence accepts only unexecuted proposals')
    }
    let acknowledged = false
    try {
      const id = await this.createAction(action)
      if (id !== action.id) throw new ControlPlanePersistenceError('Proposal insert returned an unexpected ID')
      acknowledged = true
    } catch {
      // A unique conflict and a lost acknowledgment both require the same exact
      // readback. No retry or fallback write is made inside this method.
    }
    let existing: Record<string, unknown>
    try {
      const table = this.client.from('agent_actions')
      if (!table.select) throw new Error('Readback unavailable')
      const query = table.select('*')
      if (!query.eq) throw new Error('Exact-key readback unavailable')
      const filtered = query.eq('idempotency_key', action.idempotencyKey)
      if (!filtered.single) throw new Error('Single-row readback unavailable')
      const result = await filtered.single()
      if (result.error || !result.data) throw new Error('Readback failed')
      existing = result.data
    } catch {
      throw new ProposalReadbackUnknownError()
    }
    const expected = proposalBinding(mapAction(action))
    if (canonicalJson(proposalBinding(existing)) !== canonicalJson(expected)) {
      throw new ProposalBindingConflictError()
    }
    return { id: action.id, disposition: acknowledged ? 'created' : 'reused' }
  }

  async createRun(run: AgentRun): Promise<string> {
    const response = await resolveQuery<{ id: string }>(
      this.client.from('agent_runs').insert(mapRun(run)),
      true,
    )
    return response.id
  }

  async updateTask(task: AgentTask): Promise<void> {
    await resolveQuery(this.client.from('agent_tasks').update(mapTask(task)), false, task.id)
  }

  async updateAction(action: ProposedAction): Promise<void> {
    await resolveQuery(this.client.from('agent_actions').update(mapAction(action)), false, action.id)
  }

  async updateRun(run: AgentRun): Promise<void> {
    await resolveQuery(this.client.from('agent_runs').update(mapRun(run)), false, run.id)
  }
}

function proposalBinding(row: Record<string, unknown>): Record<string, unknown> {
  const keys = ['id', 'action_type', 'target_system', 'requested_by_agent', 'task_id', 'run_id',
    'experiment_id', 'signal_ids', 'payload', 'evidence', 'source_refs', 'concise_rationale',
    'risk_level', 'approval_required', 'execution_guard_version', 'idempotency_key',
    'correlation_id', 'causation_id', 'trace_id']
  return Object.fromEntries(keys.map((key) => [key, row[key]]))
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`
  return JSON.stringify(value) ?? 'undefined'
}

export class ProposalReadbackUnknownError extends Error {
  readonly code = 'PROPOSAL_READBACK_UNKNOWN'
  constructor() {
    super('Proposal persistence outcome is unknown; exact stored readback is required')
    this.name = 'ProposalReadbackUnknownError'
  }
}

export class ProposalBindingConflictError extends Error {
  readonly code = 'PROPOSAL_BINDING_CONFLICT'
  constructor() {
    super('Proposal idempotency key conflicts with a different immutable binding')
    this.name = 'ProposalBindingConflictError'
  }
}

async function resolveQuery<T extends Record<string, unknown>>(
  query: SupabaseQueryLike,
  returnSingle: boolean,
  matchId?: string,
): Promise<T> {
  let builder = query as SupabaseQueryLike<T>

  if (matchId) {
    if (typeof builder.eq !== 'function') {
      throw new ControlPlanePersistenceError('Supabase update builder is missing eq()')
    }
    builder = builder.eq('id', matchId)
  }

  if (returnSingle) {
    if (typeof builder.select !== 'function') {
      throw new ControlPlanePersistenceError('Supabase builder is missing select()')
    }
    builder = builder.select('id')
    if (typeof builder.single !== 'function') {
      throw new ControlPlanePersistenceError('Supabase builder is missing single()')
    }

    const response = await builder.single()
    if (response.error) throw persistenceError(response.error)
    if (!response.data) throw new ControlPlanePersistenceError('Supabase write returned no row')
    return response.data
  }

  const response = await (builder as unknown as Promise<SupabaseResponseLike<T>>)
  if (response.error) throw persistenceError(response.error)
  return (response.data ?? {}) as T
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

function mapTask(task: AgentTask): Record<string, unknown> {
  return {
    id: task.id,
    task_type: task.taskType,
    assigned_agent: task.assignedAgent,
    status: task.status,
    priority: task.priority,
    input: task.input,
    output: task.output,
    concise_rationale: task.conciseRationale,
    parent_task_id: task.parentTaskId,
    signal_id: task.signalId,
    experiment_id: task.experimentId,
    idempotency_key: task.idempotencyKey,
    attempts: task.attempts,
    max_attempts: task.maxAttempts,
    retry_after: task.retryAfter,
    started_at: task.startedAt,
    completed_at: task.completedAt,
    error: task.error,
    correlation_id: task.correlation.correlationId,
    causation_id: task.correlation.causationId,
    trace_id: task.correlation.traceId,
  }
}

function mapAction(action: ProposedAction): Record<string, unknown> {
  return {
    id: action.id,
    action_type: action.actionType,
    target_system: action.targetSystem,
    requested_by_agent: action.requestedByAgent,
    task_id: action.taskId,
    run_id: action.runId,
    experiment_id: action.experimentId,
    signal_ids: action.signalIds,
    payload: action.payload,
    evidence: action.evidence,
    source_refs: action.sourceRefs,
    concise_rationale: action.conciseRationale,
    risk_level: action.riskLevel,
    approval_required: action.approvalRequired,
    status: action.status,
    approved_by: action.approval?.approvedBy ?? null,
    approved_at: action.approval?.approvedAt ?? null,
    approval_authority: action.approval ? 'owner' : null,
    approval_context: action.approval?.approvalContext ?? {},
    rejected_by: action.rejection?.rejectedBy ?? null,
    rejected_at: action.rejection?.rejectedAt ?? null,
    rejection_reason: action.rejection?.reason ?? null,
    executor_key: action.executorKey,
    execution_guard_version: action.executionGuardVersion,
    execution_started_at: action.executionStartedAt,
    executed_at: action.executedAt,
    execution_result: action.executionResult,
    verification_status: action.verificationStatus,
    verified_at: action.verifiedAt,
    idempotency_key: action.idempotencyKey,
    correlation_id: action.correlation.correlationId,
    causation_id: action.correlation.causationId,
    trace_id: action.correlation.traceId,
  }
}

function mapRun(run: AgentRun): Record<string, unknown> {
  return {
    id: run.id,
    agent_name: run.agentName,
    workflow_name: run.workflowName,
    workflow_run_id: run.workflowRunId,
    durable_workflow_id: run.durableWorkflowId,
    task_id: run.taskId,
    provider: run.provider,
    model: run.model,
    runtime_version: run.runtimeVersion,
    status: run.status,
    input: run.input,
    output: run.output,
    concise_rationale: run.conciseRationale,
    tool_calls: run.toolCalls,
    input_tokens: run.inputTokens,
    output_tokens: run.outputTokens,
    estimated_cost: run.estimatedCost,
    attempt: run.attempt,
    max_attempts: run.maxAttempts,
    retry_after: run.retryAfter,
    started_at: run.startedAt,
    completed_at: run.completedAt,
    last_heartbeat_at: run.lastHeartbeatAt,
    stale_after: run.staleAfter,
    duration_ms: run.durationMs,
    error: run.error,
    idempotency_key: run.idempotencyKey,
    trace_id: run.correlation.traceId,
    correlation_id: run.correlation.correlationId,
    causation_id: run.correlation.causationId,
  }
}

function decodeJwtPayload(encodedPayload: string): Record<string, unknown> {
  try {
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const json = Buffer.from(padded, 'base64').toString('utf8')
    return JSON.parse(json) as Record<string, unknown>
  } catch (error) {
    throw new ServerOnlyAccessError('Supabase legacy JWT could not be decoded', {
      cause: error instanceof Error ? error.message : String(error),
    })
  }
}

function persistenceError(error: SupabaseErrorLike): ControlPlanePersistenceError {
  return new ControlPlanePersistenceError(error.message ?? 'Supabase control-plane write failed', {
    code: error.code,
    details: error.details,
    hint: error.hint,
  })
}

export class ServerOnlyAccessError extends Error {
  readonly code = 'SERVER_ONLY_ACCESS_REQUIRED'
  readonly details: Record<string, unknown>

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ServerOnlyAccessError'
    this.details = details
  }
}

export class ControlPlanePersistenceError extends Error {
  readonly code = 'CONTROL_PLANE_PERSISTENCE_FAILED'
  readonly details: Record<string, unknown>

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ControlPlanePersistenceError'
    this.details = details
  }
}
