import assert from 'node:assert/strict'
import { createHash, createHmac, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const ts = require('typescript')

test('installed official synchronous helper resolves request identity and throws without refresh when absent', () => {
  assert.equal(typeof require('@vercel/oidc').getVercelOidcTokenSync, 'function')
  const source = readFileSync(new URL('../node_modules/@vercel/oidc/dist/get-vercel-oidc-token-sync.js', import.meta.url), 'utf8')
  let contextReads = 0
  let requestToken = 'synthetic-request-identity'
  const environment = { VERCEL_OIDC_TOKEN: 'synthetic-environment-identity' }
  const module = { exports: {} }
  vm.runInNewContext(source, {
    module, exports: module.exports, process: { env: environment },
    require(name) {
      // The installed sync path must not load a refresh, credential or IO module.
      assert.equal(name, './get-context')
      return { getContext: () => { contextReads++; return { headers: { 'x-vercel-oidc-token': requestToken } } } }
    },
  })
  assert.equal(contextReads, 0)
  assert.equal(module.exports.getVercelOidcTokenSync(), 'synthetic-request-identity')
  requestToken = undefined
  assert.equal(module.exports.getVercelOidcTokenSync(), 'synthetic-environment-identity')
  delete environment.VERCEL_OIDC_TOKEN
  assert.throws(() => module.exports.getVercelOidcTokenSync(), /missing from the request/)
  assert.equal(contextReads, 3)
})

function loadProducer(getOidcToken = () => syntheticToken()) {
  const source = readFileSync(new URL('../lib/free-journey-operation-producer.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports, AbortController, URL, Date, JSON, RegExp, Number, Buffer, setTimeout, clearTimeout,
    process: { env: {} },
    require(name) {
      if (name === 'server-only') return {}
      if (name === '@vercel/oidc') return { getVercelOidcTokenSync: getOidcToken }
      assert.equal(name, 'crypto')
      return { createHash, createHmac, randomUUID }
    },
  })
  return exports
}

const producer = loadProducer()
const now = '2026-10-10T12:00:00.000Z'
const nonce = '31800000-0000-4000-8000-000000000527'
const secret = 'synthetic-shared-secret-longer-than-32-characters'
const environment = {
  VERCEL: '1',
  VERCEL_ENV: 'production',
  VERCEL_TARGET_ENV: 'production',
  VERCEL_PROJECT_ID: 'prj_vv4pDxAdR8GXJumgetMhEMHYfIo5',
  FREE_JOURNEY_PRODUCER_ENABLED: 'true',
  FREE_JOURNEY_OPERATION_ENDPOINT_URL: 'https://nested-objects-agent-runtime-autumns-projects-246e052c.vercel.app/api/operations/free-journey',
  FREE_JOURNEY_OPERATION_PRODUCER_ORIGIN: 'https://members.nestedobjects.com',
  FREE_JOURNEY_OPERATION_PRODUCER_SUBJECT: 'web-members-production',
  FREE_JOURNEY_OPERATION_SHARED_SECRET: secret,
}
const input = {
  kind: 'income_scenario_completed',
  occurredAt: now,
  outsetaPersonUid: 'SyntheticPerson',
  subscriptionUid: 'SyntheticCycle',
}
const evaluationId = 'a'.repeat(64)

function syntheticToken(overrides = {}) {
  const claims = {
    project_id: environment.VERCEL_PROJECT_ID,
    owner_id: 'team_uSLsRZHA5u8JAkI9tVVipAFi',
    environment: 'production',
    nbf: Date.parse(now) / 1000 - 60,
    exp: Date.parse(now) / 1000 + 3600,
    ...overrides,
  }
  return `${Buffer.from('{"alg":"RS256"}').toString('base64url')}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.synthetic-signature`
}

function runtimeResponse(overrides = {}) {
  const body = {
    ok: true,
    evaluationId,
    status: 'ready',
    recoveryRequired: false,
    ...overrides,
  }
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'x-free-journey-evaluation-id': body.evaluationId },
  })
}

test('producer is disabled by default and performs no request', async () => {
  let calls = 0
  const result = await producer.emitFreeJourneySourceEvent(input, {
    environment: {}, fetch: async () => { calls++; throw new Error('unexpected') },
  })
  assert.equal(result.status, 'disabled')
  assert.equal(result.automaticRetry, false)
  assert.equal(calls, 0)
})

test('consent source kinds are distinct, deterministic and disabled by default', async () => {
  const keys = new Set()
  for (const kind of ['signup', 'consent_recorded', 'consent_check_requested']) {
    const event = producer.buildFreeJourneySourceEvent({ ...input, kind })
    assert.equal(event.kind, kind)
    assert.equal(producer.buildFreeJourneySourceEvent({ ...input, kind }).idempotencyKey, event.idempotencyKey)
    keys.add(event.idempotencyKey)
    let requests = 0
    const result = await producer.emitFreeJourneySourceEvent({ ...input, kind }, {
      environment: {}, fetch: async () => { requests++; throw new Error('Unexpected live request') },
    })
    assert.equal(result.status, 'disabled'); assert.equal(requests, 0)
  }
  assert.equal(keys.size, 3)
})

test('runtime-unknown event kinds cannot be signed or sent', async () => {
  for (const kind of ['confirmed', 'subscribe', '', null, undefined]) {
    assert.equal(producer.buildFreeJourneySourceEvent({ ...input, kind }), null)
    let requests = 0
    const result = await producer.emitFreeJourneySourceEvent({ ...input, kind }, {
      environment, fetch: async () => { requests++; throw new Error('Unexpected request') },
    })
    assert.equal(result.status, 'withheld'); assert.equal(requests, 0)
  }
})

test('producer signs the exact deterministic source event contract', async () => {
  const calls = []
  const result = await producer.emitFreeJourneySourceEvent(input, {
    environment, now: () => now, nonce: () => nonce,
    fetch: async (url, init) => {
      calls.push({ url: String(url), init })
      return runtimeResponse()
    },
  })

  assert.equal(result.status, 'delivered')
  assert.equal(result.evaluationId, evaluationId)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, environment.FREE_JOURNEY_OPERATION_ENDPOINT_URL)
  const body = JSON.parse(calls[0].init.body)
  const digest = createHash('sha256').update(JSON.stringify([
    'free_journey_event_v1', input.kind, input.outsetaPersonUid, input.subscriptionUid, now,
  ])).digest('hex')
  assert.equal(body.sourceEvent.idempotencyKey, `free-journey:${input.kind}:${digest}`)
  const bodyDigest = createHash('sha256').update(calls[0].init.body).digest('hex')
  const canonical = [
    'nested-objects-free-journey-v1', 'POST', '/api/operations/free-journey',
    'web-members-production', now, nonce, 'https://members.nestedobjects.com', bodyDigest,
  ].join('\n')
  const signature = createHmac('sha256', secret).update(canonical).digest('hex')
  assert.equal(calls[0].init.headers['x-free-journey-signature'], signature)
  assert.equal(calls[0].init.headers['x-free-journey-body-sha256'], bodyDigest)
  assert.equal(calls[0].init.headers['x-vercel-trusted-oidc-idp-token'], syntheticToken())
  assert.equal(calls[0].init.body.includes(syntheticToken()), false)
  assert.equal(JSON.stringify(result).includes(syntheticToken()), false)
  assert.equal(calls[0].init.redirect, 'error')
  assert.equal(calls[0].init.cache, 'no-store')
})

test('disabled or invalid deployment configuration never obtains or transmits identity', async () => {
  let tokenCalls = 0
  let fetchCalls = 0
  const scopedProducer = loadProducer(() => { tokenCalls++; return syntheticToken() })
  const endpoint = environment.FREE_JOURNEY_OPERATION_ENDPOINT_URL
  for (const overrides of [
    { FREE_JOURNEY_PRODUCER_ENABLED: undefined },
    { VERCEL: undefined }, { VERCEL: '0' },
    { VERCEL_ENV: undefined }, { VERCEL_ENV: 'preview' }, { VERCEL_ENV: 'development' },
    { VERCEL_TARGET_ENV: 'staging' },
    { VERCEL_PROJECT_ID: undefined }, { VERCEL_PROJECT_ID: 'unrelated-project' },
    { FREE_JOURNEY_OPERATION_ENDPOINT_URL: 'https://runtime.example.test/api/operations/free-journey' },
    { FREE_JOURNEY_OPERATION_ENDPOINT_URL: endpoint.replace('.vercel.app', '.vercel.app.evil.test') },
    { FREE_JOURNEY_OPERATION_ENDPOINT_URL: endpoint.replace('https:', 'http:') },
    { FREE_JOURNEY_OPERATION_ENDPOINT_URL: endpoint.replace('/api/', ':8443/api/') },
    { FREE_JOURNEY_OPERATION_ENDPOINT_URL: endpoint.replace('https://', 'https://user:password@') },
    { FREE_JOURNEY_OPERATION_ENDPOINT_URL: `${endpoint}?target=other` },
    { FREE_JOURNEY_OPERATION_ENDPOINT_URL: `${endpoint}#fragment` },
    { FREE_JOURNEY_OPERATION_PRODUCER_ORIGIN: 'https://preview.example.test' },
  ]) {
    const result = await scopedProducer.emitFreeJourneySourceEvent(input, {
      environment: { ...environment, ...overrides }, now: () => now, nonce: () => nonce,
      fetch: async () => { fetchCalls++; return runtimeResponse() },
    })
    assert.ok(['disabled', 'withheld'].includes(result.status))
    assert.equal(result.recoveryRequired, false)
    assert.equal(result.automaticRetry, false)
  }
  assert.equal(tokenCalls, 0)
  assert.equal(fetchCalls, 0)
})

test('missing or unavailable request-scoped OIDC withholds before any request without exposing errors', async () => {
  for (const getToken of [() => undefined, () => '', () => { throw new Error('private token lookup detail') }]) {
    let requests = 0
    const result = await loadProducer(getToken).emitFreeJourneySourceEvent(input, {
      environment, now: () => now, nonce: () => nonce,
      fetch: async () => { requests++; return runtimeResponse() },
    })
    assert.equal(result.status, 'withheld')
    assert.equal(result.code, 'producer_oidc_unavailable')
    assert.equal(result.recoveryRequired, false)
    assert.equal(result.automaticRetry, false)
    assert.equal(requests, 0)
    assert.equal(JSON.stringify(result).includes('private token lookup detail'), false)
  }
})

test('wrong project, owner, environment, validity or malformed OIDC cannot leave the producer', async () => {
  for (const token of [
    syntheticToken({ environment: 'preview' }), syntheticToken({ environment: 'development' }),
    syntheticToken({ project_id: 'unrelated-project' }), syntheticToken({ owner_id: 'unrelated-team' }),
    syntheticToken({ exp: Date.parse(now) / 1000 }), syntheticToken({ nbf: Date.parse(now) / 1000 + 1 }),
    syntheticToken({ exp: undefined }), syntheticToken({ nbf: undefined }),
    syntheticToken({ exp: '9999999999' }), 'malformed', `${syntheticToken()}\r\ninjected: header`,
    'a'.repeat(16_385), 'a.W10.signature',
  ]) {
    let requests = 0
    const result = await loadProducer(() => token).emitFreeJourneySourceEvent(input, {
      environment, now: () => now, nonce: () => nonce,
      fetch: async () => { requests++; return runtimeResponse() },
    })
    assert.equal(result.status, 'withheld')
    assert.equal(result.code, 'producer_oidc_scope_invalid')
    assert.equal(result.recoveryRequired, false)
    assert.equal(requests, 0)
    assert.equal(JSON.stringify(result).includes(token), false)
  }
})

test('each delivery resolves fresh identity and protection failures never retry or follow redirects', async () => {
  let tokenCalls = 0
  const calls = []
  const scopedProducer = loadProducer(() => syntheticToken({ jti: `request-${++tokenCalls}` }))
  for (const status of [200, 403, 302]) {
    const result = await scopedProducer.emitFreeJourneySourceEvent(input, {
      environment, now: () => now, nonce: () => nonce,
      fetch: async (url, init) => {
        calls.push({ url: String(url), init })
        return status === 200 ? runtimeResponse() : new Response('private protection response', { status })
      },
    })
    assert.equal(result.status, status === 200 ? 'delivered' : 'failed')
    assert.equal(result.automaticRetry, false)
    assert.equal(JSON.stringify(result).includes('private protection response'), false)
  }
  assert.equal(tokenCalls, 3)
  assert.equal(calls.length, 3)
  assert.equal(new Set(calls.map(call => call.init.headers['x-vercel-trusted-oidc-idp-token'])).size, 3)
  for (const call of calls) {
    assert.equal(call.url, environment.FREE_JOURNEY_OPERATION_ENDPOINT_URL)
    assert.equal(call.init.redirect, 'error')
    assert.equal(call.init.cache, 'no-store')
    assert.equal(Object.keys(call.init.headers).length, 8)
  }
})

test('producer surfaces withheld and recovery-required Runtime receipts without retrying', async () => {
  for (const [receipt, expected] of [
    [{ status: 'withheld', recoveryRequired: false }, ['withheld', 'runtime_evaluation_withheld', false]],
    [{ status: 'recovery_required', recoveryRequired: true }, ['failed', 'runtime_recovery_required', true]],
  ]) {
    let calls = 0
    const result = await producer.emitFreeJourneySourceEvent(input, {
      environment, now: () => now, nonce: () => nonce,
      fetch: async () => { calls++; return runtimeResponse(receipt) },
    })
    assert.equal(result.status, expected[0])
    assert.equal(result.code, expected[1])
    assert.equal(result.recoveryRequired, expected[2])
    assert.equal(result.automaticRetry, false)
    assert.equal(result.evaluationId, evaluationId)
    assert.equal(calls, 1)
  }
})

test('producer treats a malformed or mismatched successful receipt as uncertain', async () => {
  for (const response of [
    new Response('{}', { status: 200, headers: { 'x-free-journey-evaluation-id': evaluationId } }),
    new Response(JSON.stringify({
      ok: true, evaluationId: 'b'.repeat(64), status: 'ready', recoveryRequired: false,
    }), { status: 200, headers: { 'x-free-journey-evaluation-id': evaluationId } }),
  ]) {
    let calls = 0
    const result = await producer.emitFreeJourneySourceEvent(input, {
      environment, now: () => now, nonce: () => nonce,
      fetch: async () => { calls++; return response },
    })
    assert.equal(result.status, 'failed')
    assert.equal(result.code, 'runtime_receipt_invalid')
    assert.equal(result.recoveryRequired, true)
    assert.equal(result.automaticRetry, false)
    assert.equal(calls, 1)
  }
})

test('producer withholds invalid identity or partial configuration before network access', async () => {
  for (const [candidate, config] of [
    [{ ...input, subscriptionUid: 'invalid value' }, environment],
    [input, { ...environment, FREE_JOURNEY_OPERATION_SHARED_SECRET: 'short' }],
    [input, { ...environment, FREE_JOURNEY_OPERATION_ENDPOINT_URL: 'https://runtime.example.test/wrong' }],
  ]) {
    let calls = 0
    const result = await producer.emitFreeJourneySourceEvent(candidate, {
      environment: config, fetch: async () => { calls++; throw new Error('unexpected') },
    })
    assert.equal(result.status, 'withheld')
    assert.equal(result.recoveryRequired, false)
    assert.equal(calls, 0)
  }
})

test('producer makes one attempt and reports an uncertain request without retrying', async () => {
  let calls = 0
  const result = await producer.emitFreeJourneySourceEvent(input, {
    environment, now: () => now, nonce: () => nonce,
    fetch: async () => { calls++; throw new Error('synthetic response loss') },
  })
  assert.equal(result.status, 'failed')
  assert.equal(result.code, 'runtime_request_uncertain')
  assert.equal(result.recoveryRequired, true)
  assert.equal(result.automaticRetry, false)
  assert.equal(calls, 1)
})


test('paired review scope permits only an explicit consent recheck for the approved member and cycle', async () => {
  let lookups = 0
  let requests = 0
  const boundedProducer = loadProducer(() => { lookups++; return syntheticToken() })
  const scope = {
    ...environment,
    FREE_JOURNEY_PRODUCER_REVIEW_PERSON_UID: input.outsetaPersonUid,
    FREE_JOURNEY_PRODUCER_REVIEW_SUBSCRIPTION_UID: input.subscriptionUid,
  }
  const dependencies = {
    environment: scope, now: () => now, nonce: () => nonce,
    fetch: async () => { requests++; return runtimeResponse() },
  }
  for (const event of [
    input,
    { ...input, kind: 'signup' },
    { ...input, kind: 'profile_saved' },
    { ...input, kind: 'consent_recorded' },
    { ...input, kind: 'day_30' },
    { ...input, kind: 'consent_check_requested', outsetaPersonUid: 'OtherMember' },
    { ...input, kind: 'consent_check_requested', subscriptionUid: 'OtherCycle' },
  ]) {
    const result = await boundedProducer.emitFreeJourneySourceEvent(event, dependencies)
    assert.equal(result.status, 'withheld')
    assert.equal(result.code, 'producer_review_scope_withheld')
    assert.equal(result.recoveryRequired, false)
  }
  assert.equal(lookups, 0); assert.equal(requests, 0)
  const result = await boundedProducer.emitFreeJourneySourceEvent(
    { ...input, kind: 'consent_check_requested' }, dependencies,
  )
  assert.equal(result.status, 'delivered')
  assert.equal(lookups, 1); assert.equal(requests, 1)
})

test('partial or invalid review scopes withhold without resolving identity or sending', async () => {
  let lookups = 0
  let requests = 0
  const boundedProducer = loadProducer(() => { lookups++; return syntheticToken() })
  for (const scope of [
    { FREE_JOURNEY_PRODUCER_REVIEW_PERSON_UID: input.outsetaPersonUid },
    { FREE_JOURNEY_PRODUCER_REVIEW_SUBSCRIPTION_UID: input.subscriptionUid },
    { FREE_JOURNEY_PRODUCER_REVIEW_PERSON_UID: '', FREE_JOURNEY_PRODUCER_REVIEW_SUBSCRIPTION_UID: '' },
    { FREE_JOURNEY_PRODUCER_REVIEW_PERSON_UID: 'invalid/value', FREE_JOURNEY_PRODUCER_REVIEW_SUBSCRIPTION_UID: input.subscriptionUid },
    { FREE_JOURNEY_PRODUCER_REVIEW_PERSON_UID: input.outsetaPersonUid, FREE_JOURNEY_PRODUCER_REVIEW_SUBSCRIPTION_UID: 'invalid/value' },
  ]) {
    const result = await boundedProducer.emitFreeJourneySourceEvent(
      { ...input, kind: 'consent_check_requested' },
      { environment: { ...environment, ...scope }, now: () => now, nonce: () => nonce,
        fetch: async () => { requests++; return runtimeResponse() } },
    )
    assert.equal(result.code, 'producer_review_scope_withheld')
    assert.equal(result.automaticRetry, false)
  }
  assert.equal(lookups, 0); assert.equal(requests, 0)
})
