import type { OpportunityAgentInput, OpportunityAgentOutput } from '../agents/opportunity-agent.js'
import { runOpportunityAgent } from '../agents/opportunity-agent.js'
import { ContractValidationError } from '../contracts.js'
import { opportunityHash } from '../sensors/opportunity-intake.js'
import type { DurableWorkflowPort } from './port.js'
import type { CorrelationContext } from '../contracts.js'
import type { DurableRunClaim, DurableWorkflowStore } from '../persistence/durable-workflow-store.js'
import { ProposalBindingConflictError, type ImmutableProposalStore } from '../persistence/control-plane-store.js'
import type { StagingDestinationBinding } from '../runtime/staging-destination.js'
import { stableUuid } from '../stable-id.js'

export interface OpportunityReviewPayload extends Record<string, unknown> {
  input: Omit<OpportunityAgentInput, 'correlation'>
}

// Registration is opt-in. The production Gmail collector, authoritative reader and
// write executor are not installed by importing this module. Payloads stay private.
export function registerOpportunityReview(port: DurableWorkflowPort): void {
  port.register<OpportunityReviewPayload, { review: OpportunityAgentOutput }>('opportunity_review', async (invocation) => {
    if (invocation.idempotencyKey !== opportunityReviewKey(invocation.payload)) {
      throw new ContractValidationError('Opportunity review requires an input-bound invocation key')
    }
    return { review: runOpportunityAgent({ ...invocation.payload.input, correlation: invocation.correlation }) }
  })
}

export function opportunityReviewKey(payload: OpportunityReviewPayload): string {
  return `opportunity-review:${opportunityHash(payload)}`
}

export interface OpportunityReviewContext {
  durableStore: DurableWorkflowStore
  proposalStore: ImmutableProposalStore
  binding: StagingDestinationBinding
  runtimeVersion: string
  now: () => Date
}

export interface DurableOpportunityReviewResult extends Record<string, unknown> {
  state: 'prepared' | 'reused' | 'held' | 'duplicate_in_progress' | 'exhausted'
  runId: string | null
  proposalId: string | null
  holds: string[]
  dueAt: string | null
  evidenceExpiresAt: string | null
  campaignId: null
  ownerNotificationId: null
  sendAuthorized: false
  executionAllowed: false
  retryAfterMs: number | null
}

const VERSION = 'opportunity-review-v2'
const MAX_ATTEMPTS = 3

// No scheduler, collector or executor is installed here. All durable writes use
// existing agent_runs / agent_workflow_steps / agent_actions, with injected ports.
export async function prepareDurableOpportunityReview(
  payload: OpportunityReviewPayload,
  context: OpportunityReviewContext,
  workflowRunId: string,
): Promise<DurableOpportunityReviewResult> {
  const preliminary = runOpportunityAgent({ ...payload.input,
    correlation: { correlationId: stableUuid(VERSION, 'normalization'), causationId: null, traceId: null } })
  const opportunity = preliminary.data.opportunity
  if (!opportunity) return held(preliminary.data.holds)
  const key = `${VERSION}:identity:${opportunity.identityKey}`
  const correlation: CorrelationContext = { correlationId: stableUuid(VERSION, key), causationId: null, traceId: null }
  const review = runOpportunityAgent({ ...payload.input, correlation })
  // Stable ordering matches JSONB equality and makes object insertion order irrelevant.
  const sourceBinding = canonicalValue({ sourceKey: opportunity.sourceKey, sourceSha256: opportunity.sourceSha256,
    identityKey: opportunity.identityKey, revisionKey: opportunity.revisionKey, receivedAt: opportunity.receivedAt,
    dueAt: opportunity.dueAt, facts: opportunity.facts, sourceProvenance: opportunity.sourceProvenance })
  await context.durableStore.verifyDestination(context.binding)
  let sourceClaim: DurableRunClaim
  try {
    sourceClaim = await claim(`${VERSION}:source:${opportunity.sourceKey}`, 'opportunity_source_receipt', sourceBinding)
  } catch (error) {
    if (inputConflict(error)) return held(['source_binding_changed_requires_owner_review'])
    throw error
  }
  if (sourceClaim.disposition === 'busy' || sourceClaim.disposition === 'exhausted') return occupied(sourceClaim, context.now())
  if (sourceClaim.disposition === 'claimed') {
    await complete(sourceClaim.run.runId, { sourceBinding, receiptOnly: true })
  }
  // Bind all eligibility and history evidence, not only rendered content/counts.
  // A refresh or changed recipient requires owner reconciliation; it cannot replace
  // the first proposal or open a second run under a new timestamp/request key.
  const inputBinding = canonicalValue({ sourceBinding, observedAt: payload.input.observedAt,
    sourceReviewedAt: opportunity.sourceReviewedAt, members: payload.input.members,
    audienceCoverageComplete: payload.input.audienceCoverageComplete, history: payload.input.history })
  let runClaim: DurableRunClaim
  try {
    runClaim = await claim(key, 'opportunity_review', inputBinding)
  } catch (error) {
    if (inputConflict(error)) return held(['opportunity_or_evidence_changed_requires_owner_review'])
    throw error
  }
  if (runClaim.disposition === 'busy' || runClaim.disposition === 'exhausted') return occupied(runClaim, context.now())
  if (runClaim.disposition === 'reused') {
    const saved = runClaim.run.output as DurableOpportunityReviewResult | null
    if (!saved || saved.executionAllowed !== false || saved.sendAuthorized !== false
      || !Array.isArray(saved.holds)) throw new ContractValidationError('Stored opportunity review is unavailable')
    return { ...saved, state: 'reused', holds: [...new Set([...saved.holds, ...currentHolds()])] }
  }
  const runId = runClaim.run.runId
  const stepKey = 'prepare-immutable-opportunity-proposal'
  let token: string | null = null
  try {
    const step = await context.durableStore.claimStep({ runId, stepKey, workflowStepId: `${workflowRunId}:proposal`,
      input: { bindingHash: opportunityHash(inputBinding) }, maxAttempts: MAX_ATTEMPTS, leaseSeconds: 180, ...ids() })
    if (step.disposition === 'busy') return occupied(runClaim, context.now(), 'duplicate_in_progress')
    if (step.disposition === 'exhausted') return occupied(runClaim, context.now(), 'exhausted')
    if (step.disposition === 'reused') {
      if (!step.step.output) throw new ContractValidationError('Stored opportunity proposal result is unavailable')
      const result = step.step.output as DurableOpportunityReviewResult
      const completed = await complete(runId, reconcile(result))
      return { ...reconcile(completed.output as DurableOpportunityReviewResult), state: 'reused' }
    }
    token = step.step.claimToken
    if (!token) throw new ContractValidationError('Opportunity step has no claim token')
    let holds = currentHolds()
    let proposalId: string | null = null
    const action = review.proposedActions[0]
    if (holds.length === 0 && action) {
      // Reuse the exact original proposal after a committed insert/lost response.
      // This capability cannot create an ActiveCampaign campaign or send anything.
      const saved = await context.proposalStore.persistProposedActionOnce({ ...action, runId })
      proposalId = saved.id
      holds = currentHolds()
    }
    const result: DurableOpportunityReviewResult = { state: holds.length ? 'held' : 'prepared', runId, proposalId,
      holds, dueAt: opportunity.dueAt,
      evidenceExpiresAt: typeof action?.payload.evidenceExpiresAt === 'string' ? action.payload.evidenceExpiresAt : null,
      campaignId: null, ownerNotificationId: null, sendAuthorized: false, executionAllowed: false, retryAfterMs: null }
    const committedStep = await context.durableStore.completeStep({ runId, stepKey, claimToken: token, output: result, toolCalls: [], ...ids() })
    token = null
    // A lease may have expired while persistence awaited I/O. The winner's
    // committed hold takes precedence; retain any proposal ID actually read back.
    const stepResult = reconcile(committedStep.output as DurableOpportunityReviewResult, proposalId)
    const completed = await complete(runId, stepResult)
    return reconcile(completed.output as DurableOpportunityReviewResult, proposalId)
  } catch (error) {
    const operational = { code: error instanceof ProposalBindingConflictError ? error.code : 'OPPORTUNITY_PERSISTENCE_UNKNOWN',
      message: 'Opportunity proposal preparation stopped; inspect exact saved state before continuing.',
      retryable: !(error instanceof ProposalBindingConflictError), details: {}, occurredAt: context.now().toISOString() }
    if (token) {
      // Completion may have committed before its response was lost. A rejected
      // failStep is not permission to replace that committed output.
      await context.durableStore.failStep({ runId, stepKey, claimToken: token, error: operational, retryAfter: null, ...ids() })
        .catch(() => undefined)
    }
    // failRun has no claim token. Calling it here could fail a replacement
    // worker's run after this worker lost its step lease. Leave the parent lease
    // to expire; Workflow retries wait for it and reclaim through claimRun.
    throw error
  }

  function ids() {
    return { correlationId: correlation.correlationId, causationId: correlation.causationId, traceId: correlation.traceId }
  }
  function claim(idempotencyKey: string, workflowName: string, input: Record<string, unknown>) {
    return context.durableStore.claimRun({ agentName: 'opportunity-agent', workflowName, workflowVersion: VERSION,
      workflowRunId, runtimeVersion: context.runtimeVersion, input, idempotencyKey,
      maxAttempts: MAX_ATTEMPTS, leaseSeconds: 300, requestedAt: payload.input.observedAt, binding: context.binding, ...ids() })
  }
  function complete(runId: string, output: Record<string, unknown>) {
    return context.durableStore.completeRun({ runId, output, toolCalls: [], inputTokens: null, outputTokens: null,
      estimatedCost: null, verificationSummary: { proposalOnly: true, executionAllowed: false }, ...ids() })
  }
  function currentHolds(): string[] {
    const at = context.now().toISOString()
    const current = runOpportunityAgent({ ...payload.input, correlation, observedAt: at })
    const reasons = [...review.data.holds, ...current.data.holds]
    // Eligibility can change on a retry (e.g. subscription ends); do not retain an
    // original recipient if the re-evaluated exact audience no longer matches.
    if (review.data.audienceHash !== current.data.audienceHash) reasons.push('audience_changed_on_retry')
    return [...new Set(reasons)]
  }
  function reconcile(saved: DurableOpportunityReviewResult, observedProposalId: string | null = null): DurableOpportunityReviewResult {
    if (!saved || !Array.isArray(saved.holds) || saved.executionAllowed !== false || saved.sendAuthorized !== false) {
      throw new ContractValidationError('Committed opportunity review is unavailable')
    }
    const holds = [...new Set([...saved.holds, ...currentHolds()])]
    return { ...saved, holds, state: holds.length || saved.state === 'held' ? 'held' : saved.state,
      proposalId: saved.proposalId ?? observedProposalId }
  }
}

function canonicalValue(value: Record<string, unknown>): Record<string, unknown> {
  const sort = (item: unknown): unknown => Array.isArray(item) ? item.map(sort)
    : item && typeof item === 'object' ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => [key, sort(child)])) : item
  return sort(value) as Record<string, unknown>
}

function inputConflict(error: unknown): boolean {
  return error instanceof Error && /idempotency key was reused with a different input payload/i.test(error.message)
}

function held(holds: string[]): DurableOpportunityReviewResult {
  return { state: 'held', runId: null, proposalId: null, holds, dueAt: null, evidenceExpiresAt: null,
    campaignId: null, ownerNotificationId: null, sendAuthorized: false, executionAllowed: false, retryAfterMs: null }
}

function occupied(claim: DurableRunClaim, now: Date, state?: 'duplicate_in_progress' | 'exhausted'): DurableOpportunityReviewResult {
  const retryAt = Date.parse(claim.run.retryAfter ?? claim.run.staleAfter ?? '')
  return { ...held([]), runId: claim.run.runId,
    retryAfterMs: Math.min(301_000, Math.max(1, Number.isFinite(retryAt) ? retryAt - now.getTime() + 1 : 301_000)),
    state: state ?? (claim.disposition === 'exhausted' ? 'exhausted' : 'duplicate_in_progress') }
}
