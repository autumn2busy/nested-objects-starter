import type { CorrelationContext } from '../contracts.js'
import { ContractValidationError } from '../contracts.js'
import { payloadDigest } from '../http/admin-request-auth.js'
import { assertServerOnlyControlPlaneAccess } from './control-plane-store.js'

export interface AdminRunSummary {
  id: string
  workflowName: string
  workflowRunId: string | null
  status: string
  verificationStatus: string
  conciseRationale: string | null
  correlationId: string
  causationId: string | null
  createdAt: string
  completedAt: string | null
}

export interface AdminSignalSummary {
  id: string
  signalType: string
  domain: string
  title: string
  summary: string
  severity: string
  priority: number
  status: string
  evidence: unknown[]
  sourceRefs: unknown[]
  correlationId: string
  causationId: string | null
  lastDetectedAt: string
}

export interface AdminActionSummary {
  id: string
  actionType: string
  targetSystem: string
  status: string
  riskLevel: string
  conciseRationale: string
  payload: Record<string, unknown>
  payloadDigest: string
  decisionVersion: number
  evidence: unknown[]
  sourceRefs: unknown[]
  signalIds: string[]
  runId: string | null
  approvalRequired: boolean
  approvedBy: string | null
  approvedAt: string | null
  rejectedBy: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  executorKey: string | null
  executionStartedAt: string | null
  executedAt: string | null
  correlationId: string
  causationId: string | null
  createdAt: string
}

export interface AdminSourceWarning {
  sensorName: string
  provenanceMode: string
  healthStatus: string
  sourceHealth: unknown[]
  sourceGeneratedAt: string | null
  lastObservedAt: string
  correlationId: string
}

export interface AdminExperimentSummary {
  id: string
  name: string
  status: string
  primaryMetric: string
  minimumSampleSize: number
  minimumDurationDays: number
  observedSampleSize: number
  observedDurationDays: number
  analysisState: string
  sampleReady: boolean
  durationReady: boolean
  correlationId: string
}

export interface AdminReviewSummary {
  id: string
  runId: string
  workflowName: string
  reviewDate: string
  status: string
  executiveSummary: string
  priorities: Array<Record<string, unknown>>
  autumnDecisions: Array<Record<string, unknown>>
  correlationId: string
  causationId: string | null
}

export interface AdminControlPlaneSnapshot {
  generatedAt: string
  runs: AdminRunSummary[]
  unresolvedSignals: AdminSignalSummary[]
  awaitingActions: AdminActionSummary[]
  sourceWarnings: AdminSourceWarning[]
  topPriorities: Array<Record<string, unknown>>
  experiments: AdminExperimentSummary[]
  reviews: AdminReviewSummary[]
  delegationEnabled: false
  executionEnabled: false
}

export interface AdminRunDetail {
  run: Record<string, unknown>
  steps: Array<Record<string, unknown>>
  events: Array<Record<string, unknown>>
  review: Record<string, unknown> | null
  recommendations: Array<Record<string, unknown>>
}

export interface AdminActionDecisionInput {
  actionId: string
  decision: 'approved' | 'rejected'
  expectedVersion: number
  expectedPayloadDigest: string
  reason: string
  actorSubject: string
  nonceDigest: string
  nonceExpiresAt: string
  decidedAt: string
  requestIdempotencyKey: string
}

export interface AdminActionDecisionResult {
  disposition: 'decided'
  actionId: string
  status: 'approved' | 'rejected'
  decisionVersion: number
  approvedPayloadDigest: string | null
  correlationId: string
  causationId: string | null
  executionStarted: false
}

export interface ConsumeAdminNonceInput {
  nonceDigest: string
  requestType: string
  actorSubject: string
  expiresAt: string
  correlation: CorrelationContext
}

export interface AdminControlPlaneStore {
  getSnapshot(actorSubject: string, limit?: number): Promise<AdminControlPlaneSnapshot>
  getRun(actorSubject: string, runId: string): Promise<AdminRunDetail | null>
  consumeNonce(input: ConsumeAdminNonceInput): Promise<'consumed'>
  decideAction(input: AdminActionDecisionInput): Promise<AdminActionDecisionResult>
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

export async function createSupabaseAdminControlPlaneStore(configuration: {
  url: string
  serviceRoleKey: string
}): Promise<AdminControlPlaneStore> {
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
  return new SupabaseAdminControlPlaneStore(client)
}

export class SupabaseAdminControlPlaneStore implements AdminControlPlaneStore {
  constructor(private readonly client: SupabaseRpcClientLike) {}

  async getSnapshot(actorSubject: string, limit = 50): Promise<AdminControlPlaneSnapshot> {
    const snapshot = await rpcValue<AdminControlPlaneSnapshot>(this.client, 'get_agent_admin_snapshot', {
      p_actor_subject: actorSubject,
      p_limit: boundedLimit(limit),
    })
    return {
      ...snapshot,
      awaitingActions: snapshot.awaitingActions.map(withPayloadDigest),
      delegationEnabled: false,
      executionEnabled: false,
    }
  }

  getRun(actorSubject: string, runId: string): Promise<AdminRunDetail | null> {
    return rpcNullable(this.client, 'get_agent_admin_run', {
      p_actor_subject: actorSubject,
      p_run_id: runId,
    })
  }

  consumeNonce(input: ConsumeAdminNonceInput): Promise<'consumed'> {
    return rpcValue(this.client, 'consume_agent_admin_nonce', {
      p_nonce_digest: input.nonceDigest,
      p_request_type: input.requestType,
      p_actor_subject: input.actorSubject,
      p_expires_at: input.expiresAt,
      p_correlation_id: input.correlation.correlationId,
      p_causation_id: input.correlation.causationId,
    })
  }

  async decideAction(input: AdminActionDecisionInput): Promise<AdminActionDecisionResult> {
    assertDecisionInput(input)
    const current = await rpcNullable<{
      id: string
      payload: Record<string, unknown>
      decisionVersion: number
    }>(this.client, 'get_agent_action_for_decision', {
      p_actor_subject: input.actorSubject,
      p_action_id: input.actionId,
    })
    if (!current) throw new AdminControlPlaneNotFoundError('The proposed action was not found')
    const currentDigest = payloadDigest(current.payload)
    if (current.decisionVersion !== input.expectedVersion || currentDigest !== input.expectedPayloadDigest) {
      throw new AdminControlPlaneConflictError('The proposed action changed after it was reviewed')
    }
    return rpcValue(this.client, 'decide_agent_action', {
      p_action_id: input.actionId,
      p_decision: input.decision,
      p_expected_version: input.expectedVersion,
      p_expected_payload: current.payload,
      p_expected_payload_digest: currentDigest,
      p_reason: input.reason,
      p_actor_subject: input.actorSubject,
      p_nonce_digest: input.nonceDigest,
      p_nonce_expires_at: input.nonceExpiresAt,
      p_decided_at: input.decidedAt,
      p_request_idempotency_key: input.requestIdempotencyKey,
    })
  }
}

export class InMemoryAdminControlPlaneStore implements AdminControlPlaneStore {
  readonly actions = new Map<string, AdminActionSummary>()
  readonly nonces = new Set<string>()
  readonly events: Array<Record<string, unknown>> = []

  constructor(
    private readonly ownerSubject: string,
    private readonly snapshot: Omit<AdminControlPlaneSnapshot, 'awaitingActions'> & { awaitingActions?: AdminActionSummary[] },
  ) {
    for (const action of snapshot.awaitingActions ?? []) this.actions.set(action.id, structuredClone(action))
  }

  async getSnapshot(actorSubject: string): Promise<AdminControlPlaneSnapshot> {
    this.assertOwner(actorSubject)
    return {
      ...structuredClone(this.snapshot),
      awaitingActions: [...this.actions.values()]
        .filter((action) => ['proposed', 'awaiting_approval'].includes(action.status))
        .map((action) => structuredClone(action)),
      delegationEnabled: false,
      executionEnabled: false,
    }
  }

  async getRun(actorSubject: string, runId: string): Promise<AdminRunDetail | null> {
    this.assertOwner(actorSubject)
    const run = this.snapshot.runs.find((candidate) => candidate.id === runId)
    return run ? { run: structuredClone(run) as unknown as Record<string, unknown>, steps: [], events: [], review: null, recommendations: [] } : null
  }

  async consumeNonce(input: ConsumeAdminNonceInput): Promise<'consumed'> {
    this.assertOwner(input.actorSubject)
    if (this.nonces.has(input.nonceDigest)) throw new AdminControlPlaneReplayError('Admin request nonce was already consumed')
    if (Date.parse(input.expiresAt) <= Date.now()) throw new AdminControlPlaneReplayError('Admin request nonce is expired')
    this.nonces.add(input.nonceDigest)
    this.events.push({
      eventType: 'agent.admin_request.authorized',
      actorSubject: input.actorSubject,
      requestType: input.requestType,
      correlation: structuredClone(input.correlation),
    })
    return 'consumed'
  }

  async decideAction(input: AdminActionDecisionInput): Promise<AdminActionDecisionResult> {
    this.assertOwner(input.actorSubject)
    assertDecisionInput(input)
    await this.consumeNonce({
      nonceDigest: input.nonceDigest,
      requestType: `action.${input.decision}`,
      actorSubject: input.actorSubject,
      expiresAt: input.nonceExpiresAt,
      correlation: { correlationId: input.actionId, causationId: null, traceId: null },
    })
    const action = this.actions.get(input.actionId)
    if (!action) throw new AdminControlPlaneNotFoundError('The proposed action was not found')
    if (!['proposed', 'awaiting_approval'].includes(action.status)) {
      throw new AdminControlPlaneConflictError('The proposed action is no longer awaiting a decision')
    }
    if (action.decisionVersion !== input.expectedVersion || payloadDigest(action.payload) !== input.expectedPayloadDigest) {
      throw new AdminControlPlaneConflictError('The proposed action changed after it was reviewed')
    }

    const approvedPayload = structuredClone(action.payload)
    const next: AdminActionSummary = {
      ...structuredClone(action),
      status: input.decision,
      decisionVersion: action.decisionVersion + 1,
      approvedBy: input.decision === 'approved' ? input.actorSubject : null,
      approvedAt: input.decision === 'approved' ? input.decidedAt : null,
      rejectedBy: input.decision === 'rejected' ? input.actorSubject : null,
      rejectedAt: input.decision === 'rejected' ? input.decidedAt : null,
      rejectionReason: input.decision === 'rejected' ? input.reason : null,
      payload: approvedPayload,
      payloadDigest: payloadDigest(approvedPayload),
      executorKey: null,
      executionStartedAt: null,
      executedAt: null,
    }
    this.actions.set(next.id, next)
    this.events.push({
      eventType: `agent.action.${input.decision}`,
      actionId: next.id,
      actorSubject: input.actorSubject,
      payloadDigest: next.payloadDigest,
      correlationId: next.correlationId,
      causationId: next.causationId,
    })
    return {
      disposition: 'decided',
      actionId: next.id,
      status: input.decision,
      decisionVersion: next.decisionVersion,
      approvedPayloadDigest: input.decision === 'approved' ? next.payloadDigest : null,
      correlationId: next.correlationId,
      causationId: next.causationId,
      executionStarted: false,
    }
  }

  private assertOwner(subject: string): void {
    if (subject !== this.ownerSubject) throw new AdminControlPlaneAuthorizationError('Stable owner subject is required')
  }
}

function withPayloadDigest(action: AdminActionSummary): AdminActionSummary {
  return { ...action, payloadDigest: payloadDigest(action.payload) }
}

function boundedLimit(limit: number): number {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return 50
  return limit
}

function assertDecisionInput(input: AdminActionDecisionInput): void {
  if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 0) {
    throw new ContractValidationError('Admin action decision requires a nonnegative expected version')
  }
  if (!/^[a-f0-9]{64}$/.test(input.expectedPayloadDigest) || !/^[a-f0-9]{64}$/.test(input.nonceDigest)) {
    throw new ContractValidationError('Admin action decision requires SHA-256 payload and nonce digests')
  }
  if (input.reason.trim().length < 3 || input.reason.trim().length > 1_000) {
    throw new ContractValidationError('Admin action decision reason must contain 3..1000 characters')
  }
}

async function rpcValue<T>(client: SupabaseRpcClientLike, name: string, parameters: Record<string, unknown>): Promise<T> {
  const response = await client.rpc(name, parameters)
  if (response.error) throw mappedRpcError(response.error, name)
  if (response.data === null) throw new AdminControlPlanePersistenceError(`Supabase RPC ${name} returned no result`)
  return response.data as T
}

async function rpcNullable<T>(client: SupabaseRpcClientLike, name: string, parameters: Record<string, unknown>): Promise<T | null> {
  const response = await client.rpc(name, parameters)
  if (response.error) throw mappedRpcError(response.error, name)
  return response.data as T | null
}

function mappedRpcError(error: SupabaseErrorLike, operation: string): Error {
  const message = error.message ?? `Supabase RPC ${operation} failed`
  if (/not the active owner subject/i.test(message)) return new AdminControlPlaneAuthorizationError(message)
  if (/already consumed|expired/i.test(message)) return new AdminControlPlaneReplayError(message)
  if (/changed|version|awaiting a decision|idempotency/i.test(message)) return new AdminControlPlaneConflictError(message)
  if (/not found/i.test(message)) return new AdminControlPlaneNotFoundError(message)
  return new AdminControlPlanePersistenceError(message, {
    code: error.code,
    details: error.details,
    hint: error.hint,
    operation,
  })
}

export class AdminControlPlanePersistenceError extends Error {
  readonly code = 'ADMIN_CONTROL_PLANE_PERSISTENCE_FAILED'
  constructor(message: string, readonly details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'AdminControlPlanePersistenceError'
  }
}

export class AdminControlPlaneAuthorizationError extends Error {
  readonly code = 'ADMIN_CONTROL_PLANE_AUTHORIZATION_FAILED'
  constructor(message: string) {
    super(message)
    this.name = 'AdminControlPlaneAuthorizationError'
  }
}

export class AdminControlPlaneReplayError extends Error {
  readonly code = 'ADMIN_CONTROL_PLANE_REPLAY_REJECTED'
  constructor(message: string) {
    super(message)
    this.name = 'AdminControlPlaneReplayError'
  }
}

export class AdminControlPlaneConflictError extends Error {
  readonly code = 'ADMIN_CONTROL_PLANE_CONFLICT'
  constructor(message: string) {
    super(message)
    this.name = 'AdminControlPlaneConflictError'
  }
}

export class AdminControlPlaneNotFoundError extends Error {
  readonly code = 'ADMIN_CONTROL_PLANE_NOT_FOUND'
  constructor(message: string) {
    super(message)
    this.name = 'AdminControlPlaneNotFoundError'
  }
}
