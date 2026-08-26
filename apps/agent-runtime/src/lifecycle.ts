import type {
  AgentRun,
  AgentTask,
  ApprovalRecord,
  CorrelationContext,
  OperationalError,
  ProposedAction,
  RejectionRecord,
  RunStatus,
  TaskStatus,
  ActionStatus,
} from './contracts.js'
import { assertPriority, ContractValidationError } from './contracts.js'
import { evaluateActionPolicy } from './policy.js'

const TASK_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  pending: ['queued', 'blocked', 'cancelled'],
  queued: ['running', 'blocked', 'cancelled'],
  running: ['succeeded', 'failed', 'cancelled', 'stale'],
  succeeded: [],
  failed: ['queued', 'cancelled'],
  cancelled: [],
  blocked: ['queued', 'cancelled'],
  stale: ['queued', 'failed', 'cancelled'],
}

const ACTION_TRANSITIONS: Record<ActionStatus, readonly ActionStatus[]> = {
  proposed: ['awaiting_approval', 'approved', 'cancelled'],
  awaiting_approval: ['approved', 'rejected', 'cancelled'],
  approved: ['executing', 'cancelled'],
  executing: ['executed', 'failed', 'cancelled'],
  executed: ['verified', 'failed'],
  verified: [],
  rejected: [],
  failed: [],
  cancelled: [],
}

const RUN_TRANSITIONS: Record<RunStatus, readonly RunStatus[]> = {
  queued: ['running', 'cancelled'],
  running: ['succeeded', 'failed', 'cancelled', 'stale'],
  succeeded: [],
  failed: ['queued', 'cancelled'],
  cancelled: [],
  stale: ['queued', 'failed', 'cancelled'],
}

export interface CreateTaskInput<TInput extends Record<string, unknown>> {
  taskType: string
  assignedAgent: string
  priority: number
  input: TInput
  parentTaskId?: string | null
  signalId?: string | null
  experimentId?: string | null
  idempotencyKey: string
  maxAttempts?: number
  correlation: CorrelationContext
  now?: string
}

export function createAgentTask<TInput extends Record<string, unknown>>(
  input: CreateTaskInput<TInput>,
): AgentTask<TInput> {
  assertPriority(input.priority)
  if (!input.taskType.trim()) throw new ContractValidationError('taskType is required')
  if (!input.assignedAgent.trim()) throw new ContractValidationError('assignedAgent is required')
  if (!input.idempotencyKey.trim()) throw new ContractValidationError('idempotencyKey is required')
  const maxAttempts = input.maxAttempts ?? 3
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new ContractValidationError('maxAttempts must be a positive integer')
  }
  const now = input.now ?? new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    taskType: input.taskType,
    assignedAgent: input.assignedAgent,
    status: 'pending',
    priority: input.priority,
    input: structuredClone(input.input),
    output: null,
    conciseRationale: null,
    parentTaskId: input.parentTaskId ?? null,
    signalId: input.signalId ?? null,
    experimentId: input.experimentId ?? null,
    idempotencyKey: input.idempotencyKey,
    attempts: 0,
    maxAttempts,
    retryAfter: null,
    createdAt: now,
    startedAt: null,
    completedAt: null,
    error: null,
    correlation: structuredClone(input.correlation),
  }
}

export interface TaskTransitionContext<TOutput extends Record<string, unknown>> {
  now?: string
  output?: TOutput
  conciseRationale?: string
  error?: OperationalError
  retryAfter?: string | null
}

export function transitionTask<
  TInput extends Record<string, unknown>,
  TOutput extends Record<string, unknown>,
>(
  task: AgentTask<TInput, TOutput>,
  nextStatus: TaskStatus,
  context: TaskTransitionContext<TOutput> = {},
): AgentTask<TInput, TOutput> {
  assertTransition('task', task.status, nextStatus, TASK_TRANSITIONS)
  const now = context.now ?? new Date().toISOString()
  const next = structuredClone(task)
  next.status = nextStatus

  if (nextStatus === 'running') {
    if (task.attempts >= task.maxAttempts) {
      throw new LifecycleTransitionError('Task cannot start because maxAttempts has been reached', {
        attempts: task.attempts,
        maxAttempts: task.maxAttempts,
      })
    }
    next.attempts += 1
    next.startedAt ??= now
    next.retryAfter = null
    next.error = null
  }

  if (nextStatus === 'queued') {
    if (task.attempts >= task.maxAttempts) {
      throw new LifecycleTransitionError('Task cannot be requeued because maxAttempts has been reached')
    }
    next.retryAfter = context.retryAfter ?? null
    next.completedAt = null
  }

  if (nextStatus === 'succeeded') {
    if (!context.output) throw new LifecycleTransitionError('Succeeded task requires output')
    next.output = structuredClone(context.output)
    next.conciseRationale = context.conciseRationale ?? task.conciseRationale
    next.completedAt = now
    next.error = null
  }

  if (nextStatus === 'failed' || nextStatus === 'stale') {
    if (!context.error) throw new LifecycleTransitionError(`${nextStatus} task requires an operational error`)
    next.error = structuredClone(context.error)
    next.completedAt = now
    next.retryAfter = context.retryAfter ?? null
  }

  if (nextStatus === 'cancelled') next.completedAt = now
  if (nextStatus === 'blocked') next.retryAfter = context.retryAfter ?? null

  return next
}

export interface ActionTransitionContext {
  now?: string
  approval?: ApprovalRecord
  rejection?: RejectionRecord
  executorKey?: string
  executionResult?: Record<string, unknown>
  verificationStatus?: ProposedAction['verificationStatus']
  error?: Record<string, unknown>
}

export function transitionAction<TPayload extends Record<string, unknown>>(
  action: ProposedAction<TPayload>,
  nextStatus: ActionStatus,
  context: ActionTransitionContext = {},
): ProposedAction<TPayload> {
  assertTransition('action', action.status, nextStatus, ACTION_TRANSITIONS)
  const policy = evaluateActionPolicy(action.actionType)
  const now = context.now ?? new Date().toISOString()
  const next = structuredClone(action)
  next.status = nextStatus
  next.updatedAt = now

  if (nextStatus === 'awaiting_approval' && !action.approvalRequired) {
    throw new LifecycleTransitionError('Only approval-required actions should enter awaiting_approval')
  }

  if (nextStatus === 'approved') {
    if (action.approvalRequired && !context.approval) {
      throw new LifecycleTransitionError('Approval-required action cannot be approved without an owner approval record')
    }
    if (!action.approvalRequired && action.status === 'awaiting_approval' && !context.approval) {
      throw new LifecycleTransitionError('Manually reviewed action requires an approval record')
    }
    next.approval = context.approval ? structuredClone(context.approval) : action.approval
    next.rejection = null
  }

  if (nextStatus === 'rejected') {
    if (!context.rejection) throw new LifecycleTransitionError('Rejected action requires a rejection record')
    next.rejection = structuredClone(context.rejection)
  }

  if (nextStatus === 'executing') {
    if (!policy.executionAvailableInPhaseB) {
      throw new LifecycleTransitionError('Phase B cannot transition consequential actions into execution')
    }
    if (policy.approvalRequired && !action.approval) {
      throw new LifecycleTransitionError('Consequential action cannot execute without explicit approval')
    }
    if (!context.executorKey?.trim()) throw new LifecycleTransitionError('Executing action requires an executor key')
    next.executorKey = context.executorKey
    next.executionStartedAt = now
  }

  if (nextStatus === 'executed') {
    if (!context.executionResult) throw new LifecycleTransitionError('Executed action requires an execution result')
    next.executionResult = structuredClone(context.executionResult)
    next.executedAt = now
    next.verificationStatus = 'pending'
  }

  if (nextStatus === 'verified') {
    const verificationStatus = context.verificationStatus ?? 'verified'
    if (!['verified', 'not_applicable'].includes(verificationStatus)) {
      throw new LifecycleTransitionError('Verified action requires verified or not_applicable verification status')
    }
    next.verificationStatus = verificationStatus
    next.verifiedAt = now
  }

  if (nextStatus === 'failed') {
    next.executionResult = { ...(context.error ?? {}), failedAt: now }
    next.verificationStatus = 'failed'
  }

  return next
}

export interface CreateRunInput<TInput extends Record<string, unknown>> {
  agentName: string
  workflowName: string
  workflowRunId?: string | null
  durableWorkflowId?: string | null
  taskId?: string | null
  provider?: string | null
  model?: string | null
  runtimeVersion: string
  input: TInput
  maxAttempts?: number
  staleAfter?: string | null
  idempotencyKey: string
  correlation: CorrelationContext
}

export function createAgentRun<TInput extends Record<string, unknown>>(
  input: CreateRunInput<TInput>,
): AgentRun<TInput> {
  if (!input.agentName.trim() || !input.workflowName.trim()) {
    throw new ContractValidationError('agentName and workflowName are required')
  }
  if (!input.idempotencyKey.trim()) throw new ContractValidationError('idempotencyKey is required')
  const maxAttempts = input.maxAttempts ?? 3
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new ContractValidationError('maxAttempts must be a positive integer')
  }

  return {
    id: crypto.randomUUID(),
    agentName: input.agentName,
    workflowName: input.workflowName,
    workflowRunId: input.workflowRunId ?? null,
    durableWorkflowId: input.durableWorkflowId ?? null,
    taskId: input.taskId ?? null,
    provider: input.provider ?? null,
    model: input.model ?? null,
    runtimeVersion: input.runtimeVersion,
    status: 'queued',
    input: structuredClone(input.input),
    output: null,
    conciseRationale: null,
    toolCalls: [],
    inputTokens: null,
    outputTokens: null,
    estimatedCost: null,
    attempt: 0,
    maxAttempts,
    retryAfter: null,
    startedAt: null,
    completedAt: null,
    lastHeartbeatAt: null,
    staleAfter: input.staleAfter ?? null,
    durationMs: null,
    error: null,
    idempotencyKey: input.idempotencyKey,
    correlation: structuredClone(input.correlation),
  }
}

export interface RunTransitionContext<TOutput extends Record<string, unknown>> {
  now?: string
  output?: TOutput
  conciseRationale?: string
  error?: OperationalError
  retryAfter?: string | null
  usage?: {
    inputTokens?: number | null
    outputTokens?: number | null
    estimatedCost?: number | null
  }
}

export function transitionRun<
  TInput extends Record<string, unknown>,
  TOutput extends Record<string, unknown>,
>(
  run: AgentRun<TInput, TOutput>,
  nextStatus: RunStatus,
  context: RunTransitionContext<TOutput> = {},
): AgentRun<TInput, TOutput> {
  assertTransition('run', run.status, nextStatus, RUN_TRANSITIONS)
  const now = context.now ?? new Date().toISOString()
  const next = structuredClone(run)
  next.status = nextStatus

  if (nextStatus === 'running') {
    if (run.attempt >= run.maxAttempts) {
      throw new LifecycleTransitionError('Run cannot start because maxAttempts has been reached')
    }
    next.attempt += 1
    next.startedAt ??= now
    next.lastHeartbeatAt = now
    next.retryAfter = null
    next.error = null
  }

  if (nextStatus === 'queued') {
    if (run.attempt >= run.maxAttempts) {
      throw new LifecycleTransitionError('Run cannot be requeued because maxAttempts has been reached')
    }
    next.retryAfter = context.retryAfter ?? null
    next.completedAt = null
    next.durationMs = null
  }

  if (nextStatus === 'succeeded') {
    if (!context.output) throw new LifecycleTransitionError('Succeeded run requires output')
    next.output = structuredClone(context.output)
    next.conciseRationale = context.conciseRationale ?? run.conciseRationale
    next.completedAt = now
    next.durationMs = run.startedAt ? Math.max(0, Date.parse(now) - Date.parse(run.startedAt)) : null
    next.error = null
  }

  if (nextStatus === 'failed' || nextStatus === 'stale') {
    if (!context.error) throw new LifecycleTransitionError(`${nextStatus} run requires an operational error`)
    next.error = structuredClone(context.error)
    next.completedAt = now
    next.durationMs = run.startedAt ? Math.max(0, Date.parse(now) - Date.parse(run.startedAt)) : null
    next.retryAfter = context.retryAfter ?? null
  }

  if (nextStatus === 'cancelled') {
    next.completedAt = now
    next.durationMs = run.startedAt ? Math.max(0, Date.parse(now) - Date.parse(run.startedAt)) : null
  }

  if (context.usage) {
    next.inputTokens = context.usage.inputTokens ?? next.inputTokens
    next.outputTokens = context.usage.outputTokens ?? next.outputTokens
    next.estimatedCost = context.usage.estimatedCost ?? next.estimatedCost
  }

  return next
}

export function heartbeatRun<TInput extends Record<string, unknown>, TOutput extends Record<string, unknown>>(
  run: AgentRun<TInput, TOutput>,
  heartbeatAt = new Date().toISOString(),
): AgentRun<TInput, TOutput> {
  if (run.status !== 'running') throw new LifecycleTransitionError('Only running agent runs accept heartbeats')
  return { ...structuredClone(run), lastHeartbeatAt: heartbeatAt }
}

export function isRunStale(
  run: AgentRun,
  now = new Date().toISOString(),
): boolean {
  if (run.status !== 'running' || !run.staleAfter) return false
  return Date.parse(run.staleAfter) <= Date.parse(now)
}

function assertTransition<TStatus extends string>(
  entity: string,
  current: TStatus,
  next: TStatus,
  transitions: Record<TStatus, readonly TStatus[]>,
): void {
  if (!transitions[current].includes(next)) {
    throw new LifecycleTransitionError(`Invalid ${entity} transition: ${current} -> ${next}`, {
      entity,
      current,
      next,
    })
  }
}

export class LifecycleTransitionError extends Error {
  readonly code = 'INVALID_LIFECYCLE_TRANSITION'
  readonly details: Record<string, unknown>

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'LifecycleTransitionError'
    this.details = details
  }
}
