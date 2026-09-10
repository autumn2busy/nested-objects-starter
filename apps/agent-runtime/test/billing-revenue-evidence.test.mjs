import assert from 'node:assert/strict'
import test from 'node:test'

import { BillingReadOnlyClient, BILLING_STRIPE_API_VERSION } from '../dist/sensors/billing-readonly.js'
import { buildRevenueEvidenceFromBillingReads } from '../dist/sensors/billing-revenue-evidence.js'
import { adaptRevenueEvidence } from '../dist/sensors/revenue-evidence.js'
import { selectRevenueSnapshots } from '../dist/sensors/revenue-snapshot-selection.js'
import { runRevenueAgent } from '../dist/agents/revenue-agent.js'

// Invented records, not a copy of a member/account/payment response or its amounts.
const NOW = '2026-09-10T12:00:00.000Z'
const maxSnapshotAgeMs = 3_600_000
const correlation = { correlationId: 'fixture_bridge', causationId: null, traceId: null }
const policy = {
  reviewRef: 'fixture_review', reviewedAt: '2026-09-10T11:00:00.000Z', expiresAt: '2026-09-10T13:00:00.000Z',
  stripeAccountRef: 'acct_fixture', livemode: false, stripeApiVersion: BILLING_STRIPE_API_VERSION,
  outsetaHostname: 'fixture-tenant.outseta.com',
  scopes: [{ resource: 'outseta_account', id: 'account_fixture' }, { resource: 'stripe_charge', id: 'ch_fixture' }],
  maxRequests: 2, maxPages: 1, pageSize: 5, timeoutMs: 1000,
}

function charge() {
  return {
    id: 'ch_fixture', object: 'charge', customer: 'cus_fixture', payment_intent: 'pi_fixture', livemode: false,
    currency: 'usd', status: 'succeeded', paid: true, captured: true, amount_captured: 1234, amount_refunded: 0,
    created: Date.parse('2026-09-09T15:00:00.000Z') / 1000, disputed: false, balance_transaction: 'txn_fixture',
    billing_details: { email: 'fixture@example.invalid' }, metadata: { untrusted: 'raw-do-not-retain' },
  }
}

function account() {
  return {
    Uid: 'account_fixture', IsLivemode: false, IsDemo: false, AccountStage: 3, StripeId: 'cus_fixture',
    Name: 'Alias suggests a different plan',
    CurrentSubscription: { Uid: 'sub_current', Plan: { Uid: 'plan_fixture_elite' } },
    LatestSubscription: { Uid: 'sub_future', Plan: { Uid: 'plan_fixture_pro' } },
  }
}

async function fixture({ chargeChange = () => {}, accountChange = () => {}, transportStatus = 200, readerMode = 'fixture' } = {}) {
  const payment = charge()
  const member = account()
  chargeChange(payment)
  accountChange(member)
  const requests = []
  const client = new BillingReadOnlyClient({
    policy, mode: readerMode, now: () => NOW,
    ...(readerMode === 'approved_live' ? {
      liveReadsEnabled: true,
      credentials: { stripeSecret: 'fixture-dummy', outsetaApiKey: 'fixture-dummy', outsetaApiSecret: 'fixture-dummy' },
    } : {}),
    transport: async (request) => {
      requests.push(request)
      return { status: transportStatus, body: request.url.includes('outseta.com') ? member : payment }
    },
  })
  const input = {
    context: {
      metricDate: '2026-09-09', now: NOW, maxSnapshotAgeMs, stripeAccountRef: policy.stripeAccountRef,
      livemode: false, currency: 'USD', sourceKind: readerMode === 'fixture' ? 'fixture' : 'approved_read_only_export',
      stripeApiVersion: BILLING_STRIPE_API_VERSION, correlation,
    },
    outsetaHostname: policy.outsetaHostname,
    account: await client.readOutsetaAccount('account_fixture'),
    charges: [await client.readCharge('ch_fixture')],
  }
  return { input, requests }
}

function analyze(input, olderMetrics = []) {
  const bridge = buildRevenueEvidenceFromBillingReads(input)
  const adapted = adaptRevenueEvidence(bridge.evidence)
  const selected = selectRevenueSnapshots({
    observations: [...olderMetrics, ...adapted.metrics], now: NOW, maxSnapshotAgeMs,
  })
  const agent = runRevenueAgent({
    currentMetrics: selected.metrics, comparisonMetrics: olderMetrics, observedAt: NOW, correlation,
  })
  return { bridge, adapted, selected, agent }
}

function assertUnknown(result) {
  assert.equal(result.agent.data.assessments.length, 5)
  for (const assessment of result.agent.data.assessments) {
    assert.equal(assessment.currentValue, null)
    assert.equal(assessment.delta, null)
    assert.equal(assessment.confidence, 0)
    assert.equal(assessment.dataQualityState, 'unknown')
  }
  assert.deepEqual(result.agent.proposedActions, [])
  assert.deepEqual(result.agent.autumnDecisions, [])
  assert.equal(result.bridge.mutationAllowed, false)
  assert.equal(result.adapted.mutationAllowed, false)
  assert.equal(result.selected.mutationAllowed, false)
}

test('fixture provider -> readers -> evidence -> selector -> Revenue Agent preserves unknown business totals', async () => {
  const { input, requests } = await fixture()
  assert.equal(input.account.state, 'complete')
  assert.equal(input.charges[0].state, 'complete')
  const result = analyze(input)
  assertUnknown(result)
  assert.equal(requests.length, 2)
  assert.ok(requests.every((request) => request.method === 'GET'))
  assert.equal(result.bridge.evidence.stripe.rows.length, 1)
  assert.equal(result.bridge.evidence.stripe.rows[0].amountCapturedMinor, 1234)
  assert.equal(result.bridge.evidence.stripe.coverage, 'unknown')
  assert.equal(result.bridge.evidence.outseta.coverage, 'unknown')
  assert.equal(result.bridge.evidence.allocations.coverage, 'unknown')
  assert.ok(result.adapted.metrics.every((item) => item.scopeKey === 'stripe:acct_fixture:test'))
  assert.ok(result.adapted.metrics.every((item) => item.dimensions.sourceKind === 'fixture'))
  assert.ok(result.adapted.metrics.every((item) => item.observedAt === null && item.observedRecords === null))
})

test('payment creation, captured flag, balance reference and zero refund counter are not settlement/capture proof', async () => {
  const { input } = await fixture()
  const result = analyze(input)
  const row = result.bridge.evidence.stripe.rows[0]
  assert.equal(row.capturedAt, null)
  assert.equal(row.captureBasis, 'multiple_or_unknown')
  assert.equal(row.refundsCoverage, 'unknown')
  assert.deepEqual(row.refunds, [])
  assert.equal(row.balance, null)
  assertUnknown(result)
})

test('approved provider transport label does not promote test-mode charges into live business revenue', async () => {
  // The provider is still an injected fixture transport; no network or real credentials.
  const { input, requests } = await fixture({ readerMode: 'approved_live' })
  const result = analyze(input)
  assertUnknown(result)
  assert.equal(requests.length, 2)
  assert.equal(result.bridge.evidence.stripe.rows.length, 1)
  assert.ok(result.adapted.metrics.every((m) => m.scopeKey.endsWith(':test')))
  assert.ok(result.adapted.metrics.every((m) => m.dimensions.sourceKind === 'approved_read_only_export'))
  input.context.livemode = true
  assert.deepEqual(analyze(input).bridge.evidence.stripe.rows, [])
})

test('current subscription stays distinct from latest, identity, plan labels and entitlement policy', async () => {
  const { input } = await fixture()
  const row = analyze(input).bridge.evidence.outseta.rows[0]
  assert.equal(row.subscriptionRef, 'sub_current')
  assert.equal(row.identityState, 'unknown')
  assert.equal(row.plan, 'unknown')
  assert.equal(row.subscriptionStatus, 'unknown')
  for (const current of [null, undefined]) {
    const { input: missing } = await fixture({ accountChange: (a) => { a.CurrentSubscription = current } })
    const result = analyze(missing)
    assert.deepEqual(result.bridge.evidence.outseta.rows, [])
    assert.ok(result.bridge.issues.includes('current_subscription_or_customer_missing'))
    assertUnknown(result)
  }
})

test('absent reads and failed provider reads are not zero revenue', async () => {
  const { input } = await fixture({ transportStatus: 503 })
  assertUnknown(analyze(input))
  input.account = null
  input.charges = []
  const result = analyze(input)
  assertUnknown(result)
  assert.ok(result.bridge.issues.includes('charge_reads_absent'))
  assert.deepEqual(result.bridge.evidence.stripe.rows, [])
})

test('unknown customer, wrong customer, currency and test/live mode cannot be quietly relabeled', async () => {
  for (const change of [{ customer: null }, { customer: 'cus_other' }, { currency: 'eur' }, { livemode: true }]) {
    const { input } = await fixture({ chargeChange: (row) => Object.assign(row, change) })
    const result = analyze(input)
    assertUnknown(result)
    assert.deepEqual(result.bridge.evidence.stripe.rows, [])
  }
  const { input } = await fixture()
  input.context.livemode = true
  const result = analyze(input)
  assertUnknown(result)
  assert.deepEqual(result.bridge.evidence.stripe.rows, [])
  assert.deepEqual(result.bridge.evidence.outseta.rows, [])
})

test('reader provenance cannot be switched from fixtures to provider evidence or another tenant', async () => {
  for (const mutate of [
    (i) => { i.context.sourceKind = 'approved_read_only_export' },
    (i) => { i.context.stripeAccountRef = 'acct_other' },
    (i) => { i.outsetaHostname = 'other-tenant.outseta.com' },
    (i) => { i.charges[0].evidence.sourceAccount = 'acct_other' },
    (i) => { i.charges[0].evidence.expectedLivemode = true },
    (i) => { i.charges[0].evidence.resource = 'outseta_account' },
    (i) => { i.charges[0].evidence.id = 'ch_other' },
    (i) => { i.charges[0].evidence.stripeApiVersion = '2020-08-27' },
  ]) {
    const { input } = await fixture()
    mutate(input)
    const result = analyze(input)
    assertUnknown(result)
    assert.deepEqual(result.bridge.evidence.stripe.rows, [])
  }
})

test('partial, stale, future and forged-complete read envelopes remain withheld', async () => {
  for (const mutate of [
    (r) => { r.state = 'partial' },
    (r) => { r.reason = 'read_failed_or_invalid_evidence' },
    (r) => { r.observedAt = '2026-09-10T10:59:59.999Z' },
    (r) => { r.observedAt = '2026-09-10T12:00:00.001Z' },
    (r) => { r.records = [] },
    (r) => { r.pagesRead = 0 },
    (r) => { r.captureDateCoverage = 'complete' },
    (r) => { r.mutationAllowed = true },
  ]) {
    const { input } = await fixture()
    mutate(input.charges[0])
    const result = analyze(input)
    assertUnknown(result)
    assert.deepEqual(result.bridge.evidence.stripe.rows, [])
  }
})

test('duplicate reads and duplicate metric revisions cannot add money or additional assessments', async () => {
  const { input } = await fixture()
  const first = analyze(input)
  input.charges.push(structuredClone(input.charges[0]))
  const replay = analyze(input)
  assert.deepEqual(replay, first)
  const selected = selectRevenueSnapshots({ observations: [...first.adapted.metrics, ...replay.adapted.metrics], now: NOW, maxSnapshotAgeMs })
  assert.equal(selected.metrics.length, 5)
  assert.ok(selected.metrics.every((m) => m.value === null))
  assert.ok(selected.metrics.every((m) => m.provenance.selection.inputIdempotencyKeys.length === 1))
})

test('conflicting amounts or refund counters for one charge are rejected independent of order', async () => {
  for (const field of ['amountCapturedMinor', 'amountRefundedMinor']) {
    const { input } = await fixture()
    const other = structuredClone(input.charges[0])
    other.records[0][field] += 1
    input.charges.push(other)
    const first = analyze(input)
    input.charges.reverse()
    assert.deepEqual(analyze(input), first)
    assert.deepEqual(first.bridge.evidence.stripe.rows, [])
    assert.ok(first.bridge.issues.includes('conflicting_charge_observations'))
    assertUnknown(first)
  }
})

test('changed reader observations create distinct immutable evidence even when both totals stay unknown', async () => {
  const { input } = await fixture()
  const first = analyze(input)
  input.charges[0].records[0].amountRefundedMinor = 100
  const changed = analyze(input)
  assert.notEqual(changed.bridge.evidence.stripe.sourceRecordRef, first.bridge.evidence.stripe.sourceRecordRef)
  assert.notEqual(changed.adapted.metrics[0].idempotencyKey, first.adapted.metrics[0].idempotencyKey)
  assertUnknown(changed)
})

test('five distinct observations are bounded and order-independent without claiming a complete capture cohort', async () => {
  const { input } = await fixture()
  input.charges = Array.from({ length: 5 }, (_, index) => {
    const item = structuredClone(input.charges[0])
    item.evidence.id = `ch_fixture_${index}`
    item.records[0].chargeRef = item.evidence.id
    return item
  })
  const first = analyze(input)
  input.charges.reverse()
  assert.deepEqual(analyze(input), first)
  assert.equal(first.bridge.evidence.stripe.rows.length, 5)
  assertUnknown(first)
})

test('a newer incomplete sample cannot restore an older known fixture total', async () => {
  const { input } = await fixture()
  // Separately invented, independently qualified cohort: never promote the sample in application code.
  const qualified = structuredClone(buildRevenueEvidenceFromBillingReads(input).evidence)
  qualified.stripe.coverage = 'complete'
  qualified.stripe.observedAt = '2026-09-10T11:30:00.000Z'
  qualified.stripe.sourceRecordRef = 'fixture_qualified_cohort'
  Object.assign(qualified.stripe.rows[0], {
    capturedAt: '2026-09-09T15:00:00.000Z', captureBasis: 'single_capture_verified', refundsCoverage: 'complete',
  })
  const known = adaptRevenueEvidence(qualified).metrics
  assert.equal(known.find((m) => m.metricName === 'revenue.stripe_collections.gross').value, 1234)
  const result = analyze(input, known)
  assertUnknown(result)
  assert.ok(result.selected.metrics.every((m) => m.provenance.selection.reason === 'unknown_observation_time'))
})

test('PII, arbitrary metadata, legacy plan guesses and raw error messages do not escape into evidence', async () => {
  const { input } = await fixture()
  input.account.records[0].email = 'fixture@example.invalid'
  input.account.records[0].raw = 'raw-do-not-retain'
  input.charges[0].records[0].raw = 'raw-do-not-retain'
  const result = analyze(input)
  assert.ok(!JSON.stringify(result).includes('fixture@example.invalid'))
  assert.ok(!JSON.stringify(result).includes('raw-do-not-retain'))
  input.charges[0].reason = 'fixture@example.invalid raw-do-not-retain'
  assert.ok(!JSON.stringify(analyze(input)).includes('raw-do-not-retain'))
})

test('bridge is deterministic, input-preserving, bounded and requires valid scope/context', async () => {
  const { input } = await fixture()
  const before = structuredClone(input)
  assert.deepEqual(analyze(input), analyze(input))
  assert.deepEqual(input, before)
  assert.throws(() => analyze({ ...input, charges: Array(6).fill(input.charges[0]) }))
  assert.throws(() => analyze({ ...input, outsetaHostname: 'https://fixture-tenant.outseta.com/path' }))
  assert.throws(() => analyze({ ...input, context: { ...input.context, metricDate: '2026-02-30' } }))
  assert.throws(() => analyze({ ...input, context: { ...input.context, maxSnapshotAgeMs: 0 } }))
})
