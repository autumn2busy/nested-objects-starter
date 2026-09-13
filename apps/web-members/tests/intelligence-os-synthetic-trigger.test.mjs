import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const compile = (path, jsx = false) => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, ...(jsx ? { jsx: ts.JsxEmit.ReactJSX } : {}) },
}).outputText
const helperCode = compile('../lib/intelligence-os-admin.ts')
const actionCode = compile('../app/(portal)/admin/intelligence-os/actions.ts')
const pageCode = compile('../app/(portal)/admin/intelligence-os/page.tsx', true)
const comparisonCode = compile('../app/(portal)/admin/intelligence-os/OperatingReviewComparison.tsx', true)
const comparisonHelperCode = compile('../lib/intelligence-review-comparison.ts')
const scenario = 'specialist-review-v1'

function harness() {
  const env = {
    VERCEL_ENV: 'preview', INTELLIGENCE_OS_ADMIN_ENABLED: 'true',
    INTELLIGENCE_OS_ADMIN_SHARED_SECRET: 'synthetic-shared-secret-'.repeat(3),
    INTELLIGENCE_OS_AUTUMN_SUBJECT_ID: 'synthetic-owner',
    INTELLIGENCE_OS_ADMIN_ALLOWED_ORIGIN: 'https://synthetic-members.vercel.app',
    INTELLIGENCE_OS_AGENT_RUNTIME_URL: 'https://synthetic-runtime.vercel.app',
  }
  const state = { user: { sub: 'synthetic-owner' }, origin: env.INTELLIGENCE_OS_ADMIN_ALLOWED_ORIGIN, fetchSite: 'same-origin' }
  const requests = []
  const helper = {}
  const snapshot = {
    generatedAt: '2026-09-08T12:00:00.000Z', runs: [], unresolvedSignals: [], awaitingActions: [],
    sourceWarnings: [], topPriorities: [], experiments: [], reviews: [], delegationEnabled: false, executionEnabled: false,
  }
  vm.runInNewContext(helperCode, {
    exports: helper, process: { env }, URL, Buffer, AbortSignal,
    fetch: async (url, options) => {
      requests.push({ url, options })
      return Response.json(options.method === 'GET' ? { ok: true, snapshot } : {
        workflowName: JSON.parse(options.body).workflowName, status: 'queued', correlationId: 'synthetic-correlation',
      })
    },
    require(name) {
      if (name === 'node:crypto') return require(name)
      if (name === 'next/headers') return { headers: () => new Headers({ origin: state.origin, 'sec-fetch-site': state.fetchSite }) }
      if (name === '@/lib/auth-server') return { getCurrentUser: async () => state.user }
      throw new Error(`Unexpected helper dependency: ${name}`)
    },
  })
  const actions = {}
  const redirect = location => { throw Object.assign(new Error('NEXT_REDIRECT'), { location }) }
  vm.runInNewContext(actionCode, {
    exports: actions, URLSearchParams,
    require(name) {
      if (name === '@/lib/intelligence-os-admin') return helper
      if (name === 'next/cache') return { revalidatePath: () => {} }
      if (name === 'next/navigation') return { redirect }
      throw new Error(`Unexpected action dependency: ${name}`)
    },
  })
  const page = {}
  const jsx = (type, props) => ({ type, props })
  const comparisonHelper = {}
  vm.runInNewContext(comparisonHelperCode, { exports: comparisonHelper })
  const comparison = {}
  vm.runInNewContext(comparisonCode, {
    exports: comparison,
    require(name) {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' }
      if (name === '@/lib/intelligence-review-comparison') return comparisonHelper
      throw new Error(`Unexpected comparison dependency: ${name}`)
    },
  })
  vm.runInNewContext(pageCode, {
    exports: page,
    require(name) {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' }
      if (name === '@/lib/intelligence-os-admin') return helper
      if (name === 'next/navigation') return { redirect }
      if (name === 'next/link') return { default: 'a' }
      if (name === './actions') return actions
      if (name === './OperatingReviewComparison') return comparison
      throw new Error(`Unexpected page dependency: ${name}`)
    },
  })
  function form(fixtureScenario) {
    const data = new FormData()
    data.set('formToken', helper.issueIntelligenceAdminFormToken('trigger', 'synthetic-owner'))
    data.set('triggerCategory', 'weekly')
    data.set('workflowName', 'weekly_operating_review')
    data.set('businessKey', 'synthetic-weekly:2026-09-08')
    if (fixtureScenario !== undefined) data.set('fixtureScenario', fixtureScenario)
    return data
  }
  return { env, state, requests, actions, page, form }
}

async function submit(actions, data) {
  try { await actions.startSyntheticWorkflow(data) } catch (error) {
    assert.equal(error.message, 'NEXT_REDIRECT')
    return new URL(error.location, 'https://synthetic-members.vercel.app').searchParams
  }
  assert.fail('Server action must redirect after producing an outcome')
}

test('owner form signs only the opted-in weekly scenario, preserving absent-scenario baseline', async () => {
  const h = harness()
  for (const fixtureScenario of [undefined, scenario]) {
    const response = await submit(h.actions, h.form(fixtureScenario))
    assert.equal(response.has('error'), false)
    assert.match(response.get('notice'), /synthetic evidence only/)
    const request = h.requests.at(-1)
    const body = JSON.parse(request.options.body)
    assert.deepEqual(body, {
      triggerCategory: 'weekly', workflowName: 'weekly_operating_review', businessKey: 'synthetic-weekly:2026-09-08',
      fixtureMode: 'synthetic', ...(fixtureScenario ? { fixtureScenario } : {}),
    })
    assert.equal(request.url, 'https://synthetic-runtime.vercel.app/api/admin/triggers')
    assert.match(request.options.headers['x-intelligence-signature'], /^[a-f0-9]{64}$/)
    assert.equal(request.options.redirect, 'error')
  }
  assert.equal(h.requests.length, 2)
})

test('invalid, repeated, file-valued and non-weekly scenarios fail before any request', async () => {
  const cases = [
    data => data.set('fixtureScenario', 'specialist-review-v2'),
    data => data.set('fixtureScenario', 'live'),
    data => data.set('fixtureScenario', ''),
    data => data.append('fixtureScenario', scenario),
    data => data.set('fixtureScenario', new Blob(['synthetic']), 'scenario.txt'),
    data => data.set('triggerCategory', 'manual'),
    data => { data.set('triggerCategory', 'daily'); data.set('workflowName', 'daily_business_health') },
    data => { data.set('triggerCategory', 'event'); data.set('eventType', 'upgrade'); data.set('sourceEventId', 'synthetic-event:001') },
    data => data.set('workflowName', 'conversion_review'),
  ]
  for (const change of cases) {
    const h = harness()
    const data = h.form(scenario)
    change(data)
    assert.equal((await submit(h.actions, data)).has('error'), true)
    assert.equal(h.requests.length, 0)
  }
})

test('new scenario retains owner, same-origin, token, disabled-staging and Production guards', async () => {
  for (const change of [
    h => { h.state.user = null },
    h => { h.state.user = { sub: 'synthetic-nonowner' } },
    h => { h.state.origin = 'https://untrusted.invalid' },
    h => { h.state.fetchSite = 'cross-site' },
    h => { h.env.VERCEL_ENV = 'production' },
    h => { h.env.INTELLIGENCE_OS_ADMIN_ENABLED = 'false' },
    (_, data) => data.set('formToken', 'synthetic-invalid-token'),
  ]) {
    const h = harness()
    const data = h.form(scenario)
    change(h, data)
    assert.equal((await submit(h.actions, data)).has('error'), true)
    assert.equal(h.requests.length, 0)
  }
})

function flatten(element) {
  if (element === null || element === undefined || typeof element === 'boolean') return []
  if (Array.isArray(element)) return element.flatMap(flatten)
  if (typeof element !== 'object') return [element]
  if (typeof element.type === 'function') return flatten(element.type(element.props))
  return [element, ...flatten(element.props?.children)]
}

test('owner page presents one clearly synthetic option and preserves quiet baseline; visitors see neither', async () => {
  const h = harness()
  const nodes = flatten(await h.page.default({}))
  const inputs = nodes.filter(node => node?.type === 'input')
  assert.equal(inputs.filter(node => node.props.name === 'fixtureScenario').length, 1)
  assert.equal(inputs.find(node => node.props.name === 'fixtureScenario').props.value, scenario)
  const copy = nodes.filter(node => typeof node === 'string').join(' ')
  assert.match(copy, /Weekly specialist test/)
  assert.match(copy, /empty-input weekly baseline/)
  assert.match(copy, /writes synthetic staging records, not live business results/)
  assert.match(copy, /No model, email, or execution/)
  assert.match(copy, /What changed between reviews\?/)
  assert.match(copy, /Two saved reviews/)
  h.state.user = { sub: 'synthetic-nonowner' }
  h.requests.length = 0
  await assert.rejects(h.page.default({}), error => error.location === '/profile')
  assert.equal(h.requests.length, 0)
  h.state.user = { sub: 'synthetic-owner' }
  h.env.VERCEL_ENV = 'production'
  const productionNodes = flatten(await h.page.default({}))
  assert.equal(productionNodes.some(node => node?.type === 'form'), false)
  assert.equal(h.requests.length, 0)
})
