import { createHash } from 'node:crypto'
import { z } from 'zod'

import type { ConversionEventSourceRow } from '../projections/member-projection.js'
import { adaptFreeOnboardingCompletion } from './free-onboarding-evidence.js'
import type { FreeOnboardingEvidenceInput, FreeOnboardingEvidenceResult } from './free-onboarding-evidence.js'
import type { MilestoneReadSnapshot } from './income-scenario-evidence.js'

const EVENT = 'lifecycle_email_consent_requested'
const PURPOSE = 'free_onboarding_and_conversion_email'
const id = z.string().min(1).max(160).refine(value => value === value.trim() && !/[\s@\u0000-\u001f]/.test(value))
const numericId = z.string().regex(/^\d+$/)
const timestamp = z.string().datetime({ offset: true })
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
}

export interface FreeJourneySourcePreviewResult {
  status: 'ready_for_writer_review' | 'withheld'
  reasons: string[]
  consent: 'confirmed_scoped_doi' | 'unverified'
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
    consentRequest: null, mutationAllowed: false, attemptedWrites: 0,
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
  if (!asset || asset.purpose !== PURPOSE || asset.doubleOptInVerified !== true
    || !numericId.safeParse(asset.listId).success || !numericId.safeParse(asset.formId).success
    || !fresh(asset.observedAt)) return hold('dedicated_consent_asset_unverified')
  for (const [name, snapshot] of [
    ['identity', input.identities], ['membership', input.memberships],
    ['consent_receipt', input.consentRequests], ['audience', input.audience],
    ['contact', input.contacts], ['contact_lists', input.contactLists],
  ] as const) {
    if (!snapshot || snapshot.coverage !== 'complete' || !Array.isArray(snapshot.rows)) return hold(`${name}_lookup_incomplete`)
    if (!fresh(snapshot.observedAt)) return hold(`${name}_lookup_stale_or_future`)
    if (name !== 'contact_lists' && snapshot.rows.length !== 1) return hold(`${name}_lookup_missing_or_ambiguous`)
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
  const receipt = receiptSchema.safeParse(input.consentRequests.rows[0])
  if (!receipt.success) return hold('consent_receipt_contract_invalid')
  const row = receipt.data
  const expectedKey = `${EVENT}:v1:${createHash('sha256').update(JSON.stringify([
    EVENT, 'v1', member.outsetaPersonUid, member.subscriptionUid, PURPOSE,
  ])).digest('hex')}`
  if (row.member_uid !== member.outsetaPersonUid || row.event_data.lifecycleCycleId !== member.subscriptionUid
    || row.client_event_id !== expectedKey) return hold('consent_receipt_subject_cycle_or_key_mismatch')
  const requestedAt = Date.parse(row.occurred_at)
  if (requestedAt < Date.parse(member.memberSince) || requestedAt < Date.parse(member.cycleStartedAt)
    || requestedAt > Date.parse(input.consentRequests.observedAt) || requestedAt > now) return hold('consent_receipt_chronology_invalid')
  const contact = contactSchema.safeParse(input.contacts.rows[0])
  if (!contact.success || contact.data.id !== binding.activeCampaignContactId) return hold('contact_suppressed_unknown_or_mismatched')
  const matches = input.contactLists.rows.filter(value => value !== null && typeof value === 'object'
    && String((value as Record<string, unknown>).list) === asset.listId)
  if (matches.length !== 1) return hold('doi_relationship_missing_or_ambiguous')
  const relationship = relationSchema.safeParse(matches[0])
  if (!relationship.success || relationship.data.contact !== binding.activeCampaignContactId
    || relationship.data.form !== asset.formId) return hold('scoped_doi_unconfirmed')
  // Use the same independently supplied authority for both existing adapters, not a second mirrored cycle.
  const onboarding = adaptFreeOnboardingCompletion({
    ...input.onboarding, currentMemberships: {
      ...input.memberships, rows: [member],
    },
  })
  if (onboarding.status === 'withheld') return hold('onboarding_source_withheld')
  if (onboarding.activation?.memberId !== binding.canonicalMemberId) return hold('canonical_profile_mismatch')
  return {
    status: 'ready_for_writer_review', reasons: [], consent: 'confirmed_scoped_doi', onboarding,
    consentRequest: {
      clientEventId: row.client_event_id, eventName: EVENT, memberUid: row.member_uid,
      occurredAt: row.occurred_at, eventData: row.event_data,
    },
    mutationAllowed: false, attemptedWrites: 0,
  }
}

/** Counts only the explicitly supplied cohort. Unavailable or duplicate cohorts are unknown, never zero. */
export function summarizeFreeJourneySourcePreview(input: {
  coverage: 'complete' | 'partial' | 'unknown'
  candidates: readonly FreeJourneySourcePreviewInput[]
}) {
  const unknown = () => ({ coverage: 'unknown' as const, reviewed: null, readyForWriterReview: null,
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
    withheld: results.filter(value => value.status === 'withheld').length,
    reasons, mutationAllowed: false as const, attemptedWrites: 0 as const,
  }
}
