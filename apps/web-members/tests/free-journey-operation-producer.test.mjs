import assert from 'node:assert/strict'
import { createHash, createHmac, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const ts = require('typescript')

function loadProducer() {
  const source = readFileSync(new URL('../lib/free-journey-operation-producer.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports, AbortController, URL, Date, JSON, RegExp, Number, setTimeout, clearTimeout,
    process: { env: {} },
    require(name) {
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
  FREE_JOURNEY_PRODUCER_ENABLED: 'true',
  FREE_JOURNEY_OPERATION_ENDPOINT_URL: 'https://runtime.example.test/api/operations/free-journey',
  FREE_JOURNEY_OPERATION_PRODUCER_ORIGIN: 'https://members.example.test',
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
    'web-members-production', now, nonce, 'https://members.example.test', bodyDigest,
  ].join('\n')
  const signature = createHmac('sha256', secret).update(canonical).digest('hex')
  assert.equal(calls[0].init.headers['x-free-journey-signature'], signature)
  assert.equal(calls[0].init.headers['x-free-journey-body-sha256'], bodyDigest)
  assert.equal(calls[0].init.redirect, 'error')
  assert.equal(calls[0].init.cache, 'no-store')
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
