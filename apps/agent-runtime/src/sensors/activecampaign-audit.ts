import type { CorrelationContext, SourceReference } from '../contracts.js'
import { ContractValidationError } from '../contracts.js'

export type MarketingContactClassification =
  | 'current_member'
  | 'churned_member'
  | 'legacy_wix_candidate'
  | 'cold_import'
  | 'internal'
  | 'test'
  | 'inactive_member'
  | 'unknown'

export type MarketingEngagementState = 'clicked' | 'opened' | 'visited' | 'stale' | 'never_engaged' | 'unknown'
export type AssetBusinessScope = 'nested_objects' | 'legacy' | 'internal' | 'test' | 'unknown'
export type MarketingTier = 'free' | 'starter' | 'founders' | 'pro' | 'elite' | 'agency' | 'unknown'
export type MarketingLifecycle = 'active' | 'trialing' | 'canceling' | 'canceled' | 'inactive' | 'past_due' | 'paused' | 'incomplete' | 'unknown'
export type MarketingSource = 'cold_import' | 'wix' | 'vercel'
export type MarketingAudienceTrait = 'internal' | 'coworker' | 'test' | 'demo' | 'hiring_firm'

export interface ActiveCampaignContactSnapshot {
  contactId: string
  email: string | null
  tagNames: string[]
  listNames: string[]
  customFields: Record<string, string | null>
  createdAt: string | null
  updatedAt: string | null
  lastOpenAt: string | null
  lastClickAt: string | null
  lastSiteVisitAt: string | null
  bounced: boolean
  unsubscribed: boolean
  marketingConsent?: 'granted' | 'denied' | 'unknown'
}

export interface AuthoritativeMembershipTruth {
  memberId: string
  email: string | null
  membershipTier: string | null
  membershipStatus: string | null
  authoritative: true
  activeCampaignContactId: string
  sourceSystem: 'outseta'
  identityState?: 'verified' | 'conflict'
}

export interface MarketingClassificationConfig {
  internalDomains: string[]
  approvedInternalMemberEmails?: string[]
  coldTagPatterns?: string[]
  wixTagPatterns?: string[]
  testPatterns?: string[]
  coworkerContactIds?: string[]
  demoContactIds?: string[]
  hiringFirmContactIds?: string[]
  vercelContactIds?: string[]
  staleAfterDays?: number
  now?: string
}

export interface MarketingContactClassificationResult {
  sourceContactId: string
  canonicalMemberId: string | null
  classification: MarketingContactClassification
  engagementState: MarketingEngagementState
  membershipTruthState: 'known' | 'unknown' | 'conflict'
  membershipTier: MarketingTier
  lifecycle: MarketingLifecycle
  sourceMarkers: MarketingSource[]
  audienceTraits: MarketingAudienceTrait[]
  consent: 'granted' | 'denied' | 'unknown'
  excludedFromMarketingAnalysis: boolean
  exclusionReason: string | null
  evidence: Array<Record<string, unknown>>
  confidence: number
  recommendedDisposition: 'retain' | 'quarantine' | 'review' | 'suppress_candidate'
  sourceRefs: SourceReference[]
  correlation: CorrelationContext
}

export interface ActiveCampaignAssetSnapshot {
  assetType: 'list' | 'tag' | 'field' | 'automation' | 'campaign' | 'segment' | 'custom_object' | 'pipeline'
  externalId: string
  name: string
  description?: string | null
  active?: boolean | null
}

export interface AssetClassificationResult {
  assetType: ActiveCampaignAssetSnapshot['assetType']
  externalId: string
  assetName: string
  candidateScope: AssetBusinessScope
  lifecycleStatus: 'active' | 'inactive' | 'quarantined' | 'review_required'
  readRecommended: boolean
  mutationAllowed: false
  confidence: number
  reasons: string[]
  requiresOwnerReview: true
}

export function classifyMarketingContact(input: {
  contact: ActiveCampaignContactSnapshot
  membership: AuthoritativeMembershipTruth | null
  config: MarketingClassificationConfig
  correlation: CorrelationContext
}): MarketingContactClassificationResult {
  const { contact, membership, correlation } = input
  if (!contact.contactId.trim()) throw new ContractValidationError('ActiveCampaign contactId is required')
  const now = input.config.now ?? new Date().toISOString()
  const email = normalizeEmail(contact.email)
  const approvedInternalEmails = new Set((input.config.approvedInternalMemberEmails ?? []).map((value) => value.toLowerCase()))
  const internalDomains = new Set(['activecampaign.com', ...input.config.internalDomains].map((value) => value.toLowerCase().replace(/^@/, '')))
  const internalDomain = email ? internalDomains.has(email.split('@')[1] ?? '') : false
  const isApprovedInternal = email ? approvedInternalEmails.has(email) : false
  const tags = contact.tagNames.map(normalizeName)
  const fields = Object.entries(contact.customFields).map(([key, value]) => `${normalizeName(key)}:${normalizeName(value ?? '')}`)
  const coldPatterns = input.config.coldTagPatterns ?? ['cold', 'import', 'contacts.csv', 'lead:cold']
  const wixPatterns = input.config.wixTagPatterns ?? ['wix']
  const testPatterns = input.config.testPatterns ?? ['test']
  const hasColdEvidence = matchesAny([...tags, ...fields], coldPatterns)
  const hasWixEvidence = matchesAny([...tags, ...fields], wixPatterns)
  const hasTestEvidence = matchesWords([...tags, ...fields, email?.split('@')[0] ?? ''], testPatterns)
  const engagementState = deriveEngagementState(contact, now, input.config.staleAfterDays ?? 90)
  const stableMatch = membership?.authoritative === true
    && membership.sourceSystem === 'outseta'
    && membership.activeCampaignContactId === contact.contactId
    && Boolean(membership.memberId.trim())
    && membership.identityState !== 'conflict'
  const membershipTier = stableMatch ? normalizeMarketingTier(membership.membershipTier) : 'unknown'
  const lifecycle = stableMatch ? normalizeMarketingLifecycle(membership.membershipStatus) : 'unknown'
  const membershipTruthState = membership && !stableMatch ? 'conflict'
    : stableMatch && membershipTier !== 'unknown' && lifecycle !== 'unknown' ? 'known' : 'unknown'
  const sourceMarkers: MarketingSource[] = []
  if (hasColdEvidence) sourceMarkers.push('cold_import')
  if (hasWixEvidence) sourceMarkers.push('wix')
  if (input.config.vercelContactIds?.includes(contact.contactId)) sourceMarkers.push('vercel')
  const audienceTraits: MarketingAudienceTrait[] = []
  if (internalDomain && !isApprovedInternal) audienceTraits.push('internal')
  if (input.config.coworkerContactIds?.includes(contact.contactId)) audienceTraits.push('coworker')
  if (hasTestEvidence) audienceTraits.push('test')
  if (input.config.demoContactIds?.includes(contact.contactId) || matchesWords(tags, ['demo'])) audienceTraits.push('demo')
  // Agency is a member plan. Only explicit firm evidence marks a hiring-firm cohort.
  if (input.config.hiringFirmContactIds?.includes(contact.contactId)
    || tags.some((tag) => ['hiring firms', 'hiring-firm', 'persona-hiring-firm'].includes(tag))) audienceTraits.push('hiring_firm')
  const consent = contact.bounced || contact.unsubscribed || contact.marketingConsent === 'denied'
    ? 'denied' : contact.marketingConsent === 'granted' ? 'granted' : 'unknown'

  let classification: MarketingContactClassification = 'unknown'
  let confidence = 0.4
  let recommendedDisposition: MarketingContactClassificationResult['recommendedDisposition'] = 'review'
  const evidence: Array<Record<string, unknown>> = []

  if (membershipTruthState === 'known' && membership) {
    classification = lifecycle === 'inactive' ? 'inactive_member'
      : lifecycle === 'canceled' ? 'churned_member' : 'current_member'
    confidence = 1
    recommendedDisposition = 'retain'
    evidence.push({ type: 'authoritative_membership', memberId: membership.memberId, status: membership.membershipStatus })
  } else if (membership) {
    evidence.push({ type: 'unresolved_membership', truthState: membershipTruthState })
  } else if (internalDomain && !isApprovedInternal) {
    classification = 'internal'
    confidence = 0.98
    recommendedDisposition = 'quarantine'
    evidence.push({ type: 'internal_domain' })
  } else if (hasTestEvidence) {
    classification = 'test'
    confidence = 0.85
    recommendedDisposition = 'quarantine'
    evidence.push({ type: 'test_pattern' })
  } else if (hasWixEvidence) {
    classification = 'legacy_wix_candidate'
    confidence = 0.85
    recommendedDisposition = 'review'
    evidence.push({ type: 'wix_marker' })
  } else if (hasColdEvidence) {
    classification = 'cold_import'
    confidence = 0.9
    recommendedDisposition = engagementState === 'never_engaged' || engagementState === 'stale' ? 'suppress_candidate' : 'review'
    evidence.push({ type: 'cold_import_marker' })
  }

  const excludedFromMarketingAnalysis =
    audienceTraits.length > 0 ||
    membershipTruthState === 'conflict' ||
    (classification === 'cold_import' && engagementState === 'never_engaged')
  const exclusionReason = excludedFromMarketingAnalysis
    ? classification === 'cold_import'
      ? 'Cold import with no observed engagement is excluded from member and conversion analysis pending review.'
      : `${classification} contact is excluded from Nested Objects member and revenue analysis.`
    : null

  return {
    sourceContactId: contact.contactId,
    canonicalMemberId: stableMatch ? membership.memberId : null,
    classification,
    engagementState,
    membershipTruthState,
    membershipTier,
    lifecycle,
    sourceMarkers,
    audienceTraits,
    consent,
    excludedFromMarketingAnalysis,
    exclusionReason,
    evidence,
    confidence,
    recommendedDisposition,
    sourceRefs: [{
      sourceSystem: 'activecampaign',
      sourceType: 'contact',
      sourceId: contact.contactId,
      observedAt: normalizeTimestamp(contact.updatedAt ?? contact.createdAt) ?? now,
    }],
    correlation,
  }
}

export function classifyActiveCampaignAsset(asset: ActiveCampaignAssetSnapshot): AssetClassificationResult {
  if (!asset.externalId.trim() || !asset.name.trim()) {
    throw new ContractValidationError('ActiveCampaign asset requires externalId and name')
  }
  const haystack = normalizeName(`${asset.name} ${asset.description ?? ''}`)
  const reasons: string[] = []
  let candidateScope: AssetBusinessScope = 'unknown'
  let confidence = 0.4

  if (matchesAny([haystack], ['flynerd', 'fly nerd', 'salesforce', 'vonigo', 'artist', 'realtor demo'])) {
    candidateScope = 'legacy'
    confidence = 0.9
    reasons.push('Legacy non-Nested Objects naming pattern.')
  } else if (matchesAny([haystack], ['test', 'demo', 'automation ', 'new campaign', 'new template', 'first automation'])) {
    candidateScope = 'test'
    confidence = 0.85
    reasons.push('Generic test or demonstration naming pattern.')
  } else if (matchesAny([haystack], ['nested objects', 'inspector', 'member', 'directory', 'onboarding', 're-engagement', 'win-back', 'training', 'background check', 'free to paid', 'profile'])) {
    candidateScope = 'nested_objects'
    confidence = 0.85
    reasons.push('Nested Objects lifecycle or product naming pattern.')
  } else {
    reasons.push('Ownership and purpose cannot be established from metadata alone.')
  }

  return {
    assetType: asset.assetType,
    externalId: asset.externalId,
    assetName: asset.name,
    candidateScope,
    lifecycleStatus: asset.active === false ? 'inactive' : candidateScope === 'unknown' ? 'review_required' : candidateScope === 'nested_objects' ? 'active' : 'quarantined',
    readRecommended: candidateScope === 'nested_objects',
    mutationAllowed: false,
    confidence,
    reasons,
    requiresOwnerReview: true,
  }
}

function deriveEngagementState(
  contact: ActiveCampaignContactSnapshot,
  now: string,
  staleAfterDays: number,
): MarketingEngagementState {
  const observations = [
    [contact.lastClickAt, 'clicked'], [contact.lastSiteVisitAt, 'visited'], [contact.lastOpenAt, 'opened'],
  ] as const
  const current = Date.parse(now)
  const valid = observations.filter(([at]) => at && Number.isFinite(Date.parse(at)) && Date.parse(at) <= current)
  const fresh = valid.find(([at]) => !isStale(at!, now, staleAfterDays))
  if (fresh) return fresh[1]
  if (valid.length > 0) return 'stale'
  if (observations.some(([at]) => at !== null)) return 'unknown'
  if (contact.createdAt) return 'never_engaged'
  return 'unknown'
}

export function normalizeMarketingTier(value: string | null | undefined): MarketingTier {
  const normalized = normalizeName(value ?? '')
  if (normalized === 'founder') return 'founders'
  return ['free', 'starter', 'founders', 'pro', 'elite', 'agency'].includes(normalized) ? normalized as MarketingTier : 'unknown'
}

export function normalizeMarketingLifecycle(value: string | null | undefined): MarketingLifecycle {
  const normalized = normalizeName(value ?? '').replace(/ /g, '_')
  if (normalized === 'cancelled' || normalized === 'churned' || normalized === 'expired' || normalized === 'trial_expired') return 'canceled'
  if (normalized === 'cancelling') return 'canceling'
  return ['active', 'trialing', 'canceling', 'canceled', 'inactive', 'past_due', 'paused', 'incomplete'].includes(normalized)
    ? normalized as MarketingLifecycle : 'unknown'
}

function matchesWords(values: string[], patterns: string[]): boolean {
  return patterns.some((pattern) => values.some((value) => (
    (' ' + value.replace(/[^a-z0-9]+/g, ' ') + ' ').includes(' ' + normalizeName(pattern) + ' ')
  )))
}

function isStale(value: string, now: string, days: number): boolean {
  const observed = Date.parse(value)
  const current = Date.parse(now)
  return Number.isFinite(observed) && Number.isFinite(current) && current - observed > days * 86_400_000
}

function matchesAny(values: string[], patterns: string[]): boolean {
  return patterns.some((pattern) => values.some((value) => value.includes(normalizeName(pattern))))
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeEmail(value: string | null): string | null {
  const normalized = value?.trim().toLowerCase() ?? ''
  return normalized.includes('@') ? normalized : null
}

function normalizeTimestamp(value: string | null): string | null {
  if (!value || !Number.isFinite(Date.parse(value))) return null
  return new Date(value).toISOString()
}
