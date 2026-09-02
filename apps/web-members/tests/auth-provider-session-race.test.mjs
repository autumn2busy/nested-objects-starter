import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const COOKIE_USER = { sub: 'synthetic-cookie-user', name: 'Cookie User', 'outseta:planUid': 'rQVqlLm6' }
const SDK_USER = { sub: 'synthetic-previous-sdk-user', name: 'SDK User', 'outseta:planUid': 'L9nbKV9Z' }
const SDK_TOKEN = 'synthetic-previous-sdk-token'
const source = readFileSync(new URL('../components/auth-provider.tsx', import.meta.url), 'utf8')
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText

/**
 * Execute the actual provider with dependency-aware hooks and effect cleanup.
 * Only React's renderer, browser storage/timers, and session HTTP are simulated.
 * No DOM, real credentials, provider SDK, JWT verification, or network is used.
 */
function createHarness({ cookieUser = COOKIE_USER, sdkToken = null, delayInitialSession = false } = {}) {
  const hooks = []
  const timers = new Map()
  const listeners = new Map()
  const requests = []
  const sdkWrites = []
  const errors = []
  let cursor = 0
  let pendingEffects = []
  let dirty = false
  let mounted = true
  let currentValue
  let now = 0
  let nextTimerId = 0
  let initialSessionRelease

  const storage = () => {
    const values = new Map()
    return {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: key => values.delete(key),
    }
  }
  const localStorage = storage()
  const sessionStorage = storage()
  const sameDependencies = (previous, next) => previous !== undefined && next !== undefined
    && previous.length === next.length && previous.every((value, index) => Object.is(value, next[index]))

  function hook(type, initialize) {
    const index = cursor++
    if (!hooks[index]) hooks[index] = { type, ...initialize() }
    assert.equal(hooks[index].type, type, 'Provider hook order must remain consistent')
    return hooks[index]
  }

  const react = {
    createContext: () => ({ Provider: 'synthetic-context-provider' }),
    useState(initial) {
      const state = hook('state', () => ({ value: typeof initial === 'function' ? initial() : initial }))
      state.setter ??= update => {
        const next = typeof update === 'function' ? update(state.value) : update
        if (!Object.is(state.value, next)) {
          state.value = next
          if (mounted) dirty = true
        }
      }
      return [state.value, state.setter]
    },
    useRef(initial) {
      return hook('ref', () => ({ value: { current: initial } })).value
    },
    useCallback(callback, dependencies) {
      const memo = hook('callback', () => ({}))
      if (!sameDependencies(memo.dependencies, dependencies)) {
        memo.value = callback
        memo.dependencies = dependencies
      }
      return memo.value
    },
    useEffect(effect, dependencies) {
      const state = hook('effect', () => ({}))
      if (!sameDependencies(state.dependencies, dependencies)) {
        state.dependencies = dependencies
        pendingEffects.push({ state, effect })
      }
    },
    useContext() {
      throw new Error('Children are not rendered by this provider harness')
    },
  }

  function setTimeout(callback, delay = 0) {
    const id = ++nextTimerId
    timers.set(id, { callback, due: now + delay })
    return id
  }
  const clearTimeout = id => timers.delete(id)
  const window = {
    location: { href: 'https://synthetic-members.example/inspector-dashboard', search: '' },
    localStorage,
    sessionStorage,
    setTimeout,
    clearTimeout,
    Outseta: {
      getAccessToken: () => sdkToken,
      setAccessToken: token => { sdkWrites.push(token); sdkToken = token },
    },
    addEventListener(name, callback) {
      if (!listeners.has(name)) listeners.set(name, new Set())
      listeners.get(name).add(callback)
    },
    removeEventListener: (name, callback) => listeners.get(name)?.delete(callback),
  }

  async function fetch(url, init = {}) {
    assert.equal(url, '/api/auth/session', 'Unexpected HTTP request in the isolated auth test')
    const method = init.method ?? 'GET'
    requests.push({ method, url })
    if (method === 'POST') {
      assert.equal(JSON.parse(init.body).accessToken, SDK_TOKEN)
      cookieUser = SDK_USER
    } else {
      assert.equal(method, 'GET')
    }
    // Snapshot the server result before delaying it, as a real response would.
    const user = cookieUser
    const response = { ok: true, status: 200, json: async () => ({ user, isAuthenticated: Boolean(user) }) }
    if (delayInitialSession && requests.length === 1) {
      return new Promise(resolve => { initialSessionRelease = () => resolve(response) })
    }
    return response
  }

  const exports = {}
  vm.runInNewContext(code, {
    exports, URL, window, localStorage, sessionStorage, setTimeout, clearTimeout, fetch,
    console: { log() {}, error: (...args) => errors.push(args) },
    process: { env: {} }, // Keep the optional Supabase profile lookup disabled.
    require(name) {
      if (name === 'react') return react
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }) }
      if (name === 'next/navigation') return { usePathname: () => '/inspector-dashboard' }
      if (name === '@/lib/ac-events') return { trackOutsetaModalOpen() {} }
      throw new Error(`Unexpected import: ${name}`)
    },
  })

  function render() {
    dirty = false
    cursor = 0
    pendingEffects = []
    currentValue = exports.AuthProvider({ children: null }).props.value
    const effects = pendingEffects
    // Dependency changes run the prior cleanup before the new effect is set up.
    for (const { state } of effects) state.cleanup?.()
    for (const { state, effect } of effects) state.cleanup = effect()
  }

  async function flush() {
    // All non-timer work is mocked promise resolution; no real waiting occurs.
    for (let turn = 0; turn < 32; turn++) {
      await Promise.resolve()
      if (mounted && dirty) render()
    }
    assert.equal(dirty, false, 'Provider did not settle after mocked HTTP/effects')
    assert.deepEqual(errors, [], 'Provider reported an unexpected error')
  }

  async function advance(milliseconds) {
    const target = now + milliseconds
    let fired = 0
    while (true) {
      const next = [...timers].filter(([, timer]) => timer.due <= target)
        .sort((left, right) => left[1].due - right[1].due || left[0] - right[0])[0]
      if (!next) break
      assert.ok(++fired <= 100, 'Unexpected timer loop in provider')
      const [id, timer] = next
      timers.delete(id)
      now = timer.due
      timer.callback()
      await flush()
    }
    now = target
    await flush()
  }

  function unmount() {
    mounted = false
    dirty = false
    for (const state of hooks) state.cleanup?.()
  }

  render()
  return {
    requests, sdkWrites, flush, advance, unmount,
    get value() { return currentValue },
    get cookieUser() { return cookieUser },
    get pendingTimerCount() { return timers.size },
    setCookieUser(user) { cookieUser = user },
    setSdkToken(token) { sdkToken = token },
    releaseInitialSession() {
      assert.ok(initialSessionRelease, 'The initial session GET must be pending')
      initialSessionRelease()
    },
    async dispatch(name) {
      for (const callback of [...listeners.get(name) ?? []]) callback()
      await flush()
    },
  }
}

function assertCookieAuthenticated(harness) {
  assert.equal(harness.value.user?.sub, COOKIE_USER.sub)
  assert.equal(harness.value.planUid, COOKIE_USER['outseta:planUid'])
  assert.equal(harness.value.isAuthenticated, true)
  assert.equal(harness.value.isLoading, false)
  assert.equal(harness.value.accessToken, null)
  assert.equal(harness.cookieUser?.sub, COOKIE_USER.sub)
  assert.equal(harness.requests.some(request => request.method === 'POST'), false)
}

test('clean cookie-only dashboard restores auth without a callback flag or SDK token', async t => {
  const harness = createHarness()
  t.after(harness.unmount)
  await harness.flush()
  await harness.advance(2000)
  await harness.dispatch('outseta-ready')
  assertCookieAuthenticated(harness)
  assert.deepEqual(harness.requests.map(request => request.method), ['GET'])
  assert.deepEqual(harness.sdkWrites, [])
})

test('successful cookie auth cannot be overwritten by the old effect delayed SDK fallback', async t => {
  const harness = createHarness({ sdkToken: SDK_TOKEN })
  t.after(harness.unmount)
  await harness.flush() // Includes cleanup as authentication changes from false to true.
  assertCookieAuthenticated(harness)
  await harness.advance(2000)
  await harness.dispatch('outseta-ready')
  assertCookieAuthenticated(harness)
})

test('slow initial session check blocks both delayed and ready-event SDK fallback', async t => {
  const harness = createHarness({ sdkToken: SDK_TOKEN, delayInitialSession: true })
  t.after(harness.unmount)
  await harness.flush()
  assert.equal(harness.value.isLoading, true)
  await harness.advance(3000)
  await harness.dispatch('outseta-ready')
  assert.deepEqual(harness.requests.map(request => request.method), ['GET'])
  harness.releaseInitialSession()
  await harness.flush()
  await harness.advance(3000)
  await harness.dispatch('outseta-ready')
  assertCookieAuthenticated(harness)
})

test('cookie auth arriving during a logged-out fallback delay cancels the stale effect', async t => {
  const harness = createHarness({ cookieUser: null, sdkToken: SDK_TOKEN })
  t.after(harness.unmount)
  await harness.flush()
  assert.equal(harness.value.isAuthenticated, false)
  assert.ok(harness.pendingTimerCount > 0, 'Logged-out SDK recovery should be scheduled')
  harness.setCookieUser(COOKIE_USER)
  await harness.value.refreshAuth()
  await harness.flush()
  await harness.advance(2000)
  await harness.dispatch('outseta-ready')
  assertCookieAuthenticated(harness)
})

test('unmount cleanup prevents delayed SDK recovery from posting a session', async () => {
  const harness = createHarness({ cookieUser: null, sdkToken: SDK_TOKEN })
  await harness.flush()
  assert.ok(harness.pendingTimerCount > 0, 'The test must exercise a pending fallback')
  harness.unmount()
  await harness.advance(2000)
  await harness.dispatch('outseta-ready')
  assert.deepEqual(harness.requests.map(request => request.method), ['GET'])
  assert.equal(harness.cookieUser, null)
})

test('logged-out members retain delayed recovery from an existing SDK token', async t => {
  const harness = createHarness({ cookieUser: null, sdkToken: SDK_TOKEN })
  t.after(harness.unmount)
  await harness.flush()
  assert.equal(harness.value.isLoading, false)
  assert.equal(harness.value.isAuthenticated, false)
  await harness.advance(2000)
  assert.equal(harness.value.user?.sub, SDK_USER.sub)
  assert.equal(harness.value.isAuthenticated, true)
  assert.equal(harness.cookieUser?.sub, SDK_USER.sub)
  assert.deepEqual(harness.requests.map(request => request.method), ['GET', 'POST', 'GET'])
})

test('a deferred SDK ready event restores a logged-out session without duplicate recovery', async t => {
  const harness = createHarness({ cookieUser: null })
  t.after(harness.unmount)
  await harness.flush()
  harness.setSdkToken(SDK_TOKEN)
  await harness.dispatch('outseta-ready')
  await harness.advance(2000)
  assert.equal(harness.value.user?.sub, SDK_USER.sub)
  assert.equal(harness.value.isAuthenticated, true)
  assert.deepEqual(harness.requests.map(request => request.method), ['GET', 'POST', 'GET'])
})
