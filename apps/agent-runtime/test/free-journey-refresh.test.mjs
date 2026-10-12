import assert from 'node:assert/strict'
import test from 'node:test'
import refreshEndpoint from '../dist-api/api/operations/free-journey-refresh.js'
import {
  createEligibilityRecheckEvent, evaluateScheduledFreeJourneyRefresh, evaluateFreeJourneySourceEvent,
  evaluateSignedFreeJourneyOperationRequest, FreeJourneyOperationValidationError, runDurableFreeJourneyOperation,
} from '../dist/index.js'
import { now, person, cycle, receipt, dependencies, operationalEnvironment,
  operationalDependencies, sourceEvent, signedRequest } from './free-journey-test-fixtures.mjs'

const cronSecret = 'synthetic-scheduled-refresh-secret-at-least-32'
const candidate = () => receipt('lifecycle_email_consent_requested')
function env(overrides = {}) {
  return operationalEnvironment({
    FREE_JOURNEY_OPERATION_API_ENABLED: 'false', FREE_JOURNEY_REFRESH_ENABLED: 'true',
    FREE_JOURNEY_OPERATION_PREVIEW_ONLY: 'true', FREE_JOURNEY_EXPECTED_527_STATUS: 'paused',
    CRON_SECRET: cronSecret,
    FREE_JOURNEY_REFRESH_SCOPE_JSON: JSON.stringify({ kind: 'approved_members', members: [
      { outsetaPersonUid: person, subscriptionUid: cycle },
    ] }),
    FREE_JOURNEY_SOURCE_REVIEWED_AT: '2026-10-01T00:00:00.000Z',
    FREE_JOURNEY_SOURCE_REVIEW_EXPIRES_AT: '2026-10-31T00:00:00.000Z',
    FREE_JOURNEY_WRITE_APPROVED_AT: '2026-10-01T00:00:00.000Z',
    FREE_JOURNEY_WRITE_APPROVAL_EXPIRES_AT: '2026-10-31T00:00:00.000Z',
    ...overrides,
  })
}
function request(auth = 'Bearer ' + cronSecret) {
  return new Request('https://runtime.example.test/api/operations/free-journey-refresh',
    { headers: { authorization: auth } })
}
function discovery(rows = [candidate()], options = {}) {
  const calls = []
  const fetch = async (input, init) => {
    const u = new URL(String(input))
    calls.push({ url: u, method: init.method })
    assert.equal(init.method, 'GET')
    assert.equal(init.redirect, 'error')
    let page, total, offset = Number(u.searchParams.get('offset') ?? 0)
    if (u.pathname.endsWith('/agent_runs')) {
      assert.equal(u.searchParams.get('workflow_name'), 'eq.free_journey_operation')
      assert.match(u.searchParams.get('input->>contactDigest'), /^eq\.[a-f0-9]{64}$/)
      page = options.recovery ? [{ id: '31800000-0000-4000-8000-000000000501', status: options.recoveryStatus ?? 'running' }] : []
      total = page.length
    } else {
      assert.equal(u.pathname, '/rest/v1/conversion_events')
      assert.equal(u.searchParams.get('event_name'), 'eq.lifecycle_email_consent_requested')
      assert.equal(u.searchParams.get('event_data->>purpose'), 'eq.free_onboarding_and_conversion_email')
      assert.equal(u.searchParams.get('order'), 'id.asc')
      page = rows.slice(offset, offset + Number(u.searchParams.get('limit')))
      total = options.total ?? rows.length
      if (options.changed && calls.length > 1) total++
    }
    return new Response(JSON.stringify(page), { status: options.status ?? 200, headers: {
      'preference-applied': options.noCount ? '' : 'count=exact',
      'content-range': options.noRange ? '' : (page.length ? offset + '-' + (offset + page.length - 1) + '/' + total : '*/' + total),
    } })
  }
  return { fetch, calls }
}
function setup(options = {}) {
  const base = dependencies({ automationStatus: options.status ?? '3', noDoi: options.noDoi })
  const d = discovery(options.rows, options)
  return { base, d, value: { ...base.value, discoveryFetch: d.fetch, clock: () => Date.parse(now) } }
}

test('scheduled endpoint is default-disabled, Production-only and rejects absent/wrong authentication before reads', async () => {
  for (const overrides of [
    { FREE_JOURNEY_REFRESH_ENABLED: undefined }, { VERCEL_ENV: 'preview' },
    { AGENT_RUNTIME_ENV: 'staging' }, { CRON_SECRET: undefined }, { CRON_SECRET: '' },
  ]) {
    const f = setup()
    await assert.rejects(evaluateScheduledFreeJourneyRefresh(request(), env(overrides), f.value))
    assert.equal(f.d.calls.length, 0)
  }
  const f = setup()
  await assert.rejects(evaluateScheduledFreeJourneyRefresh(request('Bearer wrong'), env(), f.value), /REFRESH_UNAUTHORIZED/)
  assert.equal(f.d.calls.length, 0)
})

test('scoped paused preview rereads exact source evidence with zero writes and no member producer enablement', async () => {
  const f = setup()
  const result = await evaluateScheduledFreeJourneyRefresh(request(), env(), f.value)
  assert.equal(result.ok, true)
  assert.equal(result.previewOnly, true)
  assert.deepEqual(result.outcomes, { ready: 1 })
  assert.deepEqual(result.stages, { conversion_eligible: 1 })
  assert.equal(result.attemptedWrites, 0)
  assert.equal(result.confirmedWrites, 0)
  assert.ok(f.base.calls.length > 5)
  assert.ok(f.base.calls.every(c => c.method === 'GET'))
  assert.ok(f.d.calls[0].url.searchParams.get('or').includes(person))
  assert.ok(!JSON.stringify(result).includes(person))
  assert.ok(!JSON.stringify(result).includes('member@example.com'))
  assert.equal(result.sourceReviewExpiresAt, env().FREE_JOURNEY_SOURCE_REVIEW_EXPIRES_AT)
})

test('scheduled events are truthful, per-hour/cycle deterministic and excluded from signed member input', async () => {
  const first = createEligibilityRecheckEvent(person, cycle, now)
  assert.equal(first.kind, 'eligibility_recheck')
  assert.deepEqual(first, createEligibilityRecheckEvent(person, cycle, '2026-10-10T12:59:59.000Z'))
  assert.notEqual(first.idempotencyKey, createEligibilityRecheckEvent(person, cycle, '2026-10-10T13:00:00.000Z').idempotencyKey)
  assert.notEqual(first.idempotencyKey, createEligibilityRecheckEvent(person, 'AnotherCycle', now).idempotencyKey)
  const accepted = await evaluateSignedFreeJourneyOperationRequest(signedRequest({ sourceEvent: sourceEvent('consent_check_requested') }),
    env({ FREE_JOURNEY_OPERATION_API_ENABLED: 'true' }), setup().value)
  assert.equal(accepted.status, 'ready')
  await assert.rejects(evaluateSignedFreeJourneyOperationRequest(signedRequest({ sourceEvent: sourceEvent('eligibility_recheck') }),
    env({ FREE_JOURNEY_OPERATION_API_ENABLED: 'true' }), setup().value), FreeJourneyOperationValidationError)
})

test('missing/ambiguous scope, expired source review and paused writes fail closed', async () => {
  for (const overrides of [
    { FREE_JOURNEY_REFRESH_SCOPE_JSON: '{}' },
    { FREE_JOURNEY_REFRESH_SCOPE_JSON: JSON.stringify({ kind: 'approved_members', members: [] }) },
    { FREE_JOURNEY_REFRESH_SCOPE_JSON: JSON.stringify({ kind: 'approved_members', members: [
      { outsetaPersonUid: person, subscriptionUid: cycle }, { outsetaPersonUid: person, subscriptionUid: cycle },
    ] }) },
    { FREE_JOURNEY_REFRESH_SCOPE_JSON: JSON.stringify({ kind: 'consented_cohort', approvalRef: 'wrong-review' }) },
    { FREE_JOURNEY_SOURCE_REVIEW_EXPIRES_AT: '2026-10-10T11:00:00.000Z' },
    { FREE_JOURNEY_OPERATION_PREVIEW_ONLY: 'false', FREE_JOURNEY_EXPECTED_527_STATUS: 'paused' },
  ]) {
    const f = setup()
    await assert.rejects(evaluateScheduledFreeJourneyRefresh(request(), env(overrides), f.value))
    assert.equal(f.d.calls.length, 0)
  }
})

test('HTTP failure, unconfirmed pagination, cohort overflow/change and invalid candidate cannot become absence', async () => {
  for (const options of [
    { status: 500 }, { noCount: true }, { noRange: true }, { total: 501 }, { changed: true },
    { rows: [{ ...candidate(), member_uid: 'OutOfScope' }] },
    { rows: [{ ...candidate(), event_data: { ...candidate().event_data, purpose: 'other-purpose' } }] },
    { rows: [candidate(), candidate()] },
  ]) {
    const f = setup(options)
    await assert.rejects(evaluateScheduledFreeJourneyRefresh(request(), env(), f.value))
    assert.equal(f.base.calls.length, 0)
  }
})

test('rotating bounded pages cover a 500-record cohort across 21 hourly windows without claiming first-page completion', async () => {
  const rows = Array.from({ length: 500 }, (_, i) => ({ ...candidate(),
    id: '31800000-0000-4000-8000-' + String(i).padStart(12, '0'), member_uid: 'SyntheticPerson' + i }))
  const seen = new Set()
  for (let hour = 0; hour < 21; hour++) {
    const at = new Date(Date.parse(now) + hour * 3_600_000).toISOString()
    const d = discovery(rows)
    const result = await evaluateScheduledFreeJourneyRefresh(request(), env({
      FREE_JOURNEY_REFRESH_SCOPE_JSON: JSON.stringify({ kind: 'consented_cohort', approvalRef: 'issue318-free-journey-source' }),
    }), { now: () => at, clock: () => Date.parse(at), discoveryFetch: d.fetch,
      evaluate: async event => { seen.add(event.outsetaPersonUid); return {
        status: 'ready', desiredStage: 'profile_needed', attemptedWrites: 0, confirmedWrites: 0,
        recoveryRequired: false, automaticRetry: false, reasons: [], steps: [],
      } } })
    assert.ok(result.coverage.selected <= 24)
    assert.equal(result.coverage.cohortTotal, 500)
    assert.equal(result.coverage.pageComplete, true)
    assert.equal(result.coverage.fullCohortThisRun, false)
  }
  assert.equal(seen.size, 500)
})

test('unresolved earlier writes block scheduled mutation across successive windows and unknown recovery reads also withhold', async () => {
  for (const options of [{ recoveryStatus: 'running' }, { recoveryStatus: 'failed' }, { noCount: true }, { throwRecovery: true }]) {
    const base = operationalDependencies()
    const d = discovery([candidate()], { recovery: true, recoveryStatus: options.recoveryStatus })
    const read = async (u, init) => {
      if (options.throwRecovery && new URL(String(u)).pathname.endsWith('/agent_runs')) throw new Error('unknown reader failure')
      const response = await d.fetch(u, init)
      if (options.noCount && new URL(String(u)).pathname.endsWith('/agent_runs')) response.headers.delete('preference-applied')
      return response
    }
    for (const hour of [12, 13]) {
      const at = '2026-10-10T' + hour + ':00:00.000Z'
      const result = await evaluateScheduledFreeJourneyRefresh(request(), env({
        FREE_JOURNEY_OPERATION_PREVIEW_ONLY: 'false', FREE_JOURNEY_EXPECTED_527_STATUS: 'active',
      }), { ...base.value, now: () => at, clock: () => Date.parse(at), discoveryFetch: read })
      assert.equal(result.ok, false)
      assert.equal(result.recoveryRequired, true)
      assert.equal(result.attemptedWrites, 0)
      assert.equal(base.durableCalls.length, 0)
    }
  }
})

function mutableWriter(options = {}) {
  const fields = [], writes = []
  const base = dependencies({ automationStatus: '1' }).value.activeCampaignFetch
  const fetch = async (url, init = {}) => {
    const path = String(url).split('/api/3/')[1]
    const method = init.method ?? 'GET'
    const response = b => new Response(JSON.stringify(b), { status: 200 })
    if (path === 'contacts/41/fieldValues' && method === 'GET') return response({ fieldValues: structuredClone(fields) })
    if (method === 'POST' && path === 'fieldValues') {
      const field = { ...JSON.parse(init.body).fieldValue, id: String(300 + fields.length) }
      fields.push(field); writes.push({ field: String(field.field), value: field.value }); options.afterWrite?.()
      return response({ fieldValue: structuredClone(field) })
    }
    if (method === 'GET' && path.startsWith('fieldValues/')) {
      return response({ fieldValue: structuredClone(fields.find(f => f.id === path.split('/')[1])) })
    }
    if (method === 'PUT' && path.startsWith('fieldValues/')) {
      const field = fields.find(f => f.id === path.split('/')[1])
      Object.assign(field, JSON.parse(init.body).fieldValue)
      writes.push({ field: String(field.field), value: field.value })
      return response({ fieldValue: structuredClone(field) })
    }
    return base(url, init)
  }
  return { fetch, fields, writes }
}

test('durable writer with approved synthetic sources refreshes expiry only when stage is unchanged; duplicate windows never repeat writes', async () => {
  const base = operationalDependencies()
  base.value.durableRunner = (input, context) => runDurableFreeJourneyOperation({
    ...input, storedSources: { ...input.storedSources, mode: 'approved_live' },
  }, context) // Approved synthetic source channel; every provider request remains mocked.
  const writer = mutableWriter()
  const d = discovery()
  const configuration = env({ FREE_JOURNEY_OPERATION_PREVIEW_ONLY: 'false', FREE_JOURNEY_EXPECTED_527_STATUS: 'active' })
  const evaluations = []
  const run = at => evaluateScheduledFreeJourneyRefresh(request(), configuration, { ...base.value,
    now: () => at, clock: () => Date.parse(at), discoveryFetch: d.fetch, activeCampaignFetch: writer.fetch,
    evaluate: async (...args) => { const result = await evaluateFreeJourneySourceEvent(...args); evaluations.push(result); return result } })
  const first = await run(now)
  assert.equal(first.confirmedWrites, 2, JSON.stringify(evaluations))
  assert.deepEqual(writer.writes.map(w => w.field), ['194', '193'])
  const duplicate = await run(now)
  assert.equal(duplicate.attemptedWrites, 0)
  assert.deepEqual(duplicate.outcomes, { reused: 1 })
  const next = await run('2026-10-11T12:00:00.000Z')
  assert.equal(next.confirmedWrites, 1)
  assert.deepEqual(writer.writes.map(w => w.field), ['194', '193', '194'])
  assert.equal(writer.fields.find(f => f.field === '194').value, '2026-10-13')
})

test('idle incomplete onboarding stays fresh on days3/10/21; genuine completion waits until day30 and trial remains nonpromotional', async () => {
  for (const [day, completed, trial, expected] of [
    [3, false, false, 'profile_needed'], [10, false, false, 'profile_needed'], [21, false, false, 'profile_needed'],
    [21, true, false, 'onboarding_complete'], [30, true, false, 'conversion_eligible'],
    [30, false, false, 'profile_needed'], [30, true, true, 'onboarding_complete'],
  ]) {
    const at = new Date(Date.parse(now) + day * 86_400_000).toISOString()
    const f = setup()
    const source = f.value.sourceTransport, onboarding = f.value.onboardingTransport
    f.value.sourceTransport = async r => {
      const result = await source(r)
      if (r.provider === 'outseta') {
        result.body.Created = now
        result.body.CurrentSubscription.StartDate = now
        if (trial) { result.body.AccountStage = 2; result.body.AccountStageLabel = 'Trialing' }
      }
      return result
    }
    f.value.onboardingTransport = async r => {
      const result = await onboarding(r)
      if (new URL(r.url).pathname.endsWith('/profiles')) {
        result.body[0].updated_at = now
        if (!completed) result.body[0].headline = ''
      }
      if (!new URL(r.url).pathname.endsWith('/profiles')) result.body[0].occurred_at = '2026-10-10T12:00:00.000Z'
      return result
    }
    let evaluated
    const result = await evaluateScheduledFreeJourneyRefresh(request(), env({
      FREE_JOURNEY_SOURCE_REVIEWED_AT: '2026-10-10T00:00:00.000Z',
      FREE_JOURNEY_SOURCE_REVIEW_EXPIRES_AT: '2026-11-15T00:00:00.000Z',
    }), { ...f.value, now: () => at, clock: () => Date.parse(at),
      evaluate: async (...args) => { evaluated = await evaluateFreeJourneySourceEvent(...args); return evaluated } })
    assert.deepEqual(result.stages, { [expected]: 1 }, 'day=' + day + ', completed=' + completed + ', trial=' + trial + ' result=' + JSON.stringify(evaluated))
    assert.equal(result.attemptedWrites, 0)
  }
})

test('withdrawn consent and a changed authoritative cycle withhold refresh without writes', async () => {
  for (const changedCycle of [false, true]) {
    const f = setup({ noDoi: !changedCycle })
    const source = f.value.sourceTransport
    if (changedCycle) f.value.sourceTransport = async r => {
      const result = await source(r)
      if (r.provider === 'outseta') result.body.CurrentSubscription.Uid = 'DifferentCurrentCycle'
      return result
    }
    const result = await evaluateScheduledFreeJourneyRefresh(request(), env(), f.value)
    assert.equal(result.attemptedWrites, 0)
    assert.deepEqual(result.outcomes, { withheld: 1 })
  }
})

test('budget exhaustion reports unprocessed candidates and unknown evaluation never masquerades as zero writes', async () => {
  const rows = [candidate(), { ...candidate(), id: '31800000-0000-4000-8000-000000001299' }]
  const d = discovery(rows)
  let clock = Date.parse(now)
  const result = await evaluateScheduledFreeJourneyRefresh(request(), env(), {
    now: () => now, clock: () => clock, discoveryFetch: d.fetch,
    evaluate: async () => { clock += 250_000; return {
      status: 'ready', desiredStage: 'profile_needed', attemptedWrites: 0, confirmedWrites: 0,
      recoveryRequired: false, automaticRetry: false, reasons: [], steps: [],
    } },
  })
  assert.equal(result.ok, false)
  assert.equal(result.coverage.processed, 1)
  assert.equal(result.coverage.pageComplete, false)
  const unknown = await evaluateScheduledFreeJourneyRefresh(request(), env(), {
    now: () => now, clock: () => Date.parse(now), discoveryFetch: discovery().fetch,
    evaluate: async () => { throw new Error('private provider body must not leave endpoint') },
  })
  assert.equal(unknown.recoveryRequired, true)
  assert.equal(unknown.attemptedWrites, null)
  assert.equal(unknown.confirmedWrites, null)
  assert.ok(!JSON.stringify(unknown).includes('private provider'))
})


test('paid, failed-payment, unknown lifecycle and bounced contacts do not become Free refresh candidates', async () => {
  for (const variant of ['paid', 'past_due', 'unknown', 'bounced']) {
    const f = setup()
    const source = f.value.sourceTransport
    f.value.sourceTransport = async r => {
      const result = await source(r)
      if (r.provider === 'outseta') {
        if (variant === 'paid') result.body.CurrentSubscription.Plan = { Uid: 'rQVqlLm6', Name: 'Pro' }
        if (variant === 'past_due') { result.body.AccountStage = 7; result.body.AccountStageLabel = 'Past Due' }
        if (variant === 'unknown') { result.body.AccountStage = 99; result.body.AccountStageLabel = 'Unknown' }
      } else if (variant === 'bounced' && new URL(r.url).pathname === '/api/3/contacts/41') {
        result.body.contact.bounced_hard = '1'
      }
      return result
    }
    const result = await evaluateScheduledFreeJourneyRefresh(request(), env(), f.value)
    assert.deepEqual(result.outcomes, { withheld: 1 }, variant)
    assert.equal(result.attemptedWrites, 0)
    assert.ok(!result.stages.profile_needed, variant)
  }
})

test('a cycle beginning after the rounded review window withholds until the next truthful window', async () => {
  for (const [at, expected] of [['2026-10-10T12:45:00.000Z', null], ['2026-10-10T13:00:00.000Z', 'onboarding_complete']]) {
    const f = setup()
    const source = f.value.sourceTransport, onboarding = f.value.onboardingTransport
    f.value.sourceTransport = async r => {
      const result = await source(r)
      if (r.provider === 'outseta') {
        result.body.Created = '2026-10-10T12:15:00.000Z'
        result.body.CurrentSubscription.StartDate = '2026-10-10T12:15:00.000Z'
      }
      return result
    }
    f.value.onboardingTransport = async r => {
      const result = await onboarding(r)
      if (new URL(r.url).pathname.endsWith('/profiles')) result.body[0].updated_at = '2026-10-10T12:30:00.000Z'
      else result.body[0].occurred_at = '2026-10-10T12:35:00.000Z'
      return result
    }
    const result = await evaluateScheduledFreeJourneyRefresh(request(), env(), {
      ...f.value, now: () => at, clock: () => Date.parse(at),
    })
    assert.deepEqual(result.stages, expected ? { [expected]: 1 } : {})
    assert.equal(result.attemptedWrites, 0)
  }
})


test('deadline after an unconfirmed expiry write stops stage and later windows require reconciliation', async () => {
  const base = operationalDependencies()
  base.value.durableRunner = (input, context) => runDurableFreeJourneyOperation({
    ...input, storedSources: { ...input.storedSources, mode: 'approved_live' },
  }, context)
  let clock = Date.parse(now)
  const writer = mutableWriter({ afterWrite: () => { clock += 250_000 } })
  const d = discovery()
  const configuration = env({ FREE_JOURNEY_OPERATION_PREVIEW_ONLY: 'false', FREE_JOURNEY_EXPECTED_527_STATUS: 'active' })
  const failed = await evaluateScheduledFreeJourneyRefresh(request(), configuration, {
    ...base.value, now: () => now, clock: () => clock, discoveryFetch: d.fetch, activeCampaignFetch: writer.fetch,
  })
  assert.equal(failed.recoveryRequired, true)
  assert.equal(failed.attemptedWrites, 1)
  assert.equal(failed.confirmedWrites, 0)
  assert.deepEqual(writer.writes.map(w => w.field), ['194'])
  clock = Date.parse(now) + 3_600_000
  const held = await evaluateScheduledFreeJourneyRefresh(request(), configuration, {
    ...base.value, now: () => new Date(clock).toISOString(), clock: () => clock,
    discoveryFetch: discovery([candidate()], { recovery: true, recoveryStatus: 'running' }).fetch,
    activeCampaignFetch: writer.fetch,
  })
  assert.equal(held.recoveryRequired, true)
  assert.equal(held.attemptedWrites, 0)
  assert.deepEqual(writer.writes.map(w => w.field), ['194'])
})


test('a provider failure remains partial health and cannot report a healthy withheld cohort', async () => {
  const f = setup()
  f.value.sourceTransport = async () => ({ status: 500, body: { private: 'never retained' } })
  const result = await evaluateScheduledFreeJourneyRefresh(request(), env(), f.value)
  assert.equal(result.ok, false)
  assert.equal(result.sourceHealth, 'partial')
  assert.deepEqual(result.outcomes, { withheld: 1 })
  assert.equal(result.reasonCounts.outseta_http_failure_500, 1)
  assert.equal(result.attemptedWrites, 0)
  assert.ok(!JSON.stringify(result).includes('never retained'))
})


test('HTTP endpoint rejects writes and remains disabled without leaking provider context', async () => {
  const method = await refreshEndpoint.fetch(new Request('https://runtime.example.test/api/operations/free-journey-refresh', { method: 'POST' }))
  assert.equal(method.status, 405)
  assert.equal(method.headers.get('allow'), 'GET')
  const previous = process.env.FREE_JOURNEY_REFRESH_ENABLED
  delete process.env.FREE_JOURNEY_REFRESH_ENABLED
  try {
    const disabled = await refreshEndpoint.fetch(request())
    assert.equal(disabled.status, 503)
    assert.equal((await disabled.json()).error.code, 'REFRESH_DISABLED')
    assert.match(disabled.headers.get('cache-control'), /no-store/)
  } finally {
    if (previous === undefined) delete process.env.FREE_JOURNEY_REFRESH_ENABLED
    else process.env.FREE_JOURNEY_REFRESH_ENABLED = previous
  }
})


test('unavailable, exhausted or inconsistent relationship pagination reports partial coverage', async () => {
  for (const code of ['activecampaign_relationship_coverage_unavailable', 'activecampaign_relationship_page_budget',
    'activecampaign_relationship_early_end', 'activecampaign_relationship_total_changed',
    'profiles_lookup_incomplete', 'consent_requests_lookup_incomplete', 'profiles_lookup_stale_or_future',
    'invalid_observation_context', 'onboarding_source_withheld', 'arbitrary-new-failure']) {
    const result = await evaluateScheduledFreeJourneyRefresh(request(), env(), {
      now: () => now, clock: () => Date.parse(now), discoveryFetch: discovery().fetch,
      evaluate: async () => ({ status: 'withheld', desiredStage: null, attemptedWrites: 0, confirmedWrites: 0,
        recoveryRequired: false, automaticRetry: false, reasons: [code], steps: [] }),
    })
    assert.equal(result.ok, false, code)
    assert.equal(result.sourceHealth, 'partial', code)
    assert.equal(result.reasonCounts[code], 1)
    assert.equal(result.attemptedWrites, 0)
  }
})
