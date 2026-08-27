import type {
  CorrelationContext,
  EvidenceReference,
  IntelligenceSignal,
  MetricSnapshot,
  MetricValueState,
  SourceReference,
} from '../contracts.js'
import { assertMetricSnapshot } from '../metrics.js'
import { stableUuid } from '../stable-id.js'
import type { RevenueAgentOutput } from './revenue-agent.js'
import {
  deterministicResult,
  type DeterministicAgentResult,
  uniqueSourceReferences,
} from './specialist-contracts.js'

export type GrowthMetricCategory =
  | 'signup_upgrade'
  | 'churn'
  | 'trial'
  | 'directory_firm'
  | 'paywall'
  | 'profile_completion'
  | 'training'
  | 'opportunity'
  | 'marketing_engagement'
  | 'acquisition_source'
  | 'seo'
  | 'other'

export interface GrowthAgentInput {
  metrics: MetricSnapshot[]
  currentWeekEnd: string
  revenue: RevenueAgentOutput
  aggregationByMetric?: Record<string, 'sum' | 'latest' | 'average'>
  minimumAbsoluteChange?: number
  minimumRelativeChange?: number
  correlation: CorrelationContext
  observedAt?: string
}

export interface GrowthPeriodValue {
  startDate: string
  endDate: string
  value: number | null
  valueState: MetricValueState
  observedDays: number
  expectedDays: number
  confidence: number
}

export interface GrowthMetricComparison {
  metric: string
  scopeKey: string
  unit: string
  category: GrowthMetricCategory
  aggregation: 'sum' | 'latest' | 'average'
  currentWeek: GrowthPeriodValue
  priorWeek: GrowthPeriodValue
  trailingFourWeeks: GrowthPeriodValue
  trailingTwelveWeeks: GrowthPeriodValue
  weekOverWeekDelta: number | null
  weekOverWeekPercent: number | null
  evidenceReferences: SourceReference[]
}

export interface GrowthAnomaly {
  id: string
  metric: string
  scopeKey: string
  category: GrowthMetricCategory
  direction: 'increase' | 'decrease'
  absoluteChange: number
  relativeChange: number | null
  confidence: number
  priority: number
  signalId: string
  evidenceReferences: SourceReference[]
}

export interface GrowthAgentData extends Record<string, unknown> {
  currentWeekEnd: string
  comparisons: GrowthMetricComparison[]
  anomalies: GrowthAnomaly[]
  financialTruthAgent: 'revenue-agent'
  financialAssessmentCount: number
}

export type GrowthAgentOutput = DeterministicAgentResult<GrowthAgentData>

export function runGrowthAgent(input: GrowthAgentInput): GrowthAgentOutput {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.currentWeekEnd)) throw new Error('currentWeekEnd must use YYYY-MM-DD')
  if (input.metrics.length > 25_000) throw new Error('Growth metrics exceed the 25,000-record bound')
  input.metrics.forEach(assertMetricSnapshot)
  const observedAt = input.observedAt ?? new Date().toISOString()
  const grouped = groupMetrics(input.metrics)
  const comparisons = [...grouped.values()]
    .map((metrics) => compareGrowthMetric(metrics, input))
    .sort((left, right) => `${left.metric}:${left.scopeKey}`.localeCompare(`${right.metric}:${right.scopeKey}`))
  const anomalies = comparisons.flatMap((comparison) => detectAnomaly(comparison, input))
  const signals = anomalies.map((anomaly) => anomalySignal(anomaly, comparisons, input.correlation, observedAt))
  const sourceRefs = uniqueSourceReferences(comparisons.flatMap((comparison) => comparison.evidenceReferences))

  return deterministicResult({
    agentName: 'growth-agent',
    status: anomalies.length === 0 ? 'quiet' : 'completed',
    summary: anomalies.length === 0
      ? `No material week-over-week growth anomaly met the evidence threshold across ${comparisons.length} series.`
      : `Detected ${anomalies.length} evidence-backed week-over-week growth anomalies across ${comparisons.length} series.`,
    data: {
      currentWeekEnd: input.currentWeekEnd,
      comparisons,
      anomalies,
      financialTruthAgent: 'revenue-agent',
      financialAssessmentCount: input.revenue.data.assessments.length,
    },
    signals,
    recommendations: anomalies.map((anomaly) => ({
      id: stableUuid('growth-agent-recommendation', anomaly.id),
      domain: 'growth',
      title: `Investigate ${anomaly.metric} ${anomaly.direction}`,
      summary: `Validate the ${anomaly.absoluteChange} ${anomaly.direction} against acquisition, product, and lifecycle evidence before acting.`,
      priority: anomaly.priority,
      evidenceReferences: anomaly.evidenceReferences,
      signalIds: [anomaly.signalId],
      recommendedFollowUp: 'Correlate the change with normalized source and segment metrics; propose an experiment only when a controllable driver is identified.',
      correlation: { ...input.correlation, causationId: anomaly.signalId },
    })),
    proposedActions: [],
    autumnDecisions: [],
    evidence: comparisons.flatMap(comparisonEvidence),
    sourceRefs,
    conciseRationale: 'Current week, prior week, trailing four weeks, and trailing twelve weeks are calculated from normalized daily metrics; financial truth is delegated to Revenue Agent.',
    correlation: input.correlation,
  })
}

function compareGrowthMetric(metrics: MetricSnapshot[], input: GrowthAgentInput): GrowthMetricComparison {
  const sample = metrics[0]
  if (!sample) throw new Error('Growth metric group is empty')
  const aggregation = input.aggregationByMetric?.[sample.metricName]
    ?? defaultAggregation(sample)
  const end = parseDate(input.currentWeekEnd)
  const currentRange = dateRange(end, 6, 0)
  const priorRange = dateRange(end, 13, 7)
  const fourRange = dateRange(end, 27, 0)
  const twelveRange = dateRange(end, 83, 0)
  const currentWeek = aggregatePeriod(metrics, currentRange, aggregation)
  const priorWeek = aggregatePeriod(metrics, priorRange, aggregation)
  const current = currentWeek.value
  const prior = priorWeek.value
  const delta = current !== null && prior !== null ? current - prior : null
  const percent = delta !== null && prior !== null && prior !== 0 ? delta / Math.abs(prior) : null

  return {
    metric: sample.metricName,
    scopeKey: sample.scopeKey,
    unit: sample.unit,
    category: categoryFor(sample.metricName),
    aggregation,
    currentWeek,
    priorWeek,
    trailingFourWeeks: aggregatePeriod(metrics, fourRange, aggregation),
    trailingTwelveWeeks: aggregatePeriod(metrics, twelveRange, aggregation),
    weekOverWeekDelta: delta,
    weekOverWeekPercent: percent,
    evidenceReferences: uniqueSourceReferences(metrics.flatMap(metricSourceReferences)),
  }
}

function aggregatePeriod(
  metrics: MetricSnapshot[],
  range: { start: Date; end: Date },
  aggregation: 'sum' | 'latest' | 'average',
): GrowthPeriodValue {
  const selected = metrics
    .filter((metric) => inRange(metric.metricDate, range))
    .sort((left, right) => left.metricDate.localeCompare(right.metricDate))
  const expectedDays = aggregation === 'latest' ? 1 : daysInclusive(range)
  const usable = selected.filter((metric) => metric.value !== null && ['known', 'partial'].includes(metric.valueState))
  const observedDays = new Set(usable.map((metric) => metric.metricDate)).size
  if (usable.length === 0) {
    return periodValue(range, null, 'unknown', 0, expectedDays, 0)
  }
  const values = usable.map((metric) => metric.value as number)
  const value = aggregation === 'latest'
    ? values.at(-1) ?? null
    : aggregation === 'average'
      ? values.reduce(sum, 0) / values.length
      : values.reduce(sum, 0)
  const coverage = aggregation === 'latest' ? 1 : Math.min(1, observedDays / expectedDays)
  const sourceConfidence = usable.reduce((total, metric) => total + Math.min(metric.confidence, metric.completeness), 0) / usable.length
  const complete = coverage === 1 && usable.every((metric) => metric.valueState === 'known')
  return periodValue(range, value, complete ? 'known' : 'partial', observedDays, expectedDays, sourceConfidence * coverage)
}

function detectAnomaly(comparison: GrowthMetricComparison, input: GrowthAgentInput): GrowthAnomaly[] {
  const delta = comparison.weekOverWeekDelta
  if (delta === null || delta === 0) return []
  const confidence = Math.min(comparison.currentWeek.confidence, comparison.priorWeek.confidence)
  if (confidence < 0.5) return []
  const absolute = Math.abs(delta)
  const relative = comparison.weekOverWeekPercent
  const absoluteThreshold = input.minimumAbsoluteChange ?? 1
  const relativeThreshold = input.minimumRelativeChange ?? 0.25
  if (absolute < absoluteThreshold) return []
  if (relative !== null && Math.abs(relative) < relativeThreshold) return []
  const fingerprint = `growth-anomaly:${comparison.metric}:${comparison.scopeKey}:${input.currentWeekEnd}:${delta > 0 ? 'increase' : 'decrease'}`
  const priority = anomalyPriority(comparison.category, relative, absolute)
  const signalId = stableUuid('growth-agent-signal', fingerprint)
  return [{
    id: stableUuid('growth-agent-anomaly', fingerprint),
    metric: comparison.metric,
    scopeKey: comparison.scopeKey,
    category: comparison.category,
    direction: delta > 0 ? 'increase' : 'decrease',
    absoluteChange: absolute,
    relativeChange: relative === null ? null : Math.abs(relative),
    confidence,
    priority,
    signalId,
    evidenceReferences: comparison.evidenceReferences,
  }]
}

function anomalySignal(
  anomaly: GrowthAnomaly,
  comparisons: GrowthMetricComparison[],
  correlation: CorrelationContext,
  detectedAt: string,
): IntelligenceSignal {
  const comparison = comparisons.find((candidate) => (
    candidate.metric === anomaly.metric
    && candidate.scopeKey === anomaly.scopeKey
    && candidate.category === anomaly.category
  ))
  if (!comparison) throw new Error('Growth anomaly comparison is missing')
  const fingerprint = `growth-anomaly:${anomaly.metric}:${comparison.scopeKey}:${comparison.currentWeek.endDate}:${anomaly.direction}`
  const evidence = comparisonEvidence(comparison)
  return {
    id: anomaly.signalId,
    signalType: `growth.${anomaly.category}_anomaly`,
    domain: anomaly.category === 'seo' ? 'seo' : anomaly.category === 'marketing_engagement' ? 'marketing' : 'growth',
    producer: 'growth-agent',
    title: `${anomaly.metric} ${anomaly.direction} is material`,
    summary: `${anomaly.metric} changed by ${anomaly.absoluteChange} week over week with ${Math.round(anomaly.confidence * 100)}% evidence confidence.`,
    evidence,
    sourceRefs: anomaly.evidenceReferences,
    confidence: anomaly.confidence,
    severity: anomaly.priority >= 85 ? 'high' : anomaly.priority >= 70 ? 'medium' : 'low',
    priority: anomaly.priority,
    businessImpact: `A material ${anomaly.category} change may affect the member funnel; causation is not asserted.`,
    affectedEntities: [{ entityType: 'metric', metricName: anomaly.metric, scopeKey: comparison.scopeKey }],
    recommendedFollowUp: 'Correlate with segment and source evidence before proposing an intervention.',
    fingerprint,
    idempotencyKey: `signal:${fingerprint}`,
    status: 'new',
    firstDetectedAt: detectedAt,
    lastDetectedAt: detectedAt,
    correlation,
  }
}

function comparisonEvidence(comparison: GrowthMetricComparison): EvidenceReference[] {
  return comparison.evidenceReferences.map((sourceRef) => ({
    evidenceType: 'metric',
    summary: `${comparison.metric} current/prior/four-week/twelve-week normalized comparison.`,
    sourceRef,
    value: {
      currentWeek: comparison.currentWeek.value,
      priorWeek: comparison.priorWeek.value,
      trailingFourWeeks: comparison.trailingFourWeeks.value,
      trailingTwelveWeeks: comparison.trailingTwelveWeeks.value,
    },
    confidence: Math.min(comparison.currentWeek.confidence, comparison.priorWeek.confidence),
  }))
}

function groupMetrics(metrics: MetricSnapshot[]): Map<string, MetricSnapshot[]> {
  const groups = new Map<string, MetricSnapshot[]>()
  for (const metric of metrics) {
    const key = `${metric.metricName}:${metric.scopeKey}:${JSON.stringify(metric.dimensions)}`
    const group = groups.get(key) ?? []
    group.push(metric)
    groups.set(key, group)
  }
  return groups
}

function categoryFor(metricName: string): GrowthMetricCategory {
  const name = metricName.toLowerCase()
  if (name.includes('signup') || name.includes('upgrade')) return 'signup_upgrade'
  if (name.includes('churn') || name.includes('cancellation')) return 'churn'
  if (name.includes('trial')) return 'trial'
  if (name.includes('directory') || name.includes('firm')) return 'directory_firm'
  if (name.includes('paywall')) return 'paywall'
  if (name.includes('profile_completion')) return 'profile_completion'
  if (name.includes('training')) return 'training'
  if (name.includes('opportunity')) return 'opportunity'
  if (name.startsWith('marketing.') || name.includes('engagement')) return 'marketing_engagement'
  if (name.includes('acquisition') || name.includes('signup_source')) return 'acquisition_source'
  if (name.startsWith('seo.')) return 'seo'
  return 'other'
}

function defaultAggregation(metric: MetricSnapshot): 'sum' | 'latest' | 'average' {
  if (metric.metricName.endsWith('.snapshot') || metric.dimensions.snapshot === true) return 'latest'
  if (['ratio', 'percent', 'percentage', 'rate'].includes(metric.unit.toLowerCase())) return 'average'
  return 'sum'
}

function anomalyPriority(category: GrowthMetricCategory, relative: number | null, absolute: number): number {
  const base = ['churn', 'signup_upgrade', 'trial', 'paywall'].includes(category) ? 70 : 60
  const relativeBoost = relative === null ? 10 : Math.min(20, Math.floor(Math.abs(relative) * 20))
  return Math.min(100, base + relativeBoost + Math.min(10, Math.floor(absolute / 10)))
}

function metricSourceReferences(metric: MetricSnapshot): SourceReference[] {
  return metric.sourceRefs.length > 0 ? metric.sourceRefs : [{
    sourceSystem: metric.sourceSystem,
    sourceType: 'business_metric_daily',
    sourceId: `${metric.metricDate}:${metric.metricName}:${metric.scopeKey}`,
    ...(metric.observedAt ? { observedAt: metric.observedAt } : {}),
  }]
}

function dateRange(end: Date, startDaysAgo: number, endDaysAgo: number): { start: Date; end: Date } {
  return { start: shiftDays(end, -startDaysAgo), end: shiftDays(end, -endDaysAgo) }
}

function periodValue(
  range: { start: Date; end: Date },
  value: number | null,
  valueState: MetricValueState,
  observedDays: number,
  expectedDays: number,
  confidence: number,
): GrowthPeriodValue {
  return {
    startDate: formatDate(range.start),
    endDate: formatDate(range.end),
    value,
    valueState,
    observedDays,
    expectedDays,
    confidence,
  }
}

function parseDate(value: string): Date {
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(parsed.getTime()) || formatDate(parsed) !== value) throw new Error('currentWeekEnd is invalid')
  return parsed
}

function shiftDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000)
}

function inRange(value: string, range: { start: Date; end: Date }): boolean {
  const time = parseDate(value).getTime()
  return time >= range.start.getTime() && time <= range.end.getTime()
}

function daysInclusive(range: { start: Date; end: Date }): number {
  return Math.floor((range.end.getTime() - range.start.getTime()) / 86_400_000) + 1
}

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function sum(total: number, value: number): number {
  return total + value
}
