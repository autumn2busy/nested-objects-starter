import assert from 'node:assert/strict'
import test from 'node:test'
import { InMemoryDurableWorkflowStore, createStagingDestinationFingerprint } from '../dist/index.js'
import { prepareDueOpportunityReview } from '../dist/workflows/opportunity-due-review.js'
import { fixture } from './fixtures/opportunity.mjs'

const projectRef = 'syntheticopportunity'
const binding = { bindingKey: 'due-review-test', policyVersion: 'due-review-test', projectRef,
  hostname: `${projectRef}.supabase.co`, destinationFingerprint: createStagingDestinationFingerprint({
    policyVersion: 'due-review-test', projectRef, hostname: `${projectRef}.supabase.co` }) }
const enabled = { enabled: true }

function request() {
  const { correlation: _correlation, ...input } = fixture()
  return { fixtureMode: 'synthetic', reviewNotBefore: input.observedAt, payload: { input } }
}

function environment() {
  let time = new Date(fixture().observedAt)
  const actions = new Map()
  const durableStore = new InMemoryDurableWorkflowStore(binding, () => time)
  const context = { durableStore, binding, runtimeVersion: 'synthetic-due-test', now: () => time,
    proposalStore: { async persistProposedActionOnce(action) {
      const previous = actions.get(action.idempotencyKey)
      if (previous) assert.deepEqual(previous, action)
      else actions.set(action.idempotencyKey, structuredClone(action))
      return { id: action.id, disposition: previous ? 'reused' : 'created' }
    } } }
  return { context, actions, setTime(at) { time = new Date(at) } }
}

function noExecution(result) {
  assert.equal(result.executionAllowed, false)
  assert.equal(result.sendAuthorized, false)
  assert.equal(result.campaignId, null)
  assert.equal(result.ownerNotificationId, null)
}

test('due preparation defaults disabled and ignores payload attempts to enable it before any context access', async () => {
  const unavailable = new Proxy({}, { get() { throw new Error('Context must stay untouched') } })
  for (const options of [undefined, {}, { enabled: false }, { enabled: 'true' }, { enabled: 1 }]) {
    const result = await prepareDueOpportunityReview({ ...request(), enabled: true }, unavailable, 'disabled', options)
    assert.equal(result.state, 'disabled')
    assert.equal(result.runId, null)
    noExecution(result)
  }
})

test('non-synthetic preparation is rejected without accessing persistence', async () => {
  const e = environment()
  await assert.rejects(prepareDueOpportunityReview({ ...request(), fixtureMode: 'live' }, e.context, 'live', enabled), /synthetic/)
  assert.equal(e.context.durableStore.runsById.size, 0)
})

test('not-due delivery claims nothing; a fresh invocation at the exact review time uses the original durable preparation', async () => {
  const e = environment(); const r = request()
  r.reviewNotBefore = '2026-09-07T17:01:00Z'
  const early = await prepareDueOpportunityReview(r, e.context, 'early', enabled)
  assert.equal(early.state, 'not_due')
  assert.equal(early.dueAt, '2026-09-08T16:51:35.000Z')
  assert.equal(e.context.durableStore.runsById.size, 0)
  assert.equal(e.actions.size, 0)
  e.setTime(r.reviewNotBefore)
  const due = await prepareDueOpportunityReview(r, e.context, 'due', enabled)
  assert.equal(due.state, 'prepared')
  assert.equal(due.dueAt, early.dueAt)
  assert.equal(e.context.durableStore.runsById.size, 2)
  assert.equal(e.context.durableStore.steps.size, 1)
  assert.equal(e.actions.size, 1)
  noExecution(due)
})

test('missing, invalid and outside-window review times hold without choosing a scheduling offset', async () => {
  for (const at of [undefined, '', 'tomorrow', '2026-09-07', '2026-09-07T16:51:34Z', '2026-09-08T16:51:36Z']) {
    const e = environment()
    const result = await prepareDueOpportunityReview({ ...request(), reviewNotBefore: at }, e.context, 'invalid', enabled)
    assert.equal(result.state, 'held')
    assert.match(result.holds.join(), /review_time/)
    assert.equal(e.context.durableStore.runsById.size, 0)
    noExecution(result)
  }
})

test('unknown source and a future evidence observation cannot acquire a dispatch claim', async () => {
  for (const mutate of [
    (r) => { r.payload.input.envelope.receiverAuthentication = null },
    (r) => { r.payload.input.observedAt = '2026-09-07T17:01:00Z' },
  ]) {
    const e = environment(); const r = request(); mutate(r)
    const result = await prepareDueOpportunityReview(r, e.context, 'invalid-source', enabled)
    assert.equal(result.state, 'held')
    assert.equal(e.context.durableStore.runsById.size, 0)
  }
})

test('invalid trusted clock is rejected without creating a proposal', async () => {
  const e = environment(); e.setTime('invalid')
  await assert.rejects(prepareDueOpportunityReview(request(), e.context, 'clock', enabled), /clock/)
  assert.equal(e.actions.size, 0)
})

test('due delivery preserves source, consent and history freshness gates', async (t) => {
  for (const [name, mutate, reason] of [
    ['source', (r) => { r.payload.input.envelope.internalDateMs = Date.parse('2026-09-07T16:00:00Z');
      r.payload.input.envelope.extraction.reviewedAt = '2026-09-07T16:44:59Z' }, 'source_review_stale'],
    ['consent', (r) => { r.payload.input.members[0].activeCampaign.observedAt = '2026-09-07T16:44:59Z' }, 'empty_audience'],
    ['history', (r) => { r.payload.input.history.observedAt = '2026-09-07T16:44:59Z' }, 'history_unavailable_or_stale'],
    ['unknown consent', (r) => { r.payload.input.members[0].activeCampaign.consent = 'unknown' }, 'empty_audience'],
    ['internal identity', (r) => { r.payload.input.members[0].audienceTraits.internal = true }, 'empty_audience'],
  ]) await t.test(name, async () => {
    const e = environment(); const r = request(); mutate(r)
    const result = await prepareDueOpportunityReview(r, e.context, name, enabled)
    assert.equal(result.state, 'held')
    assert.ok(result.holds.includes(reason))
    assert.equal(e.actions.size, 0)
    noExecution(result)
  })
})

test('overdue dispatch is held even when it arrives after a valid review time', async () => {
  const e = environment(); e.setTime('2026-09-08T16:51:35.001Z')
  const result = await prepareDueOpportunityReview(request(), e.context, 'late', enabled)
  assert.equal(result.state, 'held')
  assert.ok(result.holds.includes('overdue_requires_owner_decision'))
  assert.equal(e.actions.size, 0)
})

test('sent, scheduled and uncertain history collisions hold due preparation', async () => {
  for (const state of ['sent', 'scheduled', 'uncertain']) {
    const e = environment(); const r = request()
    r.payload.input.history.deliveries.push({ memberId: 'member-1', at: r.payload.input.observedAt, state })
    const result = await prepareDueOpportunityReview(r, e.context, state, enabled)
    assert.equal(result.state, 'held')
    assert.ok(result.holds.includes('opportunity_or_digest_collision'))
    assert.equal(e.actions.size, 0)
  }
})

test('concurrent delivery and restarted callers reuse existing business keys without a dispatch store', async () => {
  const e = environment(); const r = request()
  const results = await Promise.all(Array.from({ length: 8 }, (_, n) => prepareDueOpportunityReview(r, e.context, `delivery-${n}`, enabled)))
  assert.equal(results.filter((result) => result.state === 'prepared').length, 1)
  assert.ok(results.every((result) => ['prepared', 'reused', 'duplicate_in_progress'].includes(result.state)))
  const first = results.find((result) => result.state === 'prepared')
  const replay = await prepareDueOpportunityReview(structuredClone(r), { ...e.context }, 'restart', enabled)
  assert.equal(replay.state, 'reused')
  assert.equal(replay.runId, first.runId)
  assert.equal(replay.proposalId, first.proposalId)
  assert.equal(e.actions.size, 1)
  assert.equal(e.context.durableStore.runsById.size, 2)
  noExecution(replay)
})

test('restart after a lost committed insert response uses the same proposal', async () => {
  const e = environment(); const persist = e.context.proposalStore.persistProposedActionOnce
  let lost = true
  e.context.proposalStore.persistProposedActionOnce = async (action) => {
    const result = await persist(action)
    if (lost) { lost = false; throw new Error('Lost committed insert response') }
    return result
  }
  await assert.rejects(prepareDueOpportunityReview(request(), e.context, 'first', enabled), /Lost/)
  const original = structuredClone([...e.actions.values()])
  e.setTime('2026-09-07T17:05:01Z')
  const result = await prepareDueOpportunityReview(request(), { ...e.context }, 'restart', enabled)
  assert.equal(result.state, 'prepared')
  assert.deepEqual([...e.actions.values()], original)
  assert.equal(e.context.durableStore.runsById.size, 2)
})

test('committed holds remain held on repeat and refreshed evidence cannot replace the bound review', async () => {
  const e = environment(); const r = request(); r.payload.input.history.complete = false
  const first = await prepareDueOpportunityReview(r, e.context, 'held', enabled)
  const repeat = await prepareDueOpportunityReview(r, e.context, 'repeat', enabled)
  assert.equal(repeat.state, 'held')
  assert.equal(repeat.runId, first.runId)
  assert.ok(repeat.holds.includes('history_unavailable_or_stale'))
  r.payload.input.history.complete = true
  const changed = await prepareDueOpportunityReview(r, e.context, 'refresh', enabled)
  assert.equal(changed.state, 'held')
  assert.ok(changed.holds.includes('opportunity_or_evidence_changed_requires_owner_review'))
  assert.equal(e.actions.size, 0)
})

test('a prepared proposal replayed after expiry returns held with its original proposal and expiry', async () => {
  const e = environment()
  const first = await prepareDueOpportunityReview(request(), e.context, 'first', enabled)
  e.setTime('2026-09-07T17:16:01Z')
  const replay = await prepareDueOpportunityReview(request(), e.context, 'expired', enabled)
  assert.equal(replay.state, 'held')
  assert.equal(replay.proposalId, first.proposalId)
  assert.equal(replay.evidenceExpiresAt, first.evidenceExpiresAt)
  assert.equal(e.actions.size, 1)
  noExecution(replay)
})

test('caller mutation while a durable claim waits cannot change the snapshotted audience', async () => {
  const e = environment(); const r = request()
  const verify = e.context.durableStore.verifyDestination.bind(e.context.durableStore)
  e.context.durableStore.verifyDestination = async (...args) => {
    r.payload.input.members[0].activeCampaign.consent = 'unknown'
    return verify(...args)
  }
  const result = await prepareDueOpportunityReview(r, e.context, 'snapshot', enabled)
  assert.equal(result.state, 'prepared')
  assert.equal(e.actions.size, 1)
})
