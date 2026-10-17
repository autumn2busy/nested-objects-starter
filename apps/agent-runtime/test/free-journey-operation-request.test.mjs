import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'

import {
  FREE_JOURNEY_PRODUCTION_DESTINATION,
  FreeJourneyOperationAuthenticationError,
  FreeJourneyOperationConfigurationError,
  FreeJourneyOperationValidationError,
  InMemoryDurableWorkflowStore,
  createFreeJourneyOperationHeaders,
  evaluateSignedFreeJourneyOperationRequest,
  loadFreeJourneyOperationRuntimeConfiguration,
  verifyFreeJourneyOperationRequest,
} from '../dist/index.js'
import freeJourneyEndpoint from '../dist-api/api/operations/free-journey.js'

import { now, origin, pathname, secret, subject, person, account, cycle, member, purpose, hash, sourceEvent, environment, signedRequest, profileRow, receipt, dependencies, operationalEnvironment, operationalDependencies } from './free-journey-test-fixtures.mjs'

test('signatures bind method, path, body, service subject, origin, timestamp and nonce', () => {
  const request = signedRequest()
  const bodyText = JSON.stringify({ sourceEvent: sourceEvent() })
  const verified = verifyFreeJourneyOperationRequest(request, bodyText, loadFreeJourneyOperationRuntimeConfiguration(environment()), new Date(now))
  assert.match(verified.nonceDigest, /^[a-f0-9]{64}$/)
  assert.throws(() => verifyFreeJourneyOperationRequest(
    signedRequest(undefined, { tamperSignature: true }), bodyText,
    loadFreeJourneyOperationRuntimeConfiguration(environment()), new Date(now),
  ), FreeJourneyOperationAuthenticationError)
  assert.throws(() => verifyFreeJourneyOperationRequest(
    signedRequest(undefined, { timestamp: '2026-10-10T11:54:59.000Z' }), bodyText,
    loadFreeJourneyOperationRuntimeConfiguration(environment()), new Date(now),
  ), FreeJourneyOperationAuthenticationError)
})

test('runtime remains default-disabled and requires explicit Preview or exact Production gates', () => {
  for (const changes of [
    { FREE_JOURNEY_OPERATION_API_ENABLED: undefined },
    { FREE_JOURNEY_OPERATION_PREVIEW_ONLY: 'false' },
    { FREE_JOURNEY_LIVE_READS_ENABLED: 'false' },
    { FREE_JOURNEY_EXCLUSION_POLICY_JSON: undefined },
    { FREE_JOURNEY_EXCLUSION_POLICY_JSON: '{}' },
  ]) assert.throws(() => loadFreeJourneyOperationRuntimeConfiguration(environment(changes)), FreeJourneyOperationConfigurationError)

  for (const changes of [
    { FREE_JOURNEY_OPERATIONAL_MODE: undefined },
    { FREE_JOURNEY_WRITE_ENABLED: undefined },
    { FREE_JOURNEY_ACTIVE_527_ENABLED: undefined },
    { FREE_JOURNEY_DURABLE_EXECUTOR_ENABLED: undefined },
    { FREE_JOURNEY_EXPECTED_527_STATUS: 'inactive' },
    { FREE_JOURNEY_WRITE_APPROVAL_REF: undefined },
  ]) assert.throws(() => loadFreeJourneyOperationRuntimeConfiguration(
    operationalEnvironment(changes),
  ), FreeJourneyOperationConfigurationError)
})

test('default transport uses documented Outseta authentication and reloads changed credentials', async t => {
  const authorizationHeaders = []
  let supabaseReads = 0
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const request = new Request(input, init)
    const url = new URL(request.url)
    assert.equal(request.method, 'GET')
    assert.equal(request.redirect, 'error')
    assert.equal(request.cache, 'no-store')
    if (url.hostname === 'abcdefghijklmnopqrst.supabase.co') {
      supabaseReads++
      assert.equal(request.headers.get('authorization'), `Bearer ${environment().SUPABASE_SERVICE_ROLE_KEY}`)
      const row = url.pathname.endsWith('/profiles')
        ? profileRow()
        : receipt(url.searchParams.get('event_name').slice(3))
      return new Response(JSON.stringify([row]), { status: 200, headers: {
        'content-type': 'application/json', 'content-range': '0-0/1', 'preference-applied': 'count=exact',
      } })
    }
    assert.equal(url.origin, 'https://nested-objects.outseta.com')
    assert.equal(url.pathname, `/api/v1/crm/accounts/${account}`)
    assert.deepEqual([...url.searchParams.keys()], ['fields'])
    assert(url.searchParams.get('fields').includes('CurrentSubscription.Plan.Uid'))
    assert(url.searchParams.get('fields').includes('PersonAccount.Person.Uid'))
    assert.equal(request.headers.get('accept'), 'application/json')
    assert.equal(request.headers.get('api-token'), null)
    assert.equal(request.headers.get('apikey'), null)
    authorizationHeaders.push(request.headers.get('authorization'))
    return new Response('Ignored non-JSON authentication error', { status: 401 })
  })

  for (const [apiKey, apiSecret] of [
    ['synthetic-FIRST-key', 'synthetic-FIRST-secret'],
    ['synthetic-SECOND-key', 'synthetic-SECOND-secret'],
  ]) {
    const result = await evaluateSignedFreeJourneyOperationRequest(signedRequest(), environment({
      OUTSETA_HOSTNAME: '  NESTED-OBJECTS.OUTSETA.COM  ',
      OUTSETA_API_KEY: `  ${apiKey}  `,
      OUTSETA_API_SECRET: `  ${apiSecret}  `,
    }), { now: () => now, mode: 'approved_live' })
    assert.equal(result.status, 'withheld')
    assert.deepEqual(result.reasons, ['outseta_http_failure_401'])
    assert.equal(result.desiredStage, null)
    assert.equal(result.attemptedWrites, 0)
    assert.equal(result.confirmedWrites, 0)
    assert.equal(result.automaticRetry, false)
    assert.deepEqual(result.steps, [])
    assert(!/synthetic-FIRST|synthetic-SECOND|Ignored non-JSON|SyntheticAccount/.test(JSON.stringify(result)))
  }
  assert.equal(supabaseReads, 6)
  assert.deepEqual(authorizationHeaders, [
    'Outseta synthetic-FIRST-key:synthetic-FIRST-secret',
    'Outseta synthetic-SECOND-key:synthetic-SECOND-secret',
  ])
})

test('Outseta tenant configuration rejects URL and authority injection before fetching', async t => {
  let reads = 0
  t.mock.method(globalThis, 'fetch', () => { reads++; throw new Error('Unexpected fetch') })
  for (const hostname of [
    'https://nested-objects.outseta.com',
    'nested-objects.outseta.com/api/v1',
    'user@nested-objects.outseta.com',
    'nested-objects.outseta.com:443',
    'nested-objects.outseta.com?tenant=other',
    'nested-objects.outseta.com.example.test',
  ]) {
    await assert.rejects(evaluateSignedFreeJourneyOperationRequest(
      signedRequest(), environment({ OUTSETA_HOSTNAME: hostname }), { now: () => now, mode: 'approved_live' },
    ), FreeJourneyOperationConfigurationError)
  }
  assert.equal(reads, 0)
})

test('signed Preview can verify automation 527 while it remains inactive', async () => {
  const deps = dependencies({ automationStatus: '2' })
  const result = await evaluateSignedFreeJourneyOperationRequest(
    signedRequest(),
    environment({ FREE_JOURNEY_EXPECTED_527_STATUS: 'inactive' }),
    deps.value,
  )
  assert.equal(result.status, 'ready', JSON.stringify(result))
  assert.equal(result.previewOnly, true)
  assert.equal(result.attemptedWrites, 0)
  assert(deps.calls.every(call => call.method === 'GET'))
})

test('operational endpoint binds exact source identity and approval to the durable executor', async () => {
  const deps = operationalDependencies()
  const first = await evaluateSignedFreeJourneyOperationRequest(
    signedRequest(), operationalEnvironment(), deps.value,
  )
  const repeated = await evaluateSignedFreeJourneyOperationRequest(
    signedRequest(), operationalEnvironment(), deps.value,
  )
  assert.equal(first.state, 'completed', JSON.stringify(first))
  assert.equal(first.previewOnly, false)
  assert.equal(first.durableReplayReceipt, true)
  assert.equal(first.confirmedWrites, 2)
  assert.equal(repeated.state, 'reused')
  assert.equal(repeated.confirmedWrites, 2)
  assert.equal(deps.durableCalls.length, 2)
  assert.equal(deps.durableCalls[0].input.writeApproval.outsetaPersonUid, person)
  assert.equal(deps.durableCalls[0].input.writeApproval.subscriptionUid, cycle)
  assert.equal(deps.durableCalls[0].input.writeApproval.activeCampaignContactId, '41')
  assert.equal(
    deps.durableCalls[0].input.writeApproval.sourceEventIdempotencyKey,
    sourceEvent().idempotencyKey,
  )
  assert.deepEqual(deps.durableCalls[0].input.writeApproval.allowedFieldIdsInOrder, ['194', '193'])
  assert.equal(
    deps.durableCalls[0].context.binding.destinationFingerprint,
    FREE_JOURNEY_PRODUCTION_DESTINATION.destinationFingerprint,
  )
  assert.equal(
    deps.durableCalls[1].input.writeApproval.sourceEventIdempotencyKey,
    deps.durableCalls[0].input.writeApproval.sourceEventIdempotencyKey,
  )
})

test('signed endpoint accepts only the source event and rebuilds all external facts server-side', async () => {
  const deps = dependencies()
  const result = await evaluateSignedFreeJourneyOperationRequest(signedRequest(), environment(), deps.value)
  assert.equal(result.status, 'ready')
  assert.equal(result.sourceStatus, 'ready_for_writer_review')
  assert.equal(result.desiredStage, 'conversion_eligible')
  assert.equal(result.previewOnly, true)
  assert.equal(result.durableReplayReceipt, false)
  assert.equal(result.attemptedWrites, 0)
  assert.equal(result.confirmedWrites, 0)
  assert(deps.calls.every(call => call.method === 'GET'))
  assert(!/SyntheticPerson|SyntheticAccount|member@example/.test(JSON.stringify(result)))

  const injected = signedRequest({ sourceEvent: sourceEvent(), external: { memberships: [{ authoritative: true }] } })
  const rejectedDeps = dependencies()
  await assert.rejects(
    evaluateSignedFreeJourneyOperationRequest(injected, environment(), rejectedDeps.value),
    FreeJourneyOperationValidationError,
  )
  assert.equal(rejectedDeps.calls.length, 0)
})

test('repeated signed preview is deterministic and performs no provider mutation', async () => {
  const firstDeps = dependencies()
  const secondDeps = dependencies()
  const first = await evaluateSignedFreeJourneyOperationRequest(signedRequest(), environment(), firstDeps.value)
  const second = await evaluateSignedFreeJourneyOperationRequest(signedRequest(), environment(), secondDeps.value)
  assert.deepEqual(second, first)
  assert.equal(first.attemptedWrites, 0)
  assert.equal(first.automaticRetry, false)
  assert([...firstDeps.calls, ...secondDeps.calls].every(call => call.method === 'GET'))
})

test('later confirmed DOI re-evaluates the same event from withheld to ready without sending or enrolling', async () => {
  const beforeDeps = dependencies({ noDoi: true })
  const afterDeps = dependencies()
  const before = await evaluateSignedFreeJourneyOperationRequest(signedRequest(), environment(), beforeDeps.value)
  const after = await evaluateSignedFreeJourneyOperationRequest(signedRequest(), environment(), afterDeps.value)
  assert.equal(before.status, 'withheld')
  assert.deepEqual(before.reasons, ['doi_relationship_missing_or_ambiguous'])
  assert.equal(after.status, 'ready')
  assert.equal(before.attemptedWrites + after.attemptedWrites, 0)
  assert([...beforeDeps.calls, ...afterDeps.calls].every(call => call.method === 'GET'))
})

for (const kind of ['consent_recorded', 'consent_check_requested']) {
  test(`${kind} requires independently confirmed DOI and preserves zero-write Preview`, async () => {
    const unconfirmed = dependencies({ noDoi: true })
    const confirmed = dependencies()
    const request = () => signedRequest({ sourceEvent: sourceEvent(kind) })
    const before = await evaluateSignedFreeJourneyOperationRequest(request(), environment(), unconfirmed.value)
    const after = await evaluateSignedFreeJourneyOperationRequest(request(), environment(), confirmed.value)
    assert.equal(before.status, 'withheld')
    assert.equal(after.status, 'ready')
    assert.equal(after.attemptedWrites, 0)
    assert.equal(after.confirmedWrites, 0)
    assert.equal([...unconfirmed.calls, ...confirmed.calls].every(call => call.method === 'GET'), true)
    assert.notEqual(sourceEvent(kind).idempotencyKey, sourceEvent('signup').idempotencyKey)
  })
}

test('HTTP surface rejects unsupported methods and bad signatures with sanitized responses', async () => {
  const get = await freeJourneyEndpoint.fetch(new Request(`${origin}${pathname}`, { method: 'GET' }))
  assert.equal(get.status, 405)
  assert.equal(get.headers.get('allow'), 'POST')

  const current = new Date()
  const runtimeEnvironment = environment({
    FREE_JOURNEY_SOURCE_REVIEWED_AT: new Date(current.getTime() - 60_000).toISOString(),
    FREE_JOURNEY_SOURCE_REVIEW_EXPIRES_AT: new Date(current.getTime() + 60_000).toISOString(),
  })
  const keys = Object.keys(runtimeEnvironment)
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]))
  try {
    Object.assign(process.env, runtimeEnvironment)
    const response = await freeJourneyEndpoint.fetch(signedRequest(undefined, {
      timestamp: current.toISOString(), tamperSignature: true,
    }))
    assert.equal(response.status, 401)
    assert.deepEqual(await response.json(), {
      ok: false,
      error: { code: 'FREE_JOURNEY_AUTHENTICATION_FAILED', message: 'Unauthorized.' },
    })
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    }
  }
})
