import type { CorrelationContext, EvidenceReference, IntelligenceSignal, SourceReference } from '../contracts.js'
import { stableUuid } from '../stable-id.js'
import type { MarketingContactClassificationResult } from '../sensors/activecampaign-audit.js'
import type { MemberProjectionPlan, MembershipProjection } from '../projections/member-projection.js'

export interface ProductAccessSnapshot {
  memberId: string
  accessTier: string | null
  accessStatus: string | null
  directoryAccess: boolean | null
  observedAt: string
}

export interface ActiveCampaignMembershipMirror {
  contactId: string
  planName: string | null
  lifecycleStatus: string | null
  onboardingEnteredAt: string | null
  observedAt: string
}

export interface LifecycleIntegrityInput {
  projection: MemberProjectionPlan
  productAccess: ProductAccessSnapshot | null
  activeCampaignMirror: ActiveCampaignMembershipMirror | null
  marketingClassification: MarketingContactClassificationResult | null
  correlation: CorrelationContext
  now?: string
  onboardingGraceHours?: number
  trackingLagHours?: number
}

export function evaluateLifecycleIntegrity(input: LifecycleIntegrityInput): IntelligenceSignal[] {
  const now = input.now ?? new Date().toISOString()
  const authority = authoritativeMembership(input.projection.memberships)
  const signals: IntelligenceSignal[] = []

  for (const conflict of input.projection.identityConflicts) {
    signals.push(makeSignal(input, now, {
      signalType: 'lifecycle.identity_conflict',
      title: 'Canonical identity conflict requires review',
      summary: `${conflict.conflictType} prevents silent identity merging for this member.`,
      severity: 'high',
      priority: 90,
      confidence: 1,
      fingerprint: `identity:${input.projection.memberId}:${conflict.conflictType}:${stableUuid('identity-conflict-identifier', conflict.identifier)}`,
      evidence: [{
        evidenceType: 'observation',
        summary: 'Multiple profiles share a supposedly stable identity.',
        sourceRef: profileSourceRef(input.projection.memberId, now),
        value: { conflictType: conflict.conflictType, profileCount: conflict.profileIds.length },
        confidence: 1,
      }],
      followUp: 'Investigate the conflicting profiles and approve an explicit merge or separation decision.',
    }))
  }

  if (authority && isPaidTier(authority.membershipTier) && !hasOutsetaIdentity(input.projection)) {
    signals.push(makeSignal(input, now, {
      signalType: 'lifecycle.paid_member_missing_outseta_identity',
      title: 'Paid member is missing an Outseta identity link',
      summary: 'A paid membership projection exists without a stable Outseta person or account identifier.',
      severity: 'critical',
      priority: 100,
      confidence: 0.95,
      fingerprint: `paid-missing-outseta:${input.projection.memberId}`,
      evidence: membershipEvidence(authority, input.projection.memberId, now),
      followUp: 'Verify the Outseta account before changing access or marketing state.',
    }))
  }

  if (authority && isPaidTier(authority.membershipTier) && authority.membershipStatus === 'active' && input.productAccess) {
    const accessTier = normalizeTier(input.productAccess.accessTier)
    const expectedTier = authority.membershipTier
    if (accessTier !== expectedTier || input.productAccess.directoryAccess === false) {
      signals.push(makeSignal(input, now, {
        signalType: 'lifecycle.paid_access_mismatch',
        title: 'Paid member access does not match authoritative membership',
        summary: `Authoritative membership is ${expectedTier}, but the application access projection does not match.`,
        severity: 'critical',
        priority: 100,
        confidence: 1,
        fingerprint: `paid-access:${input.projection.memberId}:${expectedTier}:${accessTier}:${input.productAccess.directoryAccess}`,
        evidence: [
          ...membershipEvidence(authority, input.projection.memberId, now),
          {
            evidenceType: 'observation',
            summary: 'Application access snapshot.',
            sourceRef: {
              sourceSystem: 'supabase',
              sourceType: 'product_access',
              sourceId: input.productAccess.memberId,
              observedAt: input.productAccess.observedAt,
            },
            value: input.productAccess,
            confidence: 1,
          },
        ],
        followUp: 'Propose a deterministic entitlement repair after Autumn reviews the authoritative account evidence.',
      }))
    }
  }

  if (authority && input.activeCampaignMirror) {
    const mirrorTier = normalizeTier(input.activeCampaignMirror.planName)
    if (mirrorTier !== 'unknown' && mirrorTier !== authority.membershipTier) {
      signals.push(makeSignal(input, now, {
        signalType: 'marketing.plan_state_conflict',
        title: 'ActiveCampaign plan state conflicts with product truth',
        summary: `ActiveCampaign reflects ${mirrorTier}, while authoritative membership is ${authority.membershipTier}.`,
        severity: 'high',
        priority: 85,
        confidence: 1,
        fingerprint: `ac-tier:${input.projection.memberId}:${authority.membershipTier}:${mirrorTier}`,
        evidence: [
          ...membershipEvidence(authority, input.projection.memberId, now),
          activeCampaignEvidence(input.activeCampaignMirror),
        ],
        followUp: 'Review and approve a targeted lifecycle sync. Do not infer membership from ActiveCampaign.',
      }))
    }

    if (authority.membershipStatus === 'canceled' && !isCancelled(input.activeCampaignMirror.lifecycleStatus)) {
      signals.push(makeSignal(input, now, {
        signalType: 'marketing.cancellation_not_propagated',
        title: 'Cancellation has not propagated to ActiveCampaign',
        summary: 'Product truth is canceled, but the marketing lifecycle mirror is not canceled.',
        severity: 'high',
        priority: 90,
        confidence: 1,
        fingerprint: `ac-cancellation:${input.projection.memberId}:${input.activeCampaignMirror.lifecycleStatus ?? 'unknown'}`,
        evidence: [
          ...membershipEvidence(authority, input.projection.memberId, now),
          activeCampaignEvidence(input.activeCampaignMirror),
        ],
        followUp: 'Propose removing the member from paid nurture after Autumn reviews the exact automation impact.',
      }))
    }

    const createdAt = input.projection.canonicalMember.profileFacts.createdAt
    const graceHours = input.onboardingGraceHours ?? 24
    if (
      authority.membershipStatus === 'active' &&
      !input.activeCampaignMirror.onboardingEnteredAt &&
      typeof createdAt === 'string' &&
      ageHours(createdAt, now) >= graceHours
    ) {
      signals.push(makeSignal(input, now, {
        signalType: 'marketing.onboarding_missing',
        title: 'Active member did not enter onboarding',
        summary: `No onboarding entry is recorded after the ${graceHours}-hour grace period.`,
        severity: 'medium',
        priority: 70,
        confidence: 0.9,
        fingerprint: `onboarding-missing:${input.projection.memberId}`,
        evidence: [activeCampaignEvidence(input.activeCampaignMirror)],
        followUp: 'Investigate the triggering tag or field before proposing enrollment.',
      }))
    }
  }

  const activity = input.projection.operationalProfile
  const trackingLagHours = input.trackingLagHours ?? 24
  if (
    activity.profileLastActiveAt &&
    (!activity.latestEventAt || ageHours(activity.latestEventAt, activity.profileLastActiveAt) >= trackingLagHours)
  ) {
    signals.push(makeSignal(input, now, {
      signalType: 'technical.conversion_tracking_lag',
      title: 'Member activity is newer than conversion telemetry',
      summary: 'The profile activity timestamp is materially newer than the latest first-party conversion event.',
      severity: 'medium',
      priority: 65,
      confidence: 0.85,
      fingerprint: `tracking-lag:${input.projection.memberId}:${activity.profileLastActiveAt}:${activity.latestEventAt ?? 'none'}`,
      evidence: [{
        evidenceType: 'observation',
        summary: 'Profile and conversion telemetry timestamps.',
        sourceRef: profileSourceRef(input.projection.memberId, now),
        value: { profileLastActiveAt: activity.profileLastActiveAt, latestEventAt: activity.latestEventAt },
        confidence: 0.85,
      }],
      followUp: 'Verify tracking coverage before interpreting this member as inactive.',
    }))
  }

  if (
    input.marketingClassification?.canonicalMemberId &&
    ['internal', 'test', 'cold_import'].includes(input.marketingClassification.classification)
  ) {
    signals.push(makeSignal(input, now, {
      signalType: 'marketing.contact_classification_conflict',
      title: 'Marketing contact classification conflicts with member identity',
      summary: `A canonical member is classified as ${input.marketingClassification.classification} in the marketing audit.`,
      severity: 'high',
      priority: 80,
      confidence: input.marketingClassification.confidence,
      fingerprint: `contact-classification:${input.projection.memberId}:${input.marketingClassification.classification}`,
      evidence: [{
        evidenceType: 'observation',
        summary: 'Read-only ActiveCampaign contact classification.',
        sourceRef: input.marketingClassification.sourceRefs[0] ?? profileSourceRef(input.projection.memberId, now),
        value: { classification: input.marketingClassification.classification },
        confidence: input.marketingClassification.confidence,
      }],
      followUp: 'Review the identity before suppressing, retagging, or removing the contact from any automation.',
    }))
  }

  return signals
}

function makeSignal(
  input: LifecycleIntegrityInput,
  detectedAt: string,
  specification: {
    signalType: string
    title: string
    summary: string
    severity: IntelligenceSignal['severity']
    priority: number
    confidence: number
    fingerprint: string
    evidence: EvidenceReference[]
    followUp: string
  },
): IntelligenceSignal {
  return {
    id: stableUuid('nested-objects-intelligence-signal', specification.fingerprint),
    signalType: specification.signalType,
    domain: specification.signalType.startsWith('marketing.') ? 'marketing' : specification.signalType.startsWith('technical.') ? 'technical' : 'operations',
    producer: 'lifecycle-integrity-check',
    title: specification.title,
    summary: specification.summary,
    evidence: specification.evidence,
    sourceRefs: uniqueSourceRefs(specification.evidence.map((item) => item.sourceRef)),
    confidence: specification.confidence,
    severity: specification.severity,
    priority: specification.priority,
    businessImpact: specification.severity === 'critical' ? 'Member access, revenue attribution, or lifecycle treatment may be wrong.' : null,
    affectedEntities: [{ entityType: 'member', memberId: input.projection.memberId }],
    recommendedFollowUp: specification.followUp,
    fingerprint: specification.fingerprint,
    idempotencyKey: `signal:${specification.fingerprint}`,
    status: 'new',
    firstDetectedAt: detectedAt,
    lastDetectedAt: detectedAt,
    correlation: input.correlation,
  }
}

function authoritativeMembership(memberships: MembershipProjection[]): MembershipProjection | null {
  return [...memberships].sort((left, right) => right.authorityRank - left.authorityRank)[0] ?? null
}

function membershipEvidence(membership: MembershipProjection, memberId: string, observedAt: string): EvidenceReference[] {
  return [{
    evidenceType: 'observation',
    summary: 'Authoritative membership projection.',
    sourceRef: {
      sourceSystem: membership.sourceSystem,
      sourceType: 'membership_snapshot',
      sourceId: membership.sourceRecordId ?? memberId,
      observedAt: membership.snapshotAt ?? observedAt,
    },
    value: {
      tier: membership.membershipTier,
      status: membership.membershipStatus,
      authorityRank: membership.authorityRank,
    },
    confidence: membership.confidence,
  }]
}

function activeCampaignEvidence(mirror: ActiveCampaignMembershipMirror): EvidenceReference {
  return {
    evidenceType: 'observation',
    summary: 'ActiveCampaign lifecycle mirror.',
    sourceRef: {
      sourceSystem: 'activecampaign',
      sourceType: 'contact_lifecycle',
      sourceId: mirror.contactId,
      observedAt: mirror.observedAt,
    },
    value: { planName: mirror.planName, lifecycleStatus: mirror.lifecycleStatus, onboardingEnteredAt: mirror.onboardingEnteredAt },
    confidence: 1,
  }
}

function profileSourceRef(memberId: string, observedAt: string): SourceReference {
  return { sourceSystem: 'supabase', sourceType: 'profile', sourceId: memberId, observedAt }
}

function hasOutsetaIdentity(projection: MemberProjectionPlan): boolean {
  return projection.identityLinks.some((link) => link.sourceSystem === 'outseta' && link.status === 'active')
}

function isPaidTier(tier: string): boolean {
  return !['free', 'unknown'].includes(tier)
}

function normalizeTier(value: string | null): string {
  const text = value?.toLowerCase() ?? ''
  if (text.includes('elite')) return 'elite'
  if (text.includes('pro')) return 'pro'
  if (text.includes('founder')) return 'founders'
  if (text.includes('starter') || text.includes('directory')) return 'starter'
  if (text.includes('agency')) return 'agency'
  if (text.includes('free')) return 'free'
  return 'unknown'
}

function isCancelled(value: string | null): boolean {
  const normalized = value?.toLowerCase() ?? ''
  return normalized.includes('cancel') || normalized.includes('churn')
}

function ageHours(older: string, newer: string): number {
  const difference = Date.parse(newer) - Date.parse(older)
  return Number.isFinite(difference) ? Math.max(0, difference / 3_600_000) : 0
}

function uniqueSourceRefs(sourceRefs: SourceReference[]): SourceReference[] {
  const seen = new Set<string>()
  return sourceRefs.filter((sourceRef) => {
    const key = `${sourceRef.sourceSystem}:${sourceRef.sourceType}:${sourceRef.sourceId ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
