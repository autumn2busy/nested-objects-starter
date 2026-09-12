import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { start } from 'workflow/api'
import { InMemoryDurableWorkflowStore } from '../src/persistence/durable-workflow-store.js'
import { installOpportunityReviewTestContext } from '../src/runtime/opportunity-review-context.js'
import { createStagingDestinationFingerprint } from '../src/runtime/staging-destination.js'
import type { ProposedAction } from '../src/contracts.js'
import { fixture } from '../test/fixtures/opportunity.mjs'
import { opportunityReviewWorkflow, type OpportunityWorkflowInput } from './opportunity-review.js'

const projectRef = 'syntheticopportunity'
const binding = { bindingKey: 'opportunity-workflow-test', policyVersion: 'opportunity-workflow-test', projectRef,
  hostname: `${projectRef}.supabase.co`, destinationFingerprint: createStagingDestinationFingerprint({
    policyVersion: 'opportunity-workflow-test', projectRef, hostname: `${projectRef}.supabase.co` }) }

describe('Opportunity Workflow with invented inputs and injected stores', () => {
  let cleanup: () => void
  let actions: Map<string, ProposedAction>
  let durableStore: InMemoryDurableWorkflowStore
  let insertAttempts: number
  let failuresRemaining: number
  let currentTime: Date

  beforeEach(() => {
    process.env.VITEST = 'true'
    actions = new Map(); insertAttempts = 0; failuresRemaining = 0
    currentTime = new Date(fixture().observedAt)
    const now = () => currentTime
    durableStore = new InMemoryDurableWorkflowStore(binding, now)
    cleanup = installOpportunityReviewTestContext({ durableStore, binding, now, runtimeVersion: 'workflow-test',
      proposalStore: { async persistProposedActionOnce(action) {
        insertAttempts++
        const existing = actions.get(action.idempotencyKey)
        if (existing && JSON.stringify(existing) !== JSON.stringify(action)) throw new Error('Immutable conflict')
        actions.set(action.idempotencyKey, structuredClone(action))
        if (failuresRemaining-- > 0) {
          currentTime = new Date(currentTime.getTime() + 301_000)
          throw new Error('Simulated committed insert with lost acknowledgment')
        }
        return { id: action.id, disposition: existing ? 'reused' : 'created' }
      } },
    })
  })

  afterEach(() => cleanup?.())

  function input(): OpportunityWorkflowInput {
    const { correlation: _correlation, ...agentInput } = fixture()
    return { fixtureMode: 'synthetic', binding, payload: { input: agentInput } }
  }

  it('executes the compiled Workflow and reuses one exact business proposal across provider deliveries', async () => {
    const firstRun = await start(opportunityReviewWorkflow, [input()])
    const first = await firstRun.returnValue
    expect(first.state).toBe('prepared')
    expect(first.campaignId).toBeNull()
    expect(first.ownerNotificationId).toBeNull()
    expect(first.sendAuthorized).toBe(false)
    const secondRun = await start(opportunityReviewWorkflow, [input()])
    const second = await secondRun.returnValue
    expect(second.state).toBe('reused')
    expect(second.runId).toBe(first.runId)
    expect(second.proposalId).toBe(first.proposalId)
    expect(actions.size).toBe(1)
    expect(insertAttempts).toBe(1)
    expect(durableStore.runsById.size).toBe(2)
    expect([...actions.values()][0]).toMatchObject({ status: 'proposed', approvalRequired: true,
      approval: null, executorKey: null, executedAt: null,
      payload: { schedule: null, requiresSeparateSendAuthorization: true } })
  })

  it('Workflow retries a lost persistence acknowledgment without another action', async () => {
    failuresRemaining = 1
    const run = await start(opportunityReviewWorkflow, [input()])
    const result = await run.returnValue
    expect(result.state).toBe('prepared')
    expect(actions.size).toBe(1)
    expect(insertAttempts).toBe(2)
  })

  it('holds unknown consent without calling the proposal store', async () => {
    const value = input()
    value.payload.input.members[0]!.activeCampaign!.consent = 'unknown'
    const run = await start(opportunityReviewWorkflow, [value])
    expect((await run.returnValue).state).toBe('held')
    expect(actions.size).toBe(0)
    expect(insertAttempts).toBe(0)
  })

  it.each(['source', 'run', 'step'])('retries a busy %s claim after lost acknowledgment until its lease can be reclaimed', async (stage) => {
    let lost = false
    let sawBusy = false
    const originalRun = durableStore.claimRun.bind(durableStore)
    durableStore.claimRun = async (value) => {
      const result = await originalRun(value)
      const selected = stage === 'source' ? value.workflowName === 'opportunity_source_receipt'
        : stage === 'run' && value.workflowName === 'opportunity_review'
      if (selected && !lost) { lost = true; throw new Error('Lost committed run claim acknowledgment') }
      if ((selected || (stage === 'step' && lost && value.workflowName === 'opportunity_review')) && result.disposition === 'busy') {
        sawBusy = true
        // Advance the injected database clock, keeping the provider test quick.
        // The Workflow still must throw RetryableError and invoke the step again.
        currentTime = new Date(Date.parse(result.run.staleAfter!) + 1)
      }
      return result
    }
    const originalStep = durableStore.claimStep.bind(durableStore)
    durableStore.claimStep = async (value) => {
      const result = await originalStep(value)
      if (stage === 'step' && !lost) { lost = true; throw new Error('Lost committed step claim acknowledgment') }
      if (stage === 'step' && result.disposition === 'busy') {
        sawBusy = true
        currentTime = new Date(currentTime.getTime() + 301_000)
      }
      return result
    }
    const run = await start(opportunityReviewWorkflow, [input()])
    expect((await run.returnValue).state).toBe('prepared')
    expect(sawBusy).toBe(true)
    expect(actions.size).toBe(1)
    expect(durableStore.runsById.size).toBe(2)
  })

  it('rejects a non-synthetic request before resolving persistence', async () => {
    const value = { ...input(), fixtureMode: 'live' } as unknown as OpportunityWorkflowInput
    const run = await start(opportunityReviewWorkflow, [value])
    await expect(run.returnValue).rejects.toThrow()
    expect(durableStore.runsById.size).toBe(0)
    expect(actions.size).toBe(0)
  })
})
