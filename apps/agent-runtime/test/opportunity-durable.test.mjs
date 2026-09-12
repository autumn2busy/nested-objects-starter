import assert from 'node:assert/strict'
import test from 'node:test'
import { prepareDurableOpportunityReview, runOpportunityAgent, InMemoryDurableWorkflowStore,
  SupabaseControlPlaneStore, ProposalBindingConflictError, ProposalReadbackUnknownError,
  createStagingDestinationFingerprint } from '../dist/index.js'
import { fixture } from './fixtures/opportunity.mjs'

const projectRef = 'syntheticopportunity'
const binding = { bindingKey: 'opportunity-test', policyVersion: 'opportunity-test', projectRef,
  hostname: `${projectRef}.supabase.co`, destinationFingerprint: createStagingDestinationFingerprint({
    policyVersion: 'opportunity-test', projectRef, hostname: `${projectRef}.supabase.co` }) }

// Simulates a database transport, not a PostgreSQL instance or provider acceptance.
function proposalTransport() {
  const rows = new Map()
  const controls = { loseInsertResponse: false, failInsert: false, failRead: false }
  const calls = []
  const client = { from(table) {
    assert.equal(table, 'agent_actions')
    return {
      insert(value) {
        calls.push('insert')
        return { select() { return { async single() {
          if (controls.failInsert) throw new Error('simulated outage')
          if (rows.has(value.idempotency_key)) return { data: null, error: { code: '23505' } }
          rows.set(value.idempotency_key, structuredClone(value))
          if (controls.loseInsertResponse) throw new Error('committed, response lost')
          return { data: { id: value.id }, error: null }
        } } } }
      },
      select() { return { eq(column, key) {
        assert.equal(column, 'idempotency_key')
        return { async single() {
          calls.push('read')
          if (controls.failRead) return { data: null, error: { code: 'unavailable' } }
          return { data: structuredClone(rows.get(key) ?? null), error: null }
        } }
      } } },
      update() { throw new Error('Proposal reuse must never update') },
      upsert() { throw new Error('Proposal reuse must never upsert') },
    }
  } }
  return { store: new SupabaseControlPlaneStore(client), rows, controls, calls }
}

function environment() {
  let time = new Date(fixture().observedAt)
  const transport = proposalTransport()
  const durableStore = new InMemoryDurableWorkflowStore(binding, () => time)
  const context = { durableStore, proposalStore: transport.store, binding, runtimeVersion: 'synthetic-test', now: () => time }
  return { transport, context, setTime(at) { time = new Date(at) } }
}

const action = () => runOpportunityAgent(fixture()).proposedActions[0]
const payload = () => { const { correlation: _correlation, ...input } = fixture(); return { input } }

test('proposal insert readback reuses identical binding and preserves later approval/execution state', async () => {
  const t = proposalTransport()
  const a = action()
  assert.equal((await t.store.persistProposedActionOnce(a)).disposition, 'created')
  const row = t.rows.get(a.idempotencyKey)
  row.status = 'approved'; row.approved_by = 'synthetic-owner'; row.execution_result = { preserved: true }
  const before = structuredClone(row)
  assert.equal((await t.store.persistProposedActionOnce(a)).disposition, 'reused')
  assert.deepEqual(t.rows.get(a.idempotencyKey), before)
  assert.deepEqual(t.calls, ['insert', 'read', 'insert', 'read'])
})

test('proposal binding conflict never overwrites an existing payload or owner decision', async () => {
  const t = proposalTransport(); const a = action()
  await t.store.persistProposedActionOnce(a)
  const before = structuredClone([...t.rows.values()])
  await assert.rejects(t.store.persistProposedActionOnce({ ...a, payload: { ...a.payload, audienceHash: 'different' } }), ProposalBindingConflictError)
  assert.deepEqual([...t.rows.values()], before)
  await assert.rejects(t.store.persistProposedActionOnce({ ...a, status: 'approved' }), /unexecuted proposals/)
})

test('committed insert with lost acknowledgment is verified by readback, never inserted twice', async () => {
  const t = proposalTransport(); t.controls.loseInsertResponse = true
  const result = await t.store.persistProposedActionOnce(action())
  assert.equal(result.disposition, 'reused')
  assert.equal(t.rows.size, 1)
  assert.deepEqual(t.calls, ['insert', 'read'])
})

test('unavailable readback remains unknown with only one bounded insert and one read', async () => {
  for (const failInsert of [true, false]) {
    const t = proposalTransport(); t.controls.failRead = true; t.controls.failInsert = failInsert
    await assert.rejects(t.store.persistProposedActionOnce(action()), ProposalReadbackUnknownError)
    assert.deepEqual(t.calls, ['insert', 'read'])
    assert.equal(t.rows.size, failInsert ? 0 : 1)
  }
})

test('concurrent durable reviews create one immutable proposal; a restarted caller reuses it', async () => {
  const e = environment(); const p = payload()
  const results = await Promise.all(Array.from({ length: 8 }, (_, i) => prepareDurableOpportunityReview(p, e.context, `delivery-${i}`)))
  assert.equal(results.filter((r) => r.state === 'prepared').length, 1)
  assert.ok(results.every((r) => ['prepared', 'reused', 'duplicate_in_progress'].includes(r.state)))
  assert.equal(e.transport.rows.size, 1)
  const original = structuredClone([...e.transport.rows.values()])
  const restart = await prepareDurableOpportunityReview(structuredClone(p), { ...e.context }, 'new-process-delivery')
  assert.equal(restart.state, 'reused')
  assert.equal(restart.executionAllowed, false)
  assert.equal(restart.campaignId, null)
  assert.equal(restart.ownerNotificationId, null)
  assert.deepEqual([...e.transport.rows.values()], original)
  assert.equal(e.context.durableStore.runsById.size, 2)
})

test('same source changed identity, semantic duplicate, revision and recipient refresh cannot add or overwrite a proposal', async () => {
  for (const mutate of [
    (p) => { p.input.envelope.extraction.facts.company = 'Different company' },
    (p) => { p.input.envelope.gmailMessageId = 'another-source' },
    (p) => { p.input.envelope.gmailMessageId = 'new-revision'; p.input.envelope.extraction.facts.advertisedRate = '$30' },
    (p) => { p.input.members[0].link.contactId = p.input.members[0].activeCampaign.contactId = 'new-contact' },
    (p) => { p.input.history.deliveries.push({ memberId: 'member-1', at: p.input.observedAt, state: 'uncertain' }) },
  ]) {
    const e = environment(); const p = payload()
    await prepareDurableOpportunityReview(p, e.context, 'first')
    const before = structuredClone([...e.transport.rows.values()])
    mutate(p)
    const result = await prepareDurableOpportunityReview(p, e.context, 'second')
    assert.equal(result.state, 'held')
    assert.match(result.holds.join(), /changed_requires_owner_review/)
    assert.deepEqual([...e.transport.rows.values()], before)
  }
})

test('crash before insert recovers through the same run and action after a fresh caller retries', async () => {
  const e = environment(); e.transport.controls.failInsert = true
  await assert.rejects(prepareDurableOpportunityReview(payload(), e.context, 'first'), ProposalReadbackUnknownError)
  assert.equal(e.transport.rows.size, 0)
  e.transport.controls.failInsert = false
  e.setTime('2026-09-07T17:05:01Z')
  const recovered = await prepareDurableOpportunityReview(payload(), { ...e.context }, 'restart')
  assert.equal(recovered.state, 'prepared')
  assert.equal(e.transport.rows.size, 1)
  assert.equal(e.context.durableStore.runsById.size, 2)
})

test('crash after proposal commit with unavailable readback recovers without a second proposal', async () => {
  const e = environment(); e.transport.controls.loseInsertResponse = true; e.transport.controls.failRead = true
  await assert.rejects(prepareDurableOpportunityReview(payload(), e.context, 'first'), ProposalReadbackUnknownError)
  const before = structuredClone([...e.transport.rows.values()])
  e.transport.controls.failRead = false
  e.setTime('2026-09-07T17:05:01Z')
  const recovered = await prepareDurableOpportunityReview(payload(), { ...e.context }, 'restart')
  assert.equal(recovered.state, 'prepared')
  assert.deepEqual([...e.transport.rows.values()], before)
})

test('lost step-completion acknowledgment recovers the committed output without repeating insertion', async () => {
  const e = environment(); const store = e.context.durableStore
  const original = store.completeStep.bind(store); let once = true
  store.completeStep = async (input) => { const result = await original(input); if (once) { once = false; throw new Error('lost step response') }; return result }
  await assert.rejects(prepareDurableOpportunityReview(payload(), e.context, 'first'), /lost step response/)
  const calls = e.transport.calls.length
  e.setTime('2026-09-07T17:05:01Z')
  const recovered = await prepareDurableOpportunityReview(payload(), { ...e.context }, 'restart')
  assert.equal(recovered.state, 'reused')
  assert.equal(e.transport.calls.length, calls)
  assert.equal(e.transport.rows.size, 1)
})

test('stale leases after a lost claim acknowledgment recover without a new business run', async () => {
  const e = environment(); const store = e.context.durableStore
  const original = store.claimRun.bind(store); let once = true
  store.claimRun = async (input) => { const result = await original(input); if (once) { once = false; throw new Error('lost claim response') }; return result }
  await assert.rejects(prepareDurableOpportunityReview(payload(), e.context, 'first'), /lost claim response/)
  assert.equal((await prepareDurableOpportunityReview(payload(), e.context, 'early')).state, 'duplicate_in_progress')
  e.setTime('2026-09-07T17:05:01Z')
  assert.equal((await prepareDurableOpportunityReview(payload(), e.context, 'restart')).state, 'prepared')
  assert.equal(e.transport.rows.size, 1)
  assert.equal(store.runsById.size, 2)
})

test('retry exhaustion is bounded and cannot become success when persistence is unavailable', async () => {
  const e = environment(); e.transport.controls.failInsert = true
  for (let attempt = 0; attempt < 3; attempt++) {
    e.setTime(new Date(Date.parse(fixture().observedAt) + attempt * 301_000).toISOString())
    await assert.rejects(prepareDurableOpportunityReview(payload(), e.context, `retry-${attempt}`), ProposalReadbackUnknownError)
  }
  e.setTime('2026-09-07T17:15:03Z')
  assert.equal((await prepareDurableOpportunityReview(payload(), e.context, 'fourth')).state, 'exhausted')
  assert.equal(e.transport.calls.length, 6)
  assert.equal(e.transport.rows.size, 0)
})

test('a lost step-claim acknowledgment can recover after its own lease expires even when the run is renewed', async () => {
  const e = environment(); const store = e.context.durableStore
  const original = store.claimStep.bind(store); let once = true
  store.claimStep = async (input) => { const result = await original(input); if (once) { once = false; throw new Error('lost step claim') }; return result }
  await assert.rejects(prepareDurableOpportunityReview(payload(), e.context, 'first'), /lost step claim/)
  e.setTime('2026-09-07T17:05:01Z')
  assert.equal((await prepareDurableOpportunityReview(payload(), e.context, 'restart')).state, 'prepared')
  assert.equal(e.transport.rows.size, 1)
  assert.equal(store.steps.size, 1)
})

test('independent child leases enforce live ownership, stale-token fencing, immutable input and attempt bounds', async () => {
  const e = environment(); const store = e.context.durableStore
  const ids = { correlationId: 'lease-test', causationId: null, traceId: null }
  const runInput = { agentName: 'opportunity-agent', workflowName: 'opportunity_review', workflowVersion: 'test',
    workflowRunId: 'first', runtimeVersion: 'test', input: {}, idempotencyKey: 'opportunity-lease-test',
    maxAttempts: 3, leaseSeconds: 30, requestedAt: fixture().observedAt, binding, ...ids }
  const run = await store.claimRun(runInput)
  const stepInput = { runId: run.run.runId, stepKey: 'proposal', workflowStepId: 'first-step', input: { immutable: true },
    maxAttempts: 2, leaseSeconds: 60, ...ids }
  const old = await store.claimStep(stepInput)
  e.setTime('2026-09-07T17:00:31Z')
  assert.equal((await store.claimRun({ ...runInput, leaseSeconds: 300 })).disposition, 'busy')
  assert.equal((await store.claimStep(stepInput)).disposition, 'busy')
  e.setTime('2026-09-07T17:01:01Z')
  assert.equal((await store.claimRun({ ...runInput, leaseSeconds: 300 })).disposition, 'claimed')
  const reclaimed = await store.claimStep({ ...stepInput, workflowStepId: 'new-step' })
  assert.equal(reclaimed.disposition, 'claimed')
  assert.notEqual(reclaimed.step.claimToken, old.step.claimToken)
  const error = { code: 'TEST', message: 'invented failure', retryable: true, details: {}, occurredAt: e.context.now().toISOString() }
  await assert.rejects(store.completeStep({ ...ids, runId: run.run.runId, stepKey: 'proposal', claimToken: old.step.claimToken, output: {}, toolCalls: [] }), /stale or invalid/)
  await assert.rejects(store.failStep({ ...ids, runId: run.run.runId, stepKey: 'proposal', claimToken: old.step.claimToken, error, retryAfter: null }), /stale or invalid/)
  await assert.rejects(store.claimStep({ ...stepInput, input: { immutable: false } }), /different input/)
  await store.failStep({ ...ids, runId: run.run.runId, stepKey: 'proposal', claimToken: reclaimed.step.claimToken,
    error, retryAfter: '2026-09-07T17:02:00Z' })
  assert.equal((await store.claimStep(stepInput)).disposition, 'busy')
  e.setTime('2026-09-07T17:02:01Z')
  assert.equal((await store.claimStep(stepInput)).disposition, 'exhausted')
  const completedInput = { ...stepInput, stepKey: 'completed' }
  const next = await store.claimStep(completedInput)
  await store.completeStep({ ...ids, runId: run.run.runId, stepKey: 'completed', claimToken: next.step.claimToken,
    output: { unchanged: true }, toolCalls: [] })
  e.setTime('2026-09-07T17:10:00Z')
  assert.equal((await store.claimStep(completedInput)).disposition, 'reused')
})

test('time advancing on retry holds stale evidence and an ended subscription without saving a proposal', async () => {
  const e = environment(); const p = payload()
  p.input.members[0].outseta.endsAt = '2026-09-07T17:02:00Z'
  e.transport.controls.failInsert = true
  await assert.rejects(prepareDurableOpportunityReview(p, e.context, 'first'))
  e.transport.controls.failInsert = false
  e.setTime('2026-09-07T17:16:00Z')
  const result = await prepareDurableOpportunityReview(p, e.context, 'restart')
  assert.equal(result.state, 'held')
  assert.ok(result.holds.includes('history_unavailable_or_stale'))
  assert.ok(result.holds.includes('audience_changed_on_retry'))
  assert.equal(e.transport.rows.size, 0)
})

test('missing, stale, malformed, uncertain and overdue evidence holds without any proposal insertion', async () => {
  for (const mutate of [
    (p) => { p.input.history.complete = false },
    (p) => { p.input.history.receipts = [{ sourceKey: 'unknown' }] },
    (p) => { p.input.history.deliveries = [{ memberId: 'member-1', state: 'uncertain', at: p.input.observedAt }] },
    (p) => { p.input.audienceCoverageComplete = false },
    (p) => { p.input.members[0].activeCampaign.consent = 'unknown' },
    (p) => { p.input.members[0].audienceTraits.test = true },
    (p) => { p.input.envelope.internalDateMs -= 2 * 86_400_000 },
  ]) {
    const e = environment(); const p = payload(); mutate(p)
    const result = await prepareDurableOpportunityReview(p, e.context, 'held')
    assert.equal(result.state, 'held')
    assert.equal(e.transport.rows.size, 0)
    assert.equal(result.sendAuthorized, false)
  }
})

test('replaying an old completed review does not refresh its evidence or authorize execution', async () => {
  const e = environment()
  const first = await prepareDurableOpportunityReview(payload(), e.context, 'first')
  e.setTime('2026-09-09T17:00:00Z')
  const replay = await prepareDurableOpportunityReview(payload(), e.context, 'replay')
  assert.equal(replay.state, 'reused')
  assert.equal(replay.proposalId, first.proposalId)
  assert.equal(replay.evidenceExpiresAt, first.evidenceExpiresAt)
  assert.ok(replay.holds.includes('overdue_requires_owner_decision'))
  assert.equal(replay.executionAllowed, false)
  assert.equal(e.transport.rows.size, 1)
})

test('a delayed worker cannot report prepared after a newer worker commits a stale-evidence hold', async () => {
  const e = environment()
  let release
  let entered
  const waiting = new Promise((resolve) => { entered = resolve })
  const pause = new Promise((resolve) => { release = resolve })
  const persist = e.context.proposalStore.persistProposedActionOnce.bind(e.context.proposalStore)
  e.context.proposalStore.persistProposedActionOnce = async (action) => { entered(); await pause; return persist(action) }
  const delayed = prepareDurableOpportunityReview(payload(), e.context, 'delayed-worker')
  await waiting
  e.setTime('2026-09-07T17:16:01Z')
  const newer = await prepareDurableOpportunityReview(payload(), { ...e.context }, 'newer-worker')
  assert.equal(newer.state, 'held')
  release()
  const old = await delayed
  assert.equal(old.state, 'held')
  assert.ok(old.holds.includes('history_unavailable_or_stale'))
  assert.equal(old.executionAllowed, false)
  assert.equal(e.context.durableStore.runsById.get(old.runId).output.state, 'held')
  // An already-started insert may finish. Its actual ID remains visible, but
  // its expired proposal never becomes Draft/send authority or a fresh review.
  assert.equal(e.transport.rows.size, 1)
  assert.equal(old.proposalId, [...e.transport.rows.values()][0].id)
  assert.ok(Date.parse([...e.transport.rows.values()][0].payload.evidenceExpiresAt) < e.context.now().getTime())
})

test('a stale worker failure cannot fail the replacement worker parent run', async () => {
  const e = environment()
  let enterA, enterB, releaseA, releaseB
  const enteredA = new Promise((resolve) => { enterA = resolve })
  const enteredB = new Promise((resolve) => { enterB = resolve })
  const gateA = new Promise((resolve) => { releaseA = resolve })
  const gateB = new Promise((resolve) => { releaseB = resolve })
  const persist = e.context.proposalStore.persistProposedActionOnce.bind(e.context.proposalStore)
  let calls = 0
  e.context.proposalStore.persistProposedActionOnce = async (action) => {
    if (++calls === 1) { enterA(); await gateA; throw new Error('Late stale worker failure') }
    enterB(); await gateB; return persist(action)
  }
  const first = prepareDurableOpportunityReview(payload(), e.context, 'stale-worker')
  const firstFailed = assert.rejects(first, /Late stale worker failure/)
  await enteredA
  e.setTime('2026-09-07T17:05:01Z')
  const second = prepareDurableOpportunityReview(payload(), e.context, 'replacement-worker')
  await enteredB
  releaseA(); await firstFailed
  const run = [...e.context.durableStore.runsById.values()].find((value) => value.durableWorkflowId.startsWith('opportunity_review@'))
  assert.equal(run.status, 'running')
  releaseB()
  assert.equal((await second).state, 'prepared')
  assert.equal(e.transport.rows.size, 1)
  assert.equal(e.context.durableStore.runsById.get(run.runId).status, 'succeeded')
})
