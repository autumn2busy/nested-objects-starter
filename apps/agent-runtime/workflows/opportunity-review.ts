import { FatalError, RetryableError, getWorkflowMetadata } from '@workflow/core'
import { ContractValidationError } from '../src/contracts.js'
import { ProposalBindingConflictError } from '../src/persistence/control-plane-store.js'
import { resolveOpportunityReviewContext } from '../src/runtime/opportunity-review-context.js'
import type { StagingDestinationBinding } from '../src/runtime/staging-destination.js'
import { prepareDurableOpportunityReview, type DurableOpportunityReviewResult,
  type OpportunityReviewPayload } from '../src/workflows/opportunity-review.js'

export interface OpportunityWorkflowInput {
  fixtureMode: 'synthetic'
  payload: OpportunityReviewPayload
  binding: StagingDestinationBinding
}

// Intentionally absent from HTTP dispatch/cron registration. Only invented-input
// tests exercise this first batch; hosted/database acceptance needs its own scope.
export async function opportunityReviewWorkflow(input: OpportunityWorkflowInput): Promise<DurableOpportunityReviewResult> {
  'use workflow'

  return prepareOpportunityReviewStep(input, getWorkflowMetadata().workflowRunId)
}

export async function prepareOpportunityReviewStep(
  input: OpportunityWorkflowInput,
  workflowRunId: string,
): Promise<DurableOpportunityReviewResult> {
  'use step'

  if (input.fixtureMode !== 'synthetic') throw new FatalError('Opportunity Workflow currently accepts synthetic fixtures only')
  const context = await resolveOpportunityReviewContext(input.binding)
  try {
    const result = await prepareDurableOpportunityReview(input.payload, context, workflowRunId)
    if (result.state === 'duplicate_in_progress') {
      throw new RetryableError('An opportunity claim is busy; retry after its bounded lease', { retryAfter: result.retryAfterMs ?? 301_000 })
    }
    if (result.state === 'exhausted') throw new FatalError('Opportunity claim attempts are exhausted; owner review is required')
    return result
  } catch (error) {
    if (error instanceof RetryableError || error instanceof FatalError) throw error
    if (error instanceof ContractValidationError || error instanceof ProposalBindingConflictError) {
      throw new FatalError('Opportunity proposal input or immutable binding was rejected')
    }
    // Unknown persistence outcomes remain errors; retry can only reuse the bound
    // proposal. No provider response is converted to campaign/send success.
    throw new Error('Opportunity proposal persistence requires retry or exact stored readback')
  }
}

prepareOpportunityReviewStep.maxRetries = 2
