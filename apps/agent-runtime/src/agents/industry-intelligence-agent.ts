import type {
  CorrelationContext,
  EvidenceReference,
  IntelligenceSignal,
  SourceReference,
} from '../contracts.js'
import { ContractValidationError } from '../contracts.js'
import { stableUuid } from '../stable-id.js'
import {
  deterministicResult,
  type DeterministicAgentResult,
  uniqueSourceReferences,
} from './specialist-contracts.js'

export type IndustryImportance = 'low' | 'medium' | 'high' | 'critical'

export interface IndustryResearchObservation {
  observationId: string
  title: string
  summary: string
  publicationDate: string
  eventDate: string | null
  source: {
    publisher: string
    uri: string
    sourceId: string
    checksum?: string
  }
  confidence: number
  businessRelevance: IndustryImportance
  affectedSegment: string
  risk: IndustryImportance
  licensingCaveat: string
  recommendedFollowUp: string
}

export interface IndustryIntelligenceAgentInput {
  observations: IndustryResearchObservation[]
  researchMode: 'deterministic_fixture' | 'approved_read_only'
  approvedReadOnlyToolConfigured: boolean
  correlation: CorrelationContext
  observedAt?: string
}

export interface StructuredIndustryEvent extends IndustryResearchObservation {
  provenance: SourceReference
  routedToOrchestrator: boolean
  signalId: string | null
}

export interface IndustryIntelligenceAgentData extends Record<string, unknown> {
  events: StructuredIndustryEvent[]
  routedSignalCount: number
  researchMode: IndustryIntelligenceAgentInput['researchMode']
  liveResearchPerformed: false
}

export type IndustryIntelligenceAgentOutput = DeterministicAgentResult<IndustryIntelligenceAgentData>

export function runIndustryIntelligenceAgent(
  input: IndustryIntelligenceAgentInput,
): IndustryIntelligenceAgentOutput {
  if (input.observations.length > 100) throw new ContractValidationError('Industry observations exceed the 100-record bound')
  if (input.researchMode === 'approved_read_only' && !input.approvedReadOnlyToolConfigured) {
    throw new ContractValidationError('Approved read-only research mode requires an explicitly configured tool')
  }
  const observedAt = input.observedAt ?? new Date().toISOString()
  const events = input.observations.map((observation) => structureObservation(observation, observedAt))
  const signals = events.filter((event) => event.routedToOrchestrator).map((event) => industrySignal(event, input.correlation, observedAt))

  return deterministicResult({
    agentName: 'industry-intelligence-agent',
    status: signals.length === 0 ? 'quiet' : 'completed',
    summary: events.length === 0
      ? 'No approved industry research observations were supplied.'
      : `Structured ${events.length} sourced industry observations and routed ${signals.length} high-value signals.`,
    data: {
      events,
      routedSignalCount: signals.length,
      researchMode: input.researchMode,
      liveResearchPerformed: false,
    },
    signals,
    recommendations: events.filter((event) => event.routedToOrchestrator).map((event) => ({
      id: stableUuid('industry-agent-recommendation', event.observationId),
      domain: 'industry',
      title: event.title,
      summary: event.recommendedFollowUp,
      priority: priorityFor(event.businessRelevance, event.risk),
      evidenceReferences: [event.provenance],
      recommendedFollowUp: event.recommendedFollowUp,
    })),
    proposedActions: [],
    autumnDecisions: [],
    evidence: events.map(industryEvidence),
    sourceRefs: uniqueSourceReferences(events.map((event) => event.provenance)),
    conciseRationale: 'Approved research observations are normalized into dated, licensed, source-addressable events; only high-value evidence is routed as a durable signal.',
    correlation: input.correlation,
  })
}

function structureObservation(
  observation: IndustryResearchObservation,
  observedAt: string,
): StructuredIndustryEvent {
  if (!observation.observationId.trim()) throw new ContractValidationError('Industry observationId is required')
  if (!observation.title.trim() || !observation.summary.trim()) {
    throw new ContractValidationError('Industry title and summary are required')
  }
  assertDate(observation.publicationDate, 'publicationDate')
  if (observation.eventDate) assertDate(observation.eventDate, 'eventDate')
  if (!observation.source.publisher.trim() || !observation.source.sourceId.trim()) {
    throw new ContractValidationError('Industry source publisher and sourceId are required')
  }
  let uri: URL
  try {
    uri = new URL(observation.source.uri)
  } catch {
    throw new ContractValidationError('Industry source URI is invalid')
  }
  if (uri.protocol !== 'https:') throw new ContractValidationError('Industry source URI must use HTTPS')
  if (!Number.isFinite(observation.confidence) || observation.confidence < 0 || observation.confidence > 1) {
    throw new ContractValidationError('Industry confidence must be between zero and one')
  }
  if (!observation.affectedSegment.trim() || !observation.licensingCaveat.trim() || !observation.recommendedFollowUp.trim()) {
    throw new ContractValidationError('Affected segment, licensing caveat, and recommended follow-up are required')
  }
  const routedToOrchestrator = isHighValue(observation)
  const signalId = routedToOrchestrator
    ? stableUuid('industry-intelligence-signal', observation.observationId)
    : null
  return {
    ...observation,
    provenance: {
      sourceSystem: 'approved-industry-research',
      sourceType: 'industry_observation',
      sourceId: observation.source.sourceId,
      uri: observation.source.uri,
      observedAt,
      ...(observation.source.checksum ? { checksum: observation.source.checksum } : {}),
      metadata: {
        publisher: observation.source.publisher,
        publicationDate: observation.publicationDate,
        eventDate: observation.eventDate,
        licensingCaveat: observation.licensingCaveat,
      },
    },
    routedToOrchestrator,
    signalId,
  }
}

function industrySignal(
  event: StructuredIndustryEvent,
  correlation: CorrelationContext,
  detectedAt: string,
): IntelligenceSignal {
  if (!event.signalId) throw new Error('Routed industry event is missing signalId')
  const fingerprint = `industry:${event.observationId}:${event.publicationDate}`
  const evidence = [industryEvidence(event)]
  return {
    id: event.signalId,
    signalType: 'industry.high_value_observation',
    domain: 'industry',
    producer: 'industry-intelligence-agent',
    title: event.title,
    summary: event.summary,
    evidence,
    sourceRefs: [event.provenance],
    confidence: event.confidence,
    severity: severityFor(event.risk),
    priority: priorityFor(event.businessRelevance, event.risk),
    businessImpact: `Potential ${event.businessRelevance} relevance for ${event.affectedSegment}; licensing caveat: ${event.licensingCaveat}`,
    affectedEntities: [{ entityType: 'segment', segment: event.affectedSegment }],
    recommendedFollowUp: event.recommendedFollowUp,
    fingerprint,
    idempotencyKey: `signal:${fingerprint}`,
    status: 'new',
    firstDetectedAt: detectedAt,
    lastDetectedAt: detectedAt,
    correlation,
  }
}

function industryEvidence(event: StructuredIndustryEvent): EvidenceReference {
  return {
    evidenceType: 'document',
    summary: `${event.title}; published ${event.publicationDate}${event.eventDate ? `, event ${event.eventDate}` : ''}.`,
    sourceRef: event.provenance,
    value: {
      businessRelevance: event.businessRelevance,
      affectedSegment: event.affectedSegment,
      risk: event.risk,
      licensingCaveat: event.licensingCaveat,
    },
    confidence: event.confidence,
  }
}

function isHighValue(observation: IndustryResearchObservation): boolean {
  return ['high', 'critical'].includes(observation.businessRelevance)
    || ['high', 'critical'].includes(observation.risk)
}

function priorityFor(relevance: IndustryImportance, risk: IndustryImportance): number {
  const scores: Record<IndustryImportance, number> = { low: 35, medium: 55, high: 75, critical: 95 }
  return Math.max(scores[relevance], scores[risk])
}

function severityFor(risk: IndustryImportance): IntelligenceSignal['severity'] {
  return risk === 'critical' ? 'critical' : risk === 'high' ? 'high' : risk === 'medium' ? 'medium' : 'low'
}

function assertDate(value: string, fieldName: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00.000Z`))) {
    throw new ContractValidationError(`${fieldName} must use a valid YYYY-MM-DD value`)
  }
}
