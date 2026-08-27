import { createHash } from 'node:crypto'

import type {
  CorrelationContext,
  IntelligenceSignal,
  SourceReference,
} from '../contracts.js'
import { ContractValidationError } from '../contracts.js'
import { stableUuid } from '../stable-id.js'
import {
  getSensorRegistration,
  type SensorHealthStatus,
  type SensorIngestionBatch,
  type SensorName,
  type SensorObservation,
  type SensorProvenanceMode,
  type SensorSourceHealth,
} from './contracts.js'

interface ExistingReportSource {
  name: string
  status: 'configured' | 'missing_config' | 'error'
  detail: string
  count?: number
}

export interface SeoContentOpportunityReport {
  generatedAt: string
  cadence: 'weekly'
  workflowBoundary: string
  dataSources: ExistingReportSource[]
  opportunities: Array<{
    id: string
    title: string
    angle: string
    category: string
    priority: 'high' | 'medium' | 'low'
    score: number
    recommendedSurface: string
    workflowStatus: 'candidate'
    targetKeywords: string[]
    internalLinks: Array<{ label: string; href: string }>
    rationale: string
    sourceSignals: string[]
  }>
}

export interface AiAeoOpportunityReport {
  generatedAt: string
  cadence: 'weekly'
  workflowBoundary: string
  dataSources: ExistingReportSource[]
  promptSet?: unknown[]
  answerSnapshots?: unknown[]
  opportunities: Array<{
    id: string
    prompt: string
    intent: string
    priority: 'high' | 'medium' | 'low'
    score: number
    recommendedAction: string
    targetPage: string
    answerGap: string
    recommendedAnswerElements: string[]
    internalLinks: Array<{ label: string; href: string }>
    observedBrands: string[]
    workflowStatus: 'candidate'
  }>
}

export interface ContentBriefReport {
  generatedAt: string
  cadence: 'weekly'
  workflowBoundary: string
  dataSources: ExistingReportSource[]
  briefs: Array<{
    id: string
    sourceOpportunityIds: string[]
    contentType: string
    title: string
    status: 'candidate'
    priority: 'high' | 'medium' | 'low'
    score: number
    angle: string
    sourceSignals: string[]
  }>
}

export type WeeklySensorReportInput =
  | {
    sensorName: 'seo-content-monitor'
    provenanceMode: SensorProvenanceMode
    report: SeoContentOpportunityReport
  }
  | {
    sensorName: 'ai-aeo-monitor'
    provenanceMode: SensorProvenanceMode
    report: AiAeoOpportunityReport
  }

export interface ReportAdapterOptions {
  observedAt: string
  correlation: CorrelationContext
  staleAfterHours?: number
}

export function adaptSeoContentReport(
  input: Extract<WeeklySensorReportInput, { sensorName: 'seo-content-monitor' }>,
  options: ReportAdapterOptions,
): SensorIngestionBatch {
  return adaptOpportunityReport({
    sensorName: input.sensorName,
    provenanceMode: input.provenanceMode,
    report: input.report,
    opportunities: input.report.opportunities.map((opportunity) => ({
      sourceRecordId: opportunity.id,
      title: opportunity.title,
      summary: opportunity.rationale,
      score: opportunity.score,
      priority: opportunity.priority,
      signalType: 'growth.seo_content_opportunity',
      observationType: 'seo_content_opportunity',
      payload: {
        title: opportunity.title,
        angle: opportunity.angle,
        category: opportunity.category,
        priority: opportunity.priority,
        score: opportunity.score,
        recommendedSurface: opportunity.recommendedSurface,
        workflowStatus: opportunity.workflowStatus,
        targetKeywords: opportunity.targetKeywords,
        internalLinks: opportunity.internalLinks,
        rationale: opportunity.rationale,
        sourceSignals: opportunity.sourceSignals,
      },
    })),
    options,
  })
}

export function adaptAiAeoReport(
  input: Extract<WeeklySensorReportInput, { sensorName: 'ai-aeo-monitor' }>,
  options: ReportAdapterOptions,
): SensorIngestionBatch {
  return adaptOpportunityReport({
    sensorName: input.sensorName,
    provenanceMode: input.provenanceMode,
    report: input.report,
    opportunities: input.report.opportunities.map((opportunity) => ({
      sourceRecordId: opportunity.id,
      title: opportunity.prompt,
      summary: opportunity.answerGap,
      score: opportunity.score,
      priority: opportunity.priority,
      signalType: 'growth.aeo_visibility_opportunity',
      observationType: 'aeo_visibility_opportunity',
      payload: {
        prompt: opportunity.prompt,
        intent: opportunity.intent,
        priority: opportunity.priority,
        score: opportunity.score,
        recommendedAction: opportunity.recommendedAction,
        targetPage: opportunity.targetPage,
        answerGap: opportunity.answerGap,
        recommendedAnswerElements: opportunity.recommendedAnswerElements,
        internalLinks: opportunity.internalLinks,
        observedBrands: opportunity.observedBrands,
        workflowStatus: opportunity.workflowStatus,
      },
    })),
    options,
  })
}

export function adaptContentBriefReport(input: {
  provenanceMode: SensorProvenanceMode
  report: ContentBriefReport
}, options: ReportAdapterOptions): SensorIngestionBatch {
  const sensorName = 'content-brief-generator' as const
  const base = adaptOpportunityReport({
    sensorName,
    provenanceMode: input.provenanceMode,
    report: input.report,
    opportunities: input.report.briefs.map((brief) => ({
      sourceRecordId: brief.id,
      title: brief.title,
      summary: brief.angle,
      score: brief.score,
      priority: brief.priority,
      signalType: 'marketing.content_brief_candidate',
      observationType: 'content_brief_candidate',
      payload: {
        title: brief.title,
        contentType: brief.contentType,
        status: brief.status,
        priority: brief.priority,
        score: brief.score,
        sourceOpportunityIds: brief.sourceOpportunityIds,
        angle: brief.angle,
        sourceSignals: brief.sourceSignals,
      },
    })),
    options,
  })
  return {
    ...base,
    candidateActions: input.report.briefs.slice(0, 20).map((brief) => ({
      actionType: 'content.review_draft_candidate',
      targetSystem: 'github_content_workflow',
      payload: {
        briefId: brief.id,
        sourceOpportunityIds: brief.sourceOpportunityIds,
        mutationAllowed: false,
        publishAllowed: false,
      },
      conciseRationale: `Review the existing ${brief.contentType} brief candidate; publishing remains outside the sensor boundary.`,
      correlation: options.correlation,
    })),
  }
}

export function adaptWeeklySensorReports(
  inputs: WeeklySensorReportInput[],
  options: ReportAdapterOptions,
): SensorIngestionBatch[] {
  if (inputs.length > 10) throw new ContractValidationError('Weekly sensor input exceeds the 10-report bound')
  return inputs.map((input) => input.sensorName === 'seo-content-monitor'
    ? adaptSeoContentReport(input, options)
    : adaptAiAeoReport(input, options))
}

interface NormalizedOpportunity {
  sourceRecordId: string
  title: string
  summary: string
  score: number
  priority: 'high' | 'medium' | 'low'
  signalType: string
  observationType: string
  payload: Record<string, unknown>
}

function adaptOpportunityReport(input: {
  sensorName: SensorName
  provenanceMode: SensorProvenanceMode
  report: {
    generatedAt: string
    cadence: 'weekly'
    workflowBoundary: string
    dataSources: ExistingReportSource[]
  }
  opportunities: NormalizedOpportunity[]
  options: ReportAdapterOptions
}): SensorIngestionBatch {
  getSensorRegistration(input.sensorName)
  assertTimestamp(input.report.generatedAt, 'report.generatedAt')
  assertTimestamp(input.options.observedAt, 'observedAt')
  if (input.opportunities.length > 100) throw new ContractValidationError('Sensor report exceeds the 100-observation bound')
  if (!['live', 'baseline', 'fixture'].includes(input.provenanceMode)) {
    throw new ContractValidationError('Sensor report requires explicit live, baseline, or fixture provenance')
  }

  const checksum = checksumFor({
    sensorName: input.sensorName,
    generatedAt: input.report.generatedAt,
    opportunities: input.opportunities,
    dataSources: input.report.dataSources,
  })
  const sensorRunId = stableUuid('nested-objects-sensor-run', `${input.sensorName}:${input.report.generatedAt}:${checksum}`)
  const sourceHealth = normalizeSourceHealth(
    input.sensorName,
    input.report.dataSources,
    input.report.generatedAt,
    input.options.observedAt,
    input.options.staleAfterHours ?? 216,
  )
  const healthStatus = summarizeHealth(sourceHealth)
  const observations = input.opportunities.map((opportunity) => observationFor({
    sensorName: input.sensorName,
    sensorRunId,
    provenanceMode: input.provenanceMode,
    reportGeneratedAt: input.report.generatedAt,
    reportChecksum: checksum,
    sourceHealth,
    opportunity,
    options: input.options,
  }))
  const signals = [
    ...observations.map((observation, index) => opportunitySignal(
      observation,
      input.opportunities[index] as NormalizedOpportunity,
      input.options.correlation,
      input.options.observedAt,
    )),
    ...healthSignals(input.sensorName, sensorRunId, sourceHealth, input.options.correlation, input.options.observedAt),
  ]

  return {
    sensorName: input.sensorName,
    sensorRunId,
    provenanceMode: input.provenanceMode,
    observedAt: input.options.observedAt,
    sourceGeneratedAt: input.report.generatedAt,
    checksum,
    healthStatus,
    sourceHealth,
    observations,
    metrics: [],
    signals,
    candidateActions: [],
    idempotencyKey: `sensor-run:${input.sensorName}:${sensorRunId}`,
    correlation: input.options.correlation,
  }
}

function observationFor(input: {
  sensorName: SensorName
  sensorRunId: string
  provenanceMode: SensorProvenanceMode
  reportGeneratedAt: string
  reportChecksum: string
  sourceHealth: SensorSourceHealth[]
  opportunity: NormalizedOpportunity
  options: ReportAdapterOptions
}): SensorObservation {
  const sourceRef: SourceReference = {
    sourceSystem: input.sensorName,
    sourceType: input.opportunity.observationType,
    sourceId: input.opportunity.sourceRecordId,
    observedAt: input.reportGeneratedAt,
    checksum: input.reportChecksum,
    metadata: { provenanceMode: input.provenanceMode },
  }
  const observationChecksum = checksumFor(input.opportunity.payload)
  const idempotencyKey = `sensor-observation:${input.sensorName}:${input.sensorRunId}:${input.opportunity.sourceRecordId}:${observationChecksum}`
  return {
    id: stableUuid('nested-objects-sensor-observation', idempotencyKey),
    sensorName: input.sensorName,
    sensorRunId: input.sensorRunId,
    observationType: input.opportunity.observationType,
    sourceRecordId: input.opportunity.sourceRecordId,
    provenanceMode: input.provenanceMode,
    observedAt: input.options.observedAt,
    sourceGeneratedAt: input.reportGeneratedAt,
    checksum: observationChecksum,
    payload: input.opportunity.payload,
    sourceRefs: [sourceRef],
    sourceHealth: input.sourceHealth,
    idempotencyKey,
    correlation: input.options.correlation,
  }
}

function opportunitySignal(
  observation: SensorObservation,
  opportunity: NormalizedOpportunity,
  correlation: CorrelationContext,
  detectedAt: string,
): IntelligenceSignal {
  const provenanceFactor = observation.provenanceMode === 'live' ? 1 : observation.provenanceMode === 'fixture' ? 0.95 : 0.7
  const confidence = round4(provenanceFactor * (opportunity.score / 100))
  const priority = Math.max(1, Math.min(100, Math.round(opportunity.score * provenanceFactor)))
  const fingerprint = `sensor-opportunity:${observation.sensorName}:${observation.sourceRecordId}`
  const sourceRef = observation.sourceRefs[0] as SourceReference
  return {
    id: stableUuid('nested-objects-intelligence-signal', fingerprint),
    signalType: opportunity.signalType,
    domain: observation.sensorName === 'content-brief-generator' ? 'marketing' : 'growth',
    producer: observation.sensorName,
    title: opportunity.title,
    summary: `${opportunity.summary} Provenance=${observation.provenanceMode}; source generated=${observation.sourceGeneratedAt ?? 'unknown'}.`,
    evidence: [{
      evidenceType: 'observation',
      summary: 'Normalized existing-monitor opportunity; no publishing or mutation was performed.',
      sourceRef,
      value: {
        score: opportunity.score,
        priority: opportunity.priority,
        provenanceMode: observation.provenanceMode,
        observationId: observation.id,
      },
      confidence,
    }],
    sourceRefs: observation.sourceRefs,
    confidence,
    severity: opportunity.priority === 'high' ? 'high' : opportunity.priority === 'medium' ? 'medium' : 'low',
    priority,
    businessImpact: 'Search visibility or answer-engine discoverability may have a documented improvement opportunity.',
    affectedEntities: [{ entityType: 'sensor_observation', observationId: observation.id }],
    recommendedFollowUp: 'Review the evidence and prioritize a draft candidate; do not publish automatically.',
    fingerprint,
    idempotencyKey: `signal:${fingerprint}`,
    status: 'new',
    firstDetectedAt: detectedAt,
    lastDetectedAt: detectedAt,
    correlation,
  }
}

function normalizeSourceHealth(
  sensorName: SensorName,
  sources: ExistingReportSource[],
  sourceGeneratedAt: string,
  observedAt: string,
  staleAfterHours: number,
): SensorSourceHealth[] {
  if (!Number.isFinite(staleAfterHours) || staleAfterHours <= 0) {
    throw new ContractValidationError('Sensor staleAfterHours must be positive')
  }
  const reportStale = Date.parse(observedAt) - Date.parse(sourceGeneratedAt) > staleAfterHours * 3_600_000
  const normalized = sources.map((source) => {
    const status: SensorHealthStatus = source.status === 'configured'
      ? reportStale ? 'stale' : 'healthy'
      : source.status === 'missing_config' ? 'not_configured' : 'failed'
    return {
      sourceId: `${sensorName}:${source.name}`,
      status,
      detail: source.detail.slice(0, 1_000),
      observedAt,
      recordCount: Number.isInteger(source.count) && (source.count ?? -1) >= 0 ? source.count ?? null : null,
      staleAfterHours,
      errorCode: status === 'failed' ? 'SOURCE_ERROR' : status === 'not_configured' ? 'SOURCE_NOT_CONFIGURED' : null,
    }
  })
  if (normalized.length > 0) return normalized
  return [{
    sourceId: `${sensorName}:report`,
    status: reportStale ? 'stale' : 'degraded',
    detail: reportStale ? 'Report is older than its accepted weekly freshness window.' : 'Report included no source-health entries.',
    observedAt,
    recordCount: null,
    staleAfterHours,
    errorCode: null,
  }]
}

function healthSignals(
  sensorName: SensorName,
  sensorRunId: string,
  sourceHealth: SensorSourceHealth[],
  correlation: CorrelationContext,
  detectedAt: string,
): IntelligenceSignal[] {
  return sourceHealth.flatMap((health) => {
    if (health.status === 'healthy') return []
    const fingerprint = `sensor-health:${health.sourceId}:${health.status}`
    const sourceRef: SourceReference = {
      sourceSystem: sensorName,
      sourceType: 'source_health',
      sourceId: health.sourceId,
      observedAt: health.observedAt,
      metadata: { sensorRunId },
    }
    return [{
      id: stableUuid('nested-objects-intelligence-signal', fingerprint),
      signalType: health.status === 'stale' ? 'operations.sensor_source_stale' : 'operations.sensor_source_degraded',
      domain: 'operations' as const,
      producer: sensorName,
      title: `${health.sourceId} is ${health.status}`,
      summary: health.detail,
      evidence: [{
        evidenceType: 'observation' as const,
        summary: 'Normalized collector source-health state.',
        sourceRef,
        value: { status: health.status, recordCount: health.recordCount, errorCode: health.errorCode },
        confidence: 1,
      }],
      sourceRefs: [sourceRef],
      confidence: 1,
      severity: health.status === 'failed' ? 'high' as const : 'medium' as const,
      priority: health.status === 'failed' ? 85 : health.status === 'stale' ? 70 : 65,
      businessImpact: 'Weekly search and content conclusions may be incomplete or stale.',
      affectedEntities: [{ entityType: 'sensor_source', sourceId: health.sourceId }],
      recommendedFollowUp: 'Restore or refresh the existing collector before treating its opportunities as live observations.',
      fingerprint,
      idempotencyKey: `signal:${fingerprint}`,
      status: 'new' as const,
      firstDetectedAt: detectedAt,
      lastDetectedAt: detectedAt,
      correlation,
    }]
  })
}

function summarizeHealth(sourceHealth: SensorSourceHealth[]): SensorHealthStatus {
  const statuses = new Set(sourceHealth.map((source) => source.status))
  if (statuses.has('failed')) return 'failed'
  if (statuses.has('stale')) return 'stale'
  if (statuses.has('degraded')) return 'degraded'
  if (statuses.has('not_configured')) return 'not_configured'
  return 'healthy'
}

export function checksumFor(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex')
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function assertTimestamp(value: string, field: string): void {
  if (!Number.isFinite(Date.parse(value))) throw new ContractValidationError(`${field} must be a valid timestamp`)
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000
}
