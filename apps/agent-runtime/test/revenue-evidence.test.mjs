import assert from 'node:assert/strict'
import test from 'node:test'

import { runRevenueAgent } from '../dist/agents/revenue-agent.js'
import { adaptRevenueEvidence } from '../dist/sensors/revenue-evidence.js'

const names = {
  gross: 'revenue.stripe_collections.gross',
  retained: 'revenue.stripe_collections.retained',
  membership: 'revenue.membership_collections.gross',
}

function fixture() {
  const observation = {
    coverage: 'complete',
    observedAt: '2026-09-09T11:00:00.000Z',
    sourceRecordRef: 'fixture-export-1',
  }
  return {
    context: {
      metricDate: '2026-09-08', now: '2026-09-09T12:00:00.000Z',
      maxSnapshotAgeMs: 86_400_000, stripeAccountRef: 'acct_fixture', livemode: false,
      currency: 'USD', sourceKind: 'fixture', stripeApiVersion: '2025-06-30.basil',
      correlation: { correlationId: 'fixture-revenue-correlation', causationId: null, traceId: null },
    },
    stripe: {
      ...observation, captureDate: '2026-09-08', rows: [{
        chargeRef: 'ch_fixture', customerRef: 'cus_fixture', stripeAccountRef: 'acct_fixture',
        livemode: false, currency: 'USD', status: 'succeeded', paid: true, captured: true,
        amountCapturedMinor: 6000, capturedAt: '2026-09-08T12:00:00.000Z', captureBasis: 'single_capture_verified',
        refundsCoverage: 'complete', refunds: [], disputed: false,
        balance: { balanceRef: 'txn_fixture', status: 'available', currency: 'USD' },
      }],
    },
    outseta: {
      ...observation, rows: [{
        accountRef: 'outseta_fixture', stripeCustomerRef: 'cus_fixture', stripeAccountRef: 'acct_fixture',
        livemode: false, subscriptionRef: 'sub_fixture', identityState: 'verified',
        plan: 'elite', subscriptionStatus: 'active',
      }],
    },
    allocations: {
      ...observation, rows: [{
        allocationRef: 'allocation_fixture', chargeRef: 'ch_fixture', accountRef: 'outseta_fixture',
        subscriptionRef: 'sub_fixture', amountMinor: 6000, basis: 'verified_payment_allocation',
      }],
    },
  }
}

function metric(result, name) {
  const found = result.metrics.find((item) => item.metricName === (names[name] ?? name))
  assert.ok(found, `Expected metric ${name}`)
  return found
}

function values(result) {
  return Object.fromEntries(Object.keys(names).map((name) => [name, metric(result, name).value]))
}

function assertUnknown(result, ...keys) {
  for (const key of keys) {
    assert.equal(metric(result, key).value, null, `${key} must not fabricate a value`)
    assert.equal(metric(result, key).valueState, 'unknown')
    assert.equal(metric(result, key).confidence, 0)
  }
}

function addRefund(input, status = 'succeeded', amountMinor = 1000) {
  input.stripe.rows[0].refunds.push({
    refundRef: 're_fixture', chargeRef: 'ch_fixture', amountMinor, status,
  })
}

function addSecondPayment(input, amountMinor = 6000) {
  input.stripe.rows.push({
    ...structuredClone(input.stripe.rows[0]), chargeRef: 'ch_fixture_2', amountCapturedMinor: amountMinor,
    refunds: [], balance: { balanceRef: 'txn_fixture_2', status: 'available', currency: 'USD' },
  })
  input.allocations.rows.push({
    ...input.allocations.rows[0], allocationRef: 'allocation_fixture_2', chargeRef: 'ch_fixture_2', amountMinor,
  })
}

test('revenue evidence counts captured minor units and successful refunds, not nominal plan value or MRR', () => {
  const input = fixture()
  addRefund(input)
  input.outseta.rows[0].subscriptionStatus = 'canceled'
  const result = adaptRevenueEvidence(input)
  assert.deepEqual(values(result), { gross: 6000, retained: 5000, membership: 6000 })
  assert.equal(metric(result, 'gross').unit, 'USD_minor')
  assert.equal(metric(result, 'gross').provenance.stripeApiVersion, '2025-06-30.basil')
  assert.equal(result.payments[0].subscriptionStatus, 'canceled')
  assert.equal(result.payments[0].balanceAvailability, 'available')
  assert.equal(result.mutationAllowed, false)
  assertUnknown(result, 'revenue.mrr', 'revenue.arr')
  assert.ok(result.metrics.every((item) => !item.metricName.includes('upgrade')))
})

test('revenue evidence ignores failed and canceled refunds but withholds unresolved refund outcomes', () => {
  for (const status of ['failed', 'canceled']) {
    const input = fixture()
    addRefund(input, status)
    assert.equal(metric(adaptRevenueEvidence(input), 'retained').value, 6000, status)
  }
  for (const status of ['pending', 'requires_action']) {
    const input = fixture()
    addRefund(input, status)
    const result = adaptRevenueEvidence(input)
    assert.equal(metric(result, 'gross').value, 6000)
    assertUnknown(result, 'retained')
    assert.ok(result.reasons.includes('refund_or_dispute_reconciliation_required'))
  }
})

test('revenue evidence preserves captured collections while disputes or incomplete refund lists withhold retained totals', () => {
  for (const change of [
    (row) => { row.disputed = true },
    (row) => { row.refundsCoverage = 'partial' },
    (row) => { row.refundsCoverage = 'unknown' },
    (row) => { row.refunds.push({ refundRef: 're_wrong', chargeRef: 'ch_other', amountMinor: 100, status: 'succeeded' }) },
    (row) => { row.refunds.push({ refundRef: 're_excess', chargeRef: row.chargeRef, amountMinor: 6001, status: 'succeeded' }) },
  ]) {
    const input = fixture()
    change(input.stripe.rows[0])
    const result = adaptRevenueEvidence(input)
    assert.equal(metric(result, 'gross').value, 6000)
    assertUnknown(result, 'retained')
  }
})

test('Stripe balance pending, unknown, and settlement currency do not invent bank payouts or erase captured charges', () => {
  for (const balance of [null, { balanceRef: 'txn_pending', status: 'pending', currency: 'USD' },
    { balanceRef: 'txn_foreign', status: 'available', currency: 'EUR' }]) {
    const input = fixture()
    input.stripe.rows[0].balance = balance
    const result = adaptRevenueEvidence(input)
    assert.deepEqual(values(result), { gross: 6000, retained: 6000, membership: 6000 })
    assert.equal(result.payments[0].balanceAvailability, balance?.status ?? 'unknown')
    assert.equal(result.payments[0].balanceCurrency, balance?.currency ?? null)
    assert.ok(result.metrics.every((item) => !item.metricName.includes('payout')))
  }
})

test('complete closed-day empty collection evidence is zero even when an Elite subscription is active', () => {
  const input = fixture()
  input.stripe.rows = []
  input.allocations.rows = []
  const result = adaptRevenueEvidence(input)
  assert.deepEqual(values(result), { gross: 0, retained: 0, membership: 0 })
  assert.equal(metric(result, 'gross').observedRecords, 0)
  assertUnknown(result, 'revenue.mrr', 'revenue.arr')
})

test('missing, partial, unknown, stale, future, or wrong-cohort Stripe snapshots produce unknowns rather than zero', () => {
  for (const change of [
    (input) => { delete input.stripe },
    (input) => { input.stripe = null },
    (input) => { input.stripe.coverage = 'partial' },
    (input) => { input.stripe.coverage = 'unknown' },
    (input) => { input.stripe.observedAt = '2026-09-08T01:00:00.000Z' },
    (input) => { input.stripe.observedAt = '2026-09-09T13:00:00.000Z' },
    (input) => { input.stripe.captureDate = '2026-09-07' },
  ]) {
    const input = fixture()
    change(input)
    const result = adaptRevenueEvidence(input)
    assertUnknown(result, 'gross', 'retained', 'membership')
    assert.ok(result.reasons.includes('stripe_snapshot_invalid_incomplete_stale_or_open_day'))
  }
})

test('unavailable membership or allocation evidence withholds attribution without discarding Stripe collection truth', () => {
  for (const key of ['outseta', 'allocations']) {
    for (const change of [
      (input) => { delete input[key] },
      (input) => { input[key].coverage = 'partial' },
      (input) => { input[key].coverage = 'unknown' },
      (input) => { input[key].observedAt = '2026-09-07T11:00:00.000Z' },
      (input) => { input[key].observedAt = '2026-09-08T13:00:00.000Z' },
      (input) => { input[key].observedAt = '2026-09-09T13:00:00.000Z' },
    ]) {
      const input = fixture()
      change(input)
      const result = adaptRevenueEvidence(input)
      assert.equal(metric(result, 'gross').value, 6000)
      assert.equal(metric(result, 'retained').value, 6000)
      assertUnknown(result, 'membership')
    }
  }
})

test('authorized, failed, pending and zero-amount payments never fabricate collections', () => {
  for (const state of [
    { status: 'succeeded', paid: true, captured: false },
    { status: 'failed', paid: false, captured: false },
    { status: 'pending', paid: false, captured: false },
    { status: 'succeeded', paid: true, captured: true },
  ]) {
    const input = fixture()
    Object.assign(input.stripe.rows[0], state, { amountCapturedMinor: 0, capturedAt: null })
    input.allocations.rows = []
    const result = adaptRevenueEvidence(input)
    assert.deepEqual(values(result), { gross: 0, retained: 0, membership: 0 })
    assert.deepEqual(result.payments, [])
  }
})

test('contradictory positive captures fail closed and allocations against non-collected payments stay unresolved', () => {
  for (const state of [{ captured: false }, { paid: false }, { status: 'failed' }, { status: 'pending' },
    { captureBasis: 'multiple_or_unknown' }]) {
    const input = fixture()
    Object.assign(input.stripe.rows[0], state)
    assertUnknown(adaptRevenueEvidence(input), 'gross', 'retained', 'membership')
  }
  const input = fixture()
  input.stripe.rows[0].amountCapturedMinor = 0
  const result = adaptRevenueEvidence(input)
  assert.equal(metric(result, 'gross').value, 0)
  assertUnknown(result, 'membership')
  assert.ok(result.reasons.includes('allocation_without_collected_payment'))
})

test('identical charge, refund, account and allocation observations deduplicate without double counting', () => {
  const input = fixture()
  addRefund(input)
  input.stripe.rows[0].refunds.push(structuredClone(input.stripe.rows[0].refunds[0]))
  input.stripe.rows.push(structuredClone(input.stripe.rows[0]))
  input.outseta.rows.push(structuredClone(input.outseta.rows[0]))
  input.allocations.rows.push(structuredClone(input.allocations.rows[0]))
  const result = adaptRevenueEvidence(input)
  assert.deepEqual(values(result), { gross: 6000, retained: 5000, membership: 6000 })
  assert.equal(metric(result, 'gross').observedRecords, 1)
  assert.equal(result.payments.length, 1)
})

test('conflicting observations of the same charge, refund, account or allocation are not silently chosen', () => {
  const charges = fixture()
  charges.stripe.rows.push({ ...charges.stripe.rows[0], amountCapturedMinor: 5000 })
  assertUnknown(adaptRevenueEvidence(charges), 'gross', 'retained', 'membership')
  const refunds = fixture()
  addRefund(refunds)
  refunds.stripe.rows[0].refunds.push({ ...refunds.stripe.rows[0].refunds[0], amountMinor: 500 })
  const refundResult = adaptRevenueEvidence(refunds)
  assert.equal(metric(refundResult, 'gross').value, 6000)
  assertUnknown(refundResult, 'retained')
  for (const key of ['outseta', 'allocations']) {
    const input = fixture()
    input[key].rows.push({ ...input[key].rows[0], ...(key === 'outseta' ? { plan: 'pro' } : { amountMinor: 5000 }) })
    assertUnknown(adaptRevenueEvidence(input), 'membership')
  }
})

test('a refund identifier reused across distinct charges cannot be counted as two successful refunds', () => {
  const input = fixture()
  addRefund(input)
  addSecondPayment(input)
  input.stripe.rows[1].refunds.push({
    ...input.stripe.rows[0].refunds[0], chargeRef: 'ch_fixture_2',
  })
  const result = adaptRevenueEvidence(input)
  assert.equal(metric(result, 'gross').value, 12000)
  assertUnknown(result, 'retained')
})

test('mixed charge currency, connected account or mode is never silently aggregated into one scope', () => {
  for (const change of [{ currency: 'EUR' }, { stripeAccountRef: 'acct_other' }, { livemode: true }]) {
    const input = fixture()
    addSecondPayment(input)
    Object.assign(input.stripe.rows[1], change)
    assertUnknown(adaptRevenueEvidence(input), 'gross', 'retained', 'membership')
  }
  for (const change of [{ stripeAccountRef: 'acct_other' }, { livemode: true }]) {
    const input = fixture()
    Object.assign(input.outseta.rows[0], change)
    const result = adaptRevenueEvidence(input)
    assert.equal(metric(result, 'gross').value, 6000)
    assertUnknown(result, 'membership')
  }
})

test('Agency subscription attribution is account-level and duplicate account observations do not multiply revenue', () => {
  const input = fixture()
  input.outseta.rows[0].plan = 'agency'
  input.outseta.rows.push(structuredClone(input.outseta.rows[0]))
  addSecondPayment(input, 3000)
  const result = adaptRevenueEvidence(input)
  assert.deepEqual(values(result), { gross: 9000, retained: 9000, membership: 9000 })
  assert.equal(result.payments.length, 2)
  assert.ok(result.payments.every((item) => item.outsetaAccountRef === 'outseta_fixture'))
})

test('metadata-only, unmatched, ambiguous and orphan allocations cannot establish membership revenue', () => {
  for (const change of [
    (input) => { input.allocations.rows[0].basis = 'metadata_only' },
    (input) => { input.allocations.rows[0].basis = 'unknown' },
    (input) => { input.allocations.rows = [] },
    (input) => { input.outseta.rows = [] },
    (input) => { input.outseta.rows.push({ ...input.outseta.rows[0], accountRef: 'outseta_ambiguous' }) },
    (input) => { input.allocations.rows.push({ ...input.allocations.rows[0], allocationRef: 'orphan', chargeRef: 'ch_missing' }) },
  ]) {
    const input = fixture()
    change(input)
    const result = adaptRevenueEvidence(input)
    assert.equal(metric(result, 'gross').value, 6000)
    assertUnknown(result, 'membership')
  }
})

test('identity conflicts, mismatched subscription/account references and invalid allocation amounts withhold attribution', () => {
  for (const change of [
    (input) => { input.outseta.rows[0].identityState = 'unknown' },
    (input) => { input.outseta.rows[0].identityState = 'conflict' },
    (input) => { input.allocations.rows[0].subscriptionRef = 'sub_other' },
    (input) => { input.allocations.rows[0].accountRef = 'outseta_other' },
    (input) => { input.allocations.rows[0].amountMinor = 6001 },
    (input) => { input.allocations.rows[0].amountMinor = 0 },
  ]) {
    const input = fixture()
    change(input)
    assertUnknown(adaptRevenueEvidence(input), 'membership')
  }
  const partiallyAllocated = fixture()
  partiallyAllocated.allocations.rows[0].amountMinor = 4000
  assert.equal(metric(adaptRevenueEvidence(partiallyAllocated), 'membership').value, 4000)
})

test('strict normalized snapshots reject unexpected raw payload fields instead of passing them into metric evidence', () => {
  for (const select of [
    (input) => input.stripe,
    (input) => input.stripe.rows[0],
    (input) => input.stripe.rows[0].balance,
    (input) => { addRefund(input); return input.stripe.rows[0].refunds[0] },
  ]) {
    const input = fixture()
    select(input).unexpectedRawPayload = 'fixture-only'
    const result = adaptRevenueEvidence(input)
    assertUnknown(result, 'gross', 'retained', 'membership')
    assert.ok(!JSON.stringify(result).includes('fixture-only'))
  }
  for (const select of [(input) => input.outseta.rows[0], (input) => input.allocations.rows[0]]) {
    const input = fixture()
    select(input).unexpectedRawPayload = 'fixture-only'
    assertUnknown(adaptRevenueEvidence(input), 'membership')
  }
  const context = fixture()
  context.context.unexpected = true
  assert.throws(() => adaptRevenueEvidence(context))
})

test('capture boundaries use the closed UTC day and reject impossible or future metric dates', () => {
  for (const capturedAt of ['2026-09-08T00:00:00.000Z', '2026-09-08T23:59:59.999Z']) {
    const input = fixture()
    input.stripe.rows[0].capturedAt = capturedAt
    assert.equal(metric(adaptRevenueEvidence(input), 'gross').value, 6000)
  }
  for (const capturedAt of [null, '2026-09-07T23:59:59.999Z', '2026-09-09T00:00:00.000Z']) {
    const input = fixture()
    input.stripe.rows[0].capturedAt = capturedAt
    assertUnknown(adaptRevenueEvidence(input), 'gross', 'retained', 'membership')
  }
  for (const metricDate of ['2026-02-30', '2026-09-10']) {
    const input = fixture()
    input.context.metricDate = metricDate
    assert.throws(() => adaptRevenueEvidence(input), /Invalid revenue evidence date/)
  }
  const openDay = fixture()
  openDay.context.metricDate = '2026-09-09'
  openDay.stripe.captureDate = '2026-09-09'
  openDay.stripe.rows[0].capturedAt = '2026-09-09T01:00:00.000Z'
  assertUnknown(adaptRevenueEvidence(openDay), 'gross', 'retained', 'membership')
})

test('unsafe source amounts and aggregate overflow never produce rounded monetary values', () => {
  for (const amountMinor of [-1, 0.1, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN]) {
    const input = fixture()
    input.stripe.rows[0].amountCapturedMinor = amountMinor
    assertUnknown(adaptRevenueEvidence(input), 'gross', 'retained', 'membership')
  }
  const input = fixture()
  input.stripe.rows[0].amountCapturedMinor = Number.MAX_SAFE_INTEGER
  input.allocations.rows[0].amountMinor = Number.MAX_SAFE_INTEGER
  addSecondPayment(input, 1)
  const result = adaptRevenueEvidence(input)
  assertUnknown(result, 'gross', 'retained', 'membership')
  assert.ok(result.metrics.every((item) => item.value === null || Number.isSafeInteger(item.value)))
})

test('an orphan allocation cannot turn an empty Stripe cohort into verified membership collections', () => {
  const input = fixture()
  input.stripe.rows = []
  const result = adaptRevenueEvidence(input)
  assert.equal(metric(result, 'gross').value, 0)
  assert.equal(metric(result, 'retained').value, 0)
  assertUnknown(result, 'membership')
  assert.ok(result.reasons.includes('orphan_payment_allocation'))
})

test('pure adapter is deterministic, does not mutate source inputs, and keeps source scope in metric identities', () => {
  const input = fixture()
  addSecondPayment(input, 3000)
  const original = structuredClone(input)
  const first = adaptRevenueEvidence(input)
  const reordered = structuredClone(input)
  reordered.stripe.rows.reverse()
  reordered.allocations.rows.reverse()
  assert.deepEqual(adaptRevenueEvidence(reordered), first)
  assert.deepEqual(adaptRevenueEvidence(input), first)
  assert.deepEqual(input, original)
  const otherMode = fixture()
  otherMode.context.livemode = true
  otherMode.stripe.rows[0].livemode = true
  otherMode.outseta.rows[0].livemode = true
  assert.notEqual(metric(adaptRevenueEvidence(otherMode), 'gross').idempotencyKey, metric(first, 'gross').idempotencyKey)
  const exported = fixture()
  exported.context.sourceKind = 'approved_read_only_export'
  assert.notEqual(metric(adaptRevenueEvidence(exported), 'gross').idempotencyKey, metric(first, 'gross').idempotencyKey)
  assert.equal(metric(adaptRevenueEvidence(exported), 'gross').provenance.sourceKind, 'approved_read_only_export')
})

test('adapter metrics feed Revenue Agent comparisons without inventing upgrades, MRR, live execution or mutations', () => {
  const current = fixture()
  addRefund(current, 'succeeded', 1000)
  const prior = fixture()
  prior.context.metricDate = '2026-09-07'
  prior.stripe.captureDate = '2026-09-07'
  prior.stripe.rows[0].capturedAt = '2026-09-07T12:00:00.000Z'
  prior.stripe.rows[0].amountCapturedMinor = 3000
  prior.allocations.rows[0].amountMinor = 3000
  const output = runRevenueAgent({
    currentMetrics: adaptRevenueEvidence(current).metrics,
    comparisonMetrics: adaptRevenueEvidence(prior).metrics,
    correlation: current.context.correlation, observedAt: current.context.now,
  })
  const assessments = Object.fromEntries(output.data.assessments.map((item) => [item.metric, item]))
  assert.equal(assessments[names.gross].currentValue, 6000)
  assert.equal(assessments[names.gross].comparisonValue, 3000)
  assert.equal(assessments[names.gross].delta, 3000)
  assert.equal(assessments[names.gross].dataQualityState, 'ready')
  assert.equal(assessments[names.retained].delta, 2000)
  assert.equal(assessments[names.membership].delta, 3000)
  for (const key of ['revenue.mrr', 'revenue.arr']) {
    assert.equal(assessments[key].currentValue, null)
    assert.equal(assessments[key].comparisonValue, null)
    assert.equal(assessments[key].delta, null)
    assert.equal(assessments[key].dataQualityState, 'unknown')
  }
  assert.ok(output.data.assessments.every((item) => !item.metric.includes('upgrade')))
  assert.equal(output.modelUsed, false)
  assert.deepEqual(output.proposedActions, [])
  assert.ok(output.sourceRefs.some((item) => item.sourceSystem === 'stripe'))
  assert.ok(output.sourceRefs.some((item) => item.sourceSystem === 'outseta'))
})

test('observation revisions distinguish later refunds from older replay while identical duplicate observations retain keys', () => {
  const input = fixture()
  const original = adaptRevenueEvidence(input)
  const duplicate = structuredClone(input)
  duplicate.stripe.rows.push(structuredClone(duplicate.stripe.rows[0]))
  assert.equal(metric(adaptRevenueEvidence(duplicate), 'retained').idempotencyKey, metric(original, 'retained').idempotencyKey)
  const laterRefund = structuredClone(input)
  laterRefund.stripe.observedAt = '2026-09-09T11:30:00.000Z'
  addRefund(laterRefund)
  const revised = adaptRevenueEvidence(laterRefund)
  assert.equal(metric(revised, 'retained').value, 5000)
  assert.notEqual(metric(revised, 'retained').idempotencyKey, metric(original, 'retained').idempotencyKey)
  assert.notEqual(metric(revised, 'retained').provenance.evidenceRevision, metric(original, 'retained').provenance.evidenceRevision)
  const replay = adaptRevenueEvidence(input)
  assert.equal(metric(replay, 'retained').idempotencyKey, metric(original, 'retained').idempotencyKey)
  assert.equal(metric(replay, 'retained').value, 6000)
  assert.deepEqual(replay, original)
})

test('Stripe metrics retain Stripe-only provenance while membership attribution uses the latest evidence observation', () => {
  const input = fixture()
  input.outseta.observedAt = '2026-09-09T11:30:00.000Z'
  input.allocations.observedAt = '2026-09-09T11:45:00.000Z'
  const result = adaptRevenueEvidence(input)
  for (const name of ['gross', 'retained']) {
    assert.equal(metric(result, name).sourceSystem, 'stripe')
    assert.deepEqual(metric(result, name).sourceRefs.map((item) => item.sourceSystem), ['stripe'])
    assert.equal(metric(result, name).observedAt, '2026-09-09T11:00:00.000Z')
  }
  assert.equal(metric(result, 'membership').sourceSystem, 'stripe+outseta')
  assert.deepEqual(metric(result, 'membership').sourceRefs.map((item) => item.sourceSystem), ['stripe', 'outseta', 'stripe_outseta'])
  assert.equal(metric(result, 'membership').observedAt, '2026-09-09T11:45:00.000Z')
})

test('bounded normalized input refuses overlarge Stripe snapshots', () => {
  const input = fixture()
  input.stripe.rows = Array.from({ length: 5001 }, () => structuredClone(input.stripe.rows[0]))
  assertUnknown(adaptRevenueEvidence(input), 'gross', 'retained', 'membership')
})
