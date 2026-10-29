import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

function renderLoader(pathname, { existing = false, development = false } = {}) {
  const scripts = [], timers = [], listeners = []
  const browser = { dispatchEvent() {}, setTimeout(fn, ms) { timers.push({ fn, ms }); return 1 },
    clearTimeout() {}, addEventListener: name => listeners.push(name), removeEventListener() {} }
  const exports = {}
  const code = ts.transpileModule(readFileSync(new URL('../components/DeferredOutsetaLoader.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(code, { exports, window: browser, Event,
    process: { env: { NODE_ENV: development ? 'development' : 'production' } },
    document: { getElementById: () => existing ? {} : null,
      createElement: () => ({ dataset: {}, addEventListener() {} }), head: { appendChild: script => scripts.push(script) } },
    require: name => name === 'react' ? { useEffect: fn => fn() } : { usePathname: () => pathname },
  })
  exports.DeferredOutsetaLoader()
  return { browser, scripts, timers, listeners }
}

test('pricing eagerly loads both registration and authenticated plan-management modules', () => {
  const { browser, scripts, timers } = renderLoader('/membership-pricing')
  assert.equal(browser.o_options.load, 'auth,profile')
  assert.equal(browser.o_options.domain, 'nested-objects.outseta.com')
  assert.equal(browser.o_options.tokenStorage, 'local')
  assert.equal(scripts.length, 1)
  assert.equal(scripts[0].src, 'https://cdn.outseta.com/outseta.min.js')
  assert.equal(timers.length, 0)
})

test('unrelated public pages retain deferred loading and an existing script is not duplicated', () => {
  const publicPage = renderLoader('/guides/inspector')
  assert.equal(publicPage.scripts.length, 0)
  assert.equal(publicPage.timers[0].ms, 10000)
  publicPage.timers[0].fn()
  assert.equal(publicPage.scripts.length, 1)
  assert.equal(renderLoader('/membership-pricing', { existing: true }).scripts.length, 0)
})

test('local development does not contact the provider without its existing explicit opt-in', () => {
  const dev = renderLoader('/membership-pricing', { development: true })
  assert.equal(dev.scripts.length, 0)
  assert.equal(dev.timers.length, 0)
  assert.equal(dev.browser.o_options, undefined)
})
