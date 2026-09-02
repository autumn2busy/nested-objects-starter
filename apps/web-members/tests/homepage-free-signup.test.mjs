import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const jsxRuntime = require('react/jsx-runtime')
const placements = ['home_hero', 'home_mobile', 'home_starter', 'home_final']
const freeSignupUrl = 'https://nested-objects.outseta.com/auth?widgetMode=register&planUid=L9nbKV9Z&skipPlanOptions=true'

// Execute actual CTA, homepage, hero, and plan-identifier source. Auth and the
// existing intent tracker are synthetic; no browser, SDK, storage, or network
// globals are provided, so no account or marketing changes can happen here.
function load(relativePath, imports = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports,
    require(name) {
      if (name === 'react/jsx-runtime') return jsxRuntime
      if (name === 'lucide-react') return require('lucide-react')
      if (name === 'next/link') return { default: props => React.createElement('a', props) }
      assert.ok(Object.hasOwn(imports, name), `Unexpected import in ${relativePath}: ${name}`)
      return imports[name]
    },
  })
  return exports
}

const planConfig = load('../lib/plan-config.ts')

function createHarness(auth = {}, { trackingThrows = false } = {}) {
  const events = []
  const cta = load('../components/FreeSignupCta.tsx', {
    '@/components/auth-provider': { useAuth: () => ({ isLoading: false, isAuthenticated: false, ...auth }) },
    '@/lib/plan-config': planConfig,
    '@/lib/ac-events': {
      trackJoinFreeClick(payload) {
        events.push(JSON.parse(JSON.stringify(payload)))
        if (trackingThrows) throw new Error('Synthetic analytics unavailable')
      },
    },
  })
  return {
    events,
    cta,
    render: (placement = 'home_hero') => cta.FreeSignupCta({ placement, className: 'synthetic-cta-style' }),
    homepage() {
      const hero = load('../components/TechHero.tsx', { '@/components/FreeSignupCta': cta })
      const page = load('../app/page.tsx', {
        '@/components/FreeSignupCta': cta,
        '@/components/TechHero': hero,
        '@/components/RoleCarousel': { RoleCarousel: () => null },
        '@/components/TestimonialsSection': { TestimonialsSection: () => null, TestimonialStrip: () => null },
        '@/lib/testimonials': { TESTIMONIALS: [], getAverageRating: () => 0 },
      })
      return expand(page.default())
    },
  }
}

function expand(node) {
  if (Array.isArray(node)) return node.flatMap(expand)
  if (!React.isValidElement(node)) return node
  if (typeof node.type === 'function') return expand(node.type(node.props))
  return { type: node.type, props: { ...node.props, children: expand(node.props.children) } }
}

function nodes(tree, predicate) {
  if (Array.isArray(tree)) return tree.flatMap(node => nodes(node, predicate))
  if (tree == null || typeof tree !== 'object' || !tree.props) return []
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props.children, predicate)]
}

function content(tree) {
  if (Array.isArray(tree)) return tree.map(content).join(' ')
  if (tree == null || typeof tree === 'boolean') return ''
  if (typeof tree === 'object') return content(tree.props?.children)
  return String(tree)
}

function clickEvent(overrides = {}) {
  return {
    button: 0, detail: 1, defaultPrevented: false,
    ctrlKey: false, metaKey: false, shiftKey: false, altKey: false,
    preventDefaultCalls: 0,
    propagationStops: 0,
    preventDefault() { this.preventDefaultCalls += 1; this.defaultPrevented = true },
    stopPropagation() { this.propagationStops += 1 },
    ...overrides,
  }
}

function assertNativeNavigation(event) {
  assert.equal(event.preventDefaultCalls, 0)
  assert.equal(event.propagationStops, 0)
}

test('visitor CTA is a native direct Free registration link with no SDK or plan-selection dependency', () => {
  const harness = createHarness()
  const link = harness.render()
  assert.equal(planConfig.PLAN_UIDS.FREE, 'L9nbKV9Z')
  assert.equal(link.type, 'a')
  assert.equal(link.props.href, freeSignupUrl)
  assert.match(content(link), /^Start free/)
  assert.match(link.props.className, /synthetic-cta-style/)
  assert.match(link.props.className, /focus-visible:/)
  const html = renderToStaticMarkup(link)
  assert.match(html, /^<a /)
  assert.doesNotMatch(html, /membership-pricing|planFamilyUid|planPaymentTerm|rQVqlLm6/)
  assert.equal(harness.events.length, 0, 'Rendering must not record signup intent')
})

test('each deliberate pointer or keyboard click records one existing intent event and leaves navigation native', () => {
  for (const placement of placements) {
    const harness = createHarness()
    const link = harness.render(placement)
    for (const overrides of [{}, { detail: 0 }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }]) {
      const event = clickEvent(overrides)
      const before = harness.events.length
      link.props.onClick(event)
      assert.equal(harness.events.length, before + 1)
      assert.deepEqual(harness.events.at(-1), {
        sourcePage: 'homepage', source: placement, targetPlan: 'Free', targetPlanUid: planConfig.PLAN_UIDS.FREE,
      })
      assertNativeNavigation(event)
      assert.equal(link.props.href, freeSignupUrl)
    }
  }
})

test('middle-click tracks once through auxclick and right-click or canceled navigation does not track', () => {
  const harness = createHarness()
  const link = harness.render()
  const middle = clickEvent({ button: 1 })
  link.props.onClick(middle)
  assert.equal(harness.events.length, 0)
  link.props.onAuxClick(middle)
  assert.equal(harness.events.length, 1)
  assertNativeNavigation(middle)
  for (const event of [clickEvent({ button: 2 }), clickEvent({ defaultPrevented: true }), clickEvent({ button: 1, defaultPrevented: true })]) {
    link.props.onClick(event)
    link.props.onAuxClick(event)
    assert.equal(harness.events.length, 1)
    assertNativeNavigation(event)
  }
  link.props.onAuxClick(clickEvent({ button: 0 }))
  assert.equal(harness.events.length, 1, 'Primary activation must not duplicate through auxiliary handling')
})

test('an analytics exception cannot cancel or replace hosted Free navigation', () => {
  const harness = createHarness({}, { trackingThrows: true })
  const link = harness.render()
  for (const [handler, event] of [['onClick', clickEvent()], ['onAuxClick', clickEvent({ button: 1 })]]) {
    assert.doesNotThrow(() => link.props[handler](event))
    assertNativeNavigation(event)
    assert.equal(link.props.href, freeSignupUrl)
  }
  assert.equal(harness.events.length, 2)
})

test('signed-in members of every tier receive a dashboard link and no signup events', () => {
  for (const planUid of Object.values(planConfig.PLAN_UIDS)) {
    const harness = createHarness({ isAuthenticated: true, planUid })
    const link = harness.render()
    assert.equal(link.type, 'a')
    assert.equal(link.props.href, '/inspector-dashboard')
    assert.match(content(link), /^Open my dashboard/)
    for (const [handler, event] of [['onClick', clickEvent()], ['onAuxClick', clickEvent({ button: 1 })]]) {
      link.props[handler](event)
      assertNativeNavigation(event)
    }
    assert.equal(harness.events.length, 0)
  }
})

test('unresolved auth renders an inert accessible control, never a premature registration link', () => {
  for (const isAuthenticated of [false, true]) {
    const harness = createHarness({ isLoading: true, isAuthenticated })
    const button = harness.render()
    assert.equal(button.type, 'button')
    assert.equal(button.props.type, 'button')
    assert.equal(button.props.disabled, true)
    assert.equal(button.props['aria-busy'], 'true')
    assert.equal(button.props.href, undefined)
    assert.equal(button.props.onClick, undefined)
    assert.equal(button.props.onAuxClick, undefined)
    assert.match(content(button), /Checking sign-in/)
    assert.equal(harness.events.length, 0)
  }
})

test('real homepage and hero mount four consistent Free entry points with separate plan comparison links', () => {
  for (const auth of [{}, { isAuthenticated: true }, { isLoading: true }]) {
    const harness = createHarness(auth)
    const tree = harness.homepage()
    const ctas = nodes(tree, node => node.props['data-cta-placement'])
    assert.deepEqual(ctas.map(node => node.props['data-cta-placement']), placements)
    for (const cta of ctas) {
      if (auth.isLoading) {
        assert.equal(cta.type, 'button')
        assert.equal(cta.props.disabled, true)
        assert.equal(cta.props.href, undefined)
      } else {
        assert.equal(cta.type, 'a')
        assert.equal(cta.props.href, auth.isAuthenticated ? '/inspector-dashboard' : freeSignupUrl)
        assert.match(content(cta), auth.isAuthenticated ? /^Open my dashboard/ : /^Start free/)
      }
    }
    const comparisons = nodes(tree, node => node.type === 'a' && node.props.href === '/membership-pricing')
    assert.ok(comparisons.filter(node => /Compare membership plans/.test(content(node))).length >= 3)
    assert.ok(comparisons.every(node => !/Start free|Start the 7-day Pro trial/i.test(content(node))))
    assert.doesNotMatch(content(tree), /Start the 7-day Pro trial/)
    assert.equal(harness.events.length, 0)
    if (!auth.isAuthenticated && !auth.isLoading) {
      ctas.forEach(cta => cta.props.onClick(clickEvent()))
      assert.deepEqual(harness.events.map(event => event.source), placements)
    }
  }
})
