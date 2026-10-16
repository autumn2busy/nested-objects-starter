import type { ProposedAction } from '../contracts.js'
import { ContractValidationError } from '../contracts.js'
import type { OpportunityAgentInput } from '../agents/opportunity-agent.js'
import { runOpportunityAgent } from '../agents/opportunity-agent.js'
import { payloadDigest } from '../http/admin-request-auth.js'

export const ACTIVE_CAMPAIGN_OPPORTUNITY_DESTINATION = {
  accountHostname: 'awilliams.api-us1.com',
  listId: 33,
} as const

const FRESHNESS_MS = 15 * 60_000
const SHA256 = /^[a-f0-9]{64}$/
const POSITIVE_ID = /^[1-9]\d*$/

export interface OpportunityAlertConsentEvidence {
  source: 'activecampaign_api'
  memberId: string
  contactId: string
  listId: 33
  status: 'active'
  observedAt: string
  responseChecksum: string
}

export interface ActiveCampaignOpportunityDraftPreparationInput {
  action: ProposedAction
  reviewInput: OpportunityAgentInput
  opportunityAlertConsent: OpportunityAlertConsentEvidence[]
  preparedAt: string
  approvedPayloadDigest?: string | null
}

export type ActiveCampaignOpportunityDraftHold =
  | 'action_binding_mismatch'
  | 'action_state_not_reviewable'
  | 'approval_binding_mismatch'
  | 'destination_binding_invalid'
  | 'evidence_expired'
  | 'opportunity_expired_or_overdue'
  | 'opportunity_review_not_ready'
  | 'opportunity_specific_consent_missing_or_stale'
  | 'preparation_precedes_review'
  | 'recipient_binding_mismatch'

export interface ActiveCampaignMessageRequest {
  method: 'POST'
  path: '/api/3/messages'
  body: {
    message: {
      name: string
      fromname: 'Nested Objects'
      fromemail: 'info@nestedobjects.com'
      reply2: 'support@nestedobjects.com'
      subject: string
      text: string
      html: string
      format: 'mime'
      priority: 3
      charset: 'utf-8'
      encoding: 'quoted-printable'
    }
  }
}

export interface ActiveCampaignCampaignRequest {
  method: 'POST'
  path: '/api/3/campaigns'
  body: {
    campaign: {
      name: string
      type: 'single'
      listIds: [33]
      messages: [{ messageId: number; percentage: 100 }]
      scheduledDate: null
      trackLinks: 'all'
      trackReads: true
      trackReplies: true
      public: false
      embedImages: false
      htmlUnsub: false
      textUnsub: false
      analyticsCampaignName: string
    }
  }
}

export interface ActiveCampaignOpportunityDraftPlan {
  state: 'held' | 'reviewable'
  holds: ActiveCampaignOpportunityDraftHold[]
  accountHostname: 'awilliams.api-us1.com'
  listId: 33
  actionId: string
  actionPayloadDigest: string
  ownerDraftApprovalVerified: boolean
  executionAvailable: false
  automaticRetryAllowed: false
  recipientSnapshot: Array<{ memberId: string; contactId: string }>
  messageRequest: ActiveCampaignMessageRequest | null
  campaignRequestRequiresVerifiedMessageId: true
  campaignName: string | null
  analyticsCampaignName: string | null
}

/**
 * Produces an exact, no-send request preview for the documented ActiveCampaign
 * message and campaign APIs. This module intentionally contains no fetch call,
 * credential loader, executor registration, scheduler, enrollment or send path.
 */
export function prepareActiveCampaignOpportunityDraftPlan(
  input: ActiveCampaignOpportunityDraftPreparationInput,
): ActiveCampaignOpportunityDraftPlan {
  const holds = new Set<ActiveCampaignOpportunityDraftHold>()
  const preparedAt = Date.parse(input.preparedAt)
  if (!Number.isFinite(preparedAt)) throw new ContractValidationError('Draft preparation time is invalid')

  let expected: ProposedAction | null = null
  const review = runOpportunityAgent(structuredClone(input.reviewInput))
  if (review.data.disposition !== 'review_ready' || review.proposedActions.length !== 1) {
    holds.add('opportunity_review_not_ready')
  } else {
    expected = review.proposedActions[0] ?? null
  }

  const actionPayloadDigest = payloadDigest(input.action.payload)
  if (!expected || input.action.actionType !== 'activecampaign.change_campaign'
    || input.action.targetSystem !== 'activecampaign' || input.action.requestedByAgent !== 'opportunity-agent'
    || input.action.id !== expected.id || input.action.idempotencyKey !== expected.idempotencyKey
    || actionPayloadDigest !== payloadDigest(expected.payload)) {
    holds.add('action_binding_mismatch')
  }

  if (!['proposed', 'awaiting_approval', 'approved'].includes(input.action.status)
    || input.action.executorKey !== null || input.action.executionStartedAt !== null
    || input.action.executedAt !== null || input.action.executionResult !== null
    || input.action.verificationStatus !== 'not_started' || input.action.verifiedAt !== null) {
    holds.add('action_state_not_reviewable')
  }

  let ownerDraftApprovalVerified = false
  if (input.action.status === 'approved') {
    if (!input.action.approval || !input.approvedPayloadDigest
      || !SHA256.test(input.approvedPayloadDigest)
      || input.approvedPayloadDigest !== actionPayloadDigest) {
      holds.add('approval_binding_mismatch')
    } else {
      ownerDraftApprovalVerified = true
    }
  } else if (input.approvedPayloadDigest) {
    holds.add('approval_binding_mismatch')
  }

  const payload = input.action.payload
  const recipients = recipientSnapshot(payload.recipientSnapshot)
  const eligibleCount = asPositiveInteger(payload.eligibleCount)
  if (!recipients || eligibleCount === null || recipients.length !== eligibleCount
    || duplicate(recipients.map((row) => row.memberId)) || duplicate(recipients.map((row) => row.contactId))) {
    holds.add('recipient_binding_mismatch')
  }

  if (payload.operation !== 'create_unscheduled_draft' || payload.schedule !== null
    || payload.requiresExactAudienceTransport !== true
    || payload.requiresSeparateSendAuthorization !== true
    || payload.fromName !== 'Nested Objects' || payload.fromEmail !== 'info@nestedobjects.com'
    || payload.replyTo !== 'support@nestedobjects.com'
    || !trackingIsExact(payload.tracking)) {
    holds.add('destination_binding_invalid')
  }

  const evidenceExpiresAt = timestamp(payload.evidenceExpiresAt)
  if (evidenceExpiresAt === null || preparedAt > evidenceExpiresAt) holds.add('evidence_expired')
  const observedAt = timestamp(payload.observedAt)
  if (observedAt === null || preparedAt < observedAt) holds.add('preparation_precedes_review')
  const dueAt = timestamp(payload.dueAt)
  const expiresAt = payload.expiresAt === null ? null : timestamp(payload.expiresAt)
  if (dueAt === null || preparedAt > dueAt || (payload.expiresAt !== null && (expiresAt === null || preparedAt >= expiresAt))) {
    holds.add('opportunity_expired_or_overdue')
  }

  if (!recipients || !exactOpportunityConsent(recipients, input.opportunityAlertConsent, preparedAt)) {
    holds.add('opportunity_specific_consent_missing_or_stale')
  }

  const copy = draftCopy(payload.draftCopy)
  if (!copy) holds.add('destination_binding_invalid')
  const revisionKey = typeof payload.revisionKey === 'string' && SHA256.test(payload.revisionKey)
    ? payload.revisionKey : null
  const receivedAt = timestamp(payload.receivedAt)
  if (!revisionKey || receivedAt === null) holds.add('destination_binding_invalid')

  const campaignName = revisionKey && receivedAt !== null
    ? `Nested Objects | Elite Opportunity | ${new Date(receivedAt).toISOString().slice(0, 10)} | ${revisionKey.slice(0, 12)}`
    : null
  const analyticsCampaignName = revisionKey ? `no_elite_opportunity_${revisionKey.slice(0, 12)}` : null
  const messageRequest = copy && campaignName ? {
    method: 'POST' as const,
    path: '/api/3/messages' as const,
    body: { message: {
      name: campaignName,
      fromname: 'Nested Objects' as const,
      fromemail: 'info@nestedobjects.com' as const,
      reply2: 'support@nestedobjects.com' as const,
      subject: copy.subject,
      text: copy.text,
      html: copy.html,
      format: 'mime' as const,
      priority: 3 as const,
      charset: 'utf-8' as const,
      encoding: 'quoted-printable' as const,
    } },
  } : null

  return {
    state: holds.size ? 'held' : 'reviewable',
    holds: [...holds].sort(),
    accountHostname: ACTIVE_CAMPAIGN_OPPORTUNITY_DESTINATION.accountHostname,
    listId: ACTIVE_CAMPAIGN_OPPORTUNITY_DESTINATION.listId,
    actionId: input.action.id,
    actionPayloadDigest,
    ownerDraftApprovalVerified,
    executionAvailable: false,
    automaticRetryAllowed: false,
    recipientSnapshot: recipients ?? [],
    messageRequest: holds.size ? null : messageRequest,
    campaignRequestRequiresVerifiedMessageId: true,
    campaignName,
    analyticsCampaignName,
  }
}

export function bindVerifiedActiveCampaignMessage(
  plan: ActiveCampaignOpportunityDraftPlan,
  messageId: string,
): ActiveCampaignCampaignRequest {
  const numericMessageId = Number(messageId)
  if (plan.state !== 'reviewable' || !plan.messageRequest || !plan.campaignName
    || !plan.analyticsCampaignName || !POSITIVE_ID.test(messageId)
    || !Number.isSafeInteger(numericMessageId)) {
    throw new ContractValidationError('A reviewable Draft plan and verified message ID are required')
  }
  return {
    method: 'POST',
    path: '/api/3/campaigns',
    body: { campaign: {
      name: plan.campaignName,
      type: 'single',
      listIds: [ACTIVE_CAMPAIGN_OPPORTUNITY_DESTINATION.listId],
      messages: [{ messageId: numericMessageId, percentage: 100 }],
      scheduledDate: null,
      trackLinks: 'all',
      trackReads: true,
      trackReplies: true,
      public: false,
      embedImages: false,
      // The reviewed HTML and text already contain ActiveCampaign's unsubscribe tokens.
      htmlUnsub: false,
      textUnsub: false,
      analyticsCampaignName: plan.analyticsCampaignName,
    } },
  }
}

export interface ActiveCampaignDraftReadback {
  campaignId: string
  name: string
  type: string
  status: string
  schedule: string
  scheduledDate: string | null
  sendAmount: string
  totalAmount: string
  listIds: string[]
  messageIds: string[]
}

export type ActiveCampaignDraftRecoveryState =
  | 'not_started'
  | 'message_failure'
  | 'message_outcome_unknown'
  | 'message_created_campaign_not_started'
  | 'campaign_failure_after_message'
  | 'campaign_outcome_unknown'
  | 'draft_readback_required'
  | 'draft_verification_failed'
  | 'draft_verified'

export function reconcileActiveCampaignOpportunityDraft(input: {
  plan: ActiveCampaignOpportunityDraftPlan
  message: { state: 'not_started' | 'created' | 'failed' | 'unknown'; id?: string }
  campaign: { state: 'not_started' | 'created' | 'failed' | 'unknown'; id?: string }
  readback?: ActiveCampaignDraftReadback | null
}): { state: ActiveCampaignDraftRecoveryState; automaticRetryAllowed: false; campaignId: string | null } {
  const messageId = input.message.id
  const campaignId = input.campaign.id
  if (input.message.state === 'not_started') return recovery('not_started')
  if (input.message.state === 'failed') return recovery('message_failure')
  if (input.message.state === 'unknown') return recovery('message_outcome_unknown')
  if (!messageId || !POSITIVE_ID.test(messageId)) return recovery('message_outcome_unknown')
  if (input.campaign.state === 'not_started') return recovery('message_created_campaign_not_started')
  if (input.campaign.state === 'failed') return recovery('campaign_failure_after_message')
  if (input.campaign.state === 'unknown') return recovery('campaign_outcome_unknown')
  if (!campaignId || !POSITIVE_ID.test(campaignId)) return recovery('campaign_outcome_unknown')
  if (!input.readback) return recovery('draft_readback_required', campaignId)
  const readback = input.readback
  const verified = input.plan.state === 'reviewable'
    && readback.campaignId === campaignId && readback.name === input.plan.campaignName
    && readback.type === 'single' && readback.status === '0' && readback.schedule === '0'
    && readback.scheduledDate === null && readback.sendAmount === '0' && readback.totalAmount === '0'
    && sameIds(readback.listIds, [String(ACTIVE_CAMPAIGN_OPPORTUNITY_DESTINATION.listId)])
    && sameIds(readback.messageIds, [messageId])
  return recovery(verified ? 'draft_verified' : 'draft_verification_failed', campaignId)
}

function recovery(state: ActiveCampaignDraftRecoveryState, campaignId: string | null = null) {
  return { state, automaticRetryAllowed: false as const, campaignId }
}

function exactOpportunityConsent(
  recipients: Array<{ memberId: string; contactId: string }>,
  evidence: OpportunityAlertConsentEvidence[],
  preparedAt: number,
): boolean {
  if (!Array.isArray(evidence) || evidence.length !== recipients.length
    || duplicate(evidence.map((row) => row?.memberId)) || duplicate(evidence.map((row) => row?.contactId))) return false
  return recipients.every((recipient) => evidence.some((row) => row?.source === 'activecampaign_api'
    && row.memberId === recipient.memberId && row.contactId === recipient.contactId
    && row.listId === ACTIVE_CAMPAIGN_OPPORTUNITY_DESTINATION.listId && row.status === 'active'
    && SHA256.test(row.responseChecksum) && fresh(row.observedAt, preparedAt)))
}

function fresh(value: string, now: number): boolean {
  const observedAt = Date.parse(value)
  const age = now - observedAt
  return Number.isFinite(observedAt) && age >= 0 && age <= FRESHNESS_MS
}

function recipientSnapshot(value: unknown): Array<{ memberId: string; contactId: string }> | null {
  if (!Array.isArray(value)) return null
  const rows: Array<{ memberId: string; contactId: string }> = []
  for (const row of value) {
    const record = asRecord(row)
    if (!record || typeof record.memberId !== 'string' || !record.memberId.trim()
      || typeof record.contactId !== 'string' || !record.contactId.trim()) return null
    rows.push({ memberId: record.memberId, contactId: record.contactId })
  }
  return rows
}

function draftCopy(value: unknown): { subject: string; html: string; text: string } | null {
  const copy = asRecord(value)
  if (!copy || typeof copy.subject !== 'string' || !copy.subject.trim() || copy.subject.length > 255
    || typeof copy.html !== 'string' || !copy.html.trim() || copy.html.length > 1_000_000
    || typeof copy.text !== 'string' || !copy.text.trim() || copy.text.length > 1_000_000
    || !copy.html.includes('%UNSUBSCRIBELINK%') || !copy.text.includes('%UNSUBSCRIBELINK%')) return null
  return { subject: copy.subject, html: copy.html, text: copy.text }
}

function trackingIsExact(value: unknown): boolean {
  const tracking = asRecord(value)
  return tracking?.opens === true && tracking.links === true
    && tracking.googleAnalytics === true && tracking.replies === true
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null
}

function asPositiveInteger(value: unknown): number | null {
  return Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : null
}

function timestamp(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

function duplicate(values: Array<string | undefined>): boolean {
  return values.some((value, index) => !value || values.indexOf(value) !== index)
}

function sameIds(left: string[], right: string[]): boolean {
  return left.length === right.length && !duplicate(left) && !duplicate(right)
    && [...left].sort().join(',') === [...right].sort().join(',')
}
