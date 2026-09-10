import assert from 'node:assert/strict'
import test from 'node:test'

import { BILLING_STRIPE_API_VERSION, BillingReadOnlyClient } from '../dist/sensors/billing-readonly.js'

const NOW = '2026-09-09T12:00:00.000Z'
const dummyCredentials = {
  stripeSecret: 'fixture_stripe_dummy', outsetaApiKey: 'fixture_outseta_key', outsetaApiSecret: 'fixture_outseta_secret',
}

function policy(overrides = {}) {
  return {
    reviewRef: 'review_fixture', reviewedAt: '2026-09-09T11:00:00.000Z', expiresAt: '2026-09-09T13:00:00.000Z',
    stripeAccountRef: 'acct_fixture', livemode: false, stripeApiVersion: BILLING_STRIPE_API_VERSION,
    outsetaHostname: 'fixture-tenant.outseta.com',
    scopes: [
      { resource: 'stripe_charge', id: 'ch_fixture' },
      { resource: 'stripe_refunds', id: 'ch_fixture' },
      { resource: 'stripe_balance', id: 'txn_fixture' },
      { resource: 'stripe_invoice_payments', id: 'in_fixture' },
      { resource: 'outseta_account', id: 'account_fixture' },
    ],
    maxRequests: 20, maxPages: 3, pageSize: 2, timeoutMs: 1000,
    ...overrides,
  }
}

function charge(overrides = {}) {
  return {
    id: 'ch_fixture', object: 'charge', customer: 'cus_fixture', payment_intent: 'pi_fixture', livemode: false,
    status: 'succeeded', paid: true, captured: true, amount_captured: 6000, amount_refunded: 0,
    currency: 'usd', created: 1_783_680_000, disputed: false, balance_transaction: 'txn_fixture',
    ...overrides,
  }
}

function refund(id = 're_fixture', overrides = {}) {
  return { id, object: 'refund', charge: 'ch_fixture', amount: 1000, currency: 'usd', created: 1_783_680_000, status: 'succeeded', ...overrides }
}

function account(overrides = {}) {
  return {
    Uid: 'account_fixture', AccountStage: 3, StripeId: 'cus_fixture', IsLivemode: false, IsDemo: false,
    CurrentSubscription: { Uid: 'subscription_current', Plan: { Uid: 'plan_fixture' } },
    LatestSubscription: { Uid: 'subscription_latest', Plan: { Uid: 'plan_later' } },
    ...overrides,
  }
}

function invoicePayment(overrides = {}) {
  return {
    id: 'inpay_fixture', object: 'invoice_payment', invoice: 'in_fixture', livemode: false, currency: 'usd',
    status: 'paid', amount_paid: 2000, payment: { type: 'charge', charge: 'ch_fixture' },
    ...overrides,
  }
}

function list(data = [], has_more = false) { return { object: 'list', data, has_more } }

function fixture(transport = async () => ({ status: 200, body: charge() }), overrides = {}) {
  return new BillingReadOnlyClient({ policy: policy(), mode: 'fixture', now: () => NOW, transport, ...overrides })
}

function assertUnavailable(result, reason = 'read_failed_or_invalid_evidence') {
  assert.equal(result.state, 'unavailable')
  assert.equal(result.reason, reason)
  assert.deepEqual(result.records, [])
  assert.equal(result.captureDateCoverage, 'unknown')
  assert.equal(result.mutationAllowed, false)
}

test('fixture reads require an injected transport and refuse credentials', () => {
  assert.throws(() => new BillingReadOnlyClient({ policy: policy(), mode: 'fixture', now: () => NOW }), /injected transport/)
  assert.throws(() => fixture(undefined, { credentials: dummyCredentials }), /no credentials/)
})

test('live billing reads are disabled unless explicitly enabled and credentials are supplied', () => {
  const base = { policy: policy(), mode: 'approved_live', now: () => NOW }
  assert.throws(() => new BillingReadOnlyClient(base), /Live billing reads are disabled/)
  assert.throws(() => new BillingReadOnlyClient({ ...base, credentials: dummyCredentials, liveReadsEnabled: false }), /disabled/)
  assert.throws(() => new BillingReadOnlyClient({ ...base, liveReadsEnabled: true }))
  assert.throws(() => fixture(undefined, { mode: 'arbitrary_mode' }), /Invalid billing reader mode/)
})

test('policy rejects unpinned API versions, hostile hosts, paths and invalid bounds', () => {
  const invalid = [
    { stripeApiVersion: '2020-08-27' }, { stripeAccountRef: 'acct_fixture/../other' },
    { outsetaHostname: 'https://fixture-tenant.outseta.com' }, { outsetaHostname: 'fixture.outseta.com.attacker.invalid' },
    { outsetaHostname: 'fixture-tenant.outseta.com/path' }, { outsetaHostname: 'fixture@outseta.com' },
    { scopes: [{ resource: 'stripe_charge', id: '../customers' }] },
    { scopes: [{ resource: 'stripe_charge', id: 'ch_fixture?expand[]=customer' }] },
    { scopes: [{ resource: 'stripe_customers', id: 'cus_fixture' }] }, { scopes: [] },
    { maxRequests: 101 }, { maxPages: 6 }, { pageSize: 101 }, { timeoutMs: 30_001 },
  ]
  for (const invalidPolicy of invalid) assert.throws(() => fixture(undefined, { policy: policy(invalidPolicy) }))
})

test('future, expired, or malformed reviews fail before a transport can run', () => {
  for (const overrides of [
    { reviewedAt: '2026-09-09T12:00:00.001Z' }, { expiresAt: NOW }, { expiresAt: '2026-09-08T13:00:00.000Z' },
    { reviewedAt: 'not-a-timestamp' },
  ]) assert.throws(() => fixture(undefined, { policy: policy(overrides) }))
})

test('scope and path rejection never issue a request and do not echo invalid identifiers', async () => {
  let requests = 0
  const client = fixture(async () => { requests++; return { status: 200, body: charge() } })
  for (const id of ['ch_other', '../customers', 'ch_fixture?limit=100', 'fixture@example.invalid']) {
    const result = await client.readCharge(id)
    assertUnavailable(result, 'scope_not_approved')
    if (id !== 'ch_other') assert.equal(result.evidence.id, 'invalid')
  }
  assertUnavailable(await client.readOutsetaAccount('ch_fixture'), 'scope_not_approved')
  assert.equal(requests, 0)
})

test('all readers use exact approved GET endpoints with isolated headers and no redirects or cache', async () => {
  const requests = []
  const client = fixture(async (request) => {
    requests.push(request)
    return { status: 200, body: request.url.includes('outseta.com') ? account()
      : request.url.includes('/refunds?') || request.url.includes('/invoice_payments?') ? list()
        : request.url.includes('/balance_transactions/') ? {
          id: 'txn_fixture', object: 'balance_transaction', source: 'ch_fixture', currency: 'usd',
          created: 1_783_680_000, available_on: 1_783_766_400, status: 'pending',
        } : charge() }
  })
  const stripeResult = await client.readCharge('ch_fixture')
  await client.readRefunds('ch_fixture')
  await client.readBalance('txn_fixture')
  await client.readInvoicePayments('in_fixture')
  const outsetaResult = await client.readOutsetaAccount('account_fixture')
  assert.equal(stripeResult.evidence.sourceAccount, 'acct_fixture')
  assert.equal(stripeResult.evidence.stripeApiVersion, BILLING_STRIPE_API_VERSION)
  assert.equal(stripeResult.evidence.expectedLivemode, false)
  assert.equal(outsetaResult.evidence.sourceAccount, 'fixture-tenant.outseta.com')
  assert.equal(outsetaResult.evidence.stripeApiVersion, null)
  assert.equal(outsetaResult.evidence.expectedLivemode, false)
  assert.deepEqual(requests.slice(0, 4).map((request) => request.url), [
    'https://api.stripe.com/v1/charges/ch_fixture',
    'https://api.stripe.com/v1/refunds?charge=ch_fixture&limit=2',
    'https://api.stripe.com/v1/balance_transactions/txn_fixture',
    'https://api.stripe.com/v1/invoice_payments?invoice=in_fixture&limit=2',
  ])
  const outsetaUrl = new URL(requests[4].url)
  assert.equal(outsetaUrl.origin, 'https://fixture-tenant.outseta.com')
  assert.equal(outsetaUrl.pathname, '/api/v1/crm/accounts/account_fixture')
  assert.deepEqual([...outsetaUrl.searchParams.keys()], ['fields'])
  assert.equal(outsetaUrl.searchParams.get('fields'), 'Uid,StripeId,IsLivemode,IsDemo,AccountStage,CurrentSubscription.Uid,CurrentSubscription.Plan.Uid,LatestSubscription.Uid')
  for (const request of requests) {
    assert.equal(request.method, 'GET')
    assert.equal(request.redirect, 'error')
    assert.equal(request.cache, 'no-store')
    assert.ok(request.signal instanceof AbortSignal)
    assert.equal('body' in request, false)
    assert.equal(request.headers.Accept, 'application/json')
  }
  for (const request of requests.slice(0, 4)) assert.deepEqual(request.headers, {
    Authorization: 'Bearer fixture-stripe-not-a-secret', 'Stripe-Account': 'acct_fixture',
    'Stripe-Version': BILLING_STRIPE_API_VERSION, Accept: 'application/json',
  })
  assert.deepEqual(requests[4].headers, { Authorization: 'Outseta fixture-key:fixture-secret', Accept: 'application/json' })
})

test('Outseta normalizes only minimal fields and never treats a customer candidate as verified identity', async () => {
  const result = await fixture(async () => ({ status: 200, body: account({
    Name: 'Private Fixture', Person: { Email: 'private@example.invalid' }, arbitrary: 'raw-provider-secret',
    CurrentSubscription: { Uid: 'subscription_current', Plan: { Uid: 'plan_fixture', Price: 999 }, PrivateNote: 'not for output' },
  }) })).readOutsetaAccount('account_fixture')
  assert.equal(result.state, 'complete')
  assert.deepEqual(result.records, [{
    accountRef: 'account_fixture', accountStage: 3, currentSubscriptionRef: 'subscription_current', currentPlanRef: 'plan_fixture',
    latestSubscriptionRef: 'subscription_latest', stripeCustomerRef: 'cus_fixture', livemode: false, isDemo: false, identityState: 'unknown',
  }])
  assert.doesNotMatch(JSON.stringify(result), /private@example|Private Fixture|raw-provider-secret|PrivateNote|Price/)
})

test('missing current Outseta subscription remains unknown instead of falling back to latest', async () => {
  for (const current of [undefined, null]) {
    const result = await fixture(async () => ({ status: 200, body: account({ CurrentSubscription: current, StripeId: null }) }))
      .readOutsetaAccount('account_fixture')
    assert.equal(result.records[0].currentSubscriptionRef, null)
    assert.equal(result.records[0].currentPlanRef, null)
    assert.equal(result.records[0].latestSubscriptionRef, 'subscription_latest')
    assert.equal(result.records[0].stripeCustomerRef, null)
    assert.equal(result.records[0].identityState, 'unknown')
  }
})

test('charge output preserves authorized and captured facts without claiming capture-date coverage', async () => {
  const result = await fixture(async () => ({ status: 200, body: charge({
    paid: true, captured: false, amount_captured: 0, customer: { id: 'cus_fixture', email: 'private@example.invalid' },
    billing_details: { name: 'Private Fixture' }, metadata: { untrusted: 'raw-note' },
  }) })).readCharge('ch_fixture')
  assert.deepEqual(result.records, [{
    chargeRef: 'ch_fixture', customerRef: 'cus_fixture', paymentIntentRef: 'pi_fixture', livemode: false, currency: 'USD',
    status: 'succeeded', paid: true, captured: false, amountCapturedMinor: 0, amountRefundedMinor: 0,
    createdAt: new Date(1_783_680_000 * 1000).toISOString(), capturedAt: null, captureBasis: 'multiple_or_unknown',
    disputed: false, balanceRef: 'txn_fixture',
  }])
  assert.equal(result.scope, 'explicit_id_only')
  assert.equal(result.captureDateCoverage, 'unknown')
  assert.equal(result.mutationAllowed, false)
  assert.doesNotMatch(JSON.stringify(result), /private@example|Private Fixture|raw-note|billing_details|metadata/)
})

test('captured amounts, refund totals and dispute flags survive normalization without becoming settlement claims', async () => {
  const result = await fixture(async () => ({ status: 200, body: charge({ amount_refunded: 2000, disputed: true }) }))
    .readCharge('ch_fixture')
  assert.equal(result.records[0].amountCapturedMinor, 6000)
  assert.equal(result.records[0].amountRefundedMinor, 2000)
  assert.equal(result.records[0].disputed, true)
  assert.equal(result.records[0].captured, true)
  assert.equal(result.records[0].capturedAt, null)
  assert.equal('settled' in result.records[0], false)
})

test('wrong returned IDs, livemode and parent links are rejected rather than attributed', async () => {
  const cases = [
    ['readCharge', 'ch_fixture', charge({ id: 'ch_other' })],
    ['readCharge', 'ch_fixture', charge({ livemode: true })],
    ['readOutsetaAccount', 'account_fixture', account({ Uid: 'other_account' })],
    ['readOutsetaAccount', 'account_fixture', account({ IsLivemode: true })],
    ['readOutsetaAccount', 'account_fixture', account({ IsLivemode: undefined })],
    ['readOutsetaAccount', 'account_fixture', account({ StripeId: 'not_customer_ref' })],
    ['readRefunds', 'ch_fixture', list([refund('re_fixture', { charge: 'ch_other' })])],
    ['readInvoicePayments', 'in_fixture', list([invoicePayment({ invoice: 'in_other' })])],
    ['readInvoicePayments', 'in_fixture', list([invoicePayment({ livemode: true })])],
    ['readBalance', 'txn_fixture', { id: 'txn_other', object: 'balance_transaction', source: 'ch_fixture', currency: 'usd',
      created: 1_783_680_000, available_on: 1_783_766_400, status: 'available' }],
  ]
  for (const [method, id, body] of cases) assertUnavailable(await fixture(async () => ({ status: 200, body }))[method](id))
})

test('invoice payments preserve allocated invoice amounts, not the full charge amount', async () => {
  const result = await fixture(async () => ({ status: 200, body: list([invoicePayment({
    payment: { type: 'charge', charge: { id: 'ch_fixture', amount_captured: 6000, receipt_email: 'private@example.invalid' } },
    customer_email: 'private@example.invalid',
  })]) })).readInvoicePayments('in_fixture')
  assert.deepEqual(result.records, [{
    allocationRef: 'inpay_fixture', invoiceRef: 'in_fixture', livemode: false, currency: 'USD', amountPaidMinor: 2000,
    status: 'paid', paymentType: 'charge', paymentRef: 'ch_fixture',
  }])
  assert.doesNotMatch(JSON.stringify(result), /6000|private@example|receipt_email/)
})

test('invoice payments preserve supported payment kinds and unknown payment allocation amounts', async () => {
  for (const [type, id] of [['payment_intent', 'pi_fixture'], ['payment_record', 'payrec_fixture']]) {
    const result = await fixture(async () => ({ status: 200, body: list([invoicePayment({
      status: 'open', amount_paid: null, payment: { type, [type]: id },
    })]) })).readInvoicePayments('in_fixture')
    assert.equal(result.records[0].paymentType, type)
    assert.equal(result.records[0].paymentRef, id)
    assert.equal(result.records[0].amountPaidMinor, null)
    assert.equal(result.records[0].status, 'open')
  }
})

test('balance observations retain their own currency and source without asserting payout or charge linkage', async () => {
  const result = await fixture(async () => ({ status: 200, body: {
    id: 'txn_fixture', object: 'balance_transaction', source: { id: 'ch_other', billing_details: 'private' },
    currency: 'eur', created: 1_783_680_000, available_on: 1_783_766_400, status: 'available',
    amount: 6000, net: 5750, fee: 250, description: 'private fixture text',
  } })).readBalance('txn_fixture')
  assert.deepEqual(result.records, [{ balanceRef: 'txn_fixture', sourceRef: 'ch_other', currency: 'EUR',
    createdAt: new Date(1_783_680_000 * 1000).toISOString(), availableOn: new Date(1_783_766_400 * 1000).toISOString(), status: 'available' }])
  assert.doesNotMatch(JSON.stringify(result), /private|5750|net|payout|settled/)
})

test('refund collection follows all approved pages with stable charge filtering and cursors', async () => {
  const urls = []
  const client = fixture(async (request) => {
    urls.push(request.url)
    return { status: 200, body: urls.length === 1 ? list([refund('re_one'), refund('re_two', { status: 'pending' })], true)
      : list([refund('re_three', { status: 'failed', amount: 500 })]) }
  })
  const result = await client.readRefunds('ch_fixture')
  assert.equal(result.state, 'complete')
  assert.equal(result.pagesRead, 2)
  assert.deepEqual(result.records.map((row) => [row.refundRef, row.status]), [['re_one', 'succeeded'], ['re_two', 'pending'], ['re_three', 'failed']])
  assert.deepEqual(urls, [
    'https://api.stripe.com/v1/refunds?charge=ch_fixture&limit=2',
    'https://api.stripe.com/v1/refunds?charge=ch_fixture&limit=2&starting_after=re_two',
  ])
  assert.equal(result.scope, 'explicit_id_only')
  assert.equal(result.captureDateCoverage, 'unknown')
})

test('exhausted page budget is partial, with only validated evidence retained', async () => {
  const client = fixture(async () => ({ status: 200, body: list([refund()], true) }), { policy: policy({ maxPages: 1 }) })
  const result = await client.readRefunds('ch_fixture')
  assert.equal(result.state, 'partial')
  assert.equal(result.reason, 'page_budget')
  assert.equal(result.pagesRead, 1)
  assert.equal(result.records.length, 1)
})

test('duplicate collection cursors and duplicate rows never report complete or double count', async () => {
  let requests = 0
  const result = await fixture(async () => ({ status: 200, body: list([refund()], ++requests === 1) }))
    .readRefunds('ch_fixture')
  assert.equal(result.state, 'partial')
  assert.equal(result.reason, 'duplicate_or_changing_page')
  assert.equal(result.records.length, 1)
  assert.equal(result.pagesRead, 1)
  const samePage = await fixture(async () => ({ status: 200, body: list([refund(), refund()]) })).readRefunds('ch_fixture')
  assertUnavailable(samePage, 'duplicate_or_changing_page')
})

test('empty has_more pages and malformed list envelopes fail closed', async () => {
  assertUnavailable(await fixture(async () => ({ status: 200, body: list([], true) })).readRefunds('ch_fixture'), 'invalid_page')
  for (const body of [list([], 'true'), { data: [], has_more: false }, list([refund('re_one'), refund('re_two'), refund('re_three')])]) {
    assertUnavailable(await fixture(async () => ({ status: 200, body })).readRefunds('ch_fixture'))
  }
  const empty = await fixture(async () => ({ status: 200, body: list() })).readRefunds('ch_fixture')
  assert.equal(empty.state, 'complete')
  assert.equal(empty.pagesRead, 1)
  assert.deepEqual(empty.records, [])
  assert.equal(empty.captureDateCoverage, 'unknown')
})

test('partial provider failure retains the first page without returning raw provider messages', async () => {
  let requests = 0
  const result = await fixture(async () => {
    if (++requests === 1) return { status: 200, body: list([refund()], true) }
    throw new Error('private@example.invalid fixture_provider_token https://private.invalid')
  }).readRefunds('ch_fixture')
  assert.equal(result.state, 'partial')
  assert.equal(result.reason, 'read_failed_or_invalid_evidence')
  assert.equal(result.records.length, 1)
  assert.equal(result.pagesRead, 1)
  assert.doesNotMatch(JSON.stringify(result), /private@example|fixture_provider_token|https:/)
})

test('null refund status and malformed rows invalidate the whole current page without leaking payloads', async () => {
  const result = await fixture(async () => ({ status: 200, body: list([
    refund('re_valid'), refund('re_invalid', { status: null, receipt_email: 'private@example.invalid' }),
  ]) })).readRefunds('ch_fixture')
  assertUnavailable(result)
  assert.equal(result.pagesRead, 0)
  assert.doesNotMatch(JSON.stringify(result), /private@example|receipt_email/)
})

test('non-200 statuses and raw error bodies remain unavailable and sanitized', async () => {
  for (const status of [201, 204, 301, 401, 429, 500]) {
    const result = await fixture(async () => ({ status, body: { error: { message: 'private@example.invalid fixture_secret_do_not_copy' } } }))
      .readCharge('ch_fixture')
    assertUnavailable(result)
    assert.doesNotMatch(JSON.stringify(result), /private@example|fixture_secret|message|429|500/)
  }
})

test('request budget counts failed attempts and refuses automatic retries', async () => {
  let requests = 0
  const client = fixture(async () => { requests++; throw new Error('fixture transport failure') }, { policy: policy({ maxRequests: 1 }) })
  assertUnavailable(await client.readCharge('ch_fixture'))
  assertUnavailable(await client.readCharge('ch_fixture'), 'request_budget')
  assert.equal(requests, 1)
})

test('request budget applies to every collection page and preserves a partial result', async () => {
  let requests = 0
  const client = fixture(async () => { requests++; return { status: 200, body: list([refund()], true) } }, { policy: policy({ maxRequests: 1 }) })
  const result = await client.readRefunds('ch_fixture')
  assert.equal(result.state, 'partial')
  assert.equal(result.reason, 'request_budget')
  assert.equal(result.records.length, 1)
  assert.equal(requests, 1)
})

test('concurrent reads cannot overspend the shared request budget', async () => {
  let requests = 0
  let release
  const wait = new Promise((resolve) => { release = resolve })
  const client = fixture(async () => { requests++; await wait; return { status: 200, body: charge() } }, { policy: policy({ maxRequests: 1 }) })
  const first = client.readCharge('ch_fixture')
  assertUnavailable(await client.readCharge('ch_fixture'), 'request_budget')
  release()
  assert.equal((await first).state, 'complete')
  assert.equal(requests, 1)
})

test('responses arriving after review expiry are withheld and subsequent calls remain blocked', async () => {
  let time = NOW
  let requests = 0
  const client = fixture(async () => {
    requests++
    time = '2026-09-09T13:00:00.000Z'
    return { status: 200, body: list([refund()], true) }
  }, { now: () => time })
  const result = await client.readRefunds('ch_fixture')
  assertUnavailable(result)
  assertUnavailable(await client.readCharge('ch_fixture'))
  assert.equal(requests, 1)
})

test('review expiry between validated collection pages stops the next request', async () => {
  let time = NOW
  let requests = 0
  const client = fixture(async () => {
    requests++
    return { status: 200, body: {
      object: 'list', data: [refund()],
      get has_more() { time = '2026-09-09T13:00:00.000Z'; return true },
    } }
  }, { now: () => time })
  const result = await client.readRefunds('ch_fixture')
  assert.equal(result.state, 'partial')
  assert.equal(result.reason, 'read_failed_or_invalid_evidence')
  assert.equal(result.records.length, 1)
  assert.equal(result.pagesRead, 1)
  assert.equal(requests, 1)
})

test('bounded timeout returns even when an injected transport ignores its abort signal', async () => {
  let signal
  const client = fixture(async (request) => { signal = request.signal; return new Promise(() => {}) }, { policy: policy({ timeoutMs: 10 }) })
  const result = await client.readCharge('ch_fixture')
  assertUnavailable(result)
  assert.equal(signal.aborted, true)
})

test('mutating the original policy and request headers cannot widen subsequent reads', async () => {
  const initial = policy({ maxRequests: 1, scopes: [{ resource: 'stripe_charge', id: 'ch_fixture' }] })
  let requests = 0
  const client = fixture(async (request) => {
    requests++
    assert.equal(request.headers['Stripe-Account'], 'acct_fixture')
    assert.equal(new URL(request.url).hostname, 'api.stripe.com')
    return { status: 200, body: charge() }
  }, { policy: initial })
  initial.scopes[0].id = 'ch_other'
  initial.scopes.push({ resource: 'outseta_account', id: 'account_fixture' })
  initial.maxRequests = 100
  initial.stripeAccountRef = 'acct_other'
  initial.outsetaHostname = 'other-tenant.outseta.com'
  initial.expiresAt = '2099-01-01T00:00:00.000Z'
  assertUnavailable(await client.readCharge('ch_other'), 'scope_not_approved')
  assertUnavailable(await client.readOutsetaAccount('account_fixture'), 'scope_not_approved')
  assert.equal((await client.readCharge('ch_fixture')).state, 'complete')
  assertUnavailable(await client.readCharge('ch_fixture'), 'request_budget')
  assert.equal(requests, 1)
})

test('transport header mutations are isolated from credentials retained for later requests', async () => {
  let requests = 0
  const client = fixture(async (request) => {
    requests++
    assert.equal(request.headers.Authorization, 'Bearer fixture-stripe-not-a-secret')
    request.headers.Authorization = 'mutated_fixture_header'
    return { status: 200, body: charge() }
  })
  assert.equal((await client.readCharge('ch_fixture')).state, 'complete')
  assert.equal((await client.readCharge('ch_fixture')).state, 'complete')
  assert.equal(requests, 2)
})

test('default live transport is tested only through a fetch stub with dummy credentials', async (t) => {
  let request
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    request = { url, options }
    return new Response(JSON.stringify(charge()), { status: 200 })
  })
  const client = new BillingReadOnlyClient({
    policy: policy(), mode: 'approved_live', liveReadsEnabled: true, credentials: dummyCredentials, now: () => NOW,
  })
  const result = await client.readCharge('ch_fixture')
  assert.equal(result.state, 'complete')
  assert.equal(request.url, 'https://api.stripe.com/v1/charges/ch_fixture')
  assert.equal(request.options.method, 'GET')
  assert.equal(request.options.redirect, 'error')
  assert.equal(request.options.cache, 'no-store')
  assert.equal(request.options.headers.Authorization, 'Bearer fixture_stripe_dummy')
  assert.equal(request.options.headers['Stripe-Version'], BILLING_STRIPE_API_VERSION)
  assert.equal(result.evidence.mode, 'approved_live')
  assert.doesNotMatch(JSON.stringify(result), /fixture_stripe_dummy|fixture_outseta/)
})

test('default transport rejects oversized and malformed response bodies using a local fetch stub', async (t) => {
  let payload = 'x'.repeat(1_000_001)
  t.mock.method(globalThis, 'fetch', async () => new Response(payload, { status: 200 }))
  const client = new BillingReadOnlyClient({
    policy: policy(), mode: 'approved_live', liveReadsEnabled: true, credentials: dummyCredentials, now: () => NOW,
  })
  assertUnavailable(await client.readCharge('ch_fixture'))
  payload = '{ private@example.invalid not json'
  const result = await client.readCharge('ch_fixture')
  assertUnavailable(result)
  assert.doesNotMatch(JSON.stringify(result), /private@example|not json/)
})

test('default transport sanitizes non-200 and redirect failures without retrying', async (t) => {
  let requests = 0
  t.mock.method(globalThis, 'fetch', async () => {
    if (++requests === 1) return new Response('private@example.invalid', { status: 401 })
    throw new Error('Redirect to https://private.invalid with fixture_token')
  })
  const client = new BillingReadOnlyClient({
    policy: policy(), mode: 'approved_live', liveReadsEnabled: true, credentials: dummyCredentials, now: () => NOW,
  })
  assertUnavailable(await client.readCharge('ch_fixture'))
  const redirected = await client.readCharge('ch_fixture')
  assertUnavailable(redirected)
  assert.doesNotMatch(JSON.stringify(redirected), /private|fixture_token|Redirect/)
  assert.equal(requests, 2)
})
