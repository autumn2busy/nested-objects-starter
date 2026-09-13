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

test('only catalogued member-tool paths are allowlisted, with an optional trailing slash', () => {
  for (const path of Object.values(access.MEMBER_TOOL_PATHS)) {
    assert.equal(access.isEnabledMemberToolPath(path), true)
    assert.equal(access.isEnabledMemberToolPath(`${path}/`), true)
  }

  for (const path of [
    '/tools',
    '/tools/unknown',
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

test('Free is calculator-only, Pro receives its core tools, and Elite receives every tool', () => {
  const allTools = Object.values(access.MEMBER_TOOL_IDS)
  for (const tool of allTools) {
    assert.equal(
      access.canAccessMemberTool(plans.PLAN_UIDS.FREE, tool),
      tool === access.MEMBER_TOOL_IDS.INCOME_SCENARIO,
      `Free:${tool}`,
    )
  }

  for (const tool of allTools) {
    assert.equal(
      access.canAccessMemberTool(plans.PLAN_UIDS.PRO, tool),
      tool !== access.MEMBER_TOOL_IDS.ROUTE_ECONOMICS,
      `Pro:${tool}`,
    )
    assert.equal(access.canAccessMemberTool(plans.PLAN_UIDS.ELITE, tool), true, `Elite:${tool}`)
    assert.equal(access.canAccessMemberTool(plans.PLAN_UIDS.AGENCY, tool), true, `Agency:${tool}`)
  }
})

test('legacy paid plans retain their promised core tools without receiving current Pro route tools', () => {
  const legacyCore = new Set([
    access.MEMBER_TOOL_IDS.INCOME_SCENARIO,
    access.MEMBER_TOOL_IDS.CLIENT_WORKSPACE,
    access.MEMBER_TOOL_IDS.COMPANY_TRACKER,
    access.MEMBER_TOOL_IDS.AI_CONCIERGE,
    access.MEMBER_TOOL_IDS.AI_RESUME,
    access.MEMBER_TOOL_IDS.JOB_TRACKER,
  ])

  for (const planUid of [plans.PLAN_UIDS.STARTER, plans.PLAN_UIDS.FOUNDERS]) {
    for (const tool of Object.values(access.MEMBER_TOOL_IDS)) {
      assert.equal(access.canAccessMemberTool(planUid, tool), legacyCore.has(tool), `${planUid}:${tool}`)
    }
  }
})

const incomePath = '/tools/income-calculator'
const legacyPaths = [incomePath, '/tools/clients', '/tools/companies', '/tools/ai-concierge', '/tools/ai-resume', '/tools/job-tracker']
const proPaths = [...legacyPaths, '/tools/weather', '/tools/routing']
const allPaths = [...proPaths, '/tools/notary-route-calculator']
const roleMatrix = [
  { name: 'Free', planUid: plans.PLAN_UIDS.FREE, paths: [incomePath] },
  { name: 'Pro', planUid: plans.PLAN_UIDS.PRO, paths: proPaths },
  { name: 'Elite', planUid: plans.PLAN_UIDS.ELITE, paths: allPaths },
  { name: 'Agency', planUid: plans.PLAN_UIDS.AGENCY, paths: allPaths },
  { name: 'Starter', planUid: plans.PLAN_UIDS.STARTER, paths: legacyPaths },
  { name: 'Founders', planUid: plans.PLAN_UIDS.FOUNDERS, paths: legacyPaths },
]

function loadCatalog(auth) {
  const catalog = load('../app/tools/ToolsView.tsx', {
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    '@/components/auth-provider': { useAuth: () => auth },
    '@/components/ui/button': { buttonVariants: () => 'button' },
    '@/components/ui/card': { Card: ({ children, ...props }) => React.createElement('article', props, children) },
    '@/lib/member-tool-access': access,
  })

  return {
    element: catalog.ToolsView(),
    html: renderToStaticMarkup(React.createElement(catalog.ToolsView)),
  }
}

const countLabel = (html, label) => (html.match(new RegExp(`>${label}<`, 'g')) ?? []).length
const toolLinks = (html) => [...html.matchAll(/href="(\/tools\/[^"?#]+)"/g)].map((match) => match[1])

for (const role of roleMatrix) {
  test(`${role.name} catalog links match its exact supported routes`, () => {
    const { html } = loadCatalog({ isAuthenticated: true, isLoading: false, planUid: role.planUid, login() {} })
    assert.deepEqual(toolLinks(html), [incomePath, ...role.paths], 'Header and card destinations')
    assert.equal(countLabel(html, 'Included'), role.paths.length)
    assert.equal(countLabel(html, 'Compare plans'), 9 - role.paths.length)
    assert.doesNotMatch(html, /Not yet enabled|Planned|Checking member access/)
  })
}

for (const planUid of [null, 'unknown-plan']) {
  test(`unconfirmed plan ${planUid} never offers an open-tool header or card`, () => {
    const { html } = loadCatalog({ isAuthenticated: true, isLoading: false, planUid, login() {} })
    assert.deepEqual(toolLinks(html), [])
    assert.match(html, /We could not confirm your member plan/)
    assert.match(html, /href="\/membership-pricing"/)
    assert.equal(countLabel(html, 'Included'), 0)
  })
}

for (const isAuthenticated of [false, true]) {
  test(`loading catalog with authenticated=${isAuthenticated} offers no premature access`, () => {
    const { html } = loadCatalog({ isAuthenticated, isLoading: true, planUid: plans.PLAN_UIDS.ELITE, login() {} })
    assert.deepEqual(toolLinks(html), [])
    assert.equal((html.match(/disabled=""/g) ?? []).length, 10, 'Header and all nine cards wait')
    assert.equal(countLabel(html, 'Included'), 0, 'Stale plan claims do not appear confirmed while loading')
    assert.doesNotMatch(html, /Sign in to use/)
  })
}

test('visitor catalog keeps every sign-in action wired to the existing login handler', () => {
  let logins = 0
  const { element, html } = loadCatalog({
    isAuthenticated: false, isLoading: false, planUid: plans.PLAN_UIDS.ELITE, login() { logins += 1 },
  })
  assert.deepEqual(toolLinks(html), [], 'Untrusted stale plan cannot offer tool access')
  assert.equal(countLabel(html, 'Sign in to use'), 9)
  assert.equal(countLabel(html, 'Sign in to use member tools'), 1)
  const visit = (node) => {
    if (!React.isValidElement(node)) return
    if (node.type === 'button') node.props.onClick()
    React.Children.forEach(node.props.children, visit)
  }
  visit(element)
  assert.equal(logins, 10)
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

// Exercise each real route and the shared server gate. Tool bodies are inert
// markers: this matrix cannot contact providers or imply hosted acceptance.
const routeBodies = {
  '/tools/income-calculator': ['./IncomeScenarioCalculator', 'IncomeScenarioCalculator'],
  '/tools/clients': ['./ClientWorkspace', 'ClientWorkspace'],
  '/tools/companies': ['./CompanyTracker', 'CompanyTracker'],
  '/tools/ai-concierge': ['@/components/ChatWidget', 'default'],
  '/tools/ai-resume': ['@/components/tools/ResumeBuilder', 'default'],
  '/tools/weather': ['./WeatherWorkspace', 'WeatherWorkspace'],
  '/tools/routing': ['./RoutePlanner', 'RoutePlanner'],
  '/tools/notary-route-calculator': ['./NotaryRouteCalculator', 'NotaryRouteCalculator'],
}

async function resolveServerTree(node) {
  if (!React.isValidElement(node)) return node
  if (typeof node.type === 'function') return resolveServerTree(await node.type(node.props))
  const children = []
  for (const child of React.Children.toArray(node.props.children)) children.push(await resolveServerTree(child))
  return React.cloneElement(node, undefined, ...children)
}

for (const path of allPaths) {
  test(`${path} preserves the complete role and recovery navigation matrix`, async (t) => {
    let currentUser = null
    let bodyRenders = 0
    const commonImports = {
      'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
      'next/navigation': { redirect(url) { throw new Error(`redirect:${url}`) } },
      '@/lib/auth-server': { getCurrentUser: async () => currentUser },
      '@/lib/member-tool-access': access,
    }
    const message = load('../app/tools/_components/ToolAccessMessage.tsx', { ...commonImports, react: React })
    const gate = load('../app/tools/_components/MemberToolPageAccess.tsx', {
      ...commonImports, './ToolAccessMessage': message,
    })
    const body = routeBodies[path]
    const page = load(`../app${path}/page.tsx`, {
      ...commonImports,
      '../_components/ToolAccessMessage': message,
      '../_components/MemberToolPageAccess': gate,
      ...(body ? { [body[0]]: { [body[1]]: () => {
        bodyRenders += 1
        return React.createElement('div', { 'data-tool-body': path })
      } } } : {}),
    })
    assert.equal(page.dynamic, 'force-dynamic')
    assert.equal(page.revalidate, 0)

    const cases = [
      { name: 'visitor', visitor: true, paths: [] },
      { name: 'missing plan', planUid: null, paths: [] },
      { name: 'unknown plan', planUid: 'unknown-plan', paths: [] },
      ...roleMatrix,
    ]
    for (const role of cases) {
      await t.test(role.name, async () => {
        currentUser = role.visitor ? null : { sub: 'invented-member', 'outseta:planUid': role.planUid }
        bodyRenders = 0
        const render = async () => renderToStaticMarkup(await resolveServerTree(await page.default()))
        if (role.visitor) {
          await assert.rejects(render(), /redirect:https:\/\/nested-objects\.outseta\.com\/auth/)
          assert.equal(bodyRenders, 0)
        } else if (!role.paths.includes(path)) {
          const html = await render()
          assert.equal(bodyRenders, 0, 'Denied tools never render their body')
          assert.match(html, /href="\/tools"[^>]*>Back to tools</)
          assert.match(html, /href="\/membership-pricing"/)
          assert.doesNotMatch(html, /data-tool-body/)
        } else if (path === '/tools/job-tracker') {
          await assert.rejects(render(), /^Error: redirect:\/jobs\?tab=tracker$/)
        } else {
          const html = await render()
          assert.equal(bodyRenders, 1)
          assert.ok(html.includes(`data-tool-body="${path}"`))
        }
      })
    }
  })
}

test('legacy job-tracking URL leads to the same guarded catalog destination', () => {
  const page = load('../app/tools/job-tracking/page.tsx', {
    'next/navigation': { redirect(url) { throw new Error(`redirect:${url}`) } },
  })
  assert.throws(() => page.default(), /^Error: redirect:\/tools\/job-tracker$/)
})

test('calculator privacy copy accurately distinguishes input handling and analytics', () => {
  const unchangedFiles = [
    '../app/tools/ToolsView.tsx',
    '../app/tools/notary-route-calculator/NotaryRouteCalculator.tsx',
  ]

  for (const relativePath of unchangedFiles) {
    const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
    assert.match(source, /normal site\s+analytics may\s+record/i, relativePath)
    assert.doesNotMatch(source, /values stay in (?:this|your) browser|do not submit the values/i, relativePath)
  }

  const incomeSource = readFileSync(
    new URL('../app/tools/income-calculator/IncomeScenarioCalculator.tsx', import.meta.url),
    'utf8',
  )
  assert.match(incomeSource, /numeric assumptions and calculated results stay in this browser/i)
  assert.match(incomeSource, /completion milestone for your member account/i)
  assert.match(incomeSource, /without those\s+numbers or results/i)
  assert.match(incomeSource, /normal site analytics may record/i)
})
