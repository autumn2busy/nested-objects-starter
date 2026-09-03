import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../lib/ac-events.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

// Execute the real tracker with synthetic browser storage and a recording fetch.
// No external analytics SDK, credential, browser session, or network is available.
function createHarness({ deniedStorage, deniedMethod, rejectFetch = false } = {}) {
  const requests = []
  const stores = { localStorage: new Map(), sessionStorage: new Map() }
  const window = { location: { pathname: '/membership-pricing', search: '?utm_source=synthetic' }, dataLayer: [] }
  const context = { exports: {}, window, URLSearchParams }
  let nextId = 0
  context.crypto = { randomUUID: () => `synthetic-${++nextId}` }
  context.fetch = async (url, options) => {
    requests.push({ url, ...options, body: JSON.parse(options.body) })
    if (rejectFetch) throw new Error('Synthetic network unavailable')
    return { ok: true }
  }
  for (const name of Object.keys(stores)) {
    const storage = {
      getItem(key) {
        if (deniedMethod === name) throw new Error('Synthetic storage read denied')
        return stores[name].get(key) ?? null
      },
      setItem(key, value) {
        if (deniedMethod === name) throw new Error('Synthetic storage write denied')
        stores[name].set(key, value)
      },
    }
    const descriptor = {
      get() {
        if (deniedStorage === name) throw new Error('Synthetic storage property denied')
        return storage
      },
    }
    Object.defineProperty(window, name, descriptor)
    Object.defineProperty(context, name, descriptor)
  }
  vm.runInNewContext(code, context)
  return { tracker: context.exports, requests, window, stores }
}

test('events retain visitor and session IDs while each delivery receives its own key', () => {
  const harness = createHarness()
  harness.tracker.trackPricingView({ source: 'synthetic-plan-list' })
  harness.tracker.trackJoinFreeClick({ source: 'synthetic-free-choice' })
  assert.equal(harness.requests.length, 2)
  const [view, click] = harness.requests
  assert.equal(view.url, '/api/conversion-events')
  assert.equal(view.credentials, 'same-origin')
  assert.equal(view.keepalive, true)
  assert.equal(view.body.event, 'pricing_view')
  assert.equal(click.body.event, 'join_free_click')
  assert.equal(view.body.anonymousId, click.body.anonymousId)
  assert.equal(view.body.sessionId, click.body.sessionId)
  assert.notEqual(view.body.clientEventId, click.body.clientEventId)
  assert.deepEqual(click.body.eventData, {
    sourcePage: '/membership-pricing', utm_source: 'synthetic', source: 'synthetic-free-choice',
  })
  assert.equal(harness.window.dataLayer.length, 2)
})

for (const storage of ['localStorage', 'sessionStorage']) {
  test(`denied ${storage} property preserves the action and best-effort event delivery`, () => {
    const harness = createHarness({ deniedStorage: storage })
    assert.doesNotThrow(() => harness.tracker.trackPricingCtaClick({ source: 'synthetic-plan' }))
    assert.equal(harness.requests.length, 1)
    assert.equal(harness.requests[0].body.event, 'pricing_cta_click')
    assert.match(harness.requests[0].body.anonymousId, /^anon:/)
    assert.match(harness.requests[0].body.sessionId, /^session:/)
    assert.equal(harness.window.dataLayer.length, 1)
  })

  test(`denied ${storage} methods preserve fallback event delivery`, () => {
    const harness = createHarness({ deniedMethod: storage })
    assert.doesNotThrow(() => harness.tracker.trackPricingView())
    assert.equal(harness.requests.length, 1)
    assert.equal(harness.window.dataLayer.length, 1)
  })
}

test('a rejected first-party request does not surface an unhandled rejection to the action', async () => {
  const harness = createHarness({ rejectFetch: true })
  assert.doesNotThrow(() => harness.tracker.trackJoinFreeClick())
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(harness.requests.length, 1)
  assert.equal(harness.window.dataLayer.length, 1)
})

test('server-side calls do not attempt browser access or event delivery', () => {
  const context = { exports: {} }
  vm.runInNewContext(code, context)
  assert.doesNotThrow(() => context.exports.trackPricingView())
})
