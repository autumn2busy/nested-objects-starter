import type {
  CorrelationContext,
  EvidenceReference,
  SourceReference,
} from '../contracts.js'
import { assertConfidence, assertUuid, ContractValidationError } from '../contracts.js'
import type { OperatingWorkflowArtifactBatch } from '../persistence/operating-workflow-store.js'
import { stableUuid } from '../stable-id.js'

export type TraceRelationship =
  | 'workflow_persisted_artifact'
  | 'observation_produced_signal'
  | 'signal_created_investigation'
  | 'signal_supported_recommendation'
  | 'evidence_supported_recommendation'
  | 'signal_proposed_action'
  | 'investigation_proposed_action'
  | 'experiment_proposed_action'
  | 'action_has_approval_state'
  | 'action_produced_outcome'
  | 'outcome_measured_by'
  | 'measurement_produced_learning'

export interface ArtifactTraceLink {
  id: string
  relationship: TraceRelationship
  fromType: string
  fromId: string
  toType: string
  toId: string
  runId: string | null
  experimentId: string | null
  evidence: EvidenceReference[]
  sourceRefs: SourceReference[]
  idempotencyKey: string
  correlation: CorrelationContext
}

export interface LearningOutcome {
  id: string
  outcomeType: string
  actionId: string
  runId: string
  experimentId: string | null
  signalIds: string[]
  state: 'observed' | 'verified' | 'inconclusive'
  summary: string
  evidence: EvidenceReference[]
  sourceRefs: SourceReference[]
  observedAt: string
  verificationStatus: 'pending' | 'verified' | 'failed' | 'not_applicable'
  idempotencyKey: string
  correlation: CorrelationContext
}

export interface LearningMeasurement {
  id: string
  metricName: string
  actionId: string
  runId: string
  experimentId: string | null
  outcomeId: string | null
  planMeasurementId: string | null
  status: 'planned' | 'collecting' | 'complete' | 'insufficient'
  value: number | null
  valueState: 'known' | 'partial' | 'unknown' | 'not_applicable'
  unit: string
  minimumSampleSize: number
  minimumDurationDays: number
  observedSampleSize: number
  observedDurationDays: number
  evidence: EvidenceReference[]
  sourceRefs: SourceReference[]
  measuredAt: string | null
  idempotencyKey: string
  correlation: CorrelationContext
}

export interface AgentLearning {
  id: string
  learningType: string
  actionId: string
  experimentId: string | null
  outcomeId: string
  measurementIds: string[]
  summary: string
  decision: string
  confidence: number
  reviewStatus: 'candidate'
  evidence: EvidenceReference[]
  sourceRefs: SourceReference[]
  learnedAt: string
  idempotencyKey: string
  correlation: CorrelationContext
}

export interface LearningTraceBatch {
  outcomes: LearningOutcome[]
  measurements: LearningMeasurement[]
  learnings: AgentLearning[]
}

export function buildOperatingArtifactTraceLinks(batch: OperatingWorkflowArtifactBatch): ArtifactTraceLink[] {
  const links: ArtifactTraceLink[] = []
  const add = (input: Omit<ArtifactTraceLink, 'id' | 'idempotencyKey'>) => {
    if (!input.fromId.trim() || !input.toId.trim()) return
    const key = [
      input.relationship,
      input.fromType,
      input.fromId,
      input.toType,
      input.toId,
      input.runId ?? 'no-run',
    ].join(':')
    links.push({
      ...input,
      id: stableUuid('agent-artifact-trace-link', key),
      idempotencyKey: `trace-link:${key}`,
    })
  }

  for (const signal of batch.signals) {
    add({
      relationship: 'workflow_persisted_artifact',
      fromType: 'agent_run',
      fromId: batch.runId,
      toType: 'intelligence_signal',
      toId: signal.id,
      runId: batch.runId,
      experimentId: null,
      evidence: signal.evidence,
      sourceRefs: signal.sourceRefs,
      correlation: signal.correlation,
    })
    for (const sourceRef of signal.sourceRefs) {
      const sourceId = sourceRef.sourceId ?? sourceRef.checksum ?? sourceRef.uri
      if (!sourceId) continue
      add({
        relationship: 'observation_produced_signal',
        fromType: `${sourceRef.sourceSystem}:${sourceRef.sourceType}`,
        fromId: sourceId,
        toType: 'intelligence_signal',
        toId: signal.id,
        runId: batch.runId,
        experimentId: null,
        evidence: signal.evidence,
        sourceRefs: [sourceRef],
        correlation: signal.correlation,
      })
    }
  }

  for (const task of batch.tasks) {
    add({
      relationship: 'signal_created_investigation',
      fromType: 'intelligence_signal',
      fromId: task.signalId,
      toType: 'agent_task',
      toId: task.id,
      runId: batch.runId,
      experimentId: null,
      evidence: [],
      sourceRefs: [],
      correlation: task.correlation,
    })
  }

  for (const recommendation of batch.recommendations) {
    for (const signalId of recommendation.signalIds) {
      add({
        relationship: 'signal_supported_recommendation',
        fromType: 'intelligence_signal',
        fromId: signalId,
        toType: 'agent_recommendation',
        toId: recommendation.id,
        runId: batch.runId,
        experimentId: null,
        evidence: [],
        sourceRefs: recommendation.evidenceReferences,
        correlation: recommendation.correlation,
      })
    }
    for (const sourceRef of recommendation.evidenceReferences) {
      const sourceId = sourceRef.sourceId ?? sourceRef.checksum ?? sourceRef.uri
      if (!sourceId) continue
      add({
        relationship: 'evidence_supported_recommendation',
        fromType: `${sourceRef.sourceSystem}:${sourceRef.sourceType}`,
        fromId: sourceId,
        toType: 'agent_recommendation',
        toId: recommendation.id,
        runId: batch.runId,
        experimentId: null,
        evidence: [],
        sourceRefs: [sourceRef],
        correlation: recommendation.correlation,
      })
    }
  }

  for (const action of batch.actions) {
    for (const signalId of action.signalIds) {
      add({
        relationship: 'signal_proposed_action',
        fromType: 'intelligence_signal',
        fromId: signalId,
        toType: 'agent_action',
        toId: action.id,
        runId: batch.runId,
        experimentId: action.experimentId,
        evidence: action.evidence,
        sourceRefs: action.sourceRefs,
        correlation: action.correlation,
      })
    }
    if (action.taskId) add({
      relationship: 'investigation_proposed_action',
      fromType: 'agent_task',
      fromId: action.taskId,
      toType: 'agent_action',
      toId: action.id,
      runId: batch.runId,
      experimentId: action.experimentId,
      evidence: action.evidence,
      sourceRefs: action.sourceRefs,
      correlation: action.correlation,
    })
    if (action.experimentId) add({
      relationship: 'experiment_proposed_action',
      fromType: 'experiment',
      fromId: action.experimentId,
      toType: 'agent_action',
      toId: action.id,
      runId: batch.runId,
      experimentId: action.experimentId,
      evidence: action.evidence,
      sourceRefs: action.sourceRefs,
      correlation: action.correlation,
    })
  }

  return uniqueLinks(links)
}

export function assertLearningTraceBatch(batch: LearningTraceBatch): void {
  if (batch.outcomes.length > 50 || batch.measurements.length > 100 || batch.learnings.length > 50) {
    throw new ContractValidationError('Learning trace batch exceeds a committed bound')
  }
  assertNoPrivateReasoning(batch)
  const outcomes = new Map(batch.outcomes.map((outcome) => [outcome.id, outcome]))
  const measurements = new Map(batch.measurements.map((measurement) => [measurement.id, measurement]))

  for (const outcome of batch.outcomes) {
    for (const [value, label] of [[outcome.id, 'outcome.id'], [outcome.actionId, 'outcome.actionId'], [outcome.runId, 'outcome.runId']] as const) {
      assertUuid(value, label)
    }
    outcome.signalIds.forEach((id) => assertUuid(id, 'outcome.signalId'))
    if (outcome.experimentId) assertUuid(outcome.experimentId, 'outcome.experimentId')
    if (!outcome.summary.trim() || !outcome.outcomeType.trim() || !outcome.idempotencyKey.trim()) {
      throw new ContractValidationError('Outcome type, summary, and idempotency key are required')
    }
    assertTimestamp(outcome.observedAt, 'outcome.observedAt')
    assertCorrelation(outcome.correlation, outcome.actionId, 'outcome')
  }

  for (const measurement of batch.measurements) {
    for (const [value, label] of [[measurement.id, 'measurement.id'], [measurement.actionId, 'measurement.actionId'], [measurement.runId, 'measurement.runId']] as const) {
      assertUuid(value, label)
    }
    if (measurement.experimentId) assertUuid(measurement.experimentId, 'measurement.experimentId')
    if (measurement.outcomeId) assertUuid(measurement.outcomeId, 'measurement.outcomeId')
    if (measurement.planMeasurementId) assertUuid(measurement.planMeasurementId, 'measurement.planMeasurementId')
    if (!measurement.outcomeId && !measurement.experimentId) {
      throw new ContractValidationError('Measurement must link to an outcome or experiment')
    }
    if (!measurement.metricName.trim() || !measurement.unit.trim() || !measurement.idempotencyKey.trim()) {
      throw new ContractValidationError('Measurement metric, unit, and idempotency key are required')
    }
    for (const value of [measurement.minimumSampleSize, measurement.minimumDurationDays, measurement.observedSampleSize, measurement.observedDurationDays]) {
      if (!Number.isInteger(value) || value < 0) throw new ContractValidationError('Measurement counts and durations must be nonnegative integers')
    }
    if (measurement.status === 'complete' && (
      measurement.outcomeId === null
      || measurement.valueState === 'unknown'
      || measurement.observedSampleSize < measurement.minimumSampleSize
      || measurement.observedDurationDays < measurement.minimumDurationDays
    )) {
      throw new ContractValidationError('Completed measurement requires an outcome and sufficient sample and duration')
    }
    if (measurement.valueState === 'unknown' && measurement.value !== null) {
      throw new ContractValidationError('Unknown measurement value must remain null')
    }
    if (measurement.measuredAt) assertTimestamp(measurement.measuredAt, 'measurement.measuredAt')
    assertCorrelation(measurement.correlation, measurement.outcomeId ?? measurement.actionId, 'measurement')
  }

  for (const learning of batch.learnings) {
    for (const [value, label] of [[learning.id, 'learning.id'], [learning.actionId, 'learning.actionId'], [learning.outcomeId, 'learning.outcomeId']] as const) {
      assertUuid(value, label)
    }
    if (learning.experimentId) assertUuid(learning.experimentId, 'learning.experimentId')
    learning.measurementIds.forEach((id) => assertUuid(id, 'learning.measurementId'))
    if (!outcomes.has(learning.outcomeId) || learning.measurementIds.some((id) => !measurements.has(id))) {
      throw new ContractValidationError('Learning must link to outcomes and measurements in the same atomic batch')
    }
    if (!learning.summary.trim() || !learning.decision.trim() || !learning.learningType.trim()) {
      throw new ContractValidationError('Learning type, summary, and decision are required')
    }
    assertConfidence(learning.confidence, 'learning.confidence')
    assertTimestamp(learning.learnedAt, 'learning.learnedAt')
    assertCorrelation(learning.correlation, learning.outcomeId, 'learning')
  }
}

export function learningTraceLinks(batch: LearningTraceBatch): ArtifactTraceLink[] {
  assertLearningTraceBatch(batch)
  const links: ArtifactTraceLink[] = []
  const add = (
    relationship: TraceRelationship,
    fromType: string,
    fromId: string,
    toType: string,
    toId: string,
    runId: string,
    experimentId: string | null,
    evidence: EvidenceReference[],
    sourceRefs: SourceReference[],
    correlation: CorrelationContext,
  ) => {
    const key = [relationship, fromType, fromId, toType, toId, runId].join(':')
    links.push({
      id: stableUuid('agent-learning-trace-link', key),
      relationship,
      fromType,
      fromId,
      toType,
      toId,
      runId,
      experimentId,
      evidence,
      sourceRefs,
      idempotencyKey: `trace-link:${key}`,
      correlation,
    })
  }
  for (const outcome of batch.outcomes) add(
    'action_produced_outcome', 'agent_action', outcome.actionId, 'agent_outcome', outcome.id,
    outcome.runId, outcome.experimentId, outcome.evidence, outcome.sourceRefs, outcome.correlation,
  )
  for (const measurement of batch.measurements) {
    if (!measurement.outcomeId) continue
    add(
      'outcome_measured_by', 'agent_outcome', measurement.outcomeId, 'agent_measurement', measurement.id,
      measurement.runId, measurement.experimentId, measurement.evidence, measurement.sourceRefs, measurement.correlation,
    )
  }
  for (const learning of batch.learnings) {
    for (const measurementId of learning.measurementIds) {
      const measurement = batch.measurements.find((candidate) => candidate.id === measurementId)
      if (!measurement) throw new ContractValidationError('Learning measurement link was not found')
      add(
        'measurement_produced_learning', 'agent_measurement', measurementId, 'agent_learning', learning.id,
        measurement.runId, learning.experimentId, learning.evidence, learning.sourceRefs, learning.correlation,
      )
    }
  }
  return uniqueLinks(links)
}

function uniqueLinks(links: ArtifactTraceLink[]): ArtifactTraceLink[] {
  return [...new Map(links.map((link) => [link.idempotencyKey, link])).values()]
}

function assertCorrelation(correlation: CorrelationContext, expectedCausationId: string, label: string): void {
  assertUuid(correlation.correlationId, `${label}.correlationId`)
  if (correlation.causationId !== expectedCausationId) {
    throw new ContractValidationError(`${label} causation must point to its immediate predecessor`)
  }
}

function assertTimestamp(value: string, label: string): void {
  if (!Number.isFinite(Date.parse(value))) throw new ContractValidationError(`${label} must be a timestamp`)
}

function assertNoPrivateReasoning(value: unknown, path = 'batch'): void {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoPrivateReasoning(item, `${path}[${index}]`))
    return
  }
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (/(chain.?of.?thought|private.?reasoning|hidden.?reasoning|scratchpad)/i.test(key)) {
      throw new ContractValidationError('Private reasoning fields are forbidden', { path: `${path}.${key}` })
    }
    assertNoPrivateReasoning(entry, `${path}.${key}`)
  }
}
