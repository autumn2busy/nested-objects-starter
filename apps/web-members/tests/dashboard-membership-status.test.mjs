import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const React = require('react')
const jsx = require('react/jsx-runtime')
const { renderToStaticMarkup } = require('react-dom/server')
function load(path, imports = {}) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require(name) {
    if (name === 'react/jsx-runtime') return jsx
    if (name in imports) return imports[name]
    throw Error(`Unexpected import ${name}`)
  } })
  return exports
}
const plans = load('../lib/plan-config.ts')
const Box = ({ children }) => React.createElement('div', null, children)
const Empty = () => null
function render(auth) {
  const stats = { trustTier: 'silver', trustScore: 50, pipeline: { active: 0 }, platform: { totalJobListings: 0, totalFirms: 0 }, accountAgeDays: 10 }
  const state = [stats, false, null]
  const { DashboardView } = load('../components/dashboard/dashboard-view.tsx', {
    react: { useEffect() {}, useState: () => [state.shift(), () => {}] },
    'next/link': { default: Box },
    '@/components/ui/card': { Card: Box, CardContent: Box, CardHeader: Box, CardTitle: Box },
    '@/components/dashboard/QuickActions': { QuickActions: Empty },
    '@/components/IndustryNews': { IndustryNews: Empty },
    '@/components/auth-provider': { useAuth: () => ({ isAuthenticated: true, isLoading: false, refreshAuth() {}, ...auth }) },
    '@/lib/plan-config': plans,
    'lucide-react': Object.fromEntries(['CheckCircle', 'Briefcase', 'GraduationCap', 'Shield', 'TrendingUp', 'Loader2', 'AlertCircle', 'Star'].map(key => [key, Empty])),
    '@/components/onboarding/onboarding-widget': { OnboardingWidget: Empty },
  })
  return renderToStaticMarkup(React.createElement(DashboardView, { showOnboarding: false }))
}
for (const [uid, name] of Object.entries(plans.PLAN_NAMES)) {
  test(`verified ${name} displays its centralized plan name`, () => {
    const html = render({ planUid: uid, membershipStatus: 'verified' })
    assert.match(html, />Active</)
    assert.ok(html.includes(`>${name}</span>`))
    assert.doesNotMatch(html, /Membership not confirmed|Check again/)
  })
}
for (const status of ['unknown', 'unavailable', null]) {
  test(`${status} membership never falls back to Active Free or a stale Elite grant`, () => {
    const html = render({ membershipStatus: status, planUid: plans.PLAN_UIDS.ELITE })
    assert.match(html, /Membership not confirmed/)
    assert.match(html, /You are still signed in/)
    assert.match(html, /Check again/)
    assert.doesNotMatch(html, />Active<|>Free<|>Elite<|Elite Exclusive Perks/)
  })
}
test('verified status with an unrecognized plan remains unconfirmed', () => {
  assert.match(render({ membershipStatus: 'verified', planUid: 'unknown' }), /Membership not confirmed/)
})
test('expired, loading and signed-out states are distinct from Active Free', () => {
  for (const [auth, message] of [
    [{ membershipStatus: 'expired' }, 'Subscription ended'],
    [{ isLoading: true }, 'Checking membership'],
    [{ isAuthenticated: false }, 'Sign in to check membership'],
  ]) {
    const html = render(auth)
    assert.ok(html.includes(message))
    assert.doesNotMatch(html, />Active<|>Free</)
  }
})
