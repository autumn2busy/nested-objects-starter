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

interface SupabaseClientLike {
  from(table: string): {
    upsert(values: unknown, options?: Record<string, unknown>): unknown
    insert(values: unknown): unknown
    update(values: unknown): unknown
  }
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

export function assertServerOnlyControlPlaneAccess(
  configuration: SupabaseControlPlaneConfiguration,
): void {
  const browserEnvironment =
    configuration.browserEnvironment ?? typeof (globalThis as { window?: unknown }).window !== 'undefined'

  if (browserEnvironment) {
    throw new ServerOnlyAccessError('The agent control-plane store cannot be created in a browser runtime')
  }
  if (!configuration.url.trim() || !configuration.serviceRoleKey.trim()) {
    throw new ServerOnlyAccessError('Supabase URL and service-role credentials are required')
  }
  if (!configuration.url.startsWith('https://')) {
    throw new ServerOnlyAccessError('Supabase URL must use HTTPS')
  }
  if (configuration.serviceRoleKey.startsWith('sb_publishable_')) {
    throw new ServerOnlyAccessError('A Supabase publishable key cannot mutate the private agent control plane')
  }

  if (configuration.serviceRoleKey.startsWith('sb_secret_')) return

  const segments = configuration.serviceRoleKey.split('.')
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
): Promise<ControlPlaneStore> {
  assertServerOnlyControlPlaneAccess(configuration)
  const packageName = '@supabase/supabase-js'
  const supabaseModule = (await import(packageName)) as {
    createClient?: (
      url: string,
      key: string,
      options: Record<string, unknown>,
    ) => SupabaseClientLike
  }
  if (typeof supabaseModule.createClient !== 'function') {
    throw new ContractValidationError('@supabase/supabase-js did not expose createClient')
  }
  const client = supabaseModule.createClient(configuration.url, configuration.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return new SupabaseControlPlaneStore(client)
}

export class SupabaseControlPlaneStore implements ControlPlaneStore {
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

async function resolveQuery<T extends Record<string, unknown>>(
  query: unknown,
  returnSingle: boolean,
  matchId?: string,
): Promise<T> {
  let builder = query as {
    eq?: (column: string, value: string) => unknown
    select?: (columns: string) => unknown
    single?: () => Promise<SupabaseResponseLike<T>>
    then?: Promise<SupabaseResponseLike<T>>['then']
  }

  if (matchId) {
    if (typeof builder.eq !== 'function') throw new ControlPlanePersistenceError('Supabase update builder is missing eq()')
    builder = builder.eq('id', matchId) as typeof builder
  }

  if (returnSingle) {
    if (typeof builder.select !== 'function') throw new ControlPlanePersistenceError('Supabase builder is missing select()')
    builder = builder.select('id') as typeof builder
    if (typeof builder.single !== 'function') throw new ControlPlanePersistenceError('Supabase builder is missing single()')
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
    const json = atob(padded)
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
