import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const Fragment = Symbol('Fragment')
const jsx = (type, props) => ({ type, props })
const jsxRuntime = { Fragment, jsx, jsxs: jsx }

function load(relativePath, imports = {}, globals = {}) {
    const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
    const result = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.ReactJSX,
        },
        reportDiagnostics: true,
    })
    const errors = (result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error)
    assert.equal(errors.length, 0, `Transpile errors in ${relativePath}`)
    const exports = {}
    vm.runInNewContext(result.outputText, {
        exports,
        console,
        ...globals,
        require(name) {
            if (name === 'react/jsx-runtime') return jsxRuntime
            if (name in imports) return imports[name]
            throw new Error(`Unexpected import: ${name}`)
        },
    })
    return exports
}

const plans = load('../lib/plan-config.ts')
const children = { type: 'a', props: { href: 'https://example.test/apply' } }

function components(authOverrides = {}) {
    const calls = []
    const window = { location: { href: '/firms/example' } }
    const auth = {
        isAuthenticated: true,
        isLoading: false,
        planUid: plans.PLAN_UIDS.FOUNDERS,
        // Model the existing Pro-only feature rule so the regression is
        // specific to legacy directory plans rather than all paid plans.
        hasAccess: feature => feature === 'firm_intel' && plans.PRO_OR_HIGHER.includes(auth.planUid),
        login: () => calls.push('login'),
        ...authOverrides,
    }
    const imports = {
        '@/components/auth-provider': { useAuth: () => auth },
        'next/link': { default: props => jsx('a', props) },
        'lucide-react': { Lock: () => null },
        '@/lib/plan-config': plans,
        '@/lib/ac-events': {
            trackPaywallHit: () => calls.push('paywall'),
            trackUpgradeClicked: () => calls.push('upgrade'),
        },
    }
    imports['@/components/BlurGate'] = load('../components/BlurGate.tsx', imports)
    const render = element => {
        while (element && typeof element.type === 'function') element = element.type(element.props)
        return element
    }
    return {
        render,
        ...load('../app/firms/[slug]/FirmGatedContent.tsx', imports),
        ...load('../app/firms/[slug]/AuthCTA.tsx', imports, { window }),
        calls,
        window,
    }
}

for (const [label, planUid] of Object.entries(plans.PLAN_UIDS)) {
    const eligible = plans.PAID_PLANS.includes(planUid)
    for (const componentName of ['FirmGatedContent', 'AuthCTA']) {
        test(`${componentName}: ${label} matches the server paid-plan allowlist`, () => {
            const c = components({ planUid })
            const result = c.render(c[componentName]({ children }))
            assert.equal(result.type === Fragment, eligible)
            if (eligible) {
                assert.equal(result.props.children, children)
                assert.deepEqual(c.calls, [])
                assert.equal(c.window.location.href, '/firms/example')
            }
        })
    }
}

for (const planUid of [null, undefined, '', 'unknown-plan']) {
    test(`missing/unknown plan ${String(planUid)} does not grant firm actions or details`, () => {
        const c = components({ planUid })
        assert.notEqual(c.render(c.FirmGatedContent({ children })).type, Fragment)
        assert.notEqual(c.AuthCTA({ children }).type, Fragment)
    })
}

test('signed-out users cannot use a leftover Elite plan value for access', () => {
    const c = components({ isAuthenticated: false, planUid: plans.PLAN_UIDS.ELITE })
    assert.notEqual(c.render(c.FirmGatedContent({ children })).type, Fragment)
    const result = c.AuthCTA({ children })
    assert.notEqual(result.type, Fragment)
    result.props.onClick({ preventDefault() {}, stopPropagation() {} })
    assert.deepEqual(c.calls, ['paywall', 'login'])
    assert.equal(c.window.location.href, '/firms/example')
})

test('loading does not flash firm intelligence or an actionable application link', () => {
    const c = components({ isLoading: true, planUid: plans.PLAN_UIDS.ELITE })
    const result = c.render(c.FirmGatedContent({ children }))
    assert.equal(result.props.role, 'status')
    assert.notEqual(result.props.children, children)
    assert.equal(c.AuthCTA({ children }), null)
})

test('Free member application attempts still navigate to pricing', () => {
    const c = components({ planUid: plans.PLAN_UIDS.FREE })
    c.AuthCTA({ children }).props.onClick({ preventDefault() {}, stopPropagation() {} })
    assert.deepEqual(c.calls, ['paywall', 'upgrade'])
    assert.equal(c.window.location.href, '/membership-pricing')
})

test('this directory correction does not make legacy plans Pro or publicly purchasable', () => {
    for (const planUid of [plans.PLAN_UIDS.STARTER, plans.PLAN_UIDS.FOUNDERS]) {
        assert.equal(plans.PRO_OR_HIGHER.includes(planUid), false)
        assert.equal(plans.PUBLIC_PLAN_UIDS.includes(planUid), false)
    }
})
