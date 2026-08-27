import type {
  CorrelationContext,
  EvidenceReference,
  IntelligenceSignal,
  MetricSnapshot,
  SourceReference,
} from '../contracts.js'
import { assertMetricSnapshot } from '../metrics.js'
import { stableUuid } from '../stable-id.js'
import {
  deterministicResult,
  type DeterministicAgentResult,
  uniqueSourceReferences,
} from './specialist-contracts.js'

export type RevenueDataQualityState =
  | 'ready'
  | 'partial'
  | 'unknown'
  | 'missing_comparison'
  | 'unit_mismatch'
  | 'non_authoritative'

export interface RevenueDriverHint {
  summary: string
  evidenceReferences: SourceReference[]
}

export interface RevenueAgentInput {
  currentMetrics: MetricSnapshot[]
  comparisonMetrics: MetricSnapshot[]
  driverHints?: Record<string, RevenueDriverHint>
  correlation: CorrelationContext
  observedAt?: string
}

export interface RevenueMetricAssessment {
  metric: string
  scopeKey: string
  unit: string
  currentValue: number | null
  comparisonValue: number | null
  delta: number | null
  confidence: number
  dataQualityState: RevenueDataQualityState
  likelyDriver: string | null
  evidenceReferences: SourceReference[]
  recommendedFollowUp: string | null
}

export interface RevenueAgentData extends Record<string, unknown> {
  assessments: RevenueMetricAssessment[]
  authoritativeMetricCount: number
  unknownMetricCount: number
  financialTruthSource: 'normalized_metrics_only'
}

export type RevenueAgentOutput = DeterministicAgentResult<RevenueAgentData>

export function runRevenueAgent(input: RevenueAgentInput): RevenueAgentOutput {
  assertBoundedMetrics(input.currentMetrics, 'currentMetrics')
  assertBoundedMetrics(input.comparisonMetrics, 'comparisonMetrics')
  const observedAt = input.observedAt ?? new Date().toISOString()
  const comparisons = new Map(input.comparisonMetrics.map((metric) => [metricKey(metric), metric]))
  const assessments = [...input.currentMetrics]
    .sort(compareMetrics)
    .map((current) => assessMetric(current, comparisons.get(metricKey(current)) ?? null, input.driverHints))
  const degraded = assessments.filter((assessment) => assessment.dataQualityState !== 'ready')
  const signals = degraded
    .filter((assessment) => isFinancialMetric(assessment.metric))
    .map((assessment) => dataQualitySignal(assessment, input.correlation, observedAt))
  const evidence = assessments.flatMap((assessment) => assessment.evidenceReferences.map((sourceRef) => ({
    evidenceType: 'metric' as const,
    summary: `${assessment.metric} normalized metric evidence.`,
    sourceRef,
    value: {
      currentValue: assessment.currentValue,
      comparisonValue: assessment.comparisonValue,
      delta: assessment.delta,
      dataQualityState: assessment.dataQualityState,
    },
    confidence: assessment.confidence,
  })))
  const unknownMetricCount = assessments.filter((assessment) => assessment.currentValue === null).length

  return deterministicResult({
    agentName: 'revenue-agent',
    status: assessments.length === 0 ? 'quiet' : 'completed',
    summary: assessments.length === 0
      ? 'No normalized revenue metrics were supplied.'
      : `Assessed ${assessments.length} normalized metrics; ${unknownMetricCount} remain unknown or non-authoritative.`,
    data: {
      assessments,
      authoritativeMetricCount: assessments.length - assessments.filter((item) => item.dataQualityState === 'non_authoritative').length,
      unknownMetricCount,
      financialTruthSource: 'normalized_metrics_only',
    },
    signals,
    recommendations: degraded.map((assessment) => {
      const signalIds = signals
        .filter((signal) => signal.affectedEntities.some((entity) => (
          entity.metricName === assessment.metric && entity.scopeKey === assessment.scopeKey
        )))
        .map((signal) => signal.id)
      return {
        id: stableUuid('revenue-agent-recommendation', `${assessment.metric}:${assessment.scopeKey}:${assessment.dataQualityState}`),
        domain: 'revenue',
        title: `${assessment.metric} requires better evidence`,
        summary: assessment.recommendedFollowUp ?? 'Review the normalized metric evidence.',
        priority: isFinancialMetric(assessment.metric) ? 75 : 55,
        evidenceReferences: assessment.evidenceReferences,
        signalIds,
        recommendedFollowUp: assessment.recommendedFollowUp,
        correlation: signalIds[0] ? { ...input.correlation, causationId: signalIds[0] } : input.correlation,
      }
    }),
    proposedActions: [],
    autumnDecisions: [],
    evidence,
    sourceRefs: uniqueSourceReferences(assessments.flatMap((assessment) => assessment.evidenceReferences)),
    conciseRationale: 'Only normalized, authority-qualified numeric values are compared; unknowns remain null and ActiveCampaign is never treated as financial truth.',
    correlation: input.correlation,
  })
}

function assessMetric(
  current: MetricSnapshot,
  comparison: MetricSnapshot | null,
  driverHints: RevenueAgentInput['driverHints'],
): RevenueMetricAssessment {
  assertMetricSnapshot(current)
  if (comparison) assertMetricSnapshot(comparison)
  const nonAuthoritative = isNonAuthoritativeFinancialMetric(current)
  const currentValue = nonAuthoritative || !isUsable(current) ? null : current.value
  const comparisonValue = !comparison || isNonAuthoritativeFinancialMetric(comparison) || !isUsable(comparison)
    ? null
    : comparison.value
  const unitMismatch = comparison !== null && comparison.unit !== current.unit
  const delta = currentValue !== null && comparisonValue !== null && !unitMismatch
    ? currentValue - comparisonValue
    : null
  const dataQualityState = qualityState(current, comparison, nonAuthoritative, unitMismatch)
  const hint = driverHints?.[metricKey(current)] ?? driverHints?.[current.metricName]
  const evidenceReferences = uniqueSourceReferences([
    ...metricSourceReferences(current),
    ...(comparison ? metricSourceReferences(comparison) : []),
    ...(hint?.evidenceReferences ?? []),
  ])

  return {
    metric: current.metricName,
    scopeKey: current.scopeKey,
    unit: current.unit,
    currentValue,
    comparisonValue: unitMismatch ? null : comparisonValue,
    delta,
    confidence: comparableConfidence(current, comparison, nonAuthoritative, unitMismatch),
    dataQualityState,
    likelyDriver: hint && delta !== null ? hint.summary : null,
    evidenceReferences,
    recommendedFollowUp: followUpFor(dataQualityState, current.metricName),
  }
}

function qualityState(
  current: MetricSnapshot,
  comparison: MetricSnapshot | null,
  nonAuthoritative: boolean,
  unitMismatch: boolean,
): RevenueDataQualityState {
  if (nonAuthoritative) return 'non_authoritative'
  if (!isUsable(current)) return current.valueState === 'partial' ? 'partial' : 'unknown'
  if (!comparison || !isUsable(comparison)) return 'missing_comparison'
  if (unitMismatch) return 'unit_mismatch'
  if (current.valueState === 'partial' || comparison.valueState === 'partial') return 'partial'
  return 'ready'
}

function comparableConfidence(
  current: MetricSnapshot,
  comparison: MetricSnapshot | null,
  nonAuthoritative: boolean,
  unitMismatch: boolean,
): number {
  if (nonAuthoritative || unitMismatch || !isUsable(current)) return 0
  const currentConfidence = Math.min(current.confidence, current.completeness)
  if (!comparison || !isUsable(comparison)) return currentConfidence
  return Math.min(currentConfidence, comparison.confidence, comparison.completeness)
}

function isUsable(metric: MetricSnapshot): boolean {
  return metric.value !== null && ['known', 'partial'].includes(metric.valueState)
}

function isNonAuthoritativeFinancialMetric(metric: MetricSnapshot): boolean {
  return isFinancialMetric(metric.metricName) && metric.sourceSystem.toLowerCase().includes('activecampaign')
}

function isFinancialMetric(metricName: string): boolean {
  return /(^|\.)(mrr|arr|revenue|purchase|subscription|upgrade|churn|cancellation)/i.test(metricName)
}

function metricKey(metric: MetricSnapshot): string {
  return `${metric.metricName}:${metric.scopeKey}:${stableDimensions(metric.dimensions)}`
}

function stableDimensions(dimensions: Record<string, unknown>): string {
  return JSON.stringify(Object.fromEntries(Object.entries(dimensions).sort(([left], [right]) => left.localeCompare(right))))
}

function metricSourceReferences(metric: MetricSnapshot): SourceReference[] {
  if (metric.sourceRefs.length > 0) return metric.sourceRefs
  return [{
    sourceSystem: metric.sourceSystem,
    sourceType: 'business_metric_daily',
    sourceId: `${metric.metricDate}:${metric.metricName}:${metric.scopeKey}`,
    ...(metric.observedAt ? { observedAt: metric.observedAt } : {}),
    metadata: { valueState: metric.valueState, unit: metric.unit },
  }]
}

function followUpFor(state: RevenueDataQualityState, metricName: string): string | null {
  if (state === 'ready') return null
  if (state === 'non_authoritative') return `Replace ${metricName} with an authoritative billing or product-truth metric before making a financial decision.`
  if (state === 'unit_mismatch') return `Normalize ${metricName} to one unit before comparison.`
  if (state === 'missing_comparison') return `Collect a comparable prior-period ${metricName} value.`
  return `Resolve the source completeness gap for ${metricName}; do not substitute zero.`
}

function dataQualitySignal(
  assessment: RevenueMetricAssessment,
  correlation: CorrelationContext,
  detectedAt: string,
): IntelligenceSignal {
  const fingerprint = `revenue-quality:${assessment.metric}:${assessment.scopeKey}:${assessment.dataQualityState}`
  const evidence: EvidenceReference[] = assessment.evidenceReferences.map((sourceRef) => ({
    evidenceType: 'metric',
    summary: `${assessment.metric} is ${assessment.dataQualityState}.`,
    sourceRef,
    value: { currentValue: assessment.currentValue, comparisonValue: assessment.comparisonValue },
    confidence: assessment.confidence,
  }))
  return {
    id: stableUuid('revenue-agent-signal', fingerprint),
    signalType: 'revenue.metric_quality_gap',
    domain: 'revenue',
    producer: 'revenue-agent',
    title: `${assessment.metric} is not decision-ready`,
    summary: assessment.recommendedFollowUp ?? 'The normalized financial metric is not decision-ready.',
    evidence,
    sourceRefs: assessment.evidenceReferences,
    confidence: Math.max(0.7, assessment.confidence),
    severity: assessment.dataQualityState === 'non_authoritative' ? 'high' : 'medium',
    priority: assessment.dataQualityState === 'non_authoritative' ? 85 : 70,
    businessImpact: 'Financial conclusions could be wrong if an unknown or non-authoritative metric is treated as fact.',
    affectedEntities: [{ entityType: 'metric', metricName: assessment.metric, scopeKey: assessment.scopeKey }],
    recommendedFollowUp: assessment.recommendedFollowUp,
    fingerprint,
    idempotencyKey: `signal:${fingerprint}`,
    status: 'new',
    firstDetectedAt: detectedAt,
    lastDetectedAt: detectedAt,
    correlation,
  }
}

function assertBoundedMetrics(metrics: MetricSnapshot[], fieldName: string): void {
  if (metrics.length > 5_000) throw new Error(`${fieldName} exceeds the 5,000-metric bound`)
}

function compareMetrics(left: MetricSnapshot, right: MetricSnapshot): number {
  return metricKey(left).localeCompare(metricKey(right))
}
