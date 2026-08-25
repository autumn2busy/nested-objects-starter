import type {
  ApprovalRecord,
  CorrelationContext,
  EvidenceReference,
  ProposedAction,
  RiskLevel,
  SourceReference,
} from './contracts.js'
import { ContractValidationError } from './contracts.js'

export const INTERNAL_ACTION_TYPES = [
  'internal.read_data',
  'internal.research',
  'internal.calculate',
  'internal.create_signal',
  'internal.create_task',
  'internal.record_recommendation',
  'internal.draft_copy',
  'internal.propose_action',
] as const

export const CONSEQUENTIAL_ACTION_TYPES = [
  'external.send_email',
  'external.cold_outreach',
  'activecampaign.change_campaign',
  'activecampaign.start_stop_automation',
  'content.publish',
  'billing.change_pricing',
  'billing.change_subscription',
  'production.bulk_change',
  'production.risky_data_repair',
  'data.use_paid_or_licensed_source',
  'deployment.production_deploy',
  'github.merge_pull_request',
  'production.destructive_operation',
] as const

export type InternalActionType = (typeof INTERNAL_ACTION_TYPES)[number]
export type ConsequentialActionType = (typeof CONSEQUENTIAL_ACTION_TYPES)[number]
export type KnownActionType = InternalActionType | ConsequentialActionType

export interface ActionPolicyDecision {
  actionType: string
  category: 'internal' | 'consequential' | 'unknown'
  riskLevel: RiskLevel
  approvalRequired: boolean
  proposalAllowed: boolean
  executionAvailableInPhaseB: boolean
  reason: string
  policyVersion: 'phase-b-v1'
}

const INTERNAL_POLICY = new Map<string, RiskLevel>([
  ['internal.read_data', 'low'],
  ['internal.research', 'low'],
  ['internal.calculate', 'low'],
  ['internal.create_signal', 'low'],
  ['internal.create_task', 'low'],
  ['internal.record_recommendation', 'low'],
  ['internal.draft_copy', 'medium'],
  ['internal.propose_action', 'medium'],
])

const CONSEQUENTIAL_POLICY = new Map<string, RiskLevel>([
  ['external.send_email', 'high'],
  ['external.cold_outreach', 'critical'],
  ['activecampaign.change_campaign', 'high'],
  ['activecampaign.start_stop_automation', 'critical'],
  ['content.publish', 'high'],
  ['billing.change_pricing', 'critical'],
  ['billing.change_subscription', 'critical'],
  ['production.bulk_change', 'critical'],
  ['production.risky_data_repair', 'critical'],
  ['data.use_paid_or_licensed_source', 'high'],
  ['deployment.production_deploy', 'critical'],
  ['github.merge_pull_request', 'critical'],
  ['production.destructive_operation', 'critical'],
])

export function evaluateActionPolicy(actionType: string): ActionPolicyDecision {
  const normalized = actionType.trim()
  if (!normalized) throw new ContractValidationError('actionType is required')

  const internalRisk = INTERNAL_POLICY.get(normalized)
  if (internalRisk) {
    return {
      actionType: normalized,
      category: 'internal',
      riskLevel: internalRisk,
      approvalRequired: false,
      proposalAllowed: true,
      executionAvailableInPhaseB: true,
      reason: 'Internal read-only or analytical operation.',
      policyVersion: 'phase-b-v1',
    }
  }

  const consequentialRisk = CONSEQUENTIAL_POLICY.get(normalized)
  if (consequentialRisk) {
    return {
      actionType: normalized,
      category: 'consequential',
      riskLevel: consequentialRisk,
      approvalRequired: true,
      proposalAllowed: true,
      executionAvailableInPhaseB: false,
      reason: 'Consequential external or production-facing mutation requires Autumn approval and a later registered executor.',
      policyVersion: 'phase-b-v1',
    }
  }

  return {
    actionType: normalized,
    category: 'unknown',
    riskLevel: 'critical',
    approvalRequired: true,
    proposalAllowed: true,
    executionAvailableInPhaseB: false,
    reason: 'Unknown action types fail closed as critical and approval-required.',
    policyVersion: 'phase-b-v1',
  }
}

export interface ProposedActionInput<TPayload extends Record<string, unknown>> {
  actionType: string
  targetSystem: string
  requestedByAgent: string
  taskId?: string | null
  runId?: string | null
  experimentId?: string | null
  signalIds?: string[]
  payload: TPayload
  evidence?: EvidenceReference[]
  sourceRefs?: SourceReference[]
  conciseRationale: string
  idempotencyKey: string
  correlation: CorrelationContext
  now?: string
}

export function createProposedAction<TPayload extends Record<string, unknown>>(
  input: ProposedActionInput<TPayload>,
): ProposedAction<TPayload> {
  const policy = evaluateActionPolicy(input.actionType)
  const now = input.now ?? new Date().toISOString()

  if (!input.targetSystem.trim()) throw new ContractValidationError('targetSystem is required')
  if (!input.requestedByAgent.trim()) throw new ContractValidationError('requestedByAgent is required')
  if (!input.conciseRationale.trim()) throw new ContractValidationError('conciseRationale is required')
  if (!input.idempotencyKey.trim()) throw new ContractValidationError('idempotencyKey is required')

  return {
    id: crypto.randomUUID(),
    actionType: policy.actionType,
    targetSystem: input.targetSystem,
    requestedByAgent: input.requestedByAgent,
    taskId: input.taskId ?? null,
    runId: input.runId ?? null,
    experimentId: input.experimentId ?? null,
    signalIds: [...(input.signalIds ?? [])],
    payload: input.payload,
    evidence: [...(input.evidence ?? [])],
    sourceRefs: [...(input.sourceRefs ?? [])],
    conciseRationale: input.conciseRationale,
    riskLevel: policy.riskLevel,
    approvalRequired: policy.approvalRequired,
    status: 'proposed',
    approval: null,
    rejection: null,
    executorKey: null,
    executionGuardVersion: policy.policyVersion,
    executionStartedAt: null,
    executedAt: null,
    executionResult: null,
    verificationStatus: 'not_started',
    verifiedAt: null,
    idempotencyKey: input.idempotencyKey,
    createdAt: now,
    updatedAt: now,
    correlation: input.correlation,
  }
}

export interface ApprovalDecisionInput {
  approvedBy: string
  approvedAt?: string
  approvalContext?: Record<string, unknown>
}

export function createApprovalRecord(input: ApprovalDecisionInput): ApprovalRecord {
  if (!input.approvedBy.trim()) throw new ContractValidationError('approvedBy is required')
  const approvalContext = input.approvalContext ?? { authority: 'owner' }
  if (approvalContext.authority !== 'owner') {
    throw new ContractValidationError('Phase B consequential approvals require owner authority')
  }
  return {
    approvedBy: input.approvedBy,
    approvedAt: input.approvedAt ?? new Date().toISOString(),
    approvalContext,
  }
}

export interface ActionExecutor<TPayload extends Record<string, unknown>, TResult extends Record<string, unknown>> {
  readonly key: string
  readonly actionType: string
  execute(input: {
    actionId: string
    payload: TPayload
    idempotencyKey: string
    correlation: CorrelationContext
    approval: ApprovalRecord | null
  }): Promise<TResult>
}

export interface ExecutionOptions {
  allowPhaseBInternalExecution?: boolean
}

export async function executeApprovedAction<
  TPayload extends Record<string, unknown>,
  TResult extends Record<string, unknown>,
>(
  action: ProposedAction<TPayload>,
  executor: ActionExecutor<TPayload, TResult>,
  options: ExecutionOptions = {},
): Promise<TResult> {
  const policy = evaluateActionPolicy(action.actionType)

  if (executor.actionType !== action.actionType) {
    throw new ActionExecutionGuardError('Executor action type does not match the proposal', {
      executorActionType: executor.actionType,
      proposalActionType: action.actionType,
    })
  }

  if (action.status !== 'approved') {
    throw new ActionExecutionGuardError('Action must be approved before execution', { status: action.status })
  }

  if (policy.approvalRequired && !action.approval) {
    throw new ActionExecutionGuardError('Consequential action is missing explicit approval')
  }

  if (!policy.executionAvailableInPhaseB) {
    throw new ActionExecutionGuardError(
      'Phase B does not install consequential external mutation executors. Stop at the approved proposal.',
      { actionType: action.actionType },
    )
  }

  if (!options.allowPhaseBInternalExecution) {
    throw new ActionExecutionGuardError('Internal action execution requires an explicitly injected Phase B test or host capability')
  }

  return executor.execute({
    actionId: action.id,
    payload: action.payload,
    idempotencyKey: action.idempotencyKey,
    correlation: action.correlation,
    approval: action.approval,
  })
}

export class ActionExecutionGuardError extends Error {
  readonly code = 'ACTION_EXECUTION_BLOCKED'
  readonly details: Record<string, unknown>

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ActionExecutionGuardError'
    this.details = details
  }
}
