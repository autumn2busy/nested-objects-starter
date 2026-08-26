import type { CorrelationContext, SourceReference } from '../contracts.js'
import { ContractValidationError } from '../contracts.js'

type ProjectedMembershipTier = 'free' | 'starter' | 'founders' | 'pro' | 'elite' | 'agency' | 'unknown'
type ProjectedMembershipStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused' | 'incomplete' | 'unknown'

export interface ProfileSourceRow {
  id: string
  user_id?: string | null
  outseta_person_uid?: string | null
  outseta_account_id?: string | null
  user_email?: string | null
  email?: string | null
  subscription_tier?: string | null
  subscription_status?: string | null
  subscription_start_date?: string | null
  subscription_end_date?: string | null
  plan_uid?: string | null
  plan_name?: string | null
  outseta_updated_at?: string | null
  last_login_at?: string | null
  last_active_at?: string | null
  created_at: string
  updated_at?: string | null
  state?: string | null
  service_areas?: unknown
  primary_services?: unknown
  experience_level?: string | null
  max_travel_distance?: number | string | null
  training_modules_completed?: number | null
  training_modules_total?: number | null
  is_published?: boolean | null
  headline?: string | null
  bio?: string | null
  phone?: string | null
}

export interface ConversionEventSourceRow {
  id: string
  client_event_id?: string | null
  event_name: string
  anonymous_id?: string | null
  session_id?: string | null
  member_uid?: string | null
  member_email?: string | null
  plan_uid?: string | null
  plan_name?: string | null
  source_page?: string | null
  source?: string | null
  reason?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  event_data?: Record<string, unknown> | null
  occurred_at: string
}

export interface IdentityConflict {
  conflictType: 'email_collision' | 'outseta_person_collision' | 'outseta_account_collision'
  identifier: string
  profileIds: string[]
}

export interface CanonicalMemberProjection {
  id: string
  primaryEmail: string | null
  identityStatus: 'resolved' | 'conflict'
  dataQualityStatus: 'complete' | 'partial' | 'conflict' | 'unknown'
  dataQualityScore: number
  dataQualityDetails: Record<string, unknown>
  profileFacts: Record<string, unknown>
}

export interface IdentityLinkProjection {
  sourceSystem: string
  identifierType: string
  externalId: string
  normalizedExternalId: string
  status: 'active' | 'conflict'
  isPrimary: boolean
  confidence: number
  sourceRefs: SourceReference[]
  provenance: Record<string, unknown>
  idempotencyKey: string
}

export interface MembershipProjection {
  sourceSystem: 'outseta' | 'supabase_profiles'
  sourceRecordId: string | null
  isAuthoritative: true
  authorityRank: 100 | 80
  membershipTier: ProjectedMembershipTier
  membershipStatus: ProjectedMembershipStatus
  planUid: string | null
  subscriptionUid: string | null
  subscriptionStartAt: string | null
  renewalAt: string | null
  cancellationAt: string | null
  currency: 'USD'
  mrr: null
  arr: null
  lifetimeRevenue: null
  revenueState: 'unknown'
  snapshotAt: string
  completeness: number
  confidence: number
  sourceRefs: SourceReference[]
  provenance: Record<string, unknown>
  dataQuality: Record<string, unknown>
  idempotencyKey: string
}

export interface OperationalProfileProjection {
  state: string | null
  counties: string[]
  serviceRadiusMiles: number | null
  experienceLevel: string | null
  inspectionTypes: string[]
  profileCompletion: number | null
  trainingCompletion: number | null
  lastSeenAt: string | null
  profileLastActiveAt: string | null
  latestEventAt: string | null
  directoryViews: number
  firmViews: number
  paywallHits: number
  opportunityClicks: number
  activeCampaignEngagement: Record<string, unknown>
  signupSource: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  dataState: 'known' | 'partial' | 'unknown'
  completeness: number
  confidence: number
  sourceRefs: SourceReference[]
  provenance: Record<string, unknown>
  projectionVersion: 'phase-c-v1'
}

export interface MemberProjectionPlan {
  memberId: string
  canonicalMember: CanonicalMemberProjection
  identityLinks: IdentityLinkProjection[]
  memberships: MembershipProjection[]
  operationalProfile: OperationalProfileProjection
  assignedEventIds: string[]
  identityConflicts: IdentityConflict[]
  correlation: CorrelationContext
}

export interface ProjectionBatchResult {
  projections: MemberProjectionPlan[]
  identityConflicts: IdentityConflict[]
  unmatchedEventIds: string[]
  duplicateEventIds: string[]
}

export interface BuildProjectionBatchInput {
  profiles: ProfileSourceRow[]
  conversionEvents: ConversionEventSourceRow[]
  correlation: CorrelationContext
  observedAt?: string
}

export function buildMemberProjectionBatch(input: BuildProjectionBatchInput): ProjectionBatchResult {
  const observedAt = input.observedAt ?? new Date().toISOString()
  const profiles = input.profiles.map(assertProfile)
  const { events, duplicateEventIds } = deduplicateEvents(input.conversionEvents)
  const emailGroups = groupProfiles(profiles, (profile) => normalizeEmail(profile.user_email ?? profile.email))
  const personGroups = groupProfiles(profiles, (profile) => normalizeText(profile.outseta_person_uid))
  const accountGroups = groupProfiles(profiles, (profile) => normalizeText(profile.outseta_account_id))
  const conflicts = [
    ...groupsToConflicts(emailGroups, 'email_collision'),
    ...groupsToConflicts(personGroups, 'outseta_person_collision'),
    ...groupsToConflicts(accountGroups, 'outseta_account_collision'),
  ]

  const profileByPerson = uniqueProfileLookup(personGroups)
  const profileByEmail = uniqueProfileLookup(emailGroups)
  const assignments = new Map<string, string>()
  const anonymousToProfile = new Map<string, string>()

  for (const event of events) {
    const profileId = directEventProfile(event, profileByPerson, profileByEmail)
    if (!profileId) continue
    assignments.set(event.id, profileId)
    const anonymousId = normalizeText(event.anonymous_id)
    if (anonymousId) anonymousToProfile.set(anonymousId, profileId)
  }

  for (const event of events) {
    if (assignments.has(event.id)) continue
    const anonymousId = normalizeText(event.anonymous_id)
    const profileId = anonymousId ? anonymousToProfile.get(anonymousId) : undefined
    if (profileId) assignments.set(event.id, profileId)
  }

  const eventsByProfile = new Map<string, ConversionEventSourceRow[]>()
  for (const event of events) {
    const profileId = assignments.get(event.id)
    if (!profileId) continue
    const assigned = eventsByProfile.get(profileId) ?? []
    assigned.push(event)
    eventsByProfile.set(profileId, assigned)
  }

  const projections = profiles.map((profile) => {
    const profileConflicts = conflicts.filter((conflict) => conflict.profileIds.includes(profile.id))
    return buildMemberProjection({
      profile,
      events: eventsByProfile.get(profile.id) ?? [],
      conflicts: profileConflicts,
      correlation: input.correlation,
      observedAt,
    })
  })

  return {
    projections,
    identityConflicts: conflicts,
    unmatchedEventIds: events.filter((event) => !assignments.has(event.id)).map((event) => event.id),
    duplicateEventIds,
  }
}

function buildMemberProjection(input: {
  profile: ProfileSourceRow
  events: ConversionEventSourceRow[]
  conflicts: IdentityConflict[]
  correlation: CorrelationContext
  observedAt: string
}): MemberProjectionPlan {
  const { profile, conflicts, correlation, observedAt } = input
  const events = [...input.events].sort((left, right) => Date.parse(left.occurred_at) - Date.parse(right.occurred_at))
  const email = normalizeEmail(profile.user_email ?? profile.email)
  const emailConflict = conflicts.some((conflict) => conflict.conflictType === 'email_collision')
  const identityConflict = conflicts.length > 0
  const sourceRefs = profileSourceRefs(profile)
  const completeness = profileCompleteness(profile)

  const identityLinks = buildIdentityLinks(profile, events, conflicts, sourceRefs)
  const memberships = buildMemberships(profile, observedAt, sourceRefs)
  const operationalProfile = buildOperationalProfile(profile, events, sourceRefs)

  return {
    memberId: profile.id,
    canonicalMember: {
      id: profile.id,
      primaryEmail: emailConflict ? null : email,
      identityStatus: identityConflict ? 'conflict' : 'resolved',
      dataQualityStatus: identityConflict ? 'conflict' : completeness >= 0.8 ? 'complete' : completeness > 0 ? 'partial' : 'unknown',
      dataQualityScore: completeness,
      dataQualityDetails: {
        conflicts,
        missingFields: missingProfileFields(profile),
        authoritativeMembershipSources: memberships.map((membership) => membership.sourceSystem),
      },
      profileFacts: {
        createdAt: profile.created_at,
        isPublished: profile.is_published ?? null,
        hasHeadline: Boolean(normalizeText(profile.headline)),
        hasBio: Boolean(normalizeText(profile.bio)),
      },
    },
    identityLinks,
    memberships,
    operationalProfile,
    assignedEventIds: events.map((event) => event.id),
    identityConflicts: conflicts,
    correlation,
  }
}

function buildIdentityLinks(
  profile: ProfileSourceRow,
  events: ConversionEventSourceRow[],
  conflicts: IdentityConflict[],
  sourceRefs: SourceReference[],
): IdentityLinkProjection[] {
  const links: IdentityLinkProjection[] = []
  const add = (sourceSystem: string, identifierType: string, rawValue: unknown, isPrimary = false) => {
    const externalId = normalizeText(rawValue)
    if (!externalId) return
    const normalizedExternalId = identifierType === 'email' ? externalId.toLowerCase() : externalId
    const conflicted = conflicts.some((conflict) =>
      (conflict.conflictType === 'email_collision' && identifierType === 'email') ||
      (conflict.conflictType === 'outseta_person_collision' && identifierType === 'person_uid') ||
      (conflict.conflictType === 'outseta_account_collision' && identifierType === 'account_uid'),
    )
    if (conflicted && identifierType === 'email') return

    links.push({
      sourceSystem,
      identifierType,
      externalId,
      normalizedExternalId,
      status: conflicted ? 'conflict' : 'active',
      isPrimary,
      confidence: conflicted ? 0 : 1,
      sourceRefs,
      provenance: { projection: 'profiles-and-conversion-events', projectionVersion: 'phase-c-v1' },
      idempotencyKey: `identity:${profile.id}:${sourceSystem}:${identifierType}:${normalizedExternalId}`,
    })
  }

  add('supabase', 'profile_id', profile.id, true)
  add('supabase', 'user_id', profile.user_id)
  add('outseta', 'person_uid', profile.outseta_person_uid, true)
  add('outseta', 'account_uid', profile.outseta_account_id)
  add('profile', 'email', profile.user_email ?? profile.email, true)

  const anonymousIds = new Set(events.map((event) => normalizeText(event.anonymous_id)).filter(isPresent))
  for (const anonymousId of anonymousIds) add('conversion_events', 'anonymous_id', anonymousId)

  return uniqueBy(links, (link) => `${link.sourceSystem}:${link.identifierType}:${link.normalizedExternalId}`)
}

function buildMemberships(
  profile: ProfileSourceRow,
  observedAt: string,
  sourceRefs: SourceReference[],
): MembershipProjection[] {
  const tier = normalizeTier(profile.subscription_tier ?? profile.plan_name)
  const status = normalizeStatus(profile.subscription_status)
  const cancellationAt = status === 'canceled' ? normalizeTimestamp(profile.subscription_end_date) : null
  const common = {
    membershipTier: tier,
    membershipStatus: status,
    planUid: normalizeText(profile.plan_uid),
    subscriptionUid: null,
    subscriptionStartAt: normalizeTimestamp(profile.subscription_start_date),
    renewalAt: status === 'canceled' ? null : normalizeTimestamp(profile.subscription_end_date),
    cancellationAt,
    currency: 'USD' as const,
    mrr: null,
    arr: null,
    lifetimeRevenue: null,
    revenueState: 'unknown' as const,
    snapshotAt: normalizeTimestamp(profile.outseta_updated_at ?? profile.updated_at) ?? observedAt,
    sourceRefs,
    provenance: { sourceTable: 'profiles', projectedAt: observedAt, projectionVersion: 'phase-c-v1' },
    dataQuality: {
      revenueReason: 'Profiles do not provide billing-grade revenue amounts.',
      planPresent: Boolean(normalizeText(profile.plan_uid ?? profile.plan_name)),
    },
  }

  const snapshots: MembershipProjection[] = []
  if (normalizeText(profile.outseta_person_uid) || normalizeText(profile.outseta_account_id) || normalizeText(profile.plan_uid)) {
    snapshots.push({
      ...common,
      sourceSystem: 'outseta',
      sourceRecordId: normalizeText(profile.outseta_account_id ?? profile.outseta_person_uid),
      isAuthoritative: true,
      authorityRank: 100,
      completeness: membershipCompleteness(profile, true),
      confidence: membershipCompleteness(profile, true),
      idempotencyKey: `membership:${profile.id}:outseta:${common.snapshotAt}`,
    })
  }

  snapshots.push({
    ...common,
    sourceSystem: 'supabase_profiles',
    sourceRecordId: profile.id,
    isAuthoritative: true,
    authorityRank: 80,
    completeness: membershipCompleteness(profile, false),
    confidence: membershipCompleteness(profile, false),
    idempotencyKey: `membership:${profile.id}:supabase_profiles:${common.snapshotAt}`,
  })

  return snapshots
}

function buildOperationalProfile(
  profile: ProfileSourceRow,
  events: ConversionEventSourceRow[],
  sourceRefs: SourceReference[],
): OperationalProfileProjection {
  const eventCount = (eventName: string) => events.filter((event) => event.event_name === eventName).length
  const latestEventAt = maxTimestamp(events.map((event) => event.occurred_at))
  const profileLastActiveAt = maxTimestamp([profile.last_active_at, profile.last_login_at])
  const lastSeenAt = maxTimestamp([latestEventAt, profileLastActiveAt])
  const latestSignup = latestEvent(events, 'signup_completed')
  const latestProfile = latestEvent(events, 'profile_completed')
  const profileCompletion = numericBetweenZeroAndOne(latestProfile?.event_data?.completeness)
    ?? inferProfileCompletion(profile)
  const totalTraining = nonnegativeNumber(profile.training_modules_total)
  const completedTraining = nonnegativeNumber(profile.training_modules_completed)
  const trainingCompletion = totalTraining && completedTraining !== null
    ? Math.min(1, completedTraining / totalTraining)
    : null
  const counties = normalizeStringArray(profile.service_areas)
  const inspectionTypes = normalizeStringArray(profile.primary_services)
  const source = latestSignup?.source ?? latestSignup?.utm_source ?? textFromRecord(latestSignup?.event_data, 'signup_source')
  const utmSource = latestSignup?.utm_source ?? textFromRecord(latestSignup?.event_data, 'utm_source')
  const utmMedium = latestSignup?.utm_medium ?? textFromRecord(latestSignup?.event_data, 'utm_medium')
  const utmCampaign = latestSignup?.utm_campaign ?? textFromRecord(latestSignup?.event_data, 'utm_campaign')
  const knownFields = [profile.state, counties.length > 0, inspectionTypes.length > 0, profile.experience_level, lastSeenAt]
    .filter(Boolean).length
  const completeness = round4(knownFields / 5)

  return {
    state: normalizeText(profile.state),
    counties,
    serviceRadiusMiles: nonnegativeNumber(profile.max_travel_distance),
    experienceLevel: normalizeText(profile.experience_level),
    inspectionTypes,
    profileCompletion,
    trainingCompletion,
    lastSeenAt,
    profileLastActiveAt,
    latestEventAt,
    directoryViews: eventCount('directory_viewed'),
    firmViews: eventCount('firm_view'),
    paywallHits: eventCount('paywall_hit'),
    opportunityClicks: eventCount('opportunity_clicked'),
    activeCampaignEngagement: {},
    signupSource: normalizeText(source),
    utmSource: normalizeText(utmSource),
    utmMedium: normalizeText(utmMedium),
    utmCampaign: normalizeText(utmCampaign),
    dataState: completeness >= 0.8 ? 'known' : completeness > 0 ? 'partial' : 'unknown',
    completeness,
    confidence: events.length > 0 ? Math.max(0.7, completeness) : Math.min(0.6, completeness),
    sourceRefs: [
      ...sourceRefs,
      ...events.slice(-20).map((event) => ({
        sourceSystem: 'supabase',
        sourceType: 'conversion_event',
        sourceId: event.id,
        observedAt: event.occurred_at,
      })),
    ],
    provenance: {
      sourceTables: ['profiles', 'conversion_events'],
      assignedEventCount: events.length,
      eventCounts: {
        directoryViewed: eventCount('directory_viewed'),
        firmView: eventCount('firm_view'),
        paywallHit: eventCount('paywall_hit'),
        upgradeClicked: eventCount('upgrade_clicked'),
      },
    },
    projectionVersion: 'phase-c-v1',
  }
}

function assertProfile(profile: ProfileSourceRow): ProfileSourceRow {
  if (!profile.id.trim()) throw new ContractValidationError('Profile id is required')
  if (!Number.isFinite(Date.parse(profile.created_at))) {
    throw new ContractValidationError('Profile created_at must be a valid timestamp', { profileId: profile.id })
  }
  return profile
}

function deduplicateEvents(rows: ConversionEventSourceRow[]): { events: ConversionEventSourceRow[]; duplicateEventIds: string[] } {
  const seen = new Set<string>()
  const events: ConversionEventSourceRow[] = []
  const duplicateEventIds: string[] = []
  for (const event of rows) {
    if (!event.id.trim() || !event.event_name.trim() || !Number.isFinite(Date.parse(event.occurred_at))) {
      throw new ContractValidationError('Conversion event requires id, event_name, and valid occurred_at')
    }
    const key = normalizeText(event.client_event_id) ?? event.id
    if (seen.has(key)) {
      duplicateEventIds.push(event.id)
      continue
    }
    seen.add(key)
    events.push(event)
  }
  return { events, duplicateEventIds }
}

function directEventProfile(
  event: ConversionEventSourceRow,
  profileByPerson: Map<string, string>,
  profileByEmail: Map<string, string>,
): string | null {
  const memberUid = normalizeText(event.member_uid)
  if (memberUid && profileByPerson.has(memberUid)) return profileByPerson.get(memberUid) ?? null
  const email = normalizeEmail(event.member_email)
  if (email && profileByEmail.has(email)) return profileByEmail.get(email) ?? null
  return null
}

function groupProfiles(
  profiles: ProfileSourceRow[],
  keySelector: (profile: ProfileSourceRow) => string | null,
): Map<string, string[]> {
  const groups = new Map<string, string[]>()
  for (const profile of profiles) {
    const key = keySelector(profile)
    if (!key) continue
    groups.set(key, [...(groups.get(key) ?? []), profile.id])
  }
  return groups
}

function uniqueProfileLookup(groups: Map<string, string[]>): Map<string, string> {
  return new Map([...groups.entries()].filter(([, ids]) => ids.length === 1).map(([key, ids]) => [key, ids[0] ?? '']))
}

function groupsToConflicts(
  groups: Map<string, string[]>,
  conflictType: IdentityConflict['conflictType'],
): IdentityConflict[] {
  return [...groups.entries()]
    .filter(([, profileIds]) => profileIds.length > 1)
    .map(([identifier, profileIds]) => ({ conflictType, identifier, profileIds: [...profileIds].sort() }))
}

function profileSourceRefs(profile: ProfileSourceRow): SourceReference[] {
  return [{
    sourceSystem: 'supabase',
    sourceType: 'profile',
    sourceId: profile.id,
    observedAt: normalizeTimestamp(profile.updated_at ?? profile.outseta_updated_at ?? profile.created_at) ?? profile.created_at,
  }]
}

function profileCompleteness(profile: ProfileSourceRow): number {
  const present = [
    normalizeEmail(profile.user_email ?? profile.email),
    normalizeText(profile.outseta_person_uid),
    normalizeText(profile.subscription_tier),
    normalizeText(profile.subscription_status),
    normalizeText(profile.state),
    normalizeText(profile.experience_level),
    normalizeText(profile.phone),
  ].filter(Boolean).length
  return round4(present / 7)
}

function membershipCompleteness(profile: ProfileSourceRow, outseta: boolean): number {
  const values = [
    profile.subscription_tier,
    profile.subscription_status,
    profile.plan_uid ?? profile.plan_name,
    profile.subscription_start_date,
    outseta ? profile.outseta_person_uid ?? profile.outseta_account_id : profile.id,
  ]
  return round4(values.filter((value) => normalizeText(value)).length / values.length)
}

function missingProfileFields(profile: ProfileSourceRow): string[] {
  const required: Array<[string, unknown]> = [
    ['email', profile.user_email ?? profile.email],
    ['subscription_tier', profile.subscription_tier],
    ['subscription_status', profile.subscription_status],
    ['outseta_person_uid', profile.outseta_person_uid],
    ['state', profile.state],
  ]
  return required.filter(([, value]) => !normalizeText(value)).map(([name]) => name)
}

function inferProfileCompletion(profile: ProfileSourceRow): number {
  const fields = [profile.user_email ?? profile.email, profile.phone, profile.state, profile.service_areas, profile.primary_services, profile.experience_level, profile.headline, profile.bio]
  return round4(fields.filter((value) => Array.isArray(value) ? value.length > 0 : Boolean(normalizeText(value))).length / fields.length)
}

function latestEvent(events: ConversionEventSourceRow[], name: string): ConversionEventSourceRow | undefined {
  return [...events].reverse().find((event) => event.event_name === name)
}

function normalizeTier(value: unknown): ProjectedMembershipTier {
  const normalized = normalizeText(value)?.toLowerCase() ?? ''
  if (normalized.includes('agency')) return 'agency'
  if (normalized.includes('elite')) return 'elite'
  if (normalized.includes('pro')) return 'pro'
  if (normalized.includes('founder')) return 'founders'
  if (normalized.includes('starter') || normalized.includes('directory')) return 'starter'
  if (normalized.includes('free')) return 'free'
  return 'unknown'
}

function normalizeStatus(value: unknown): ProjectedMembershipStatus {
  const normalized = normalizeText(value)?.toLowerCase().replace(/\s+/g, '_') ?? ''
  if (['active', 'trialing', 'past_due', 'canceled', 'paused', 'incomplete'].includes(normalized)) {
    return normalized as ProjectedMembershipStatus
  }
  if (normalized === 'cancelled') return 'canceled'
  return 'unknown'
}

function normalizeEmail(value: unknown): string | null {
  const normalized = normalizeText(value)?.toLowerCase() ?? null
  return normalized && normalized.includes('@') ? normalized : null
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') return value === null || value === undefined ? null : String(value).trim() || null
  return value.trim() || null
}

function normalizeTimestamp(value: unknown): string | null {
  const text = normalizeText(value)
  if (!text || !Number.isFinite(Date.parse(text))) return null
  return new Date(text).toISOString()
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return uniqueBy(value.map(normalizeText).filter(isPresent), (item) => item.toLowerCase())
  const text = normalizeText(value)
  if (!text) return []
  return uniqueBy(text.split(/[,;|]/).map((item) => item.trim()).filter(Boolean), (item) => item.toLowerCase())
}

function nonnegativeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

function numericBetweenZeroAndOne(value: unknown): number | null {
  const number = nonnegativeNumber(value)
  if (number === null) return null
  if (number <= 1) return number
  if (number <= 100) return number / 100
  return null
}

function maxTimestamp(values: unknown[]): string | null {
  const timestamps = values.map(normalizeTimestamp).filter(isPresent)
  if (timestamps.length === 0) return null
  return timestamps.sort((left, right) => Date.parse(right) - Date.parse(left))[0] ?? null
}

function textFromRecord(record: Record<string, unknown> | null | undefined, key: string): string | null {
  return record ? normalizeText(record[key]) : null
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined && value !== ''
}

function uniqueBy<T>(items: T[], keySelector: (item: T) => string): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = keySelector(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
