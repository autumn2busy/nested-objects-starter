import { createHash } from 'node:crypto'
import { z } from 'zod'

import type { ConversionEventSourceRow } from '../projections/member-projection.js'
import { adaptFreeOnboardingCompletion, deriveSavedProfileInputs } from './free-onboarding-evidence.js'
import type { FreeOnboardingEvidenceInput, FreeOnboardingEvidenceResult } from './free-onboarding-evidence.js'
import type { MilestoneReadSnapshot } from './income-scenario-evidence.js'

const EVENT = 'lifecycle_email_consent_requested'
const PURPOSE = 'free_onboarding_and_conversion_email'
const id = z.string().min(1).max(160).refine(value => value === value.trim() && !/[\s@\u0000-\u001f]/.test(value))
const numericId = z.string().regex(/^\d+$/)
const timestamp = z.string().datetime({ offset: true })
// Mirrors the AC-owned #381 public contract without importing its provider-capable writer.
const historicalSchema = z.object({
  evidenceType: z.literal('owner_attested_historical_signup_permission'),
  policyDecisionRef: id, attestedAt: timestamp, cohortCutoffAt: timestamp,
  source: z.literal('outseta_signup_form'), purpose: z.literal(PURPOSE),
  outsetaPersonUid: id, outsetaAccountUid: id, subscriptionUid: id, memberSince: timestamp,
  laterSuppression: z.object({
    observedAt: timestamp, outsetaHasUnsubscribed: z.literal(false),
    activeCampaignBounced: z.literal(false), activeCampaignDeleted: z.literal(false),
    activeCampaignSuppressed: z.literal(false),
  }).strict(),
}).strict()
const receiptSchema = z.object({
  id: z.string().uuid(), client_event_id: z.string(), event_name: z.literal(EVENT),
  member_uid: id, source_page: z.literal('/welcome'), source: z.literal('member_consent'),
  occurred_at: timestamp,
  event_data: z.object({
    sourcePage: z.literal('/welcome'), source: z.literal('member_consent'),
    consentContract: z.literal('v1'), purpose: z.literal(PURPOSE), lifecycleCycleId: id,
  }).strict(),
})
const identitySchema = z.object({
  canonicalMemberId: z.string().uuid(), outsetaPersonUid: id, outsetaAccountUid: id,
  subscriptionUid: id, activeCampaignContactId: numericId, identityState: z.literal('verified'),
})
const membershipSchema = z.object({
  sourceSystem: z.literal('outseta'), authoritative: z.literal(true), isCurrent: z.literal(true),
  identityState: z.literal('verified'), sourceRecordId: id,
  outsetaPersonUid: id, outsetaAccountUid: id, subscriptionUid: id,
  tier: z.enum(['free', 'starter', 'founders', 'pro', 'elite', 'agency', 'unknown']),
  lifecycle: z.enum(['active', 'trialing', 'past_due', 'canceled', 'paused', 'inactive', 'unknown']),
  memberSince: timestamp, cycleStartedAt: timestamp,
})
const audienceSchema = z.object({
  activeCampaignContactId: numericId,
  internal: z.boolean(), coworker: z.boolean(), test: z.boolean(), demo: z.boolean(), hiringFirm: z.boolean(),
})
const contactSchema = z.object({
  id: numericId, bounced_hard: z.literal('0'), bounced_soft: z.literal('0'), deleted: z.literal('0'),
})
const relationSchema = z.object({
  contact: numericId, list: numericId, form: numericId, status: z.literal('1'),
})

export interface FreeJourneySourcePreviewInput {
  onboarding: Omit<FreeOnboardingEvidenceInput, 'currentMemberships'>
  // Exact source linkage supplied by an approved identity reader, never an email-only join.
  identities: MilestoneReadSnapshot<unknown>
  memberships: MilestoneReadSnapshot<unknown>
  consentRequests: MilestoneReadSnapshot<ConversionEventSourceRow>
  audience: MilestoneReadSnapshot<unknown>
  contacts: MilestoneReadSnapshot<unknown>
  // Complete relationships for the exact contact, not an arbitrary first page.
  contactLists: MilestoneReadSnapshot<unknown>
  consentAsset: {
    purpose: 'free_onboarding_and_conversion_email'
    listId: string
    formId: string
    doubleOptInVerified: true
    observedAt: string
  } | null
  // Supplied by an approved server-side evidence reader; never browser claims or email-only joins.
  historicalConsent?: unknown
  historicalConsentDecisionRef?: string
}

export interface FreeJourneySourcePreviewResult {
  status: 'ready_for_writer_review' | 'historical_consent_preview_only' | 'withheld'
  reasons: string[]
  consent: 'confirmed_scoped_doi' | 'historical_owner_attestation' | 'unverified'
  historicalConsent: z.infer<typeof historicalSchema> | null
  incomeScenarioStatus: 'accepted' | 'missing' | 'withheld'
  onboarding: FreeOnboardingEvidenceResult | null
  consentRequest: {
    clientEventId: string
    eventName: typeof EVENT
    memberUid: string
    occurredAt: string
    eventData: z.infer<typeof receiptSchema>['event_data']
  } | null
  // This is not a field-write plan, send eligibility, or authority to invoke #375.
  mutationAllowed: false
  attemptedWrites: 0
}

/** Pure source readiness: consumes bounded reads; never loads credentials, fetches or invokes the writer. */
export function previewFreeJourneySources(input: FreeJourneySourcePreviewInput): FreeJourneySourcePreviewResult {
  const hold = (reason: string): FreeJourneySourcePreviewResult => ({
    status: 'withheld', reasons: [reason], consent: 'unverified', onboarding: null,
    incomeScenarioStatus: 'withheld', consentRequest: null, historicalConsent: null,
    mutationAllowed: false, attemptedWrites: 0,
  })
  if (!input?.onboarding || !timestamp.safeParse(input.onboarding.now).success
    || !Number.isFinite(input.onboarding.maxSnapshotAgeMs) || input.onboarding.maxSnapshotAgeMs <= 0) {
    return hold('invalid_observation_context')
  }
  const now = Date.parse(input.onboarding.now)
  const fresh = (value: unknown) => timestamp.safeParse(value).success
    && now >= Date.parse(value as string)
    && now - Date.parse(value as string) <= input.onboarding.maxSnapshotAgeMs
  const asset = input.consentAsset
  const historical = input.historicalConsent !== undefined && input.historicalConsent !== null
  if (!historical && (!asset || asset.purpose !== PURPOSE || asset.doubleOptInVerified !== true
    || !numericId.safeParse(asset.listId).success || !numericId.safeParse(asset.formId).success
    || !fresh(asset.observedAt))) return hold('dedicated_consent_asset_unverified')
  for (const [name, snapshot] of [
    ['identity', input.identities], ['membership', input.memberships],
    ['consent_receipt', input.consentRequests], ['audience', input.audience],
    ['contact', input.contacts], ['contact_lists', input.contactLists],
  ] as const) {
    if (!snapshot || snapshot.coverage !== 'complete' || !Array.isArray(snapshot.rows)) return hold(`${name}_lookup_incomplete`)
    if (!fresh(snapshot.observedAt)) return hold(`${name}_lookup_stale_or_future`)
    const expectedRows = historical && name === 'consent_receipt' ? 0 : 1
    if (name !== 'contact_lists' && snapshot.rows.length !== expectedRows) return hold(`${name}_lookup_missing_or_ambiguous`)
  }
  const identity = identitySchema.safeParse(input.identities.rows[0])
  const membership = membershipSchema.safeParse(input.memberships.rows[0])
  if (!identity.success || !membership.success) return hold('identity_or_authority_unverified')
  const binding = identity.data, member = membership.data
  if (binding.outsetaPersonUid !== input.onboarding.outsetaPersonUid
    || binding.outsetaPersonUid !== member.outsetaPersonUid
    || binding.outsetaAccountUid !== member.outsetaAccountUid
    || binding.subscriptionUid !== member.subscriptionUid) return hold('identity_binding_conflict')
  if (member.tier !== 'free' || !['active', 'trialing'].includes(member.lifecycle)) return hold('not_current_free_member')
  const audience = audienceSchema.safeParse(input.audience.rows[0])
  if (!audience.success || audience.data.activeCampaignContactId !== binding.activeCampaignContactId) return hold('audience_unknown_or_mismatched')
  if (audience.data.internal || audience.data.coworker || audience.data.test || audience.data.demo || audience.data.hiringFirm) return hold('excluded_audience')
  const contact = contactSchema.safeParse(input.contacts.rows[0])
  if (!contact.success || contact.data.id !== binding.activeCampaignContactId) return hold('contact_suppressed_unknown_or_mismatched')
  let row: z.infer<typeof receiptSchema> | null = null
  let historicalConsent: z.infer<typeof historicalSchema> | null = null
  if (historical) {
    const parsed = historicalSchema.safeParse(input.historicalConsent)
    if (!parsed.success || !id.safeParse(input.historicalConsentDecisionRef).success
      || parsed.data.policyDecisionRef !== input.historicalConsentDecisionRef) return hold('historical_policy_unverified')
    const evidence = parsed.data
    if (evidence.outsetaPersonUid !== member.outsetaPersonUid
      || evidence.outsetaAccountUid !== member.outsetaAccountUid
      || evidence.subscriptionUid !== member.subscriptionUid
      || evidence.memberSince !== member.memberSince) return hold('historical_identity_conflict')
    const attestedAt = Date.parse(evidence.attestedAt)
    const cutoffAt = Date.parse(evidence.cohortCutoffAt)
    const suppressionAt = Date.parse(evidence.laterSuppression.observedAt)
    // The evidence observation is bounded by the oldest source read; never claim newer evidence.
    const observedAt = Math.min(...[input.identities, input.memberships, input.consentRequests,
      input.audience, input.contacts, input.contactLists].map(snapshot => Date.parse(snapshot.observedAt)))
    if (Date.parse(member.memberSince) > cutoffAt || cutoffAt > attestedAt
      || attestedAt > observedAt || attestedAt > now
      || suppressionAt > observedAt || !fresh(evidence.laterSuppression.observedAt)) return hold('historical_chronology_unverified')
    // Do not let asserted clean suppression override contradictory supplied list evidence.
    const listSchema = z.object({ contact: numericId, list: numericId, status: z.literal('1') })
    const seenLists = new Set<string>()
    for (const value of input.contactLists.rows) {
      const relation = listSchema.safeParse(value)
      if (!relation.success || relation.data.contact !== binding.activeCampaignContactId
        || seenLists.has(relation.data.list)) return hold('historical_list_suppression_unknown_or_conflicting')
      seenLists.add(relation.data.list)
    }
    historicalConsent = evidence
  } else {
    const receipt = receiptSchema.safeParse(input.consentRequests.rows[0])
    if (!receipt.success) return hold('consent_receipt_contract_invalid')
    row = receipt.data
    const expectedKey = `${EVENT}:v1:${createHash('sha256').update(JSON.stringify([
      EVENT, 'v1', member.outsetaPersonUid, member.subscriptionUid, PURPOSE,
    ])).digest('hex')}`
    if (row.member_uid !== member.outsetaPersonUid || row.event_data.lifecycleCycleId !== member.subscriptionUid
      || row.client_event_id !== expectedKey) return hold('consent_receipt_subject_cycle_or_key_mismatch')
    const requestedAt = Date.parse(row.occurred_at)
    if (requestedAt < Date.parse(member.memberSince) || requestedAt < Date.parse(member.cycleStartedAt)
      || requestedAt > Date.parse(input.consentRequests.observedAt) || requestedAt > now) return hold('consent_receipt_chronology_invalid')
    const matches = input.contactLists.rows.filter(value => value !== null && typeof value === 'object'
      && String((value as Record<string, unknown>).list) === asset!.listId)
    if (matches.length !== 1) return hold('doi_relationship_missing_or_ambiguous')
    const relationship = relationSchema.safeParse(matches[0])
    if (!relationship.success || relationship.data.contact !== binding.activeCampaignContactId
      || relationship.data.form !== asset!.formId) return hold('scoped_doi_unconfirmed')
  }
  // Empty is meaningful only after a complete, fresh current-cycle lookup. Failed reads are not absence.
  const { profiles, completionEvents } = input.onboarding
  for (const [name, snapshot] of [['profile', profiles], ['income', completionEvents]] as const) {
    if (!snapshot || snapshot.coverage !== 'complete' || !Array.isArray(snapshot.rows)) return hold(`${name}_lookup_incomplete`)
    if (!fresh(snapshot.observedAt)) return hold(`${name}_lookup_stale_or_future`)
    if (snapshot.rows.length > 1) return hold(`${name}_lookup_ambiguous`)
  }
  const profile = profiles.rows[0]
  if (!profile || profile.id !== binding.canonicalMemberId
    || profile.outseta_person_uid !== binding.outsetaPersonUid) return hold('canonical_profile_mismatch')
  if (Date.parse(member.memberSince) > Date.parse(input.memberships.observedAt)
    || Date.parse(member.cycleStartedAt) > Date.parse(input.memberships.observedAt)) return hold('membership_chronology_invalid')
  const saved = deriveSavedProfileInputs(profile, member, profiles.observedAt)
  if (saved.status === 'withheld') return hold('onboarding_source_withheld')
  const incomeScenarioStatus = completionEvents.rows.length === 0 ? 'missing' : 'accepted'
  // No fabricated activation/completion for early stages; validated nonempty receipts use the existing adapter.
  const onboarding: FreeOnboardingEvidenceResult = incomeScenarioStatus === 'missing' ? {
    status: 'incomplete', profileInputs: saved.profileInputs, activation: null, onboardingCompletion: null,
    sourceRecordIds: [`profiles:${profile.id}@${saved.updatedAt}`],
    reasons: [...saved.reasons, 'income_scenario_missing'], mutationAllowed: false,
  } : adaptFreeOnboardingCompletion({
    ...input.onboarding, currentMemberships: {
      ...input.memberships, rows: [member],
    },
  })
  if (onboarding.status === 'withheld') return hold('onboarding_source_withheld')
  return {
    status: historical ? 'historical_consent_preview_only' : 'ready_for_writer_review', reasons: [],
    consent: historical ? 'historical_owner_attestation' : 'confirmed_scoped_doi', historicalConsent,
    onboarding, incomeScenarioStatus,
    consentRequest: row ? {
      clientEventId: row.client_event_id, eventName: EVENT, memberUid: row.member_uid,
      occurredAt: row.occurred_at, eventData: row.event_data,
    } : null,
    mutationAllowed: false, attemptedWrites: 0,
  }
}

/** Counts only the explicitly supplied cohort. Unavailable or duplicate cohorts are unknown, never zero. */
export function summarizeFreeJourneySourcePreview(input: {
  coverage: 'complete' | 'partial' | 'unknown'
  candidates: readonly FreeJourneySourcePreviewInput[]
}) {
  const unknown = () => ({ coverage: 'unknown' as const, reviewed: null, readyForWriterReview: null,
    historicalPreviewOnly: null,
    withheld: null, reasons: {} as Record<string, number>, mutationAllowed: false as const, attemptedWrites: 0 as const })
  if (!input || input.coverage !== 'complete' || !Array.isArray(input.candidates) || input.candidates.length > 100) return unknown()
  const subjects = input.candidates.map(value => value?.onboarding?.outsetaPersonUid)
  if (subjects.some(value => !id.safeParse(value).success) || new Set(subjects).size !== subjects.length) return unknown()
  // A contact or canonical profile linked to two requested people is not two eligible members.
  const bindings = input.candidates.map(value => identitySchema.safeParse(value.identities?.rows?.[0]))
  if (bindings.some(value => !value.success)) return unknown()
  const contacts = bindings.map(value => value.success ? value.data.activeCampaignContactId : '')
  const profiles = bindings.map(value => value.success ? value.data.canonicalMemberId : '')
  if (new Set(contacts).size !== contacts.length || new Set(profiles).size !== profiles.length) return unknown()
  const results = input.candidates.map(previewFreeJourneySources)
  const reasons: Record<string, number> = {}
  for (const result of results) for (const reason of result.reasons) reasons[reason] = (reasons[reason] ?? 0) + 1
  return {
    coverage: 'complete' as const, reviewed: results.length,
    readyForWriterReview: results.filter(value => value.status === 'ready_for_writer_review').length,
    historicalPreviewOnly: results.filter(value => value.status === 'historical_consent_preview_only').length,
    withheld: results.filter(value => value.status === 'withheld').length,
    reasons, mutationAllowed: false as const, attemptedWrites: 0 as const,
  }
}
