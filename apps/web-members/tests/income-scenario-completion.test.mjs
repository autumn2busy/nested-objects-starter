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

function load(relativePath, imports = {}, globals = {}) {
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
    JSON,
    ...globals,
    require(name) {
      if (name in imports) return imports[name]
      throw new Error(`Unexpected import in ${relativePath}: ${name}`)
    },
  })
  return exports
}

const calculations = load('../app/tools/income-calculator/calculations.ts')
const validScenario = {
  assignmentsPerMonth: 20,
  averageFeePerAssignment: 75,
  averageMilesPerAssignment: 0,
  vehicleCostPerMile: 0,
  minutesPerAssignment: 90,
  otherMonthlyCosts: 0,
}

test('completion requires positive core assumptions and permits zero optional costs', () => {
  assert.equal(calculations.canCompleteIncomeScenario(validScenario), true)

  const negativeNetScenario = { ...validScenario, otherMonthlyCosts: 2_000 }
  assert.ok(calculations.calculateIncomeScenario(negativeNetScenario).estimatedNet < 0)
  assert.equal(calculations.canCompleteIncomeScenario(negativeNetScenario), true)

  for (const field of ['assignmentsPerMonth', 'averageFeePerAssignment', 'minutesPerAssignment']) {
    for (const value of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.equal(calculations.canCompleteIncomeScenario({ ...validScenario, [field]: value }), false, `${field}:${value}`)
    }
  }
})

test('completion rejects non-finite or negative optional assumptions', () => {
  for (const field of ['averageMilesPerAssignment', 'vehicleCostPerMile', 'otherMonthlyCosts']) {
    for (const value of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.equal(calculations.canCompleteIncomeScenario({ ...validScenario, [field]: value }), false, `${field}:${value}`)
    }
  }
})

function completionHarness(fetchImplementation) {
  const requests = []
  const analyticsCalls = []
  const browser = {
    dataLayer: [],
    gtag: (...args) => analyticsCalls.push(['gtag', ...args]),
    vgo: (...args) => analyticsCalls.push(['vgo', ...args]),
  }
  const completion = load('../app/tools/income-calculator/completion-event.ts', {}, {
    window: browser,
    fetch: async (url, options) => {
      requests.push({ url, ...options })
      return fetchImplementation(url, options)
    },
  })
  return { completion, requests, analyticsCalls, browser }
}

test('completion helper submits only the ledger event and requires a recorded 200 receipt', async () => {
  const harness = completionHarness(async () => ({
    status: 200,
    json: async () => ({ recorded: true, activeCampaignTracked: false }),
  }))

  assert.equal(await harness.completion.recordIncomeScenarioCompletion(), true)
  assert.equal(harness.requests.length, 1)
  assert.equal(harness.requests[0].url, '/api/conversion-events')
  assert.equal(harness.requests[0].method, 'POST')
  assert.equal(harness.requests[0].credentials, 'same-origin')
  assert.deepEqual(JSON.parse(harness.requests[0].body), { event: 'income_scenario_completed' })
  assert.equal(harness.analyticsCalls.length, 0)
  assert.equal(harness.browser.dataLayer.length, 0)
})

test('unrecorded, preview-suppressed, invalid, and failed receipts remain incomplete', async () => {
  const responses = [
    async () => ({ status: 200, json: async () => ({ recorded: false }) }),
    async () => ({ status: 202, json: async () => ({ recorded: true }) }),
    async () => ({ status: 204, json: async () => { throw new Error('204 has no JSON body') } }),
    async () => ({ status: 401, json: async () => ({ recorded: true }) }),
    async () => ({ status: 409, json: async () => ({ recorded: true }) }),
    async () => ({ status: 500, json: async () => ({ recorded: true }) }),
    async () => ({ status: 200, json: async () => { throw new Error('Invalid JSON') } }),
    async () => ({ status: 200, json: async () => ({ recorded: 'true' }) }),
    async () => { throw new Error('Synthetic network failure') },
  ]

  for (const response of responses) {
    const harness = completionHarness(response)
    assert.equal(await harness.completion.recordIncomeScenarioCompletion(), false)
    assert.equal(harness.requests.length, 1)
  }
})

function findElement(node, predicate) {
  if (!node || typeof node !== 'object') return null
  if (predicate(node)) return node
  for (const child of React.Children.toArray(node.props?.children)) {
    const found = findElement(child, predicate)
    if (found) return found
  }
  return null
}

function calculatorHarness({ inputs, status = 'idle', recorded = true } = {}) {
  const stateValues = [inputs ?? {
    assignmentsPerMonth: 0,
    averageFeePerAssignment: 0,
    averageMilesPerAssignment: 0,
    vehicleCostPerMile: 0,
    minutesPerAssignment: 0,
    otherMonthlyCosts: 0,
  }, status]
  let completionCalls = 0
  let hookIndex = 0
  const mockedReact = {
    ...React,
    useMemo: callback => callback(),
    useState(initialValue) {
      const index = hookIndex++
      if (stateValues[index] === undefined) stateValues[index] = initialValue
      return [stateValues[index], nextValue => {
        stateValues[index] = typeof nextValue === 'function'
          ? nextValue(stateValues[index])
          : nextValue
      }]
    },
  }
  const component = load('../app/tools/income-calculator/IncomeScenarioCalculator.tsx', {
    react: mockedReact,
    'react/jsx-runtime': jsxRuntime,
    'lucide-react': require('lucide-react'),
    './calculations': calculations,
    './completion-event': {
      recordIncomeScenarioCompletion: async () => {
        completionCalls++
        return recorded
      },
    },
  })

  return {
    render() {
      hookIndex = 0
      return component.IncomeScenarioCalculator()
    },
    stateValues,
    completionCalls: () => completionCalls,
  }
}

test('calculator renders a native completion button with an announced eligibility state', () => {
  const invalid = calculatorHarness()
  const invalidTree = invalid.render()
  const button = findElement(invalidTree, node => node.type === 'button')
  const status = findElement(invalidTree, node => node.props?.role === 'status')

  assert.ok(button)
  assert.equal(button.props.type, 'button')
  assert.equal(button.props.disabled, true)
  assert.equal(button.props['aria-describedby'], 'income-scenario-completion-status')
  assert.ok(status)
  assert.equal(status.props.id, 'income-scenario-completion-status')
  assert.equal(status.props['aria-live'], 'polite')
  assert.match(renderToStaticMarkup(invalidTree), /Enter assignments, average fee, and total minutes above zero/)
})

test('a valid deliberate action records completion and exposes success or retry state', async () => {
  for (const [recorded, expectedStatus] of [[true, 'complete'], [false, 'error']]) {
    const harness = calculatorHarness({ inputs: validScenario, recorded })
    const tree = harness.render()
    const button = findElement(tree, node => node.type === 'button')
    assert.equal(button.props.disabled, false)
    assert.equal(button.props.children, 'Complete calculation')

    await button.props.onClick()

    assert.equal(harness.completionCalls(), 1)
    assert.equal(harness.stateValues[1], expectedStatus)
    const updatedHtml = renderToStaticMarkup(harness.render())
    assert.match(updatedHtml, recorded ? /Completion recorded/ : /Completion was not recorded/)
    assert.match(updatedHtml, recorded ? /Calculation completed/ : /Try again/)
  }
})

test('calculator disclosure distinguishes browser-local numbers from the member milestone', () => {
  const html = renderToStaticMarkup(calculatorHarness().render())
  assert.match(html, /numeric assumptions and calculated results stay in this browser/i)
  assert.match(html, /records a completion milestone for your member account/i)
  assert.match(html, /without those numbers or results/i)
  assert.match(html, /normal site analytics may record the page visit/i)
})
