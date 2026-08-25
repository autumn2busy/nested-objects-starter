import { ContractValidationError } from './contracts.js'

export type MembershipSource = 'outseta' | 'supabase_profiles' | 'activecampaign' | 'stripe' | 'manual' | 'other'
export type MembershipTier = 'free' | 'starter' | 'founders' | 'pro' | 'elite' | 'agency' | 'unknown'
export type MembershipStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused' | 'incomplete' | 'unknown'
export type RevenueState = 'known' | 'partial' | 'unknown' | 'not_applicable'

export interface MembershipSnapshot {
  sourceSystem: MembershipSource
  sourceRecordId: string | null
  isAuthoritative: boolean
  authorityRank: number
  membershipTier: MembershipTier
  membershipStatus: MembershipStatus
  planUid: string | null
  subscriptionUid: string | null
  mrr: number | null
  arr: number | null
  lifetimeRevenue: number | null
  revenueState: RevenueState
  observedAt: string
}

export interface AuthorityConflict {
  conflictType: 'multiple_authorities' | 'tier_mismatch' | 'status_mismatch' | 'plan_mismatch' | 'marketing_claim_without_authority'
  authoritativeSource: MembershipSource | null
  conflictingSource: MembershipSource
  fields: string[]
  summary: string
}

export interface MembershipResolution {
  state: 'known' | 'unknown' | 'conflict'
  authoritative: MembershipSnapshot | null
  conflicts: AuthorityConflict[]
  paid: boolean | null
  revenueUsable: boolean
  rationale: string
}

export interface IdentityLinkCandidate {
  memberId: string
  sourceSystem: string
  identifierType: string
  externalId: string
}

export function normalizeExternalIdentifier(identifierType: string, value: string): string {
  const normalized = value.trim()
  if (!normalized) throw new ContractValidationError('External identity value cannot be empty')
  if (identifierType === 'email') return normalized.toLowerCase()
  return normalized
}

export function detectIdentityCollision(
  existing: IdentityLinkCandidate | null,
  candidate: IdentityLinkCandidate,
): { collided: boolean; reason: string | null } {
  if (!existing) return { collided: false, reason: null }
  const existingValue = normalizeExternalIdentifier(existing.identifierType, existing.externalId)
  const candidateValue = normalizeExternalIdentifier(candidate.identifierType, candidate.externalId)
  const sameIdentity =
    existing.sourceSystem === candidate.sourceSystem &&
    existing.identifierType === candidate.identifierType &&
    existingValue === candidateValue

  if (!sameIdentity || existing.memberId === candidate.memberId) return { collided: false, reason: null }
  return {
    collided: true,
    reason: `External identity ${candidate.sourceSystem}/${candidate.identifierType}/${candidateValue} is already linked to another canonical member.`,
  }
}

export function resolveMembershipTruth(snapshots: MembershipSnapshot[]): MembershipResolution {
  snapshots.forEach(assertMembershipSnapshot)

  const conflicts: AuthorityConflict[] = []
  const authorities = snapshots
    .filter((snapshot) => snapshot.isAuthoritative)
    .sort((left, right) => right.authorityRank - left.authorityRank || Date.parse(right.observedAt) - Date.parse(left.observedAt))

  if (authorities.length === 0) {
    const marketingClaim = snapshots.find(
      (snapshot) => snapshot.sourceSystem === 'activecampaign' && isPaidTier(snapshot.membershipTier),
    )
    if (marketingClaim) {
      conflicts.push({
        conflictType: 'marketing_claim_without_authority',
        authoritativeSource: null,
        conflictingSource: marketingClaim.sourceSystem,
        fields: ['membershipTier'],
        summary: 'ActiveCampaign reports a paid tier, but no authoritative product or billing snapshot confirms it.',
      })
    }

    return {
      state: conflicts.length > 0 ? 'conflict' : 'unknown',
      authoritative: null,
      conflicts,
      paid: null,
      revenueUsable: false,
      rationale: 'No authoritative Outseta or explicitly approved membership snapshot is available. Paid state and revenue remain unknown.',
    }
  }

  const authoritative = authorities[0]
  if (!authoritative) throw new ContractValidationError('Membership authority resolution invariant failed')

  for (const otherAuthority of authorities.slice(1)) {
    const fields = differingMembershipFields(authoritative, otherAuthority)
    if (fields.length > 0) {
      conflicts.push({
        conflictType: 'multiple_authorities',
        authoritativeSource: authoritative.sourceSystem,
        conflictingSource: otherAuthority.sourceSystem,
        fields,
        summary: 'Multiple authoritative membership snapshots disagree and require investigation.',
      })
    }
  }

  for (const mirror of snapshots.filter((snapshot) => !snapshot.isAuthoritative)) {
    const fields = differingMembershipFields(authoritative, mirror)
    if (fields.includes('membershipTier')) {
      conflicts.push({
        conflictType: 'tier_mismatch',
        authoritativeSource: authoritative.sourceSystem,
        conflictingSource: mirror.sourceSystem,
        fields: ['membershipTier'],
        summary: `${mirror.sourceSystem} tier does not match authoritative membership truth.`,
      })
    }
    if (fields.includes('membershipStatus')) {
      conflicts.push({
        conflictType: 'status_mismatch',
        authoritativeSource: authoritative.sourceSystem,
        conflictingSource: mirror.sourceSystem,
        fields: ['membershipStatus'],
        summary: `${mirror.sourceSystem} status does not match authoritative membership truth.`,
      })
    }
    if (fields.includes('planUid')) {
      conflicts.push({
        conflictType: 'plan_mismatch',
        authoritativeSource: authoritative.sourceSystem,
        conflictingSource: mirror.sourceSystem,
        fields: ['planUid'],
        summary: `${mirror.sourceSystem} plan identifier does not match authoritative membership truth.`,
      })
    }
  }

  const revenueUsable =
    authoritative.revenueState === 'known' &&
    [authoritative.mrr, authoritative.arr, authoritative.lifetimeRevenue].some((value) => value !== null)

  return {
    state: conflicts.length > 0 ? 'conflict' : 'known',
    authoritative,
    conflicts,
    paid: isPaidTier(authoritative.membershipTier),
    revenueUsable,
    rationale:
      conflicts.length > 0
        ? 'Authoritative membership is available, but downstream or competing snapshots disagree. Use authority for access while investigating the conflict.'
        : 'Authoritative membership snapshot established product truth.',
  }
}

export function isPaidTier(tier: MembershipTier): boolean {
  return !['free', 'unknown'].includes(tier)
}

function assertMembershipSnapshot(snapshot: MembershipSnapshot): void {
  if (snapshot.sourceSystem === 'activecampaign' && snapshot.isAuthoritative) {
    throw new ContractValidationError('ActiveCampaign cannot be authoritative for membership ownership')
  }
  if (!Number.isInteger(snapshot.authorityRank) || snapshot.authorityRank < 0 || snapshot.authorityRank > 100) {
    throw new ContractValidationError('authorityRank must be an integer between 0 and 100')
  }
  if (!Number.isFinite(Date.parse(snapshot.observedAt))) {
    throw new ContractValidationError('Membership snapshot observedAt is invalid')
  }
  if (['unknown', 'not_applicable'].includes(snapshot.revenueState)) {
    if (snapshot.mrr !== null || snapshot.arr !== null || snapshot.lifetimeRevenue !== null) {
      throw new ContractValidationError('Unknown revenue state cannot carry invented revenue values')
    }
  }
  for (const [field, value] of [
    ['mrr', snapshot.mrr],
    ['arr', snapshot.arr],
    ['lifetimeRevenue', snapshot.lifetimeRevenue],
  ] as const) {
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      throw new ContractValidationError(`${field} must be null or nonnegative`)
    }
  }
}

function differingMembershipFields(left: MembershipSnapshot, right: MembershipSnapshot): string[] {
  const fields: string[] = []
  if (left.membershipTier !== right.membershipTier) fields.push('membershipTier')
  if (left.membershipStatus !== right.membershipStatus) fields.push('membershipStatus')
  if (left.planUid !== right.planUid) fields.push('planUid')
  return fields
}
