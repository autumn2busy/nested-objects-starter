import type { CorrelationContext, SourceReference } from '../contracts.js'
import { ContractValidationError } from '../contracts.js'
import { createProposedAction } from '../policy.js'
import { stableUuid } from '../stable-id.js'
import {
  normalizeOpportunity, opportunityHash,
  type OpportunityEnvelope, type OpportunitySourcePolicy, type NormalizedOpportunity,
} from '../sensors/opportunity-intake.js'
import { deterministicResult, type DeterministicAgentResult } from './specialist-contracts.js'

export interface OpportunityMemberEvidence {
  memberId: string
  link: { personId: string; accountId: string; contactId: string; state: 'verified' | 'ambiguous' }
  // Exact authoritative reads; a profile carrying these IDs is not this contract.
  outseta: {
    source: 'outseta_api'; personId: string; accountId: string; subscriptionId: string
    livemode: boolean | null; isDemo: boolean | null
    planId: string; status: string; access: boolean; startsAt: string; endsAt: string | null
    observedAt: string; responseChecksum: string
  } | null
  activeCampaign: {
    source: 'activecampaign_api'; contactId: string; observedAt: string; responseChecksum: string
    inspectorsListStatus: 'active' | 'inactive' | 'unknown'
    consent: 'affirmative' | 'denied' | 'unknown'; suppressed: boolean | null
  } | null
}

export interface OpportunityHistory {
  // A complete private read of shared actions/receipts for this source and all audience identities.
  complete: boolean
  observedAt: string
  receipts: Array<{ sourceKey: string; identityKey: string; revisionKey: string }>
  deliveries: Array<{ memberId: string; at: string; state: 'sent' | 'scheduled' | 'uncertain' }>
}

export interface OpportunityAgentInput {
  envelope: OpportunityEnvelope
  sourcePolicy: OpportunitySourcePolicy
  members: OpportunityMemberEvidence[]
  audienceCoverageComplete: boolean
  history: OpportunityHistory
  correlation: CorrelationContext
  observedAt: string
}

export interface OpportunityReviewData extends Record<string, unknown> {
  opportunity: NormalizedOpportunity | null
  disposition: 'held' | 'review_ready'
  holds: string[]
  withheldCounts: Record<string, number>
  eligibleCount: number
  audienceHash: string | null
  contentHash: string | null
  internalCopy: { subject: string; html: string; text: string } | null
  campaignId: null
  sendAuthorized: false
}

export type OpportunityAgentOutput = DeterministicAgentResult<OpportunityReviewData>
const DAY = 86_400_000
const FRESHNESS = 15 * 60_000

function fresh(at: string, now: number): boolean {
  const age = now - Date.parse(at)
  return Number.isFinite(age) && age >= 0 && age <= FRESHNESS
}

function memberReason(row: OpportunityMemberEvidence, now: number): string | null {
  const { link, outseta: o, activeCampaign: ac } = row
  if (!row.memberId || link.state !== 'verified' || !link.personId || !link.accountId || !link.contactId) return 'identity_unknown'
  if (!o || o.source !== 'outseta_api' || o.personId !== link.personId || o.accountId !== link.accountId
    || !o.subscriptionId || !/^[a-f0-9]{64}$/.test(o.responseChecksum)) return 'membership_unverified'
  if (!fresh(o.observedAt, now)) return 'membership_stale'
  if (o.livemode !== true || o.isDemo !== false) return 'membership_test_demo_or_unknown_mode'
  if (o.planId !== 'NmdnNO90' || o.status !== 'active' || o.access !== true
    || !Number.isFinite(Date.parse(o.startsAt)) || Date.parse(o.startsAt) > now
    || (o.endsAt !== null && (!Number.isFinite(Date.parse(o.endsAt)) || Date.parse(o.endsAt) <= now))) return 'not_active_elite'
  if (!ac || ac.source !== 'activecampaign_api' || ac.contactId !== link.contactId
    || !/^[a-f0-9]{64}$/.test(ac.responseChecksum) || !fresh(ac.observedAt, now)) return 'marketing_unverified_or_stale'
  if (ac.inspectorsListStatus !== 'active' || ac.consent !== 'affirmative' || ac.suppressed !== false) return 'consent_or_suppression'
  return null
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c] ?? c))

export function renderOpportunityEmail(opportunity: NormalizedOpportunity): { subject: string; html: string; text: string } {
  const f = opportunity.facts
  const paragraphs = [
    `${f.company} has advertised ${f.work}.`,
    `Coverage: ${f.coverage.join(', ')}.`,
    ...(f.immediateNeed.length ? [`Immediate need: ${f.immediateNeed.join(', ')}.`] : []),
    `Requirements: ${f.requirements}`,
    `Advertised rate: ${f.advertisedRate}`,
    `Payment terms: ${f.paymentTerms}`,
    `How to apply: ${f.applicationInstructions}`,
    `Source received: ${opportunity.receivedAt.slice(0, 10)}. Availability and terms may change. Confirm coverage, requirements and payment terms directly with the company before accepting work.`,
  ]
  const text = `${paragraphs.join('\n\n')}\n\nReview application details: ${f.applicationUrl}\n\nNested Objects shares this listing for your review; work and placement are not guaranteed.\n\n%SENDER-INFO%\nUnsubscribe: %UNSUBSCRIBELINK%`
  const html = `<!doctype html><html><body><main style="max-width:600px;margin:auto;font:16px/1.6 Arial,sans-serif;color:#202020">${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}<p><a href="${escapeHtml(f.applicationUrl)}">Review application details</a></p><p>Nested Objects shares this listing for your review; work and placement are not guaranteed.</p><footer><p>%SENDER-INFO%</p><a href="%UNSUBSCRIBELINK%">Unsubscribe</a></footer></main></body></html>`
  return { subject: `Inspection opportunity: ${f.company}`, html, text }
}

export function runOpportunityAgent(input: OpportunityAgentInput): OpportunityAgentOutput {
  const now = Date.parse(input.observedAt)
  if (!Number.isFinite(now) || input.members.length > 500 || input.history.receipts.length > 5000
    || input.history.deliveries.length > 5000) throw new ContractValidationError('Opportunity review time or read bound is invalid')
  const holds: string[] = []
  let opportunity: NormalizedOpportunity | null = null
  try { opportunity = normalizeOpportunity(input.envelope, input.sourcePolicy, input.observedAt) } catch (error) {
    if (!(error instanceof ContractValidationError)) throw error
    holds.push('source_unverified')
  }
  if (!input.audienceCoverageComplete) holds.push('audience_coverage_unknown')
  if (!input.history.complete || !fresh(input.history.observedAt, now)) holds.push('history_unavailable_or_stale')
  if (opportunity) {
    if (opportunity.facts.withdrawn || (opportunity.facts.expiresAt && Date.parse(opportunity.facts.expiresAt) <= now)) holds.push('expired_or_withdrawn')
    if (now > Date.parse(opportunity.dueAt)) holds.push('overdue_requires_owner_decision')
    if (input.history.receipts.some((r) => r.sourceKey === opportunity.sourceKey || r.revisionKey === opportunity.revisionKey)) holds.push('duplicate_source_or_opportunity')
    else if (input.history.receipts.some((r) => r.identityKey === opportunity.identityKey)) holds.push('changed_opportunity_requires_review')
  }
  const withheldCounts: Record<string, number> = {}
  const eligible: OpportunityMemberEvidence[] = []
  for (const row of input.members) {
    const duplicate = input.members.some((other) => other !== row && (other.memberId === row.memberId
      || other.link.personId === row.link.personId || other.link.contactId === row.link.contactId))
    const reason = duplicate ? 'duplicate_identity' : memberReason(row, now)
    if (reason) withheldCounts[reason] = (withheldCounts[reason] ?? 0) + 1
    else eligible.push(row)
  }
  if (eligible.length === 0) holds.push('empty_audience')
  if (eligible.length > 25) holds.push('pilot_cap_exceeded')
  const deliveryTime = opportunity ? Date.parse(opportunity.dueAt) : now
  if (input.history.deliveries.some((d) => eligible.some((row) => row.memberId === d.memberId)
    && (d.state === 'uncertain' || !Number.isFinite(Date.parse(d.at)) || Math.abs(deliveryTime - Date.parse(d.at)) < DAY))) holds.push('opportunity_or_digest_collision')
  const internalCopy = opportunity ? renderOpportunityEmail(opportunity) : null
  const contentHash = internalCopy ? opportunityHash(internalCopy) : null
  const audienceHash = eligible.length ? opportunityHash(eligible.map((row) => [row.memberId, row.link.personId, row.link.accountId, row.link.contactId]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))) : null
  const sourceRefs: SourceReference[] = opportunity ? [{
    sourceSystem: 'gmail', sourceType: 'reviewed_opportunity', sourceId: opportunity.sourceKey,
    checksum: opportunity.sourceSha256, observedAt: input.observedAt,
  }] : []
  const actions = opportunity && holds.length === 0 ? [createProposedAction({
    actionType: 'activecampaign.change_campaign', targetSystem: 'activecampaign', requestedByAgent: 'opportunity-agent',
    idempotencyKey: `opportunity-draft:${opportunity.revisionKey}:${audienceHash}:${contentHash}`,
    payload: {
      operation: 'create_unscheduled_draft', policyVersion: opportunity.policyVersion,
      revisionKey: opportunity.revisionKey, sourceKey: opportunity.sourceKey,
      dueAt: opportunity.dueAt, contentHash, audienceHash, eligibleCount: eligible.length,
      recipientSnapshot: eligible.map((row) => ({ memberId: row.memberId, contactId: row.link.contactId })),
      evidenceExpiresAt: new Date(Math.min(...eligible.flatMap((row) => [Date.parse(row.outseta!.observedAt), Date.parse(row.activeCampaign!.observedAt)])) + FRESHNESS).toISOString(),
      draftCopy: internalCopy, fromName: 'Nested Objects', fromEmail: 'info@nestedobjects.com', replyTo: 'support@nestedobjects.com',
      tracking: { opens: true, links: true, googleAnalytics: true, replies: true },
      schedule: null, requiresExactAudienceTransport: true, requiresSeparateSendAuthorization: true,
    },
    conciseRationale: 'Review the exact source, copy and bounded Elite audience before authorizing an unscheduled Draft. No campaign or send exists.',
    sourceRefs, correlation: input.correlation, now: input.observedAt,
  })] : []
  for (const action of actions) action.id = stableUuid('opportunity-draft', action.idempotencyKey)
  return deterministicResult({
    agentName: 'opportunity-agent', status: holds.length ? 'blocked' : 'completed',
    summary: holds.length ? `Opportunity held: ${holds.join(', ')}.` : `Prepared an internal opportunity review for ${eligible.length} eligible Elite members.`,
    data: { opportunity, disposition: holds.length ? 'held' : 'review_ready', holds, withheldCounts,
      eligibleCount: eligible.length, audienceHash, contentHash, internalCopy, campaignId: null, sendAuthorized: false },
    proposedActions: actions, signals: [], recommendations: [], evidence: [], sourceRefs,
    autumnDecisions: actions.map((action) => ({ id: stableUuid('opportunity-decision', action.id), decisionType: 'approve_action',
      title: 'Review an unscheduled Elite opportunity Draft proposal', summary: action.conciseRationale,
      priority: 75, actionId: action.id, evidenceReferences: sourceRefs })),
    conciseRationale: 'Exact-source, 24-hour opportunity review using fresh stable-ID membership and consent evidence; all consequential execution remains disabled.',
    correlation: input.correlation,
  })
}
