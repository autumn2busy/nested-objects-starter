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

const now = '2026-10-10T12:00:00.000Z'
const origin = 'https://members.example.test'
const pathname = '/api/operations/free-journey'
const secret = 'synthetic-free-journey-shared-secret-32-characters'
const subject = 'webmembersproducer'
const person = 'SyntheticPerson'
const account = 'SyntheticAccount'
const cycle = 'SyntheticCycle'
const member = '31800000-0000-4000-8000-000000001211'
const purpose = 'free_onboarding_and_conversion_email'
const hash = parts => createHash('sha256').update(JSON.stringify(parts)).digest('hex')

function sourceEvent(kind = 'income_scenario_completed') {
  const event = {
    contractVersion: 'free_journey_event_v1',
    kind,
    occurredAt: now,
    outsetaPersonUid: person,
    subscriptionUid: cycle,
  }
  return {
    ...event,
    idempotencyKey: `free-journey:${kind}:${hash([
      event.contractVersion, kind, person, cycle, event.occurredAt,
    ])}`,
  }
}

function environment(overrides = {}) {
  return {
    FREE_JOURNEY_OPERATION_API_ENABLED: 'true',
    FREE_JOURNEY_OPERATION_PREVIEW_ONLY: 'true',
    FREE_JOURNEY_LIVE_READS_ENABLED: 'true',
    FREE_JOURNEY_EXPECTED_527_STATUS: 'active',
    FREE_JOURNEY_OPERATION_SHARED_SECRET: secret,
    FREE_JOURNEY_OPERATION_PRODUCER_SUBJECT: subject,
    FREE_JOURNEY_OPERATION_ALLOWED_ORIGIN: origin,
    FREE_JOURNEY_SOURCE_REVIEW_REF: 'issue318-free-journey-source',
    FREE_JOURNEY_SOURCE_REVIEWED_AT: '2026-10-10T11:00:00.000Z',
    FREE_JOURNEY_SOURCE_REVIEW_EXPIRES_AT: '2026-10-10T13:00:00.000Z',
    FREE_JOURNEY_EXCLUSION_POLICY_JSON: JSON.stringify({
      internalDomains: ['nestedobjects.com'],
      approvedInternalMemberEmails: [],
      coldTagPatterns: ['cold', 'import'],
      wixTagPatterns: ['wix'],
      testPatterns: ['test'],
      coworkerContactIds: [],
      demoContactIds: [],
      hiringFirmContactIds: [],
    }),
    SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_synthetic_server_key_for_test_only',
    OUTSETA_HOSTNAME: 'nested-objects.outseta.com',
    OUTSETA_API_KEY: 'synthetic-outseta-key',
    OUTSETA_API_SECRET: 'synthetic-outseta-secret',
    AC_API_URL: 'https://synthetic.api-us1.com',
    AC_API_KEY: 'synthetic-activecampaign-api-key',
    ...overrides,
  }
}

function signedRequest(value = { sourceEvent: sourceEvent() }, overrides = {}) {
  const bodyText = typeof value === 'string' ? value : JSON.stringify(value)
  const headers = createFreeJourneyOperationHeaders({
    method: overrides.method ?? 'POST',
    pathname: overrides.pathname ?? pathname,
    bodyText,
    producerSubject: overrides.subject ?? subject,
    origin: overrides.origin ?? origin,
    timestamp: overrides.timestamp ?? now,
    nonce: overrides.nonce ?? '11111111-1111-4111-8111-111111111111',
    sharedSecret: overrides.secret ?? secret,
  })
  if (overrides.tamperSignature) headers['x-free-journey-signature'] = '0'.repeat(64)
  return new Request(`${origin}${overrides.pathname ?? pathname}`, {
    method: overrides.method ?? 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: bodyText,
  })
}

function profileRow() {
  return {
    id: member,
    outseta_person_uid: person,
    outseta_account_id: account,
    ac_contact_id: '41',
    user_email: 'member@example.com',
    email: 'member@example.com',
    headline: 'Inspection services', bio: 'Synthetic profile', city: 'Atlanta', state: 'GA',
    experience_level: 'new', primary_services: 'Property Inspections',
    service_areas: ['Property Inspections'], updated_at: '2026-10-10T10:00:00.000Z',
  }
}

function receipt(eventName) {
  const income = eventName === 'income_scenario_completed'
  const parts = [eventName, 'v1', person, cycle, ...(income ? [] : [purpose])]
  return {
    id: income ? '31800000-0000-4000-8000-000000001212' : '31800000-0000-4000-8000-000000001213',
    client_event_id: `${eventName}:v1:${hash(parts)}`,
    event_name: eventName,
    member_uid: person,
    source_page: income ? '/tools/income-calculator' : '/welcome',
    source: income ? 'income_scenarios' : 'member_consent',
    occurred_at: income ? '2026-10-10T10:30:00.000Z' : '2026-10-10T09:30:00.000Z',
    event_data: {
      sourcePage: income ? '/tools/income-calculator' : '/welcome',
      source: income ? 'income_scenarios' : 'member_consent',
      lifecycleCycleId: cycle,
      ...(income ? { completionContract: 'v1' } : { consentContract: 'v1', purpose }),
    },
  }
}

function dependencies(options = {}) {
  const calls = []
  const onboardingTransport = async request => {
    calls.push({ layer: 'supabase', method: request.method, url: request.url })
    const url = new URL(request.url)
    const row = url.pathname.endsWith('/profiles')
      ? profileRow()
      : receipt(url.searchParams.get('event_name').slice(3))
    return { status: 200, body: [row], contentRange: '0-0/1', preferenceApplied: 'count=exact' }
  }
  const sourceTransport = async request => {
    calls.push({ layer: request.provider, method: request.method, url: request.url })
    const url = new URL(request.url)
    if (request.provider === 'outseta') return { status: 200, body: {
      Uid: account, IsDemo: false, AccountStage: 3, AccountStageLabel: 'Active',
      Created: '2026-09-01T12:00:00.000Z',
      CurrentSubscription: { Uid: cycle, StartDate: '2026-09-01T12:00:00.000Z', Plan: { Uid: 'L9nbKV9Z', Name: 'Free' } },
      PersonAccount: [{ IsPrimary: true, Person: { Uid: person, Email: 'member@example.com' } }],
    } }
    if (url.pathname === '/api/3/contacts/41') return { status: 200, body: { contact: {
      id: '41', email: 'member@example.com', bounced_hard: '0', bounced_soft: '0', deleted: '0',
      cdate: '2026-09-01T12:00:00.000Z', udate: now,
    } } }
    if (url.pathname.endsWith('/contactLists')) {
      const rows = options.noDoi
        ? [{ id: '700', contact: '41', list: '12', form: '0', status: '1' }]
        : [{ id: '701', contact: '41', list: '34', form: '90', status: '1' }]
      return { status: 200, body: { contactLists: rows, meta: { total: String(rows.length) } } }
    }
    if (url.pathname.endsWith('/contactTags')) return { status: 200, body: {
      contactTags: [{ id: '801', contact: '41', tag: '802' }],
      tags: [{ id: '802', tag: 'plan-free' }], meta: { total: '1' },
    } }
    throw new Error(`Unexpected source read ${url.pathname}`)
  }
  const activeCampaignFetch = async (url, init = {}) => {
    const path = String(url).split('/api/3/')[1]
    const method = init.method ?? 'GET'
    calls.push({ layer: 'writer-preview', method, url: String(url) })
    assert.equal(method, 'GET')
    const response = body => new Response(JSON.stringify(body), {
      status: 200, headers: { 'content-type': 'application/json' },
    })
    if (path === 'contacts/41') return response({ contact: {
      id: '41', email: 'member@example.com', bounced_hard: '0', bounced_soft: '0', deleted: '0',
    } })
    if (path === 'contacts/41/contactLists') return response({
      contactLists: [{ id: '701', contact: '41', list: '34', form: '90', status: '1' }],
    })
    if (path === 'automations/527') return response({ automation: {
      id: '527', status: options.automationStatus ?? '1',
    } })
    if (path === 'contacts/41/fieldValues') return response({ fieldValues: [] })
    throw new Error(`Unexpected writer preview read ${path}`)
  }
  return {
    value: {
      now: () => now,
      mode: 'fixture',
      onboardingTransport,
      sourceTransport,
      activeCampaignFetch,
    },
    calls,
  }
}

function operationalEnvironment(overrides = {}) {
  return environment({
    FREE_JOURNEY_OPERATION_PREVIEW_ONLY: 'false',
    FREE_JOURNEY_EXPECTED_527_STATUS: 'active',
    SUPABASE_URL: 'https://lzzghrjjsyzlvofpidis.supabase.co',
    AGENT_RUNTIME_ENV: 'production',
    VERCEL_ENV: 'production',
    FREE_JOURNEY_PRODUCTION_PROJECT_REF: 'lzzghrjjsyzlvofpidis',
    FREE_JOURNEY_OPERATIONAL_MODE: 'write',
    FREE_JOURNEY_WRITE_ENABLED: 'true',
    FREE_JOURNEY_ACTIVE_527_ENABLED: 'true',
    FREE_JOURNEY_DURABLE_EXECUTOR_ENABLED: 'true',
    FREE_JOURNEY_WRITE_APPROVAL_REF: 'owner-approved-free-journey-cycle-1',
    FREE_JOURNEY_WRITE_APPROVED_AT: '2026-10-10T11:55:00.000Z',
    FREE_JOURNEY_WRITE_APPROVAL_EXPIRES_AT: '2026-10-10T12:30:00.000Z',
    FREE_JOURNEY_RUNTIME_VERSION: 'test-runtime-v1',
    ...overrides,
  })
}

function operationalDependencies() {
  const base = dependencies()
  const durableCalls = []
  return {
    value: {
      ...base.value,
      durableStore: new InMemoryDurableWorkflowStore(
        FREE_JOURNEY_PRODUCTION_DESTINATION,
        () => new Date(now),
      ),
      durableRunner: async (input, context) => {
        durableCalls.push({ input, context })
        return {
          state: durableCalls.length === 1 ? 'completed' : 'reused',
          runId: '31800000-0000-4000-8000-000000001527',
          status: 'updated', desiredStage: 'conversion_eligible',
          attemptedWrites: 2, confirmedWrites: 2, recoveryRequired: false,
          automaticRetry: false, reasons: [], steps: [],
        }
      },
    },
    calls: base.calls,
    durableCalls,
  }
}

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
