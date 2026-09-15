import { FatalError, RetryableError, getWorkflowMetadata } from '@workflow/core'
import { ContractValidationError } from '../src/contracts.js'
import { ProposalBindingConflictError } from '../src/persistence/control-plane-store.js'
import { resolveOpportunityReviewContext } from '../src/runtime/opportunity-review-context.js'
import type { StagingDestinationBinding } from '../src/runtime/staging-destination.js'
import { disabledOpportunityDueReview, prepareDueOpportunityReview,
  type OpportunityDueReviewRequest, type OpportunityDueReviewResult } from '../src/workflows/opportunity-due-review.js'

export interface OpportunityDueWorkflowInput extends OpportunityDueReviewRequest {
  binding: StagingDestinationBinding
}

// Unregistered: no HTTP handler or cron starts this Workflow. Merely deploying
// it does not enable it. Operational timing and input producers remain separate.
export async function opportunityDueReviewWorkflow(input: OpportunityDueWorkflowInput): Promise<OpportunityDueReviewResult> {
  'use workflow'

  return prepareDueOpportunityReviewStep(input, getWorkflowMetadata().workflowRunId)
}

export async function prepareDueOpportunityReviewStep(
  input: OpportunityDueWorkflowInput,
  workflowRunId: string,
): Promise<OpportunityDueReviewResult> {
  'use step'

  // Rechecked on every attempt, before credentials/context resolution. The
  // existing Preview-only, synthetic-only destination guards still apply.
  if (process.env.AGENT_OPPORTUNITY_DUE_REVIEW_ENABLED !== 'true') return disabledOpportunityDueReview()
  if (input?.fixtureMode !== 'synthetic') throw new FatalError('Due review accepts synthetic fixtures only')
  const context = await resolveOpportunityReviewContext(input.binding)
  try {
    const result = await prepareDueOpportunityReview(input, context, workflowRunId, { enabled: true })
    if (result.state === 'duplicate_in_progress') {
      throw new RetryableError('An opportunity claim is busy; retry after its bounded lease', { retryAfter: result.retryAfterMs ?? 301_000 })
    }
    if (result.state === 'exhausted') throw new FatalError('Opportunity claim attempts are exhausted; owner review is required')
    return result
  } catch (error) {
    if (error instanceof RetryableError || error instanceof FatalError) throw error
    if (error instanceof ContractValidationError || error instanceof ProposalBindingConflictError) {
      throw new FatalError('Due opportunity review input or immutable binding was rejected')
    }
    throw new Error('Due opportunity review requires retry or exact stored readback')
  }
}

prepareDueOpportunityReviewStep.maxRetries = 2
