import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const jsxRuntime = require('react/jsx-runtime')
const ts = require('typescript')

function load(relativePath, imports = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports,
    console,
    require(name) {
      if (name === 'react/jsx-runtime') return jsxRuntime
      if (name in imports) return imports[name]
      throw new Error(`Unexpected import in ${relativePath}: ${name}`)
    },
  })
  return exports
}

const plans = load('../lib/plan-config.ts')
const access = load('../lib/member-tool-access.ts', { './plan-config': plans })
const knownPlans = Object.values(plans.PLAN_UIDS)

test('only the two reviewed calculator paths are allowlisted, with an optional trailing slash', () => {
  for (const path of Object.values(access.MEMBER_TOOL_PATHS)) {
    assert.equal(access.isEnabledMemberToolPath(path), true)
    assert.equal(access.isEnabledMemberToolPath(`${path}/`), true)
  }

  for (const path of [
    '/tools',
    '/tools/weather',
    '/tools/income-calculator/example',
    '/tools/income-calculator//',
    '/tools/income-calculator?source=test',
    '/TOOLS/income-calculator',
  ]) {
    assert.equal(access.isEnabledMemberToolPath(path), false, path)
  }
})

test('income scenarios allow every known member plan and deny missing or unknown plans', () => {
  for (const planUid of knownPlans) {
    assert.equal(access.canAccessMemberTool(planUid, access.MEMBER_TOOL_IDS.INCOME_SCENARIO), true, planUid)
  }
  for (const planUid of [null, undefined, '', 'unknown-plan']) {
    assert.equal(access.canAccessMemberTool(planUid, access.MEMBER_TOOL_IDS.INCOME_SCENARIO), false)
  }
})

test('route economics allows only Elite and Agency', () => {
  for (const planUid of knownPlans) {
    const expected = planUid === plans.PLAN_UIDS.ELITE || planUid === plans.PLAN_UIDS.AGENCY
    assert.equal(access.canAccessMemberTool(planUid, access.MEMBER_TOOL_IDS.ROUTE_ECONOMICS), expected, planUid)
  }
})

test('unknown tool identifiers fail closed at runtime', () => {
  assert.equal(access.canAccessMemberTool(plans.PLAN_UIDS.AGENCY, 'unknown-tool'), false)
})

function loadPage(relativePath, calculatorImport, calculatorExport) {
  let currentUser = null
  const page = load(relativePath, {
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    'next/navigation': { redirect(url) { throw new Error(`redirect:${url}`) } },
    '../_components/ToolAccessMessage': {
      ToolAccessMessage: ({ title, description, actions }) => React.createElement('section', null, title, description, actions),
    },
    [calculatorImport]: {
      [calculatorExport]: () => React.createElement('div', { 'data-calculator': calculatorExport }),
    },
    '@/lib/auth-server': { getCurrentUser: async () => currentUser },
    '@/lib/member-tool-access': access,
  })

  return {
    page,
    signIn(planUid) { currentUser = { 'outseta:planUid': planUid } },
    signOut() { currentUser = null },
  }
}

test('income page verifies the server session before rendering the calculator', async () => {
  const route = loadPage(
    '../app/tools/income-calculator/page.tsx',
    './IncomeScenarioCalculator',
    'IncomeScenarioCalculator',
  )
  await assert.rejects(route.page.default(), /redirect:https:\/\/nested-objects\.outseta\.com\/auth/)

  route.signIn(plans.PLAN_UIDS.FREE)
  const html = renderToStaticMarkup(await route.page.default())
  assert.match(html, /Income scenario planner/)
  assert.match(html, /data-calculator="IncomeScenarioCalculator"/)
  assert.equal(route.page.dynamic, 'force-dynamic')
  assert.equal(route.page.revalidate, 0)
  assert.equal(route.page.metadata.robots.index, false)
})

test('route page server-enforces Elite and Agency access', async () => {
  const route = loadPage(
    '../app/tools/notary-route-calculator/page.tsx',
    './NotaryRouteCalculator',
    'NotaryRouteCalculator',
  )
  await assert.rejects(route.page.default(), /redirect:https:\/\/nested-objects\.outseta\.com\/auth/)

  route.signIn(plans.PLAN_UIDS.PRO)
  const denied = renderToStaticMarkup(await route.page.default())
  assert.match(denied, /included with Elite and Agency/)
  assert.doesNotMatch(denied, /data-calculator=/)

  for (const allowedPlan of [plans.PLAN_UIDS.ELITE, plans.PLAN_UIDS.AGENCY]) {
    route.signIn(allowedPlan)
    const allowed = renderToStaticMarkup(await route.page.default())
    assert.match(allowed, /Route economics calculator/)
    assert.match(allowed, /data-calculator="NotaryRouteCalculator"/)
  }
  assert.equal(route.page.dynamic, 'force-dynamic')
  assert.equal(route.page.revalidate, 0)
  assert.equal(route.page.metadata.robots.index, false)
})

test('calculator privacy copy discloses normal page analytics and avoids absolute no-tracking claims', () => {
  const files = [
    '../app/tools/ToolsView.tsx',
    '../app/tools/income-calculator/IncomeScenarioCalculator.tsx',
    '../app/tools/notary-route-calculator/NotaryRouteCalculator.tsx',
  ]

  for (const relativePath of files) {
    const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
    assert.match(source, /normal site\s+analytics may\s+record/i, relativePath)
    assert.doesNotMatch(source, /values stay in (?:this|your) browser|do not submit the values/i, relativePath)
  }
})
