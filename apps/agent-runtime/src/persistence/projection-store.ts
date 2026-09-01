import type { IntelligenceSignal, MetricSnapshot } from '../contracts.js'
import { ContractValidationError } from '../contracts.js'
import type { AssetClassificationResult, MarketingContactClassificationResult } from '../sensors/activecampaign-audit.js'
import type { MemberProjectionPlan } from '../projections/member-projection.js'
import {
  assertServerOnlyControlPlaneAccess,
  type SupabaseControlPlaneConfiguration,
} from './control-plane-store.js'

interface SupabaseErrorLike {
  message?: string
  code?: string
  details?: string
  hint?: string
}

interface SupabaseResponseLike {
  data: unknown
  error: SupabaseErrorLike | null
}

interface SupabaseQueryLike {
  eq(column: string, value: unknown): SupabaseQueryLike
  then?: Promise<SupabaseResponseLike>['then']
}

interface SupabaseClientLike {
  rpc(name: string, parameters: Record<string, unknown>): PromiseLike<SupabaseResponseLike>
  from(table: string): {
    upsert(values: unknown, options?: Record<string, unknown>): SupabaseQueryLike
    update(values: unknown): SupabaseQueryLike
  }
}

export interface ProjectionWriteSet {
  canonicalMember: Record<string, unknown>
  identityLinks: Record<string, unknown>[]
  memberships: Record<string, unknown>[]
  operationalProfile: Record<string, unknown>
}

export interface ProjectionPersistenceStore {
  persistMemberProjection(plan: MemberProjectionPlan): Promise<void>
  persistMetrics(metrics: MetricSnapshot[]): Promise<void>
  persistSignals(signals: IntelligenceSignal[]): Promise<void>
  persistMarketingClassifications(classifications: MarketingContactClassificationResult[]): Promise<void>
  persistAssetClassifications(classifications: AssetClassificationResult[], observedAt: string): Promise<void>
}

export async function createSupabaseProjectionStore(
  configuration: SupabaseControlPlaneConfiguration,
): Promise<ProjectionPersistenceStore> {
  assertServerOnlyControlPlaneAccess(configuration)
  const packageName = '@supabase/supabase-js'
  const module = (await import(packageName)) as {
    createClient?: (url: string, key: string, options: Record<string, unknown>) => SupabaseClientLike
  }
  if (typeof module.createClient !== 'function') {
    throw new ContractValidationError('@supabase/supabase-js did not expose createClient')
  }
  return new SupabaseProjectionStore(module.createClient(
    configuration.url.trim(),
    configuration.serviceRoleKey.trim(),
    { auth: { autoRefreshToken: false, persistSession: false } },
  ))
}

export class SupabaseProjectionStore implements ProjectionPersistenceStore {
  constructor(private readonly client: SupabaseClientLike) {}

  async persistMemberProjection(plan: MemberProjectionPlan): Promise<void> {
    const writes = buildProjectionWriteSet(plan)
    await execute(this.client.from('canonical_members').upsert(writes.canonicalMember, { onConflict: 'id' }))
    await executeRpc(this.client.rpc('sync_member_identity_links', {
      p_member_id: plan.memberId,
      p_identity_links: writes.identityLinks,
      p_observed_at: projectionObservedAt(writes.identityLinks),
    }))

    for (const membership of writes.memberships) {
      const sourceSystem = String(membership.source_system)
      const snapshotAt = String(membership.snapshot_at)
      await execute(
        this.client
          .from('member_memberships')
          .update({ is_current: false, valid_to: snapshotAt })
          .eq('member_id', plan.memberId)
          .eq('source_system', sourceSystem)
          .eq('is_current', true),
      )
      await execute(this.client.from('member_memberships').upsert(membership, { onConflict: 'idempotency_key' }))
    }

    await execute(this.client.from('member_operational_profiles').upsert(writes.operationalProfile, { onConflict: 'member_id' }))
  }

  async persistMetrics(metrics: MetricSnapshot[]): Promise<void> {
    if (metrics.length === 0) return
    await execute(this.client.from('business_metrics_daily').upsert(metrics.map(mapMetric), { onConflict: 'idempotency_key' }))
  }

  async persistSignals(signals: IntelligenceSignal[]): Promise<void> {
    if (signals.length === 0) return
    await execute(this.client.from('intelligence_signals').upsert(signals.map(mapSignal), { onConflict: 'producer,fingerprint' }))
  }

  async persistMarketingClassifications(classifications: MarketingContactClassificationResult[]): Promise<void> {
    if (classifications.length === 0) return
    await execute(this.client.from('marketing_contact_classifications').upsert(
      classifications.map((classification) => ({
        source_system: 'activecampaign',
        source_contact_id: classification.sourceContactId,
        canonical_member_id: classification.canonicalMemberId,
        classification: classification.classification,
        engagement_state: classification.engagementState,
        membership_truth_state: classification.membershipTruthState,
        excluded_from_marketing_analysis: classification.excludedFromMarketingAnalysis,
        exclusion_reason: classification.exclusionReason,
        evidence: classification.evidence,
        source_refs: classification.sourceRefs,
        confidence: classification.confidence,
        recommended_disposition: classification.recommendedDisposition,
        last_observed_at: classification.sourceRefs[0]?.observedAt ?? new Date().toISOString(),
        correlation_id: classification.correlation.correlationId,
        causation_id: classification.correlation.causationId,
        idempotency_key: `marketing-classification:activecampaign:${classification.sourceContactId}`,
      })),
      { onConflict: 'source_system,source_contact_id' },
    ))
  }

  async persistAssetClassifications(classifications: AssetClassificationResult[], observedAt: string): Promise<void> {
    if (classifications.length === 0) return
    await executeRpc(this.client.rpc('upsert_activecampaign_asset_inventory', {
      p_assets: classifications.map((classification) => ({
        source_system: 'activecampaign',
        asset_type: classification.assetType,
        external_id: classification.externalId,
        asset_name: classification.assetName,
        business_scope: classification.candidateScope,
        lifecycle_status: classification.lifecycleStatus,
        read_allowed: false,
        mutation_allowed: false,
        classification_source: 'phase-c-candidate-classifier',
        classification_evidence: { reasons: classification.reasons, readRecommended: classification.readRecommended },
        confidence: classification.confidence,
        review_status: 'pending',
        last_seen_at: observedAt,
        source_refs: [{
          sourceSystem: 'activecampaign',
          sourceType: classification.assetType,
          sourceId: classification.externalId,
          observedAt,
        }],
        idempotency_key: `activecampaign-asset:${classification.assetType}:${classification.externalId}`,
      })),
    }))
  }
}

function projectionObservedAt(identityLinks: Record<string, unknown>[]): string {
  const observedTimes = identityLinks.flatMap((link) => {
    const refs = Array.isArray(link.source_refs) ? link.source_refs : []
    return refs.flatMap((ref) => {
      if (!ref || typeof ref !== 'object') return []
      const value = (ref as Record<string, unknown>).observedAt
      if (typeof value !== 'string') return []
      const timestamp = Date.parse(value)
      return Number.isFinite(timestamp) ? [{ timestamp, value }] : []
    })
  })
  if (observedTimes.length === 0) {
    throw new ContractValidationError('Member projection identity links require an observed timestamp')
  }
  return observedTimes.reduce((latest, candidate) => (
    candidate.timestamp > latest.timestamp ? candidate : latest
  )).value
}

export function buildProjectionWriteSet(plan: MemberProjectionPlan): ProjectionWriteSet {
  return {
    canonicalMember: {
      id: plan.memberId,
      primary_email: plan.canonicalMember.primaryEmail,
      identity_status: plan.canonicalMember.identityStatus,
      data_quality_status: plan.canonicalMember.dataQualityStatus,
      data_quality_score: plan.canonicalMember.dataQualityScore,
      data_quality_details: plan.canonicalMember.dataQualityDetails,
      profile_facts: plan.canonicalMember.profileFacts,
    },
    identityLinks: plan.identityLinks.map((link) => ({
      member_id: plan.memberId,
      source_system: link.sourceSystem,
      identifier_type: link.identifierType,
      external_id: link.externalId,
      normalized_external_id: link.normalizedExternalId,
      status: link.status,
      is_primary: link.isPrimary,
      confidence: link.confidence,
      verified_at: link.status === 'active' && link.confidence === 1 ? link.sourceRefs[0]?.observedAt ?? null : null,
      source_refs: link.sourceRefs,
      provenance: link.provenance,
      idempotency_key: link.idempotencyKey,
    })),
    memberships: plan.memberships.map((membership) => ({
      member_id: plan.memberId,
      source_system: membership.sourceSystem,
      source_record_id: membership.sourceRecordId,
      is_authoritative: membership.isAuthoritative,
      authority_rank: membership.authorityRank,
      membership_tier: membership.membershipTier,
      membership_status: membership.membershipStatus,
      plan_uid: membership.planUid,
      subscription_uid: membership.subscriptionUid,
      subscription_start_at: membership.subscriptionStartAt,
      renewal_at: membership.renewalAt,
      cancellation_at: membership.cancellationAt,
      currency: membership.currency,
      mrr: membership.mrr,
      arr: membership.arr,
      lifetime_revenue: membership.lifetimeRevenue,
      revenue_state: membership.revenueState,
      snapshot_at: membership.snapshotAt,
      valid_from: membership.snapshotAt,
      valid_to: null,
      is_current: true,
      completeness: membership.completeness,
      confidence: membership.confidence,
      source_refs: membership.sourceRefs,
      provenance: membership.provenance,
      data_quality: membership.dataQuality,
      idempotency_key: membership.idempotencyKey,
    })),
    operationalProfile: {
      member_id: plan.memberId,
      state: plan.operationalProfile.state,
      counties: plan.operationalProfile.counties,
      service_radius_miles: plan.operationalProfile.serviceRadiusMiles,
      experience_level: plan.operationalProfile.experienceLevel,
      inspection_types: plan.operationalProfile.inspectionTypes,
      profile_completion: plan.operationalProfile.profileCompletion,
      training_completion: plan.operationalProfile.trainingCompletion,
      last_seen_at: plan.operationalProfile.lastSeenAt,
      directory_views: plan.operationalProfile.directoryViews,
      firm_views: plan.operationalProfile.firmViews,
      paywall_hits: plan.operationalProfile.paywallHits,
      opportunity_clicks: plan.operationalProfile.opportunityClicks,
      activecampaign_engagement: plan.operationalProfile.activeCampaignEngagement,
      signup_source: plan.operationalProfile.signupSource,
      utm_source: plan.operationalProfile.utmSource,
      utm_medium: plan.operationalProfile.utmMedium,
      utm_campaign: plan.operationalProfile.utmCampaign,
      data_state: plan.operationalProfile.dataState,
      completeness: plan.operationalProfile.completeness,
      confidence: plan.operationalProfile.confidence,
      source_refs: plan.operationalProfile.sourceRefs,
      provenance: plan.operationalProfile.provenance,
      projection_version: plan.operationalProfile.projectionVersion,
    },
  }
}

function mapMetric(metric: MetricSnapshot): Record<string, unknown> {
  return {
    metric_date: metric.metricDate,
    metric_name: metric.metricName,
    domain: metric.domain,
    scope_key: metric.scopeKey,
    dimensions: metric.dimensions,
    numeric_value: metric.value,
    value_state: metric.valueState,
    unit: metric.unit,
    numerator: metric.numerator,
    denominator: metric.denominator,
    observed_records: metric.observedRecords,
    expected_records: metric.expectedRecords,
    completeness: metric.completeness,
    confidence: metric.confidence,
    source_system: metric.sourceSystem,
    source_run_id: metric.sourceRunId,
    source_refs: metric.sourceRefs,
    provenance: metric.provenance,
    observed_at: metric.observedAt,
    correlation_id: metric.correlation.correlationId,
    causation_id: metric.correlation.causationId,
    idempotency_key: metric.idempotencyKey,
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

async function execute(query: SupabaseQueryLike): Promise<void> {
  const response = await (query as unknown as Promise<SupabaseResponseLike>)
  if (response.error) {
    throw new ProjectionPersistenceError(response.error.message ?? 'Projection persistence failed', {
      code: response.error.code,
      details: response.error.details,
      hint: response.error.hint,
    })
  }
}

async function executeRpc(query: PromiseLike<SupabaseResponseLike>): Promise<void> {
  const response = await query
  if (response.error) {
    throw new ProjectionPersistenceError(response.error.message ?? 'Projection persistence RPC failed', {
      code: response.error.code,
      details: response.error.details,
      hint: response.error.hint,
    })
  }
}

export class ProjectionPersistenceError extends Error {
  readonly code = 'PROJECTION_PERSISTENCE_FAILED'
  readonly details: Record<string, unknown>

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ProjectionPersistenceError'
    this.details = details
  }
}
