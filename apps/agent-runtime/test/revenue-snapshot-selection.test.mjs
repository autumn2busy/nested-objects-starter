import assert from 'node:assert/strict'
import test from 'node:test'

import { runRevenueAgent } from '../dist/agents/revenue-agent.js'
import { adaptRevenueEvidence } from '../dist/sensors/revenue-evidence.js'
import { selectRevenueSnapshots } from '../dist/sensors/revenue-snapshot-selection.js'

const now = '2026-09-09T12:00:00.000Z'
const maxSnapshotAgeMs = 86_400_000

function fixture(observedAt = '2026-09-09T10:00:00.000Z') {
  const snapshot = { coverage: 'complete', observedAt, sourceRecordRef: 'fixture_export' }
  return {
    context: {
      metricDate: '2026-09-08', now, maxSnapshotAgeMs, stripeAccountRef: 'acct_fixture', livemode: false,
      currency: 'USD', sourceKind: 'fixture', stripeApiVersion: '2025-06-30.basil',
      correlation: { correlationId: 'fixture_selection', causationId: null, traceId: null },
    },
    stripe: {
      ...snapshot, captureDate: '2026-09-08', rows: [{
        chargeRef: 'ch_fixture', customerRef: 'cus_fixture', stripeAccountRef: 'acct_fixture', livemode: false,
        currency: 'USD', status: 'succeeded', paid: true, captured: true,
        amountCapturedMinor: 6000, capturedAt: '2026-09-08T10:00:00.000Z', captureBasis: 'single_capture_verified',
        refundsCoverage: 'complete', refunds: [], disputed: false, balance: null,
      }],
    },
    outseta: { ...snapshot, rows: [] },
    allocations: { ...snapshot, rows: [] },
  }
}

function metrics(input = fixture()) {
  return adaptRevenueEvidence(input).metrics
}

function retained(input = fixture()) {
  return metrics(input).find((item) => item.metricName === 'revenue.stripe_collections.retained')
}

function select(observations, settings = {}) {
  return selectRevenueSnapshots({ observations, now, maxSnapshotAgeMs, ...settings })
}

function assertWithheld(result, reason) {
  assert.equal(result.metrics.length, 1)
  assert.equal(result.metrics[0].value, null)
  assert.equal(result.metrics[0].valueState, 'unknown')
  assert.equal(result.metrics[0].confidence, 0)
  assert.equal(result.metrics[0].completeness, 0)
  assert.equal(result.metrics[0].provenance.selection.reason, reason)
  assert.equal(result.selections[0].reason, reason)
  assert.equal(result.mutationAllowed, false)
}

test('revenue snapshot selection chooses newest retained observation, never sums immutable refund revisions', () => {
  const earlier = retained()
  const later = fixture('2026-09-09T11:00:00.000Z')
  later.stripe.rows[0].refunds = [{ refundRef: 're_fixture', chargeRef: 'ch_fixture', amountMinor: 1500, status: 'succeeded' }]
  const newest = retained(later)
  const result = select([newest, earlier, structuredClone(earlier)])
  assert.equal(result.metrics.length, 1)
  assert.equal(result.metrics[0].value, 4500)
  assert.equal(result.metrics[0].idempotencyKey, newest.idempotencyKey)
  assert.equal(result.metrics[0].provenance.selection.evidenceRevisions.length, 2)
  assert.equal(result.selections[0].reason, 'latest_observation')
})

test('revenue snapshot selection deduplicates equivalent replays with a different correlation', () => {
  const first = retained()
  const replay = structuredClone(first)
  replay.correlation.correlationId = 'fixture_replay'
  const result = select([first, replay])
  assert.equal(result.metrics.length, 1)
  assert.equal(result.metrics[0].value, 6000)
  assert.deepEqual(result.reasons, ['latest_observation'])
  assert.equal(result.metrics[0].provenance.selection.inputIdempotencyKeys.length, 1)
  assert.deepEqual(result, select([replay, first]))
})

test('latest unknown observation remains unknown instead of falling back to an older healthy value', () => {
  const later = fixture('2026-09-09T11:00:00.000Z')
  later.stripe.rows[0].disputed = true
  assertWithheld(select([retained(), retained(later)]), 'latest_unknown')
})

test('an undated incomplete observation withholds its whole group rather than selecting an older known snapshot', () => {
  const incomplete = fixture('2026-09-09T11:00:00.000Z')
  incomplete.stripe.coverage = 'partial'
  const unknown = retained(incomplete)
  assert.equal(unknown.observedAt, null)
  const result = select([retained(), unknown])
  assertWithheld(result, 'unknown_observation_time')
  assert.equal(result.metrics[0].observedAt, null)
  assert.equal(result.metrics[0].sourceRefs.length, 1)
})

test('no observations stays absent while a proven closed-day empty cohort remains numeric zero', () => {
  const empty = select([])
  assert.deepEqual(empty.metrics, [])
  assert.deepEqual(empty.reasons, ['no_observations'])
  const cohort = fixture()
  cohort.stripe.rows = []
  const result = select([retained(cohort)])
  assert.equal(result.metrics[0].value, 0)
  assert.equal(result.metrics[0].valueState, 'known')
})

test('same-as-of different revisions withhold the group even when both amounts happen to agree', () => {
  const other = fixture()
  other.stripe.sourceRecordRef = 'another_export'
  assertWithheld(select([retained(), retained(other)]), 'conflicting_latest_observations')
})

test('conflicting values or as-of timestamps under one immutable revision cannot be silently selected', () => {
  for (const observedAt of ['2026-09-09T10:00:00.000Z', '2026-09-09T11:00:00.000Z']) {
    const first = retained()
    const conflict = structuredClone(first)
    conflict.value = 1
    conflict.observedAt = observedAt
    conflict.sourceRefs[0].observedAt = observedAt
    const result = select([conflict, first])
    assertWithheld(result, 'conflicting_immutable_observation')
    assert.deepEqual(result, select([first, conflict]))
  }
})

test('a strictly newer consistent observation supersedes older timed unknown and conflicting snapshots', () => {
  const earlier = retained()
  const disputed = fixture()
  disputed.stripe.rows[0].disputed = true
  const conflict = retained(disputed)
  const later = retained(fixture('2026-09-09T11:00:00.000Z'))
  const result = select([earlier, conflict, later])
  assert.equal(result.metrics[0].value, 6000)
  assert.equal(result.selections[0].reason, 'latest_observation')
})

test('stale and future newest observations are explicit unknowns without older-value fallback', () => {
  assertWithheld(select([retained()], { now: '2026-09-11T12:00:00.000Z' }), 'stale_latest_observation')
  const later = retained(fixture('2026-09-09T11:00:00.000Z'))
  assertWithheld(select([retained(), later], { now: '2026-09-09T10:30:00.000Z' }), 'future_latest_observation')
  assert.equal(select([retained()], { maxSnapshotAgeMs: 7_200_000 }).metrics[0].value, 6000)
})

test('freshness checks all selected source references rather than only their maximum observedAt', () => {
  const input = fixture('2026-09-09T11:00:00.000Z')
  input.stripe.rows = []
  input.outseta.observedAt = '2026-09-09T00:00:00.000Z'
  const membership = metrics(input).find((item) => item.metricName === 'revenue.membership_collections.gross')
  assert.equal(membership.value, 0)
  assertWithheld(select([membership], { maxSnapshotAgeMs: 7_200_000 }), 'stale_latest_observation')
})

test('selection isolates account, mode, currency, source kind, metric date and metric name', () => {
  const variants = []
  for (const change of [
    () => {},
    (input) => { input.context.stripeAccountRef = 'acct_other' },
    (input) => { input.context.livemode = true },
    (input) => { input.context.currency = 'EUR' },
    (input) => { input.context.sourceKind = 'approved_read_only_export' },
    (input) => { input.context.metricDate = '2026-09-07'; input.stripe.captureDate = '2026-09-07' },
  ]) {
    const input = fixture()
    input.stripe.rows = []
    change(input)
    variants.push(...metrics(input))
  }
  const result = select(variants)
  assert.equal(result.metrics.length, 30)
  assert.equal(new Set(result.selections.map((item) => item.groupKey)).size, 30)
  assert.equal(result.metrics.filter((item) => item.value === 0).length, 18)
})

test('selection rejects malformed scope, mixed units, arbitrary financial metrics and unsupported provenance', () => {
  for (const mutate of [
    (item) => { item.scopeKey = 'global' },
    (item) => { item.unit = 'EUR_minor' },
    (item) => { item.dimensions.cohort = 'calendar_charge_created' },
    (item) => { item.dimensions.sourceKind = 'production' },
    (item) => { item.dimensions.extra = 'hidden_scope' },
    (item) => { item.metricName = 'revenue.profit' },
    (item) => { item.provenance.adapterVersion = 'untrusted-adapter' },
    (item) => { item.provenance.sourceKind = 'approved_read_only_export' },
    (item) => { item.provenance.evidenceRevision = 'not-a-revision' },
    (item) => { item.idempotencyKey = 'metric:00000000-0000-5000-8000-000000000000' },
    (item) => { item.metricDate = '2026-02-30' },
    (item) => { item.valueState = 'partial' },
    (item) => { item.value = 0.5 },
    (item) => { item.sourceSystem = 'stripe+outseta' },
  ]) {
    const invalid = retained()
    mutate(invalid)
    assert.throws(() => select([retained(), invalid]))
  }
})

test('selection rejects incoherent source references, unknown values and fabricated recurring metrics', () => {
  for (const mutate of [
    (item) => { item.observedAt = null },
    (item) => { item.observedAt = '2026-09-09T09:00:00.000Z' },
    (item) => { item.sourceRefs[0].sourceSystem = 'outseta' },
    (item) => { item.sourceRefs[0].metadata.sourceKind = 'approved_read_only_export' },
    (item) => { item.sourceRefs.push(structuredClone(item.sourceRefs[0])) },
    (item) => { item.value = null },
    (item) => { item.confidence = 0 },
  ]) {
    const invalid = retained()
    mutate(invalid)
    assert.throws(() => select([invalid]))
  }
  const recurring = metrics().find((item) => item.metricName === 'revenue.mrr')
  recurring.value = 6000
  recurring.valueState = 'known'
  recurring.completeness = 1
  recurring.confidence = 1
  assert.throws(() => select([recurring]))
})

test('selection requires bounded inputs and an explicit positive freshness policy', () => {
  for (const settings of [{ now: 'invalid' }, { maxSnapshotAgeMs: 0 }, { maxSnapshotAgeMs: -1 },
    { maxSnapshotAgeMs: 1.5 }, { maxSnapshotAgeMs: undefined }]) assert.throws(() => select([], settings))
  assert.throws(() => select(Array(5001).fill(retained())))
  assert.equal(select(Array(5000).fill(retained())).metrics.length, 1)
})

test('selection retains input evidence without mutating snapshots or inventing a revenue delta', () => {
  const first = retained()
  const invalid = fixture()
  invalid.stripe.coverage = 'unknown'
  const observations = [first, retained(invalid)]
  const before = structuredClone(observations)
  const selected = select(observations)
  assert.deepEqual(observations, before)
  const result = runRevenueAgent({
    currentMetrics: selected.metrics, comparisonMetrics: [first], observedAt: now,
    correlation: first.correlation,
  })
  assert.equal(result.data.assessments[0].currentValue, null)
  assert.equal(result.data.assessments[0].delta, null)
  assert.equal(result.data.assessments[0].dataQualityState, 'unknown')
  assert.deepEqual(result.proposedActions, [])
})
