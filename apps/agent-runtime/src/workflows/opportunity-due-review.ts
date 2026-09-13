import { z } from 'zod'
import { ContractValidationError } from '../contracts.js'
import { normalizeOpportunity } from '../sensors/opportunity-intake.js'
import { prepareDurableOpportunityReview, type DurableOpportunityReviewResult,
  type OpportunityReviewContext, type OpportunityReviewPayload } from './opportunity-review.js'

export interface OpportunityDueReviewRequest {
  fixtureMode: 'synthetic'
  // A supplied fixture time, not a new scheduling policy. dueAt is a deadline.
  reviewNotBefore: string
  payload: OpportunityReviewPayload
}

export interface OpportunityDueReviewResult extends Pick<DurableOpportunityReviewResult,
  'runId' | 'proposalId' | 'holds' | 'dueAt' | 'evidenceExpiresAt' | 'campaignId' | 'ownerNotificationId'
  | 'sendAuthorized' | 'executionAllowed' | 'retryAfterMs'> {
  state: DurableOpportunityReviewResult['state'] | 'disabled' | 'not_due'
  reviewNotBefore: string | null
}

const timestamp = z.string().datetime({ offset: true })

export function disabledOpportunityDueReview(): OpportunityDueReviewResult {
  return stopped('disabled', [])
}

// One supplied candidate per invocation. No query, cursor, polling, sleep, cron,
// provider request or second delivery store is introduced. A not-due result ends
// this invocation; a later explicit invocation must bring its original evidence.
export async function prepareDueOpportunityReview(
  request: OpportunityDueReviewRequest,
  context: OpportunityReviewContext,
  workflowRunId: string,
  options: { enabled?: boolean } = {},
): Promise<OpportunityDueReviewResult> {
  // Enablement belongs to the trusted caller, never the candidate payload.
  if (options.enabled !== true) return disabledOpportunityDueReview()
  if (request?.fixtureMode !== 'synthetic') throw new ContractValidationError('Due review accepts synthetic fixtures only')
  const now = context.now().getTime()
  if (!Number.isFinite(now)) throw new ContractValidationError('Due review clock is invalid')
  const at = timestamp.safeParse(request.reviewNotBefore)
  if (!at.success) return stopped('held', ['review_time_unknown'])
  const reviewTime = Date.parse(at.data)
  // Freeze supplied evidence before the first await. The original observedAt is
  // retained; checking the clock must never refresh source/consent/history age.
  const payload = structuredClone(request.payload)
  let opportunity
  try {
    opportunity = normalizeOpportunity(payload?.input?.envelope, payload?.input?.sourcePolicy, payload?.input?.observedAt)
  } catch (error) {
    if (!(error instanceof ContractValidationError)) throw error
    return stopped('held', ['source_unverified'])
  }
  const reviewNotBefore = new Date(reviewTime).toISOString()
  const dueAt = opportunity.dueAt
  if (reviewTime < Date.parse(opportunity.receivedAt) || reviewTime > Date.parse(dueAt)) {
    return stopped('held', ['review_time_outside_source_window'], reviewNotBefore, dueAt)
  }
  if (Date.parse(payload.input.observedAt) > now) {
    return stopped('held', ['input_observation_in_future'], reviewNotBefore, dueAt)
  }
  if (now < reviewTime) return stopped('not_due', [], reviewNotBefore, dueAt)

  // Reuse #363's exact business keys, immutable proposal readback, freshness and
  // collision policy. No new run/step is claimed around this existing operation.
  // Overdue candidates enter the same durable hold path; there is no catch-up send.
  const result = await prepareDurableOpportunityReview(payload, context, workflowRunId)
  // The existing core labels completed-run retrieval "reused", even when its
  // saved/current reasons withhold it. Dispatch must surface those holds as holds.
  return { ...result, state: result.holds.length ? 'held' : result.state, reviewNotBefore }
}

function stopped(
  state: 'disabled' | 'not_due' | 'held',
  holds: string[],
  reviewNotBefore: string | null = null,
  dueAt: string | null = null,
): OpportunityDueReviewResult {
  return { state, runId: null, proposalId: null, holds, dueAt, reviewNotBefore, evidenceExpiresAt: null,
    campaignId: null, ownerNotificationId: null, sendAuthorized: false, executionAllowed: false, retryAfterMs: null }
}
