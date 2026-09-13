import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { start } from 'workflow/api'
import { InMemoryDurableWorkflowStore } from '../src/persistence/durable-workflow-store.js'
import { installOpportunityReviewTestContext } from '../src/runtime/opportunity-review-context.js'
import { createStagingDestinationFingerprint } from '../src/runtime/staging-destination.js'
import type { ProposedAction } from '../src/contracts.js'
import { fixture } from '../test/fixtures/opportunity.mjs'
import { opportunityDueReviewWorkflow, type OpportunityDueWorkflowInput } from './opportunity-due-review.js'

const projectRef = 'syntheticopportunity'
const binding = { bindingKey: 'due-workflow-test', policyVersion: 'due-workflow-test', projectRef,
  hostname: `${projectRef}.supabase.co`, destinationFingerprint: createStagingDestinationFingerprint({
    policyVersion: 'due-workflow-test', projectRef, hostname: `${projectRef}.supabase.co` }) }

describe('Default-disabled due-review Workflow with invented inputs', () => {
  let cleanup: () => void
  let priorFlag: string | undefined
  let time: Date
  let store: InMemoryDurableWorkflowStore
  let actions: Map<string, ProposedAction>
  let failAfterInsert: boolean
  let inserts: number

  beforeEach(() => {
    process.env.VITEST = 'true'
    priorFlag = process.env.AGENT_OPPORTUNITY_DUE_REVIEW_ENABLED
    process.env.AGENT_OPPORTUNITY_DUE_REVIEW_ENABLED = 'true'
    time = new Date(fixture().observedAt); actions = new Map(); failAfterInsert = false; inserts = 0
    store = new InMemoryDurableWorkflowStore(binding, () => time)
    cleanup = installOpportunityReviewTestContext({ durableStore: store, binding, now: () => time,
      runtimeVersion: 'due-workflow-test', proposalStore: { async persistProposedActionOnce(action) {
        inserts++
        const existing = actions.get(action.idempotencyKey)
        if (existing && JSON.stringify(existing) !== JSON.stringify(action)) throw new Error('Immutable conflict')
        actions.set(action.idempotencyKey, structuredClone(action))
        if (failAfterInsert) {
          failAfterInsert = false
          time = new Date(time.getTime() + 301_000)
          throw new Error('Lost committed insert acknowledgment')
        }
        return { id: action.id, disposition: existing ? 'reused' : 'created' }
      } } })
  })

  afterEach(() => {
    cleanup?.()
    if (priorFlag === undefined) delete process.env.AGENT_OPPORTUNITY_DUE_REVIEW_ENABLED
    else process.env.AGENT_OPPORTUNITY_DUE_REVIEW_ENABLED = priorFlag
  })

  function input(): OpportunityDueWorkflowInput {
    const { correlation: _correlation, ...agentInput } = fixture()
    return { fixtureMode: 'synthetic', binding, reviewNotBefore: agentInput.observedAt, payload: { input: agentInput } }
  }

  it.each([undefined, 'false', '1', 'TRUE'])('stays disabled with server flag %s, even if a payload requests enablement', async (flag) => {
    if (flag === undefined) delete process.env.AGENT_OPPORTUNITY_DUE_REVIEW_ENABLED
    else process.env.AGENT_OPPORTUNITY_DUE_REVIEW_ENABLED = flag
    cleanup()
    const value = { ...input(), enabled: true }
    const run = await start(opportunityDueReviewWorkflow, [value])
    expect(await run.returnValue).toMatchObject({ state: 'disabled', runId: null, proposalId: null,
      executionAllowed: false, sendAuthorized: false, campaignId: null, ownerNotificationId: null })
    expect(store.runsById.size).toBe(0)
  })

  it('returns not-due without claims, then prepares and reuses one proposal on subsequent deliveries', async () => {
    const value = input(); value.reviewNotBefore = '2026-09-07T17:01:00Z'
    const early = await start(opportunityDueReviewWorkflow, [value])
    expect((await early.returnValue).state).toBe('not_due')
    expect(store.runsById.size).toBe(0)
    time = new Date(value.reviewNotBefore)
    const due = await start(opportunityDueReviewWorkflow, [value])
    const first = await due.returnValue
    expect(first.state).toBe('prepared')
    const repeat = await start(opportunityDueReviewWorkflow, [value])
    expect(await repeat.returnValue).toMatchObject({ state: 'reused', proposalId: first.proposalId, runId: first.runId,
      executionAllowed: false, sendAuthorized: false, campaignId: null, ownerNotificationId: null })
    expect(store.runsById.size).toBe(2)
    expect(store.steps.size).toBe(1)
    expect(actions.size).toBe(1)
    expect(inserts).toBe(1)
  })

  it.each(['source', 'consent', 'history'])('holds stale %s evidence when a due invocation arrives', async (kind) => {
    const value = input()
    const stale = '2026-09-07T16:44:59Z'
    if (kind === 'source') {
      value.payload.input.envelope.internalDateMs = Date.parse('2026-09-07T16:00:00Z')
      value.payload.input.envelope.extraction!.reviewedAt = stale
    } else if (kind === 'consent') value.payload.input.members[0]!.activeCampaign!.observedAt = stale
    else value.payload.input.history.observedAt = stale
    const run = await start(opportunityDueReviewWorkflow, [value])
    expect((await run.returnValue).state).toBe('held')
    expect(actions.size).toBe(0)
  })

  it('retries a lost insert acknowledgment through the original run, step and immutable action', async () => {
    failAfterInsert = true
    const run = await start(opportunityDueReviewWorkflow, [input()])
    expect((await run.returnValue).state).toBe('prepared')
    expect(actions.size).toBe(1)
    expect(inserts).toBe(2)
    expect(store.runsById.size).toBe(2)
  })

  it('retries a busy inherited claim instead of treating it as completed dispatch', async () => {
    const claim = store.claimRun.bind(store)
    let lost = false; let sawBusy = false
    store.claimRun = async (value) => {
      const result = await claim(value)
      if (value.workflowName === 'opportunity_review') {
        if (!lost) { lost = true; throw new Error('Lost claim acknowledgment') }
        if (result.disposition === 'busy') {
          sawBusy = true
          time = new Date(Date.parse(result.run.staleAfter!) + 1)
        }
      }
      return result
    }
    const run = await start(opportunityDueReviewWorkflow, [input()])
    expect((await run.returnValue).state).toBe('prepared')
    expect(sawBusy).toBe(true)
    expect(actions.size).toBe(1)
  })

  it('preserves a committed hold on later delivery', async () => {
    const held = input(); held.payload.input.history.complete = false
    const first = await start(opportunityDueReviewWorkflow, [held])
    expect((await first.returnValue).state).toBe('held')
    const repeat = await start(opportunityDueReviewWorkflow, [held])
    expect((await repeat.returnValue).state).toBe('held')
    expect(actions.size).toBe(0)
  })

  it('rejects non-synthetic execution before resolving a persistence context', async () => {
    cleanup()
    const value = { ...input(), fixtureMode: 'live' } as unknown as OpportunityDueWorkflowInput
    const run = await start(opportunityDueReviewWorkflow, [value])
    await expect(run.returnValue).rejects.toThrow()
    expect(store.runsById.size).toBe(0)
  })
})
