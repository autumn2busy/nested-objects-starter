import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const previewHost = 'nested-objects-starter-35qofxn46-autumns-projects-246e052c.vercel.app'
const source = readFileSync(new URL('../components/DeferredOutsetaLoader.tsx', import.meta.url), 'utf8')
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText

// Execute the actual loader and capture the options before the SDK script is added.
function load({ origin, serverPreviewHost, pathname = '/auth/callback' }) {
  const scripts = [], listeners = new Map()
  const browser = {
    location: new URL(origin),
    addEventListener(name, callback) { listeners.set(name, callback) },
    removeEventListener(name) { listeners.delete(name) },
    dispatchEvent() {},
    setTimeout(callback) { listeners.set('idle', callback); return 1 },
    clearTimeout() {},
  }
  const exports = {}
  vm.runInNewContext(code, {
    exports, window: browser, Event,
    document: {
      getElementById() { return null },
      createElement() { return { dataset: {}, addEventListener() {} } },
      head: { appendChild(script) { scripts.push({ script, options: structuredClone(browser.o_options) }) } },
    },
    process: { env: { NODE_ENV: 'production' } },
    require(name) {
      if (name === 'react') return { useEffect(effect) { effect() } }
      if (name === 'next/navigation') return { usePathname: () => pathname }
      throw new Error(`Unexpected import ${name}`)
    },
  })
  exports.DeferredOutsetaLoader({ previewHost: serverPreviewHost })
  return { scripts, listeners, browser }
}

test('the exact HTTPS Preview installs a same-origin verified callback before the SDK loads', () => {
  const { scripts } = load({ origin: `https://${previewHost}`, serverPreviewHost: previewHost })
  assert.equal(scripts.length, 1)
  assert.equal(scripts[0].script.src, 'https://cdn.outseta.com/outseta.min.js')
  assert.deepEqual(scripts[0].options, {
    domain: 'nested-objects.outseta.com', load: 'auth', tokenStorage: 'local',
    auth: { authenticationCallbackUrl: `https://${previewHost}/auth/callback` },
  })
})

for (const [name, origin, serverPreviewHost] of [
  ['Production configuration', 'https://members.nestedobjects.com', undefined],
  ['Production build at a deployment URL', `https://${previewHost}`, undefined],
  ['missing server deployment identifier', `https://${previewHost}`, ''],
  ['HTTP Preview', `http://${previewHost}`, previewHost],
  ['unexpected port', `https://${previewHost}:8443`, previewHost],
  ['another deployment', 'https://nested-objects-starter-abcdef123-autumns-projects-246e052c.vercel.app', previewHost],
  ['hostname suffix confusion', `https://${previewHost}.evil.example`, `${previewHost}.evil.example`],
  ['another Vercel project', 'https://unrelated.vercel.app', 'unrelated.vercel.app'],
  ['another team', 'https://nested-objects-starter-35qofxn46-other-team.vercel.app', 'nested-objects-starter-35qofxn46-other-team.vercel.app'],
  ['malformed server identifier', `https://${previewHost}`, `${previewHost}/auth/callback?redirect=//evil.example`],
]) test(`${name} retains the provider default without a callback override`, () => {
  const { scripts } = load({ origin, serverPreviewHost })
  assert.equal(scripts.length, 1)
  assert.equal(scripts[0].options.auth, undefined)
  assert.equal(scripts[0].options.tokenStorage, 'local')
})

test('public pages retain deferred loading and the Preview callback is configured before interaction', () => {
  const { scripts, listeners, browser } = load({ origin: `https://${previewHost}`, serverPreviewHost: previewHost, pathname: '/tools' })
  assert.equal(scripts.length, 0)
  assert.equal(browser.o_options.auth.authenticationCallbackUrl, `https://${previewHost}/auth/callback`)
  listeners.get('pointerdown')()
  assert.equal(scripts.length, 1)
  listeners.get('idle')()
  assert.equal(scripts.length, 1)
})

const layoutCode = ts.transpileModule(readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText

function serverLoaderProps(env) {
  const exports = {}
  const jsx = (type, props) => ({ type, props })
  const components = {
    'auth-provider': 'AuthProvider', ActiveCampaignTracker: 'ActiveCampaignTracker',
    SiteHeader: 'SiteHeader', SiteFooter: 'SiteFooter', MobileActionBar: 'MobileActionBar',
    DeferredGoogleTagManager: 'DeferredGoogleTagManager', DeferredOutsetaLoader: 'DeferredOutsetaLoader',
  }
  vm.runInNewContext(layoutCode, {
    exports, URL, process: { env },
    require(name) {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx }
      if (name === 'next/font/google') return { Plus_Jakarta_Sans: () => ({ variable: 'synthetic-font' }) }
      if (name === 'next/script') return { default: 'Script' }
      if (name === '@/lib/utils') return { cn: (...values) => values.join(' ') }
      if (name === '@/lib/seo') return {
        SITE_URL: 'https://members.nestedobjects.com', SITE_NAME: 'Synthetic', SITE_DESCRIPTION: '', DEFAULT_OG_IMAGE: '',
        getBreadcrumbSchema: () => ({}), getOrganizationSchema: () => ({}),
        getSoftwareApplicationSchema: () => ({}), getWebSiteSchema: () => ({}),
      }
      if (name === '../styles/globals.css') return {}
      const component = components[name.replace('@/components/', '')]
      if (component) return { [component]: component }
      throw new Error(`Unexpected layout import ${name}`)
    },
  })
  function find(node) {
    if (Array.isArray(node)) return node.map(find).find(Boolean)
    if (!node || typeof node !== 'object') return undefined
    if (node.type === 'DeferredOutsetaLoader') return node.props
    return find(node.props?.children)
  }
  return find(exports.default({ children: 'Synthetic page' }))
}

for (const environment of ['preview', 'production', 'development', undefined]) {
  test(`actual server layout enables the callback only for Preview, environment=${environment}`, () => {
    const props = serverLoaderProps({ VERCEL_ENV: environment, VERCEL_URL: previewHost })
    assert.ok(props)
    const { scripts } = load({ origin: `https://${previewHost}`, serverPreviewHost: props.previewHost })
    assert.equal(scripts[0].options.auth?.authenticationCallbackUrl,
      environment === 'preview' ? `https://${previewHost}/auth/callback` : undefined)
  })
}

test('actual Preview layout without VERCEL_URL does not invent a callback origin', () => {
  const props = serverLoaderProps({ VERCEL_ENV: 'preview' })
  assert.equal(load({ origin: `https://${previewHost}`, serverPreviewHost: props.previewHost }).scripts[0].options.auth, undefined)
})
