import { z } from 'zod'

import {
  previewActiveCampaignFreeJourney,
  syncActiveCampaignFreeJourney,
  type ActiveCampaignFreeJourneyConfig,
  type FreeJourneyEvidenceInput,
  type FreeJourneyWriteResult,
} from './active-campaign-free-journey.js'
import {
  previewFreeJourneySources,
  type FreeJourneySourcePreviewInput,
} from '../sensors/free-journey-source-preview.js'
import type { OnboardingStoredSources } from '../sensors/onboarding-receipt-reader.js'

const LIST_ID = '34'
const FORM_ID = '90'
const STAGE_FIELD_ID = '193'
const EXPIRY_FIELD_ID = '194'
const id = z.string().min(1).max(160).refine(value => value === value.trim() && !/[\s@\u0000-\u001f]/.test(value))
const numericId = z.string().regex(/^\d+$/)
const timestamp = z.string().datetime({ offset: true })
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const exactContextSchema = z.object({
  identity: z.object({
    canonicalMemberId: z.string().uuid(), outsetaPersonUid: id, outsetaAccountUid: id,
    subscriptionUid: id, activeCampaignContactId: numericId, identityState: z.literal('verified'),
  }).strict(),
  membership: z.object({
    sourceSystem: z.literal('outseta'), authoritative: z.literal(true), isCurrent: z.literal(true),
    identityState: z.literal('verified'), sourceRecordId: id,
    outsetaPersonUid: id, outsetaAccountUid: id, subscriptionUid: id,
    tier: z.enum(['free', 'starter', 'founders', 'pro', 'elite', 'agency', 'unknown']),
    lifecycle: z.enum(['active', 'trialing', 'past_due', 'canceled', 'paused', 'inactive', 'unknown']),
    memberSince: timestamp, cycleStartedAt: timestamp,
  }).strict(),
  contact: z.object({
    id: numericId, email: z.string().email().max(320),
    bounced_hard: z.literal('0'), bounced_soft: z.literal('0'), deleted: z.literal('0'),
  }).strict(),
}).strict()
const writeApprovalSchema = z.object({
  approvalRef: id,
  approvedAt: timestamp,
  expiresAt: timestamp,
  sourceReviewRef: id,
  outsetaPersonUid: id,
  subscriptionUid: id,
  activeCampaignContactId: numericId,
  allowedFieldIdsInOrder: z.tuple([z.literal(EXPIRY_FIELD_ID), z.literal(STAGE_FIELD_ID)]),
  automationMustRemainInactive: z.literal(true),
}).strict()

type ExternalSourceContext = Omit<FreeJourneySourcePreviewInput, 'onboarding' | 'consentRequests'>

export interface FreeJourneyOperationInput {
  mode: 'preview' | 'write'
  now: string
  maxEvidenceAgeMs: number
  evidenceExpiresAt: string
  outsetaPersonUid: string
  subscriptionUid: string
  storedSources: OnboardingStoredSources
  external: ExternalSourceContext
  activeCampaign: ActiveCampaignFreeJourneyConfig
  writeApproval?: unknown
}

export interface FreeJourneyOperationResult {
  status: FreeJourneyWriteResult['status']
  sourceStatus: 'ready_for_writer_review' | 'historical_consent_preview_only' | 'withheld'
  desiredStage: FreeJourneyWriteResult['desiredStage']
  consentProvenance: FreeJourneyWriteResult['consentProvenance']
  attemptedWrites: number
  confirmedWrites: number
  recoveryRequired: boolean
  automaticRetry: false
  reasons: string[]
  steps: FreeJourneyWriteResult['steps']
}

function held(sourceStatus: FreeJourneyOperationResult['sourceStatus'], reasons: string[]): FreeJourneyOperationResult {
  return {
    status: 'withheld', sourceStatus, desiredStage: null, consentProvenance: null,
    attemptedWrites: 0, confirmedWrites: 0, recoveryRequired: false, automaticRetry: false,
    reasons, steps: [],
  }
}

function exactContext(input: FreeJourneyOperationInput) {
  return exactContextSchema.safeParse({
    identity: input.external.identities.rows[0],
    membership: input.external.memberships.rows[0],
    contact: input.external.contacts.rows[0],
  })
}

function validAssets(input: FreeJourneyOperationInput) {
  return input.external.consentAsset?.listId === LIST_ID
    && input.external.consentAsset.formId === FORM_ID
    && input.activeCampaign.consentListId === LIST_ID
    && input.activeCampaign.consentFormId === FORM_ID
    && (input.activeCampaign.stageFieldId ?? STAGE_FIELD_ID) === STAGE_FIELD_ID
    && (input.activeCampaign.expiryFieldId ?? EXPIRY_FIELD_ID) === EXPIRY_FIELD_ID
    && (input.activeCampaign.automationId ?? '527') === '527'
}

function validWriteApproval(input: FreeJourneyOperationInput, contactId: string) {
  const parsed = writeApprovalSchema.safeParse(input.writeApproval)
  if (!parsed.success) return false
  const approval = parsed.data
  const now = Date.parse(input.now)
  return input.storedSources.mode === 'approved_live'
    && approval.sourceReviewRef === input.storedSources.reviewRef
    && approval.outsetaPersonUid === input.outsetaPersonUid
    && approval.subscriptionUid === input.subscriptionUid
    && approval.activeCampaignContactId === contactId
    && Date.parse(approval.approvedAt) <= now
    && now < Date.parse(approval.expiresAt)
}

function oldestObservation(input: FreeJourneyOperationInput) {
  const values = [
    input.storedSources.profiles.observedAt,
    input.storedSources.completionEvents.observedAt,
    input.storedSources.consentRequests.observedAt,
    input.external.identities.observedAt,
    input.external.memberships.observedAt,
    input.external.audience.observedAt,
    input.external.contacts.observedAt,
    input.external.contactLists.observedAt,
    input.external.consentAsset?.observedAt,
  ].filter((value): value is string => typeof value === 'string' && timestamp.safeParse(value).success)
  const expected = input.external.consentAsset ? 9 : 8
  return values.length === expected
    ? new Date(Math.min(...values.map(value => Date.parse(value)))).toISOString()
    : null
}

/**
 * Bounded pre-activation acceptance for one reviewed member only. Preview performs the same exact ActiveCampaign GETs as write
 * and returns would-create/would-update steps. Write additionally requires a matching, unexpired
 * approval record and never retries a partial or uncertain provider result. This is not an automatic
 * new-signup trigger or scheduler; the writer independently confirms automation 527 is inactive.
 */
export async function runFreeJourneyOperation(
  input: FreeJourneyOperationInput,
  fetchImpl: typeof fetch = fetch,
): Promise<FreeJourneyOperationResult> {
  if (!input || !timestamp.safeParse(input.now).success || !dateOnly.safeParse(input.evidenceExpiresAt).success
    || !Number.isFinite(input.maxEvidenceAgeMs) || input.maxEvidenceAgeMs <= 0
    || !id.safeParse(input.outsetaPersonUid).success || !id.safeParse(input.subscriptionUid).success
    || !validAssets(input)) return held('withheld', ['operation_configuration_invalid'])

  if (input.storedSources.mutationAllowed !== false || input.storedSources.attemptedWrites !== 0) {
    return held('withheld', ['stored_source_boundary_invalid'])
  }
  const sourceInput: FreeJourneySourcePreviewInput = {
    ...input.external,
    onboarding: {
      outsetaPersonUid: input.outsetaPersonUid,
      now: input.now,
      maxSnapshotAgeMs: input.maxEvidenceAgeMs,
      profiles: input.storedSources.profiles,
      completionEvents: input.storedSources.completionEvents,
    },
    consentRequests: input.storedSources.consentRequests,
  }
  const source = previewFreeJourneySources(sourceInput)
  if (source.status === 'withheld' || !source.onboarding) return held(source.status, source.reasons)

  const context = exactContext(input)
  if (!context.success) return held('withheld', ['writer_context_invalid'])
  const evidenceObservedAt = oldestObservation(input)
  if (!evidenceObservedAt) return held('withheld', ['writer_observation_incomplete'])
  const { identity, membership, contact } = context.data
  if (identity.outsetaPersonUid !== input.outsetaPersonUid
    || identity.subscriptionUid !== input.subscriptionUid
    || membership.outsetaPersonUid !== input.outsetaPersonUid
    || membership.subscriptionUid !== input.subscriptionUid
    || contact.id !== identity.activeCampaignContactId) {
    return held('withheld', ['writer_context_binding_conflict'])
  }

  const evidence: FreeJourneyEvidenceInput = {
    now: input.now,
    evidenceObservedAt,
    maxEvidenceAgeMs: input.maxEvidenceAgeMs,
    evidenceExpiresAt: input.evidenceExpiresAt,
    membership: { ...membership, ...identity, email: contact.email },
    consentRequest: source.consentRequest,
    ...(source.historicalConsent ? { historicalConsent: source.historicalConsent } : {}),
    audienceTraits: [],
    profileInputs: source.onboarding.profileInputs,
    incomeScenarioStatus: source.incomeScenarioStatus,
    activation: source.onboarding.activation,
    onboardingCompletion: source.onboarding.onboardingCompletion,
  }

  if (input.mode === 'write' && !validWriteApproval(input, contact.id)) {
    return held(source.status, ['write_approval_missing_or_invalid'])
  }
  const writer = input.mode === 'write'
    ? await syncActiveCampaignFreeJourney(evidence, input.activeCampaign, fetchImpl)
    : await previewActiveCampaignFreeJourney(evidence, input.activeCampaign, fetchImpl)
  return {
    status: writer.status,
    sourceStatus: source.status,
    desiredStage: writer.desiredStage,
    consentProvenance: writer.consentProvenance,
    attemptedWrites: writer.attemptedWrites,
    confirmedWrites: writer.confirmedWrites,
    recoveryRequired: writer.recoveryRequired,
    automaticRetry: false,
    reasons: [],
    steps: writer.steps,
  }
}
