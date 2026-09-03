import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

// Render the actual TSX with synthetic hooks and dependencies. No SDK, storage,
// network, account, database, or marketing integration is accessed by this suite.
const element = (type, props = {}) => ({ type, props })
const jsxRuntime = { jsx: element, jsxs: element, Fragment: 'synthetic-fragment' }
const icons = new Proxy({}, { get: (_, name) => props => element('svg', { ...props, 'data-icon': name }) })
const link = { default: props => element('a', props) }
const commonImports = { 'react/jsx-runtime': jsxRuntime, 'next/link': link, 'lucide-react': icons }

function load(relativePath, imports = {}, globals = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports,
    console: { warn() {}, error() {} },
    require(name) {
      const value = { ...commonImports, ...imports }[name]
      assert.ok(value, `Unexpected component import: ${name}`)
      return value
    },
    ...globals,
  })
  return exports
}

function expand(node) {
  if (Array.isArray(node)) return node.flatMap(child => expand(child))
  if (node == null || typeof node === 'boolean') return null
  if (typeof node !== 'object') return node
  if (typeof node.type === 'function') return expand(node.type(node.props))
  return { ...node, props: { ...node.props, children: expand(node.props.children) } }
}

function nodes(tree, predicate) {
  if (Array.isArray(tree)) return tree.flatMap(node => nodes(node, predicate))
  if (tree == null || typeof tree !== 'object') return []
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props.children, predicate)]
}

function content(tree) {
  if (Array.isArray(tree)) return tree.map(content).join(' ')
  if (tree == null) return ''
  if (typeof tree === 'object') return content(tree.props.children)
  return String(tree)
}

const { InspectorStartGuide } = load('../components/onboarding/inspector-start-guide.tsx')
const guideImport = { InspectorStartGuide }

function createHarness(relativePath, exportName, initialAuth = {}) {
  const hooks = []
  const sideEffects = { requests: [], signupCompleted: [], analytics: [], sdkReads: 0, logins: 0, timers: [] }
  let auth = { isLoading: false, isAuthenticated: false, ...initialAuth }
  let cursor = 0
  let dirty = false
  let pendingEffects = []
  let tree
  let props
  const sameDependencies = (previous, next) => previous && next
    && previous.length === next.length && previous.every((value, index) => Object.is(value, next[index]))
  function hook(kind, initial) {
    const index = cursor++
    if (!hooks[index]) hooks[index] = { kind, ...initial() }
    assert.equal(hooks[index].kind, kind)
    return hooks[index]
  }
  const react = {
    useState(initial) {
      const state = hook('state', () => ({ value: typeof initial === 'function' ? initial() : initial }))
      state.setter ??= update => {
        const next = typeof update === 'function' ? update(state.value) : update
        if (!Object.is(next, state.value)) {
          state.value = next
          dirty = true
        }
      }
      return [state.value, state.setter]
    },
    useRef(initial) { return hook('ref', () => ({ value: { current: initial } })).value },
    useEffect(effect, dependencies) {
      const state = hook('effect', () => ({}))
      if (!sameDependencies(state.dependencies, dependencies)) {
        state.dependencies = dependencies
        pendingEffects.push({ state, effect })
      }
    },
  }
  const { [exportName]: Component } = load(relativePath, {
    react,
    './inspector-start-guide': guideImport,
    '@/components/onboarding/inspector-start-guide': guideImport,
    '@/components/auth-provider': { useAuth: () => ({ ...auth, login: () => { sideEffects.logins += 1 } }) },
    '@/lib/ac-events': { trackSignupCompleted: plan => sideEffects.signupCompleted.push(plan) },
  }, {
    window: {
      Outseta: { getUser() { sideEffects.sdkReads += 1; return { FullName: 'Synthetic Inspector', Email: 'synthetic@example.invalid' } } },
      gtag: (...args) => sideEffects.analytics.push(args),
      setTimeout: (callback, delay) => { sideEffects.timers.push({ callback, delay }); return sideEffects.timers.length },
    },
    fetch: async (url, options) => { sideEffects.requests.push({ url, options }); return { ok: true } },
  })

  function render(nextProps = props) {
    props = nextProps
    cursor = 0
    dirty = false
    tree = expand(Component(props))
    return tree
  }

  return {
    render,
    get tree() { return tree },
    sideEffects,
    setAuth(next) { auth = { ...auth, ...next } },
    async settle() {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const effects = pendingEffects
        pendingEffects = []
        for (const { state, effect } of effects) {
          state.cleanup?.()
          state.cleanup = effect()
        }
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        if (dirty) render()
        else if (pendingEffects.length === 0) return tree
      }
      assert.fail('Synthetic component did not settle')
    },
  }
}

test('shared inspector guide starts with firm research and keeps profile preparation secondary and private', () => {
  const tree = expand(InspectorStartGuide())
  const links = nodes(tree, node => node.type === 'a')
  assert.deepEqual(links.map(node => node.props.href), ['/hiring-firms', '/roles/inspector', '/profile'])
  assert.match(content(links[0]), /Explore hiring firms/)
  assert.match(content(tree), /Your profile is private to you/)
  assert.match(content(tree), /not a job guarantee/)
  assert.match(content(tree), /before filling out your profile/)
  assert.match(content(tree), /Free includes up to 3 sample listings with no search or filters/)
  assert.match(content(tree), /Pro and higher include full directory search and firm intel/)
  assert.equal(nodes(tree, node => node.type === 'h2').length, 1)
  assert.equal(nodes(tree, node => node.type === 'h3').length, 2)
  assert.equal(nodes(tree, node => node.type === 'button').length, 0)
  assert.ok(links.every(node => !/^\/(?:members|tools)(?:\/|$)/.test(node.props.href)))
})

test('onboarding guide can hide and reopen without completion, persistence, or marketing side effects', async () => {
  const harness = createHarness('../components/onboarding/onboarding-widget.tsx', 'OnboardingWidget')
  harness.render()
  let button = nodes(harness.tree, node => node.type === 'button')[0]
  assert.equal(button.props.type, 'button')
  assert.equal(button.props['aria-expanded'], true)
  assert.equal(content(button), 'Hide for now')
  assert.equal(nodes(harness.tree, node => node.type === 'a').length, 3)
  button.props.onClick()
  harness.render()
  button = nodes(harness.tree, node => node.type === 'button')[0]
  assert.equal(button.props['aria-expanded'], false)
  assert.equal(content(button), 'Show getting-started guide')
  assert.equal(nodes(harness.tree, node => node.type === 'a').length, 0)
  button.props.onClick()
  harness.render()
  await harness.settle()
  assert.equal(nodes(harness.tree, node => node.type === 'a').length, 3)
  assert.deepEqual(harness.sideEffects, { requests: [], signupCompleted: [], analytics: [], sdkReads: 0, logins: 0, timers: [] })
  assert.doesNotMatch(content(harness.tree), /Mark all as done|Saving\.\.\./)
  const source = readFileSync(new URL('../components/onboarding/onboarding-widget.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /completeOnboardingAction|localStorage|sessionStorage|\bfetch\s*\(/)
})

test('welcome waits for auth without announcing an active account or firing signup effects', async () => {
  for (const isNewUser of [false, true]) {
    const harness = createHarness('../app/welcome/WelcomeActivation.tsx', 'WelcomeActivation', { isLoading: true })
    harness.render({ isNewUser })
    await harness.settle()
    assert.ok(nodes(harness.tree, node => node.props.role === 'status').length > 0)
    assert.doesNotMatch(content(harness.tree), /Your member hub is ready|Account created|Your free member account is ready/)
    assert.equal(nodes(harness.tree, node => node.type === 'a' && node.props.href === '/hiring-firms').length, 0)
    assert.equal(harness.sideEffects.requests.length, 0)
    assert.equal(harness.sideEffects.analytics.length, 0)
    assert.equal(harness.sideEffects.signupCompleted.length, 0)
    assert.equal(harness.sideEffects.sdkReads, 0)
  }
})

test('signed-out welcome offers login and distinguishes new-user confirmation without claiming readiness', async () => {
  for (const isNewUser of [false, true]) {
    const harness = createHarness('../app/welcome/WelcomeActivation.tsx', 'WelcomeActivation')
    harness.render({ isNewUser })
    await harness.settle()
    assert.doesNotMatch(content(harness.tree), /Your member hub is ready|Account created|Your free member account is ready|Your account is reserved/)
    if (isNewUser) assert.match(content(harness.tree), /confirmation|confirm|email/i)
    const buttons = nodes(harness.tree, node => node.type === 'button' && /log\s?in/i.test(content(node)))
    assert.equal(buttons.length, 1)
    buttons[0].props.onClick()
    assert.equal(harness.sideEffects.logins, 1)
    assert.equal(nodes(harness.tree, node => node.type === 'a' && node.props.href === '/hiring-firms').length, 0)
    assert.equal(harness.sideEffects.requests.length, 0)
    assert.equal(harness.sideEffects.analytics.length, 0)
    assert.equal(harness.sideEffects.signupCompleted.length, 0)
    assert.equal(harness.sideEffects.sdkReads, 0)
  }
})

test('authenticated welcome renders shared first-value guide without new-user marketing for returning members', async () => {
  const harness = createHarness('../app/welcome/WelcomeActivation.tsx', 'WelcomeActivation', { isAuthenticated: true })
  harness.render({ isNewUser: false })
  await harness.settle()
  const links = nodes(harness.tree, node => node.type === 'a').map(node => node.props.href)
  for (const href of ['/hiring-firms', '/roles/inspector', '/profile']) assert.ok(links.includes(href))
  assert.match(content(harness.tree), /Synthetic Inspector/)
  assert.match(content(harness.tree), /Your profile is private to you/)
  assert.equal(harness.sideEffects.requests.length, 0)
  assert.equal(harness.sideEffects.signupCompleted.length, 0)
  assert.equal(harness.sideEffects.analytics.length, 0)
})

test('authenticated new-member welcome preserves existing signup and activation effects once per mount', async () => {
  const harness = createHarness('../app/welcome/WelcomeActivation.tsx', 'WelcomeActivation', { isAuthenticated: true })
  harness.render({ isNewUser: true })
  await harness.settle()
  harness.render({ isNewUser: true })
  await harness.settle()
  assert.equal(harness.sideEffects.analytics.length, 1)
  assert.equal(harness.sideEffects.analytics[0][0], 'event')
  assert.equal(harness.sideEffects.analytics[0][1], 'sign_up')
  assert.deepEqual(harness.sideEffects.signupCompleted, ['free'])
  assert.equal(harness.sideEffects.requests.length, 1)
  assert.equal(harness.sideEffects.requests[0].url, '/api/ac/tag')
  assert.equal(harness.sideEffects.requests[0].options.method, 'POST')
  assert.deepEqual(JSON.parse(harness.sideEffects.requests[0].options.body), { tag: 'member-activated' })
})

test('quick actions describe available work and honest member-tool access without false map or volume promises', () => {
  const cardParts = Object.fromEntries(['Card', 'CardHeader', 'CardTitle', 'CardContent'].map(name => [name, props => element('div', props)]))
  const { QuickActions } = load('../components/dashboard/QuickActions.tsx', { '@/components/ui/card': cardParts })
  const tree = expand(QuickActions())
  const links = nodes(tree, node => node.type === 'a')
  assert.deepEqual(links.map(node => node.props.href), ['/hiring-firms', '/jobs', '/profile', '/tools'])
  assert.doesNotMatch(content(tree), /View Map|Explore firms near you|50\+|new leads/)
  assert.match(content(tree), /private profile/)
  assert.match(content(links.find(node => node.props.href === '/tools')), /Member Tools.*calculators.*access/)
})
