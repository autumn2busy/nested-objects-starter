import { ContractValidationError } from '../contracts.js'
import { payloadDigest, stableJson } from '../http/admin-request-auth.js'
import {
  assertLearningTraceBatch,
  learningTraceLinks,
  type AgentLearning,
  type ArtifactTraceLink,
  type LearningMeasurement,
  type LearningOutcome,
  type LearningTraceBatch,
} from '../learning/traceability.js'
import { assertServerOnlyControlPlaneAccess } from './control-plane-store.js'

export interface LearningTracePersistedCounts {
  outcomeCount: number
  measurementCount: number
  learningCount: number
  linkCount: number
}

export interface LearningTraceStore {
  persistBatch(batch: LearningTraceBatch): Promise<LearningTracePersistedCounts>
}

interface SupabaseErrorLike {
  message?: string
  code?: string
  details?: string
  hint?: string
}

interface SupabaseRpcClientLike {
  rpc(name: string, parameters: Record<string, unknown>): PromiseLike<{
    data: unknown
    error: SupabaseErrorLike | null
  }>
}

export async function createSupabaseLearningTraceStore(configuration: {
  url: string
  serviceRoleKey: string
}): Promise<LearningTraceStore> {
  assertServerOnlyControlPlaneAccess(configuration)
  const packageName = '@supabase/supabase-js'
  const supabaseModule = (await import(packageName)) as {
    createClient?: (url: string, key: string, options: Record<string, unknown>) => SupabaseRpcClientLike
  }
  if (typeof supabaseModule.createClient !== 'function') {
    throw new ContractValidationError('@supabase/supabase-js did not expose createClient')
  }
  const client = supabaseModule.createClient(configuration.url.trim(), configuration.serviceRoleKey.trim(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return new SupabaseLearningTraceStore(client)
}

export class SupabaseLearningTraceStore implements LearningTraceStore {
  constructor(private readonly client: SupabaseRpcClientLike) {}

  async persistBatch(batch: LearningTraceBatch): Promise<LearningTracePersistedCounts> {
    assertLearningTraceBatch(batch)
    const links = learningTraceLinks(batch)
    const response = await this.client.rpc('persist_agent_learning_trace', {
      p_outcomes: batch.outcomes.map(mapOutcome),
      p_measurements: batch.measurements.map(mapMeasurement),
      p_learnings: batch.learnings.map(mapLearning),
      p_links: links.map(mapTraceLink),
    })
    if (response.error) {
      throw new LearningTracePersistenceError(response.error.message ?? 'Learning trace persistence failed', {
        code: response.error.code,
        details: response.error.details,
        hint: response.error.hint,
      })
    }
    if (!response.data || typeof response.data !== 'object') {
      throw new LearningTracePersistenceError('Learning trace persistence returned no result')
    }
    return response.data as unknown as LearningTracePersistedCounts
  }
}

export class InMemoryLearningTraceStore implements LearningTraceStore {
  readonly outcomes = new Map<string, LearningOutcome>()
  readonly measurements = new Map<string, LearningMeasurement>()
  readonly learnings = new Map<string, AgentLearning>()
  readonly traceLinks = new Map<string, ArtifactTraceLink>()

  async persistBatch(batch: LearningTraceBatch): Promise<LearningTracePersistedCounts> {
    assertLearningTraceBatch(batch)
    for (const measurement of batch.measurements) {
      if (
        measurement.planMeasurementId
        && ![...this.measurements.values()].some((candidate) => candidate.id === measurement.planMeasurementId)
        && !batch.measurements.some((candidate) => candidate.id === measurement.planMeasurementId)
      ) {
        throw new LearningTracePersistenceError('Measurement plan link was not found')
      }
    }
    for (const outcome of batch.outcomes) putImmutable(this.outcomes, outcome.idempotencyKey, outcome, 'outcome')
    for (const measurement of batch.measurements) {
      putImmutable(this.measurements, measurement.idempotencyKey, measurement, 'measurement')
    }
    for (const learning of batch.learnings) putImmutable(this.learnings, learning.idempotencyKey, learning, 'learning')
    for (const link of learningTraceLinks(batch)) putImmutable(this.traceLinks, link.idempotencyKey, link, 'trace link')
    return counts(batch, learningTraceLinks(batch).length)
  }
}

export function mapTraceLink(link: ArtifactTraceLink): Record<string, unknown> {
  const record = {
    id: link.id,
    relationship: link.relationship,
    from_type: link.fromType,
    from_id: link.fromId,
    to_type: link.toType,
    to_id: link.toId,
    run_id: link.runId,
    experiment_id: link.experimentId,
    evidence: link.evidence,
    source_refs: link.sourceRefs,
    idempotency_key: link.idempotencyKey,
    correlation_id: link.correlation.correlationId,
    causation_id: link.correlation.causationId,
    trace_id: link.correlation.traceId,
  }
  return { ...record, record_checksum: payloadDigest(record) }
}

function mapOutcome(outcome: LearningOutcome): Record<string, unknown> {
  const record = {
    id: outcome.id,
    outcome_type: outcome.outcomeType,
    action_id: outcome.actionId,
    run_id: outcome.runId,
    experiment_id: outcome.experimentId,
    signal_ids: outcome.signalIds,
    state: outcome.state,
    summary: outcome.summary,
    evidence: outcome.evidence,
    source_refs: outcome.sourceRefs,
    observed_at: outcome.observedAt,
    verification_status: outcome.verificationStatus,
    idempotency_key: outcome.idempotencyKey,
    correlation_id: outcome.correlation.correlationId,
    causation_id: outcome.correlation.causationId,
    trace_id: outcome.correlation.traceId,
  }
  return { ...record, record_checksum: payloadDigest(record) }
}

function mapMeasurement(measurement: LearningMeasurement): Record<string, unknown> {
  const record = {
    id: measurement.id,
    metric_name: measurement.metricName,
    action_id: measurement.actionId,
    run_id: measurement.runId,
    experiment_id: measurement.experimentId,
    outcome_id: measurement.outcomeId,
    plan_measurement_id: measurement.planMeasurementId,
    status: measurement.status,
    numeric_value: measurement.value,
    value_state: measurement.valueState,
    unit: measurement.unit,
    minimum_sample_size: measurement.minimumSampleSize,
    minimum_duration_days: measurement.minimumDurationDays,
    observed_sample_size: measurement.observedSampleSize,
    observed_duration_days: measurement.observedDurationDays,
    evidence: measurement.evidence,
    source_refs: measurement.sourceRefs,
    measured_at: measurement.measuredAt,
    idempotency_key: measurement.idempotencyKey,
    correlation_id: measurement.correlation.correlationId,
    causation_id: measurement.correlation.causationId,
    trace_id: measurement.correlation.traceId,
  }
  return { ...record, record_checksum: payloadDigest(record) }
}

function mapLearning(learning: AgentLearning): Record<string, unknown> {
  const record = {
    id: learning.id,
    learning_type: learning.learningType,
    action_id: learning.actionId,
    experiment_id: learning.experimentId,
    outcome_id: learning.outcomeId,
    measurement_ids: learning.measurementIds,
    summary: learning.summary,
    decision: learning.decision,
    confidence: learning.confidence,
    review_status: learning.reviewStatus,
    evidence: learning.evidence,
    source_refs: learning.sourceRefs,
    learned_at: learning.learnedAt,
    idempotency_key: learning.idempotencyKey,
    correlation_id: learning.correlation.correlationId,
    causation_id: learning.correlation.causationId,
    trace_id: learning.correlation.traceId,
  }
  return { ...record, record_checksum: payloadDigest(record) }
}

function putImmutable<T>(store: Map<string, T>, key: string, value: T, label: string): void {
  const existing = store.get(key)
  if (existing && stableJson(existing) !== stableJson(value)) {
    throw new LearningTracePersistenceError(`${label} idempotency key was reused with different content`)
  }
  store.set(key, structuredClone(value))
}

function counts(batch: LearningTraceBatch, linkCount: number): LearningTracePersistedCounts {
  return {
    outcomeCount: batch.outcomes.length,
    measurementCount: batch.measurements.length,
    learningCount: batch.learnings.length,
    linkCount,
  }
}

export class LearningTracePersistenceError extends Error {
  readonly code = 'LEARNING_TRACE_PERSISTENCE_FAILED'

  constructor(message: string, readonly details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'LearningTracePersistenceError'
  }
}
