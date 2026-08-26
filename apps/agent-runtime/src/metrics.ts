import type {
  CorrelationContext,
  ExperimentAnalysisState,
  ExperimentReference,
  MetricDomain,
  MetricSnapshot,
  SourceReference,
} from './contracts.js'
import {
  assertConfidence,
  ContractValidationError,
  METRIC_DOMAINS,
  METRIC_VALUE_STATES,
} from './contracts.js'

export function assertMetricSnapshot(metric: MetricSnapshot): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(metric.metricDate)) {
    throw new ContractValidationError('metricDate must use YYYY-MM-DD', { metricDate: metric.metricDate })
  }
  if (!metric.metricName.trim()) throw new ContractValidationError('metricName is required')
  if (!METRIC_DOMAINS.includes(metric.domain)) {
    throw new ContractValidationError('Unsupported metric domain', { domain: metric.domain })
  }
  if (!METRIC_VALUE_STATES.includes(metric.valueState)) {
    throw new ContractValidationError('Unsupported metric value state', { valueState: metric.valueState })
  }
  if (['known', 'partial'].includes(metric.valueState) && metric.value === null) {
    throw new ContractValidationError('Known or partial metrics require a numeric value')
  }
  if (['unknown', 'not_applicable'].includes(metric.valueState) && metric.value !== null) {
    throw new ContractValidationError('Unknown or not-applicable metrics must preserve null instead of inventing a value')
  }
  if (metric.value !== null && !Number.isFinite(metric.value)) {
    throw new ContractValidationError('Metric value must be finite or null')
  }
  assertConfidence(metric.completeness, 'completeness')
  assertConfidence(metric.confidence, 'confidence')
  if (metric.observedRecords !== null && (!Number.isInteger(metric.observedRecords) || metric.observedRecords < 0)) {
    throw new ContractValidationError('observedRecords must be null or a nonnegative integer')
  }
  if (metric.expectedRecords !== null && (!Number.isInteger(metric.expectedRecords) || metric.expectedRecords < 0)) {
    throw new ContractValidationError('expectedRecords must be null or a nonnegative integer')
  }
  if (!metric.idempotencyKey.trim()) throw new ContractValidationError('Metric idempotencyKey is required')
}

export interface UnknownMetricInput {
  metricDate: string
  metricName: string
  domain: MetricDomain
  sourceSystem: string
  reason: string
  idempotencyKey: string
  correlation: CorrelationContext
  sourceRefs?: SourceReference[]
  scopeKey?: string
  dimensions?: Record<string, unknown>
}

export function createUnknownMetric(input: UnknownMetricInput): MetricSnapshot {
  const metric: MetricSnapshot = {
    metricDate: input.metricDate,
    metricName: input.metricName,
    domain: input.domain,
    scopeKey: input.scopeKey ?? 'global',
    dimensions: input.dimensions ?? {},
    value: null,
    valueState: 'unknown',
    unit: 'count',
    numerator: null,
    denominator: null,
    observedRecords: null,
    expectedRecords: null,
    completeness: 0,
    confidence: 0,
    sourceSystem: input.sourceSystem,
    sourceRunId: null,
    sourceRefs: [...(input.sourceRefs ?? [])],
    provenance: { reason: input.reason },
    idempotencyKey: input.idempotencyKey,
    observedAt: null,
    correlation: input.correlation,
  }
  assertMetricSnapshot(metric)
  return metric
}

export interface MetricDecisionReadiness {
  usable: boolean
  reason: string
}

export function metricDecisionReadiness(
  metric: MetricSnapshot,
  thresholds: { minimumCompleteness?: number; minimumConfidence?: number } = {},
): MetricDecisionReadiness {
  assertMetricSnapshot(metric)
  const minimumCompleteness = thresholds.minimumCompleteness ?? 0.8
  const minimumConfidence = thresholds.minimumConfidence ?? 0.7

  if (metric.valueState === 'unknown') return { usable: false, reason: 'Metric value is unknown.' }
  if (metric.valueState === 'not_applicable') return { usable: false, reason: 'Metric is not applicable.' }
  if (metric.completeness < minimumCompleteness) {
    return { usable: false, reason: `Completeness ${metric.completeness} is below ${minimumCompleteness}.` }
  }
  if (metric.confidence < minimumConfidence) {
    return { usable: false, reason: `Confidence ${metric.confidence} is below ${minimumConfidence}.` }
  }
  return { usable: true, reason: 'Metric meets value, completeness, and confidence requirements.' }
}

export interface ExperimentReadiness {
  analysisState: ExperimentAnalysisState
  mayConclude: boolean
  missingSample: number
  missingDurationDays: number
  reason: string
}

export function evaluateExperimentReadiness(experiment: ExperimentReference): ExperimentReadiness {
  if (experiment.minimumSampleSize <= 0 || experiment.minimumDurationDays <= 0) {
    throw new ContractValidationError('Experiment minimum sample and duration must be positive')
  }
  if (experiment.observedSampleSize < 0 || experiment.observedDurationDays < 0) {
    throw new ContractValidationError('Observed experiment sample and duration cannot be negative')
  }

  const missingSample = Math.max(0, experiment.minimumSampleSize - experiment.observedSampleSize)
  const missingDurationDays = Math.max(0, experiment.minimumDurationDays - experiment.observedDurationDays)
  if (missingSample > 0 || missingDurationDays > 0) {
    return {
      analysisState: 'insufficient_data',
      mayConclude: false,
      missingSample,
      missingDurationDays,
      reason: 'Experiment has not met both minimum sample size and minimum duration.',
    }
  }

  return {
    analysisState: 'ready',
    mayConclude: true,
    missingSample: 0,
    missingDurationDays: 0,
    reason: 'Experiment has met minimum evidence thresholds and may be analyzed.',
  }
}

export function createMetricIdempotencyKey(input: {
  metricDate: string
  metricName: string
  scopeKey?: string
  sourceSystem: string
  sourceRunId?: string | null
}): string {
  return [
    'metric',
    input.metricDate,
    input.metricName,
    input.scopeKey ?? 'global',
    input.sourceSystem,
    input.sourceRunId ?? 'none',
  ].join(':')
}

export function createMetricCorrelation(): CorrelationContext {
  return { correlationId: crypto.randomUUID(), causationId: null, traceId: null }
}
