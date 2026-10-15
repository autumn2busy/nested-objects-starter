import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'

import { InMemoryAdminControlPlaneStore, createAdminServiceHeaders } from '../dist-api/src/index.js'

const ownerSubject = 'synthetic-owner-handler'
const sharedSecret = 'synthetic-handler-secret-at-least-32-characters'
const allowedOrigin = 'https://admin-handler.example.test'
const entry = new URL('../dist-api/api/admin/triggers.js', import.meta.url)
const seams = Symbol.for('nested-objects.admin-handler-test-seams')
let sequence = 0

// Load the compiled production handler unchanged. Only its configuration/context and
// external Workflow start imports are replaced; contracts, auth, nonce and responses
// remain real. This is local HTTP-handler acceptance, not hosted/Postgres proof.
async function handlerFixture(t) {
  const store = new InMemoryAdminControlPlaneStore(ownerSubject, {
    generatedAt: new Date().toISOString(), runs: [], unresolvedSignals: [], sourceWarnings: [],
    topPriorities: [], experiments: [], reviews: [], awaitingActions: [],
    delegationEnabled: false, executionEnabled: false,
  })
  const calls = { configuration: 0, context: 0, starts: [] }
  const configuration = { sharedSecret, autumnSubjectId: ownerSubject, allowedOrigin }
  globalThis[seams] = {
    loadAdminRuntimeConfiguration() { calls.configuration++; return configuration },
    async resolveAdminRuntimeContext() {
      calls.context++
      return { store, configuration: { durable: { binding: { synthetic: true } } } }
    },
    async start(...args) {
      assert.equal(store.nonces.size, 1, 'the handler must consume the nonce before dispatch')
      assert.equal(store.events.length, 1, 'the nonce audit must exist before dispatch')
      calls.starts.push(args)
      return { runId: 'synthetic-workflow-run' }
    },
  }
  const shim = exports => `data:text/javascript,${encodeURIComponent(
    exports.map(name => `export const ${name} = (...args) => globalThis[Symbol.for('nested-objects.admin-handler-test-seams')].${name}(...args)`).join(';'),
  )}`
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (context.parentURL?.split('?')[0] === entry.href) {
        if (specifier === 'workflow/api') return { url: shim(['start']), shortCircuit: true }
        if (specifier === '../../src/runtime/admin-runtime.js') {
          return { url: shim(['loadAdminRuntimeConfiguration', 'resolveAdminRuntimeContext']), shortCircuit: true }
        }
      }
      return nextResolve(specifier, context)
    },
  })
  t.after(() => { hooks.deregister(); delete globalThis[seams] })
  const { default: handler } = await import(`${entry.href}?fixture=${++sequence}`)
  return { handler, store, calls }
}

function exactRequest(actorSubject = ownerSubject) {
  const bodyText = JSON.stringify({ triggerCategory: 'weekly', workflowName: 'weekly_operating_review',
    businessKey: 'synthetic-weekly:2026-10-15', fixtureMode: 'synthetic' })
  const headers = createAdminServiceHeaders({ method: 'POST', pathname: entryPath, bodyText,
    actorSubject, origin: allowedOrigin, timestamp: new Date().toISOString(),
    nonce: '11111111-1111-4111-8111-111111111111', sharedSecret })
  return new Request(`${allowedOrigin}${entryPath}`, { method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' }, body: bodyText })
}
const entryPath = '/api/admin/triggers'

test('actual admin trigger handler rejects a correctly signed non-owner before context, nonce or dispatch', async t => {
  const { handler, store, calls } = await handlerFixture(t)
  const response = await handler.fetch(exactRequest('synthetic-non-owner-handler'))
  assert.equal(response.status, 403)
  assert.equal((await response.json()).error.message, 'Forbidden.')
  assert.equal(calls.configuration, 1)
  assert.equal(calls.context, 0)
  assert.equal(calls.starts.length, 0)
  assert.equal(store.nonces.size, 0)
  assert.equal(store.events.length, 0)
})

test('actual admin trigger handler consumes identical signed bytes once before Workflow dispatch', async t => {
  const { handler, store, calls } = await handlerFixture(t)
  const request = exactRequest()
  const firstRequest = request.clone()
  const replayRequest = request.clone()
  assert.deepEqual([...firstRequest.headers], [...replayRequest.headers])
  assert.equal(await firstRequest.clone().text(), await replayRequest.clone().text())
  const first = await handler.fetch(firstRequest)
  assert.equal(first.status, 202)
  const accepted = await first.json()
  assert.equal(accepted.status, 'queued')
  assert.equal(accepted.workflowRunId, 'synthetic-workflow-run')
  assert.equal(accepted.fixtureMode, 'synthetic')
  assert.equal(accepted.mutationAllowed, false)
  const replay = await handler.fetch(replayRequest)
  assert.equal(replay.status, 409)
  assert.equal((await replay.json()).ok, false)
  assert.equal(calls.context, 2)
  assert.equal(calls.starts.length, 1)
  assert.equal(store.nonces.size, 1)
  assert.equal(store.events.length, 1)
  assert.equal(calls.starts[0][0].workflowId, 'workflow//./workflows/operating-reviews//weeklyOperatingReviewWorkflow')
})
