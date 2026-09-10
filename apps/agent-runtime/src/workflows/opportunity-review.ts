import type { OpportunityAgentInput, OpportunityAgentOutput } from '../agents/opportunity-agent.js'
import { runOpportunityAgent } from '../agents/opportunity-agent.js'
import { ContractValidationError } from '../contracts.js'
import { opportunityHash } from '../sensors/opportunity-intake.js'
import type { DurableWorkflowPort } from './port.js'

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
