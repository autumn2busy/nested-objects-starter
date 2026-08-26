import type { CorrelationContext, IntelligenceSignal, MetricSnapshot } from '../contracts.js'
import { stableUuid } from '../stable-id.js'
import { buildDailyBusinessMetrics } from '../projections/daily-metrics.js'
import {
  buildMemberProjectionBatch,
  type BuildProjectionBatchInput,
  type MemberProjectionPlan,
} from '../projections/member-projection.js'
import {
  classifyMarketingContact,
  type ActiveCampaignContactSnapshot,
  type MarketingClassificationConfig,
  type MarketingContactClassificationResult,
} from '../sensors/activecampaign-audit.js'
import {
  evaluateLifecycleIntegrity,
  type ActiveCampaignMembershipMirror,
  type ProductAccessSnapshot,
} from './lifecycle-integrity.js'

export interface PhaseCWorkflowInput extends BuildProjectionBatchInput {
  metricDate: string
  activeCampaignContacts: ActiveCampaignContactSnapshot[]
  marketingConfig: MarketingClassificationConfig
  productAccessByMemberId?: Record<string, ProductAccessSnapshot>
  activeCampaignMirrorByMemberId?: Record<string, ActiveCampaignMembershipMirror>
  sourceRunId?: string | null
}

export interface PhaseCWorkflowResult {
  projections: MemberProjectionPlan[]
  metrics: MetricSnapshot[]
  signals: IntelligenceSignal[]
  marketingClassifications: MarketingContactClassificationResult[]
  unmatchedConversionEventIds: string[]
  duplicateConversionEventIds: string[]
}

export function runPhaseCCore(input: PhaseCWorkflowInput): PhaseCWorkflowResult {
  const projectionBatch = buildMemberProjectionBatch(input)
  const detectedAt = input.marketingConfig.now ?? new Date().toISOString()
  const membershipByEmail = new Map(
    projectionBatch.projections
      .filter((projection) => projection.canonicalMember.primaryEmail)
      .map((projection) => {
        const membership = [...projection.memberships].sort((left, right) => right.authorityRank - left.authorityRank)[0]
        return [projection.canonicalMember.primaryEmail!, membership ? {
          memberId: projection.memberId,
          email: projection.canonicalMember.primaryEmail,
          membershipTier: membership.membershipTier,
          membershipStatus: membership.membershipStatus,
          authoritative: true as const,
        } : null] as const
      })
      .filter((entry): entry is readonly [string, NonNullable<(typeof entry)[1]>] => Boolean(entry[1])),
  )

  const classifications = input.activeCampaignContacts.map((contact) =>
    classifyMarketingContact({
      contact,
      membership: contact.email ? membershipByEmail.get(contact.email.trim().toLowerCase()) ?? null : null,
      config: input.marketingConfig,
      correlation: input.correlation,
    }),
  )
  const classificationByMember = new Map(
    classifications.filter((classification) => classification.canonicalMemberId).map((classification) => [classification.canonicalMemberId!, classification]),
  )

  const signals = projectionBatch.projections.flatMap((projection) =>
    evaluateLifecycleIntegrity({
      projection,
      productAccess: input.productAccessByMemberId?.[projection.memberId] ?? null,
      activeCampaignMirror: input.activeCampaignMirrorByMemberId?.[projection.memberId] ?? null,
      marketingClassification: classificationByMember.get(projection.memberId) ?? null,
      correlation: input.correlation,
    }),
  )

  if (projectionBatch.unmatchedEventIds.length > 0) {
    const fingerprint = `unmatched-conversion-events:${input.metricDate}:${projectionBatch.unmatchedEventIds.length}`
    signals.push({
      id: stableUuid('nested-objects-intelligence-signal', fingerprint),
      signalType: 'lifecycle.unmatched_conversion_events',
      domain: 'operations',
      producer: 'phase-c-projection-core',
      title: 'Conversion events could not be assigned to canonical members',
      summary: `${projectionBatch.unmatchedEventIds.length} conversion events remain unmatched after member, email, and anonymous identity stitching.`,
      evidence: [{
        evidenceType: 'observation',
        summary: 'Unmatched conversion event count from the deterministic projection run.',
        sourceRef: { sourceSystem: 'supabase', sourceType: 'conversion_events_projection', sourceId: input.metricDate },
        value: { count: projectionBatch.unmatchedEventIds.length },
        confidence: 1,
      }],
      sourceRefs: [{ sourceSystem: 'supabase', sourceType: 'conversion_events_projection', sourceId: input.metricDate }],
      confidence: 1,
      severity: 'medium',
      priority: 70,
      businessImpact: 'Conversion attribution and lifecycle routing may be incomplete.',
      affectedEntities: [{ entityType: 'conversion_event_batch', count: projectionBatch.unmatchedEventIds.length }],
      recommendedFollowUp: 'Investigate identity stitching before treating unmatched contacts as inactive or nonmembers.',
      fingerprint,
      idempotencyKey: `signal:${fingerprint}`,
      status: 'new',
      firstDetectedAt: detectedAt,
      lastDetectedAt: detectedAt,
      correlation: input.correlation,
    })
  }

  if (projectionBatch.duplicateEventIds.length > 0) {
    const fingerprint = `duplicate-conversion-deliveries:${input.metricDate}:${projectionBatch.duplicateEventIds.length}`
    signals.push({
      id: stableUuid('nested-objects-intelligence-signal', fingerprint),
      signalType: 'technical.duplicate_conversion_delivery',
      domain: 'technical',
      producer: 'phase-c-projection-core',
      title: 'Duplicate conversion event deliveries were ignored',
      summary: `${projectionBatch.duplicateEventIds.length} duplicate deliveries were excluded by client event id.`,
      evidence: [{
        evidenceType: 'observation',
        summary: 'Duplicate delivery count from the deterministic projection run.',
        sourceRef: { sourceSystem: 'supabase', sourceType: 'conversion_events_projection', sourceId: input.metricDate },
        value: { count: projectionBatch.duplicateEventIds.length },
        confidence: 1,
      }],
      sourceRefs: [{ sourceSystem: 'supabase', sourceType: 'conversion_events_projection', sourceId: input.metricDate }],
      confidence: 1,
      severity: 'low',
      priority: 40,
      businessImpact: null,
      affectedEntities: [{ entityType: 'conversion_event_batch', count: projectionBatch.duplicateEventIds.length }],
      recommendedFollowUp: 'Monitor delivery retries. No business metric correction is required because duplicates were ignored.',
      fingerprint,
      idempotencyKey: `signal:${fingerprint}`,
      status: 'new',
      firstDetectedAt: detectedAt,
      lastDetectedAt: detectedAt,
      correlation: input.correlation,
    })
  }

  return {
    projections: projectionBatch.projections,
    metrics: buildDailyBusinessMetrics({
      metricDate: input.metricDate,
      profiles: input.profiles,
      conversionEvents: input.conversionEvents,
      correlation: input.correlation,
      sourceRunId: input.sourceRunId ?? null,
    }),
    signals,
    marketingClassifications: classifications,
    unmatchedConversionEventIds: projectionBatch.unmatchedEventIds,
    duplicateConversionEventIds: projectionBatch.duplicateEventIds,
  }
}

export function phaseCCorrelation(correlation: CorrelationContext): CorrelationContext {
  return structuredClone(correlation)
}
