import type { IntelligenceSignal, ProposedAction } from '../contracts.js'
import { ContractValidationError } from '../contracts.js'
import type { MarketingExperimentProposal } from '../agents/marketing-agent.js'
import type {
  OperationsOrchestratorStateStore,
  OrchestratorOperationalState,
  OrchestratorTaskDraft,
} from '../agents/operations-orchestrator.js'
import type { AgentRecommendation, AutumnDecision } from '../agents/specialist-contracts.js'
import { buildOperatingArtifactTraceLinks, type ArtifactTraceLink } from '../learning/traceability.js'
import { assertServerOnlyControlPlaneAccess } from './control-plane-store.js'
import { mapTraceLink } from './learning-trace-store.js'

export type OperatingWorkflowName = 'conversion_review' | 'daily_business_health' | 'weekly_operating_review'

export interface OperatingReviewRecord {
  id: string
  runId: string
  workflowName: OperatingWorkflowName
  reviewDate: string
  status: 'completed' | 'quiet'
  executiveSummary: string
  priorities: Array<Record<string, unknown>>
  autumnDecisions: AutumnDecision[]
  output: Record<string, unknown>
  idempotencyKey: string
  correlationId: string
  causationId: string | null
}

export interface OperatingWorkflowArtifactBatch {
  runId: string
  workflowName: OperatingWorkflowName
  review: OperatingReviewRecord
  signals: IntelligenceSignal[]
  recommendations: AgentRecommendation[]
  tasks: OrchestratorTaskDraft[]
  experiments: MarketingExperimentProposal[]
  actions: ProposedAction[]
}

export interface OperatingWorkflowPersistedCounts {
  signalCount: number
  recommendationCount: number
  taskCount: number
  experimentCount: number
  actionCount: number
  reviewCount: 1
}

export interface OperatingWorkflowStore extends OperationsOrchestratorStateStore {
  persistArtifacts(batch: OperatingWorkflowArtifactBatch): Promise<OperatingWorkflowPersistedCounts>
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

export async function createSupabaseOperatingWorkflowStore(configuration: {
  url: string
  serviceRoleKey: string
}): Promise<OperatingWorkflowStore> {
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
  return new SupabaseOperatingWorkflowStore(client)
}

export class SupabaseOperatingWorkflowStore implements OperatingWorkflowStore {
  constructor(private readonly client: SupabaseRpcClientLike) {}

  async persist(state: OrchestratorOperationalState): Promise<'created' | 'reused'> {
    return rpcValue(this.client, 'persist_agent_orchestrator_state', {
      p_idempotency_key: state.idempotencyKey,
      p_workflow_name: state.workflowName,
      p_state: state,
      p_correlation_id: state.correlation.correlationId,
      p_causation_id: state.correlation.causationId,
    })
  }

  async persistArtifacts(batch: OperatingWorkflowArtifactBatch): Promise<OperatingWorkflowPersistedCounts> {
    assertBatchBounds(batch)
    const persisted = await rpcValue<OperatingWorkflowPersistedCounts>(this.client, 'persist_agent_operating_workflow_batch', {
      p_run_id: batch.runId,
      p_workflow_name: batch.workflowName,
      p_review: mapReview(batch.review),
      p_signals: batch.signals.map(mapSignal),
      p_recommendations: batch.recommendations.map((recommendation) => mapRecommendation(recommendation, batch)),
      p_tasks: batch.tasks.map(mapTask),
      p_experiments: batch.experiments.map((experiment) => mapExperiment(experiment, batch)),
      p_actions: batch.actions.map((action) => mapAction(action, batch.runId)),
    })
    const traceLinks = buildOperatingArtifactTraceLinks(batch)
    await rpcValue(this.client, 'persist_agent_trace_links', {
      p_run_id: batch.runId,
      p_links: traceLinks.map(mapTraceLink),
    })
    return persisted
  }
}

export class InMemoryOperatingWorkflowStore implements OperatingWorkflowStore {
  readonly states = new Map<string, OrchestratorOperationalState>()
  readonly reviews = new Map<string, OperatingReviewRecord>()
  readonly signals = new Map<string, IntelligenceSignal>()
  readonly recommendations = new Map<string, AgentRecommendation>()
  readonly tasks = new Map<string, OrchestratorTaskDraft>()
  readonly experiments = new Map<string, MarketingExperimentProposal>()
  readonly actions = new Map<string, ProposedAction>()
  readonly traceLinks = new Map<string, ArtifactTraceLink>()

  async persist(state: OrchestratorOperationalState): Promise<'created' | 'reused'> {
    const existing = this.states.get(state.idempotencyKey)
    if (existing) {
      if (!sameJson(withoutTimestamp(existing), withoutTimestamp(state))) {
        throw new OperatingWorkflowPersistenceError('Orchestrator state idempotency key was reused with different state')
      }
      return 'reused'
    }
    this.states.set(state.idempotencyKey, structuredClone(state))
    return 'created'
  }

  async persistArtifacts(batch: OperatingWorkflowArtifactBatch): Promise<OperatingWorkflowPersistedCounts> {
    assertBatchBounds(batch)
    const existingReview = this.reviews.get(batch.review.idempotencyKey)
    if (existingReview && !sameJson(existingReview, batch.review)) {
      throw new OperatingWorkflowPersistenceError('Operating review idempotency key was reused with different output')
    }
    this.reviews.set(batch.review.idempotencyKey, structuredClone(batch.review))
    for (const signal of batch.signals) this.signals.set(`${signal.producer}:${signal.fingerprint}`, structuredClone(signal))
    for (const recommendation of batch.recommendations) {
      putIdempotently(this.recommendations, recommendation.id, recommendation, 'recommendation')
    }
    for (const task of batch.tasks) putIdempotently(this.tasks, task.idempotencyKey, task, 'task')
    for (const experiment of batch.experiments) putIdempotently(this.experiments, experiment.id, experiment, 'experiment')
    for (const action of batch.actions) putIdempotently(this.actions, action.idempotencyKey, action, 'action')
    for (const link of buildOperatingArtifactTraceLinks(batch)) {
      putIdempotently(this.traceLinks, link.idempotencyKey, link, 'trace link')
    }
    return countsFor(batch)
  }
}

function assertBatchBounds(batch: OperatingWorkflowArtifactBatch): void {
  const bounds = [
    ['signals', batch.signals.length, 50],
    ['recommendations', batch.recommendations.length, 20],
    ['tasks', batch.tasks.length, 10],
    ['experiments', batch.experiments.length, 10],
    ['actions', batch.actions.length, 10],
  ] as const
  for (const [name, count, maximum] of bounds) {
    if (count > maximum) throw new ContractValidationError(`${name} exceed the ${maximum}-record operating workflow bound`)
  }
  if (batch.review.runId !== batch.runId || batch.review.workflowName !== batch.workflowName) {
    throw new ContractValidationError('Operating review does not match its durable run batch')
  }
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

async function rpcValue<T>(
  client: SupabaseRpcClientLike,
  name: string,
  parameters: Record<string, unknown>,
): Promise<T> {
  const response = await client.rpc(name, parameters)
  if (response.error) {
    throw new OperatingWorkflowPersistenceError(response.error.message ?? `Supabase RPC ${name} failed`, {
      code: response.error.code,
      details: response.error.details,
      hint: response.error.hint,
      operation: name,
    })
  }
  if (response.data === null) throw new OperatingWorkflowPersistenceError(`Supabase RPC ${name} returned no result`)
  return response.data as T
}

function mapReview(review: OperatingReviewRecord): Record<string, unknown> {
  return {
    id: review.id,
    run_id: review.runId,
    workflow_name: review.workflowName,
    review_date: review.reviewDate,
    status: review.status,
    executive_summary: review.executiveSummary,
    priorities: review.priorities,
    autumn_decisions: review.autumnDecisions,
    output: review.output,
    idempotency_key: review.idempotencyKey,
    correlation_id: review.correlationId,
    causation_id: review.causationId,
  }
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

function mapRecommendation(
  recommendation: AgentRecommendation,
  batch: OperatingWorkflowArtifactBatch,
): Record<string, unknown> {
  return {
    id: recommendation.id,
    run_id: batch.runId,
    workflow_name: batch.workflowName,
    recommendation_type: recommendation.domain,
    title: recommendation.title,
    summary: recommendation.summary,
    priority: recommendation.priority,
    signal_ids: recommendation.signalIds,
    source_refs: recommendation.evidenceReferences,
    recommended_follow_up: recommendation.recommendedFollowUp,
    fingerprint: recommendation.id,
    idempotency_key: `recommendation:${recommendation.id}`,
    correlation_id: recommendation.correlation.correlationId,
    causation_id: recommendation.correlation.causationId,
  }
}

function mapTask(task: OrchestratorTaskDraft): Record<string, unknown> {
  return {
    id: task.id,
    task_type: task.taskType,
    assigned_agent: task.assignedAgent,
    status: task.status,
    priority: task.priority,
    input: { signalId: task.signalId },
    concise_rationale: task.conciseRationale,
    signal_id: task.signalId,
    idempotency_key: task.idempotencyKey,
    attempts: 0,
    max_attempts: 3,
    correlation_id: task.correlation.correlationId,
    causation_id: task.correlation.causationId,
    trace_id: task.correlation.traceId,
  }
}

function mapExperiment(
  experiment: MarketingExperimentProposal,
  batch: OperatingWorkflowArtifactBatch,
): Record<string, unknown> {
  return {
    id: experiment.id,
    name: experiment.name,
    hypothesis: experiment.hypothesis,
    status: 'draft',
    audience: { audienceDefinitionId: experiment.audienceDefinitionId },
    primary_metric: experiment.primaryMetric,
    minimum_sample_size: experiment.minimumSampleSize,
    minimum_duration_days: experiment.minimumDurationDays,
    guardrails: { rules: experiment.guardrails },
    idempotency_key: `experiment:${experiment.id}`,
    correlation_id: batch.review.correlationId,
    causation_id: batch.review.causationId,
  }
}

function mapAction(action: ProposedAction, runId: string): Record<string, unknown> {
  return {
    id: action.id,
    action_type: action.actionType,
    target_system: action.targetSystem,
    requested_by_agent: action.requestedByAgent,
    task_id: action.taskId,
    run_id: runId,
    experiment_id: action.experimentId,
    signal_ids: action.signalIds,
    payload: action.payload,
    evidence: action.evidence,
    source_refs: action.sourceRefs,
    concise_rationale: action.conciseRationale,
    risk_level: action.riskLevel,
    approval_required: action.approvalRequired,
    status: action.status,
    execution_guard_version: action.executionGuardVersion,
    verification_status: action.verificationStatus,
    idempotency_key: action.idempotencyKey,
    correlation_id: action.correlation.correlationId,
    causation_id: action.correlation.causationId,
    trace_id: action.correlation.traceId,
  }
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function putIdempotently<T>(store: Map<string, T>, key: string, value: T, label: string): void {
  const existing = store.get(key)
  if (existing && !sameJson(existing, value)) {
    throw new OperatingWorkflowPersistenceError(`${label} idempotency key was reused with different output`)
  }
  store.set(key, structuredClone(value))
}

function withoutTimestamp(state: OrchestratorOperationalState): Omit<OrchestratorOperationalState, 'persistedAt'> {
  const { persistedAt: _persistedAt, ...value } = state
  return value
}

export class OperatingWorkflowPersistenceError extends Error {
  readonly code = 'OPERATING_WORKFLOW_PERSISTENCE_FAILED'
  readonly details: Record<string, unknown>

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'OperatingWorkflowPersistenceError'
    this.details = details
  }
}
