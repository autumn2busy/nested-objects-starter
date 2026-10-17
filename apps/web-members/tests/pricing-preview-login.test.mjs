import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const host = 'nested-objects-starter-test123-autumns-projects-246e052c.vercel.app'
const origin = `https://${host}`
function load(path, imports = {}, globals = {}) {
  const exports = {}
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText
  vm.runInNewContext(code, { exports, URL, AbortController, ...globals, require(name) {
    if (name in imports) return imports[name]
    throw Error(`Unexpected import: ${name}`)
  } })
  return exports
}
const helper = load('../lib/pricing-preview-login.ts')
const callbackFor = helper.pricingPreviewLoginCallback

test('exact server-bound Preview pricing return preserves safe campaign labels only', () => {
  const callback = new URL(callbackFor(host, `${origin}/membership-pricing?utm_source=verification&utm_campaign=pricing_qa&access_token=secret&redirect=https://evil.example&email=member@example.com#secret`))
  assert.equal(callback.origin, origin)
  assert.equal(callback.pathname, '/auth/callback')
  assert.equal(callback.searchParams.get('redirect'), '/membership-pricing?utm_source=verification&utm_campaign=pricing_qa')
  assert.equal(callback.href.includes('secret'), false)
  assert.equal(callback.href.includes('member%40example.com'), false)
})

test('Production, other routes and mismatched origins receive no override', () => {
  for (const [trusted, href] of [
    [undefined, `${origin}/membership-pricing`],
    [host, 'https://members.nestedobjects.com/membership-pricing'],
    [host, `${origin}/profile`], [host, `${origin}/membership-pricing/other`],
    [host, `${origin}.evil.example/membership-pricing`], [host, `http://${host}/membership-pricing`],
    [host, `https://user:pass@${host}/membership-pricing`], [host, `${origin}:444/membership-pricing`],
    [host, 'not a URL'],
  ]) assert.equal(callbackFor(trusted, href), undefined)
})

test('host input cannot select another project, an arbitrary URL, path, port or userinfo', () => {
  for (const trusted of ['evil.example', 'unrelated.vercel.app', `${host}.evil.example`,
    `https://${host}`, `${host}/x`, `${host}:443`, `user@${host}`, `${host}\n`]) {
    assert.equal(callbackFor(trusted, `${origin}/membership-pricing`), undefined)
  }
})

test('duplicate, control, personal and oversized campaign values are discarded', () => {
  const callback = new URL(callbackFor(host, `${origin}/membership-pricing?utm_source=one&utm_source=two&utm_medium=x%0Ay&utm_content=member%40example.com&utm_term=${'x'.repeat(129)}&utm_campaign=good_qa`))
  assert.equal(callback.searchParams.get('redirect'), '/membership-pricing?utm_campaign=good_qa')
})

function header({ path = '/membership-pricing', previewHost = host, ready = async () => true } = {}) {
  let pathname = path, authenticated = false, refIndex = 0
  const refs = [], cleanups = [], states = [], opens = [], waits = []
  const browser = { location: { href: origin + pathname }, Outseta: { auth: { open: options => opens.push(options) } } }
  const jsx = (type, props) => ({ type, props })
  const { SiteHeader } = load('../components/SiteHeader.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
    react: {
      useMemo: fn => fn(), useState: initial => [initial, value => states.push(value)],
      useRef: initial => refs[refIndex++] ||= { current: initial },
      useEffect: fn => { const cleanup = fn(); if (cleanup) cleanups.push(cleanup) },
    },
    'next/navigation': { usePathname: () => pathname },
    'next/image': { default: 'image' }, 'next/link': { default: 'link' },
    'lucide-react': { Camera: 'camera', Loader2: 'loader', Menu: 'menu', X: 'x' },
    './auth-provider': { useAuth: () => ({ user: null, isLoading: false, isAuthenticated: authenticated }) },
    './FreeSignupCta': { FreeSignupCta: 'signup' }, './ui/button': { Button: 'button', buttonVariants: () => '' },
    '@/lib/pricing-preview-login': helper,
    '@/lib/pricing-handoff': { waitForPricingWidget: (widget, signal) => { waits.push(widget); return ready(signal) } },
  }, { window: browser })
  const render = () => { refIndex = 0; return SiteHeader({ pricingPreviewHost: previewHost }) }
  let tree = render()
  const find = node => {
    if (!node || typeof node !== 'object') return null
    if (node.props?.href?.includes('widgetMode=login')) return node
    for (const child of [node.props?.children].flat(Infinity)) { const found = find(child); if (found) return found }
    return null
  }
  return {
    opens, waits, states, browser,
    click() {
      const link = find(tree)
      assert.ok(link, 'existing Login anchor is rendered')
      const stops = []
      const promise = link.props.onClickCapture({ metaKey: true, preventDefault: () => stops.push('default'),
        stopPropagation: () => stops.push('propagation'), nativeEvent: { stopImmediatePropagation: () => stops.push('native') } })
      return { promise, stops }
    },
    navigate(nextPath, signedIn = false) {
      cleanups.splice(0).forEach(fn => fn())
      pathname = nextPath; authenticated = signedIn; browser.location.href = origin + pathname; tree = render()
    },
  }
}

test('warmed SDK uses per-interaction callback after navigation into pricing, once only', async () => {
  let release
  const page = header({ path: '/about-us', ready: () => new Promise(resolve => { release = resolve }) })
  page.navigate('/membership-pricing')
  const first = page.click(), second = page.click()
  assert.deepEqual(first.stops, ['default', 'propagation', 'native'])
  assert.deepEqual(second.stops, ['default', 'propagation', 'native'])
  assert.deepEqual(page.waits, ['auth'])
  release(true)
  await Promise.all([first.promise, second.promise])
  assert.equal(page.opens.length, 1)
  assert.equal(page.opens[0].widgetMode, 'login')
  assert.equal(page.opens[0].authenticationCallbackUrl, callbackFor(host, origin + '/membership-pricing'))
  page.navigate('/about-us')
  const unrelated = page.click(); await unrelated.promise
  assert.deepEqual(unrelated.stops, [])
  assert.equal(page.opens.length, 1)
})

test('Production retains the existing normal Login behavior', async () => {
  const page = header({ previewHost: 'members.nestedobjects.com' })
  const click = page.click(); await click.promise
  assert.deepEqual(click.stops, [])
  assert.deepEqual(page.waits, [])
  assert.deepEqual(page.opens, [])
})

test('readiness failure presents a retry error without opening or navigating elsewhere', async () => {
  const page = header({ ready: async () => false })
  await page.click().promise
  assert.equal(page.opens.length, 0)
  assert.equal(page.browser.location.href, origin + '/membership-pricing')
  assert.ok(page.states.includes('Sign-in is not ready. Please try Login again.'))
})

test('leaving pricing or authenticating cancels a pending login opening', async () => {
  for (const signedIn of [false, true]) {
    let release
    const page = header({ ready: () => new Promise(resolve => { release = resolve }) })
    const click = page.click()
    page.navigate(signedIn ? '/membership-pricing' : '/about-us', signedIn)
    release(true); await click.promise
    assert.equal(page.opens.length, 0)
  }
})

test('layout passes only the server deployment hostname and only in Preview', () => {
  const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8')
  assert.match(layout, /pricingPreviewHost=\{process\.env\.VERCEL_ENV === 'preview' \? process\.env\.VERCEL_URL : undefined\}/)
})
