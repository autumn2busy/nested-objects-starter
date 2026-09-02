import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const COOKIE_USER = { sub: 'synthetic-cookie-user', name: 'Cookie User', 'outseta:planUid': 'rQVqlLm6' }
const SDK_USER = { sub: 'synthetic-previous-sdk-user', name: 'SDK User', 'outseta:planUid': 'L9nbKV9Z' }
const SDK_TOKEN = 'synthetic-previous-sdk-token'
const COOKIE_PROFILE = { display_name: 'Cookie Profile', avatar_url: 'https://synthetic-members.example/cookie-avatar.png' }
const SDK_PROFILE = { display_name: 'SDK Profile', avatar_url: 'https://synthetic-members.example/sdk-avatar.png' }
const source = readFileSync(new URL('../components/auth-provider.tsx', import.meta.url), 'utf8')
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText

/**
 * Execute the actual provider with dependency-aware hooks and effect cleanup.
 * Only React's renderer, browser storage/timers, and authenticated HTTP are simulated.
 * No DOM, real credentials, provider SDK, JWT verification, or network is used.
 */
function createHarness({
  cookieUser = COOKIE_USER,
  sdkToken = null,
  delayInitialSession = false,
  delayInitialProfile = false,
  profileStatus = 200,
} = {}) {
  const hooks = []
  const timers = new Map()
  const listeners = new Map()
  const requests = []
  const profileRequests = []
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
  let initialProfileRelease
  let profileOverride

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
    const method = init.method ?? 'GET'
    requests.push({ method, url })
    if (url === '/api/profile') {
      assert.ok(cookieUser, 'Profile hydration requires an authenticated cookie session')
      assert.equal(method, 'GET')
      assert.equal(init.cache, 'no-store')
      assert.equal(init.credentials, 'same-origin')
      assert.equal(init.headers, undefined, 'The browser must not send an anonymous Supabase key or user selector')
      profileRequests.push(init)
      const profile = profileOverride ?? (cookieUser.sub === COOKIE_USER.sub ? COOKIE_PROFILE : SDK_PROFILE)
      const response = { ok: profileStatus === 200, status: profileStatus, json: async () => ({ profile }) }
      if (delayInitialProfile && profileRequests.length === 1) {
        return new Promise(resolve => { initialProfileRelease = () => resolve(response) })
      }
      return response
    }
    assert.equal(url, '/api/auth/session', 'Unexpected HTTP request in the isolated auth test')
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
    exports, URL, AbortController, window, localStorage, sessionStorage, setTimeout, clearTimeout, fetch,
    console: { log() {}, error: (...args) => errors.push(args) },
    process: { env: {} },
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
    requests, profileRequests, sdkWrites, flush, advance, unmount,
    get value() { return currentValue },
    get cookieUser() { return cookieUser },
    get pendingTimerCount() { return timers.size },
    get cachedProfileName() { return localStorage.getItem('profileDisplayName') },
    get cachedProfileAvatar() { return localStorage.getItem('profileAvatarUrl') },
    setCookieUser(user) { cookieUser = user },
    setSdkToken(token) { sdkToken = token },
    setProfile(profile) { profileOverride = profile },
    releaseInitialSession() {
      assert.ok(initialSessionRelease, 'The initial session GET must be pending')
      initialSessionRelease()
    },
    releaseInitialProfile() {
      assert.ok(initialProfileRelease, 'The initial profile GET must be pending')
      initialProfileRelease()
    },
    async dispatch(name) {
      for (const callback of [...listeners.get(name) ?? []]) callback()
      await flush()
    },
  }
}

const sessionMethods = harness => harness.requests
  .filter(request => request.url === '/api/auth/session')
  .map(request => request.method)

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
  assert.deepEqual(sessionMethods(harness), ['GET'])
  assert.deepEqual(harness.requests.map(request => request.url), ['/api/auth/session', '/api/profile'])
  assert.equal(harness.value.profileDisplayName, COOKIE_PROFILE.display_name)
  assert.equal(harness.value.profileAvatarUrl, COOKIE_PROFILE.avatar_url)
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
  assert.deepEqual(sessionMethods(harness), ['GET'])
  assert.equal(harness.profileRequests.length, 0, 'Profile hydration must wait for initial authentication')
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
  assert.deepEqual(sessionMethods(harness), ['GET'])
  assert.equal(harness.profileRequests.length, 0)
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
  assert.deepEqual(sessionMethods(harness), ['GET', 'POST', 'GET'])
  assert.equal(harness.value.profileDisplayName, SDK_PROFILE.display_name)
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
  assert.deepEqual(sessionMethods(harness), ['GET', 'POST', 'GET'])
})

test('own profile refresh uses the API response and clears a removed avatar', async t => {
  const harness = createHarness()
  t.after(harness.unmount)
  await harness.flush()
  assert.equal(harness.value.profileAvatarUrl, COOKIE_PROFILE.avatar_url)
  harness.setProfile({ display_name: '  Updated Member  ', avatar_url: null })
  await harness.value.refreshProfileDisplayName()
  await harness.flush()
  assert.equal(harness.value.profileDisplayName, 'Updated Member')
  assert.equal(harness.value.profileAvatarUrl, null)
  assert.equal(harness.cachedProfileAvatar, null)
  assert.equal(harness.profileRequests.length, 2)
  assertCookieAuthenticated(harness)
})

test('an unavailable profile API does not discard verified cookie authentication', async t => {
  const harness = createHarness({ profileStatus: 503 })
  t.after(harness.unmount)
  await harness.flush()
  assertCookieAuthenticated(harness)
  assert.equal(harness.value.profileDisplayName, 'Cookie')
  assert.equal(harness.value.profileAvatarUrl, null)
})

test('a delayed prior-account profile cannot replace the current account profile', async t => {
  const harness = createHarness({ delayInitialProfile: true })
  t.after(harness.unmount)
  await harness.flush()
  assert.equal(harness.profileRequests.length, 1)
  harness.setCookieUser(SDK_USER)
  await harness.value.refreshAuth()
  await harness.flush()
  assert.equal(harness.profileRequests[0].signal.aborted, true)
  assert.equal(harness.value.profileDisplayName, SDK_PROFILE.display_name)
  harness.releaseInitialProfile() // Even a transport that ignores abort must not publish stale data.
  await harness.flush()
  assert.equal(harness.value.user.sub, SDK_USER.sub)
  assert.equal(harness.value.profileDisplayName, SDK_PROFILE.display_name)
  assert.equal(harness.value.profileAvatarUrl, SDK_PROFILE.avatar_url)
})

test('profile hydration cleanup prevents persistence after unmount', async () => {
  const harness = createHarness({ delayInitialProfile: true })
  await harness.flush()
  const cachedName = harness.cachedProfileName
  const cachedAvatar = harness.cachedProfileAvatar
  harness.unmount()
  assert.equal(harness.profileRequests[0].signal.aborted, true)
  harness.releaseInitialProfile()
  await harness.flush()
  assert.equal(harness.cachedProfileName, cachedName)
  assert.equal(harness.cachedProfileAvatar, cachedAvatar)
})

test('the header consumes provider profile state without mounting an anonymous profile reader', () => {
  const header = readFileSync(new URL('../components/SiteHeader.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(header, /useProfile|@\/lib\/use-profile|rest\/v1\/profiles/)
  assert.match(header, /const avatarUrl = profileAvatarUrl\s/)
})

test('firm reviews preserve approved content without selecting or rendering reviewer identity', async () => {
  const reviewSource = readFileSync(new URL('../components/directory/FirmReviews.tsx', import.meta.url), 'utf8')
  const reviewCode = ts.transpileModule(reviewSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const queries = []
  const review = {
    rating: 4, comment: 'Synthetic approved feedback', created_at: '2026-09-01T12:00:00Z',
    profiles: { display_name: 'PRIVATE_REVIEWER_SENTINEL', avatar_url: 'https://private-avatar.invalid/sentinel.png' },
  }
  const query = {
    select: fields => { queries.push(['select', fields]); return query },
    eq: (field, value) => { queries.push(['eq', field, value]); return query },
    order: async (field, options) => {
      queries.push(['order', field, options.ascending])
      return { data: [review], error: null }
    },
  }
  let schemaReviews
  const exports = {}
  vm.runInNewContext(reviewCode, {
    exports,
    process: { env: {} },
    require(name) {
      if (name === '@supabase/supabase-js') return { createClient: () => ({
        from: table => { queries.push(['from', table]); return query },
      }) }
      if (name === 'lucide-react') return { Star: 'synthetic-star' }
      if (name === '@/lib/seo') return { getReviewSchema: reviews => { schemaReviews = reviews; return { reviews } } }
      if (name === 'next/script') return { default: 'synthetic-script' }
      if (name === './LeaveReviewForm') return { LeaveReviewForm: 'synthetic-review-form' }
      if (name === 'react/jsx-runtime') {
        const jsx = (type, props) => ({ type, props })
        return { jsx, jsxs: jsx }
      }
      throw new Error(`Unexpected review import: ${name}`)
    },
  })
  const result = await exports.FirmReviews({ firmId: 'synthetic-firm' })
  assert.deepEqual(queries, [
    ['from', 'firm_reviews'], ['select', 'rating, comment, created_at'],
    ['eq', 'firm_id', 'synthetic-firm'], ['eq', 'status', 'approved'], ['order', 'created_at', false],
  ])
  assert.equal(schemaReviews[0].author, 'Member')
  assert.equal(schemaReviews[0].rating, review.rating)
  assert.equal(schemaReviews[0].body, review.comment)
  assert.equal(schemaReviews[0].datePublished, review.created_at)
  const rendered = JSON.stringify(result)
  assert.match(rendered, /Member/)
  assert.match(rendered, /Synthetic approved feedback/)
  assert.match(rendered, /Sep 2026/)
  assert.doesNotMatch(rendered, /PRIVATE_REVIEWER_SENTINEL|private-avatar\.invalid|display_name|avatar_url/)
})
