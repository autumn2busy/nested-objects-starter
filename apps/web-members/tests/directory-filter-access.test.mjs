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
let events = []

// Exercise the actual view, actions and native form components. These fixtures
// replace only Next's image/link adapters and analytics; no auth or data service
// is contacted. Free teaser fixtures represent the already-sanitized server data.
function load(relativePath, imports = {}, globals = {}) {
  const code = ts.transpileModule(readFileSync(new URL(relativePath, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports, URL, URLSearchParams, console, ...globals,
    require(name) {
      if (name === 'react') return React
      if (name === 'react/jsx-runtime') return jsxRuntime
      if (name === 'lucide-react') return require('lucide-react')
      if (name in imports) return imports[name]
      throw new Error(`Unexpected import in ${relativePath}: ${name}`)
    },
  })
  return exports
}

const nextLink = { default: ({ children, ...props }) => React.createElement('a', props, children) }
const utils = load('../lib/utils.ts')
const uiImports = { '@/lib/utils': utils }
const actions = load('../app/hiring-firms/DirectoryActions.tsx', {
  'next/link': nextLink,
  '@/lib/ac-events': Object.fromEntries([
    'trackDirectoryViewed', 'trackOutsetaModalOpen', 'trackPaywallHit', 'trackUpgradeClicked',
  ].map(name => [name, (...args) => events.push({ name, args })])),
})
const directory = load('../app/hiring-firms/DirectoryView.tsx', {
  'next/link': nextLink,
  'next/image': { default: ({ fill: _fill, ...props }) => React.createElement('img', props) },
  '@/components/ui/card': load('../components/ui/card.tsx', uiImports),
  '@/components/ui/input': load('../components/ui/input.tsx', uiImports),
  '@/components/ui/select': load('../components/ui/select.tsx', uiImports),
  '@/components/ui/StarRating': load('../components/ui/StarRating.tsx'),
  './constants': load('../app/hiring-firms/constants.ts'),
  './DirectoryActions': actions,
})

const filters = {
  state: 'GA', search: 'fixture inspections', rating: '4', industry: 'Mortgage',
  source: 'Field Operations', pay: '50', sort: 'name_asc',
}
const scenarios = [
  { name: 'visitor', access: { isAuthenticated: false, isFree: false, isRestricted: true, planUid: null } },
  { name: 'Free', access: { isAuthenticated: true, isFree: true, isRestricted: true, planUid: 'L9nbKV9Z' } },
  { name: 'Pro', access: { isAuthenticated: true, isFree: false, isRestricted: false, planUid: 'rQVqlLm6' } },
  { name: 'Founders', access: { isAuthenticated: true, isFree: false, isRestricted: false, planUid: 'pWrBRnWn' } },
  { name: 'Elite', access: { isAuthenticated: true, isFree: false, isRestricted: false, planUid: 'NmdnNO90' } },
  { name: 'Agency', access: { isAuthenticated: true, isFree: false, isRestricted: false, planUid: 'rmk5Xk9g' } },
  { name: 'Starter', access: { isAuthenticated: true, isFree: false, isRestricted: false, planUid: 'zWZD0rQp' } },
]
const firms = Array.from({ length: 8 }, (_, index) => ({
  id: `fixture-${index + 1}`, slug: `fixture-${index + 1}`, name: `Fixture Firm ${index + 1}`,
  description: `SYNTHETIC_DETAIL_${index + 1}`, geographic_coverage: 'Georgia',
  url: null, vendor_page_url: null, logo_url: null, categories: null, pay_min: 25,
  pay_max: 50, pay_type: 'per inspection', company_size: null, industry_focus: 'Mortgage',
  rating: null, contractor_rating: null, rating_count: null, verified_at: null,
  phone: null, email: null, address: null, latitude: null, longitude: null,
  source: 'Field Operations', compensation_structure: null, client_reviews: null, services: null,
}))
const freeFirms = [
  ...firms.slice(0, 3),
  ...firms.slice(3, 7).map((firm, index) => ({
    ...Object.fromEntries(Object.keys(firm).map(key => [key, null])),
    id: `teaser-${index + 1}`, name: `Locked preview ${index + 1}`,
  })),
]
const propsFor = scenario => ({
  initialFirms: scenario.access.isFree ? freeFirms : firms,
  totalCount: 100, page: 1, limit: 24, filters, access: scenario.access,
})
const plain = html => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')
  .replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim()
const normalize = value => JSON.parse(JSON.stringify(value))

function findElement(node, predicate) {
  if (!node || typeof node !== 'object') return null
  if (predicate(node)) return node
  for (const child of React.Children.toArray(node.props?.children)) {
    const found = findElement(child, predicate)
    if (found) return found
  }
  return null
}

function filterFixture(scenario) {
  const view = directory.DirectoryView(propsFor(scenario))
  const filter = findElement(view, node => node.type?.name === 'FilterBar')
  assert.ok(filter, 'DirectoryView must render its filter card')
  const tree = filter.type(filter.props)
  const html = renderToStaticMarkup(tree)
  const formHtml = html.match(/<form\b[^>]*>[\s\S]*?<\/form>/)?.[0]
  assert.ok(formHtml)
  return { tree, html, formHtml, form: findElement(tree, node => node.type === 'form') }
}

const attribute = (tag, name) => tag.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1]
test.beforeEach(() => { events = [] })

for (const scenario of scenarios) {
  test(`${scenario.name}: the labeled directory form preserves all seven controls and their access boundary`, () => {
    const { form, formHtml, html } = filterFixture(scenario)
    assert.equal(form.props.action, '/hiring-firms')
    assert.equal(form.props['aria-label'], 'Directory filters')
    assert.match(formHtml, /<input[^>]*type="hidden"[^>]*name="limit"[^>]*value="24"/)
    const controls = [...formHtml.matchAll(/<(?:input|select)\b[^>]*>/g)]
      .map(match => match[0]).filter(tag => attribute(tag, 'type') !== 'hidden')
    assert.deepEqual(controls.map(tag => attribute(tag, 'name')).sort(), Object.keys(filters).sort())
    for (const control of controls) {
      const name = attribute(control, 'name')
      assert.equal(/\sdisabled(?:=|\s|>)/.test(control), scenario.access.isRestricted, name)
      const id = attribute(control, 'id')
      assert.ok(id)
      assert.ok(formHtml.includes(`for="${id}"`), `${name} retains its associated label`)
      const expectedValue = scenario.access.isRestricted
        ? (name === 'search' ? '' : name === 'sort' ? 'rating_desc' : 'ALL') : filters[name]
      if (name === 'search') {
        assert.equal(attribute(control, 'value'), expectedValue)
      } else {
        const selectHtml = formHtml.match(new RegExp(`<select\\b[^>]*name="${name}"[^>]*>([\\s\\S]*?)<\\/select>`))[1]
        const selected = [...selectHtml.matchAll(/<option\b[^>]*>/g)]
          .map(match => match[0]).find(tag => /\sselected(?:=|\s|>)/.test(tag))
        assert.ok(selected, `${name} must retain an explicit selected value`)
        assert.equal(attribute(selected, 'value'), expectedValue)
      }
    }
    if (scenario.access.isRestricted) {
      assert.equal(form.props['aria-describedby'], 'directory-filter-explanation')
      assert.doesNotMatch(formHtml, /type="submit"/)
    } else {
      assert.equal(form.props['aria-describedby'], undefined)
      assert.doesNotMatch(html, /directory-filter-explanation|Compare plans|Sign in/)
      assert.match(formHtml, /type="submit"/)
      assert.match(plain(formHtml), /APPLY FILTERS/)
      assert.match(plain(formHtml), /Many firms are national or multi-state/)
    }
  })
}

for (const scenario of scenarios.slice(0, 2)) {
  test(`${scenario.name}: the explanation and accessible native CTA precede the disabled controls`, () => {
    const { tree, html } = filterFixture(scenario)
    const explanation = findElement(tree, node => node.props?.id === 'directory-filter-explanation')
    assert.ok(explanation)
    const description = plain(renderToStaticMarkup(explanation))
    const guest = !scenario.access.isAuthenticated
    assert.equal(description, guest
      ? 'Search and filters are unavailable to visitors and Free members. Sign in to use the directory access included with your plan.'
      : 'Your Free plan includes a directory preview. Compare plans for access to directory search and filters.')
    const actionType = guest ? actions.DirectoryLoginLink : actions.DirectoryUpgradeLink
    const action = findElement(tree, node => node.type === actionType)
    assert.ok(action)
    const link = action.type(action.props)
    const linkHtml = renderToStaticMarkup(link)
    assert.match(linkHtml, /^<a\b/)
    assert.equal(plain(linkHtml), guest ? 'Sign in' : 'Compare plans')
    assert.equal(link.props.href, guest
      ? 'https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous'
      : '/membership-pricing')
    assert.match(link.props.className, /(?:^|\s)min-h-(?:\[44px\]|11)(?:\s|$)/)
    assert.match(link.props.className, /(?:^|\s)focus-visible:ring-2(?:\s|$)/)
    const firstControl = html.search(/<(?:select|input)\b[^>]*id="(?:state|keyword)-filter"/)
    assert.ok(firstControl > 0)
    assert.ok(html.indexOf('id="directory-filter-explanation"') < firstControl)
    assert.ok(html.indexOf(linkHtml) < firstControl)
    assert.equal([...html.matchAll(/<a\b/g)].length, 1, 'The filter card has one gate action')
    assert.doesNotMatch(plain(html), /to unlock all filters and search the full directory/)

    assert.equal(events.length, 0)
    link.props.onClick()
    assert.deepEqual(normalize(events), guest ? [{
      name: 'trackOutsetaModalOpen',
      args: [{ sourcePage: 'hiring_firms', mode: 'login_redirect', feature: 'directory_login_required' }],
    }] : [{
      name: 'trackUpgradeClicked',
      args: ['hiring_firms_filter_gate', 'Pro', { planUid: 'L9nbKV9Z', isAuthenticated: true }],
    }])
  })
}

test('visitors still receive no rendered firm cards or details even when fixture rows are supplied', () => {
  const html = renderToStaticMarkup(React.createElement(directory.DirectoryView, propsFor(scenarios[0])))
  assert.doesNotMatch(html, /<article\b|href="\/firms\/fixture-|SYNTHETIC_DETAIL_|Fixture Firm/)
  assert.equal(events.length, 0, 'Server rendering must not send analytics')
})

test('Free retains three sample cards and four sanitized teasers without extra profile links', () => {
  const html = renderToStaticMarkup(React.createElement(directory.DirectoryView, propsFor(scenarios[1])))
  assert.equal([...html.matchAll(/<article\b/g)].length, 3)
  assert.deepEqual([...html.matchAll(/href="\/firms\/([^"]+)"/g)].map(match => match[1]),
    ['fixture-1', 'fixture-2', 'fixture-3'])
  for (let index = 1; index <= 3; index++) assert.ok(html.includes(`SYNTHETIC_DETAIL_${index}`))
  for (let index = 4; index <= 8; index++) assert.ok(!html.includes(`SYNTHETIC_DETAIL_${index}`))
  for (let index = 1; index <= 4; index++) assert.ok(html.includes(`Locked preview ${index}`))
  assert.equal([...html.matchAll(/Upgrade to view/g)].length, 4)
  assert.doesNotMatch(html, /aria-label="Next page"|aria-label="Previous page"/)
})

test('Free directory copy distinguishes the three-listing sample from locked cards and paid search', () => {
  const html = renderToStaticMarkup(React.createElement(directory.DirectoryView, propsFor(scenarios[1])))
  const copy = plain(html)
  assert.match(copy, /up to 3 sample (?:firm )?listings/i)
  assert.match(copy, /(?:no (?:directory )?search (?:or|and|\/) filters|search and filters (?:are not included|are unavailable|require))/i)
  assert.match(copy, /locked.{0,100}(?:not|aren.t|isn.t).{0,80}(?:additional|extra|accessible|included)|(?:not|aren.t|isn.t).{0,80}(?:additional|extra|accessible).{0,80}locked/i)
  assert.match(copy, /Pro/)
  assert.doesNotMatch(copy, /\$37|AI-powered firm matching|LOGIN FOR FULL ACCESS/i)
})

test('guest and paid directory handoffs do not advertise a retired checkout price or live AI matching', () => {
  for (const scenario of scenarios) {
    const html = renderToStaticMarkup(React.createElement(directory.DirectoryView, propsFor(scenario)))
    assert.doesNotMatch(plain(html), /\$37|AI-powered firm matching|LOGIN FOR FULL ACCESS/i, scenario.name)
  }
})

for (const scenario of scenarios.slice(0, 2)) {
  test(`${scenario.name}: actual server route neutralizes URL filters and preserves the Free payload boundary`, async () => {
    const requests = []
    const serverFirms = firms.slice(0, 7).map(firm => ({
      ...firm, url: 'https://fixture.example/website', vendor_page_url: 'https://fixture.example/apply',
      phone: 'SYNTHETIC_PHONE', email: 'fixture@example.invalid', address: 'SYNTHETIC_ADDRESS',
      compensation_structure: 'SYNTHETIC_COMPENSATION', client_reviews: 'SYNTHETIC_REVIEW',
    }))
    const constants = load('../app/hiring-firms/constants.ts')
    const stateData = load('../app/hiring-firms/state-data.ts', { './constants': constants })
    const page = load('../app/hiring-firms/page.tsx', {
      'next/link': nextLink,
      './DirectoryView': directory,
      '@/lib/seo': { generatePageMetadata: value => value, getFAQPageSchema: value => value },
      './constants': constants,
      './state-data': stateData,
      '@/lib/testimonials': { TESTIMONIALS: [], getAverageRating: () => 0 },
      '@/lib/auth-server': { getCurrentUser: async () => scenario.access.isAuthenticated
        ? { 'outseta:planUid': scenario.access.planUid } : null },
      '@/lib/plan-config': load('../lib/plan-config.ts'),
    }, {
      process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.example', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'synthetic' } },
      async fetch(url) {
        requests.push(new URL(url))
        return {
          ok: true, headers: { get: name => name === 'content-range' ? '0-6/100' : null },
          json: async () => serverFirms,
        }
      },
    })
    const tree = await page.default({ searchParams: Promise.resolve({ ...filters, page: '5', limit: '60' }) })
    const view = findElement(tree, node => node.type === directory.DirectoryView)
    assert.ok(view)
    assert.equal(requests.length, 1, 'The only data request is intercepted by the synthetic fetch')
    assert.equal(requests[0].hostname, 'fixture.example')
    assert.equal(requests[0].searchParams.get('limit'), '7')
    assert.equal(requests[0].searchParams.get('offset'), '0')
    assert.equal(requests[0].searchParams.has('and'), false)
    assert.equal(requests[0].searchParams.has('contractor_rating'), false)
    assert.equal(view.props.page, 1)
    assert.equal(view.props.limit, 7)
    assert.deepEqual(normalize(view.props.filters), {
      state: 'ALL', search: '', rating: 'ALL', industry: 'ALL', source: 'ALL', pay: 'ALL', sort: 'rating_desc',
    })
    assert.equal(view.props.access.isRestricted, true)
    if (!scenario.access.isAuthenticated) {
      assert.deepEqual(normalize(view.props.initialFirms), [])
      return
    }
    assert.equal(view.props.initialFirms.length, 7)
    assert.deepEqual(normalize(view.props.initialFirms.slice(0, 3)), serverFirms.slice(0, 3))
    for (const teaser of view.props.initialFirms.slice(3)) {
      for (const field of ['url', 'vendor_page_url', 'pay_min', 'pay_max', 'pay_type', 'phone', 'email', 'address', 'compensation_structure', 'client_reviews']) {
        assert.equal(teaser[field], null, `Locked teaser must sanitize ${field}`)
      }
    }
  })
}

for (const scenario of scenarios.slice(2)) {
  test(`${scenario.name}: full firm cards and filtered pagination remain available`, () => {
    const html = renderToStaticMarkup(React.createElement(directory.DirectoryView, propsFor(scenario)))
    assert.equal([...html.matchAll(/<article\b/g)].length, firms.length)
    assert.equal([...html.matchAll(/href="\/firms\/fixture-/g)].length, firms.length)
    assert.doesNotMatch(html, /Locked preview|Upgrade to view/)
    const nextLinkHtml = html.match(/<a\b[^>]*aria-label="Next page"[^>]*>/)?.[0]
    assert.ok(nextLinkHtml)
    const destination = new URL(attribute(nextLinkHtml, 'href').replace(/&amp;/g, '&'), 'https://fixture.example')
    assert.equal(destination.pathname, '/hiring-firms')
    assert.equal(destination.searchParams.get('page'), '2')
    assert.equal(destination.searchParams.get('limit'), '24')
    for (const [name, value] of Object.entries(filters)) assert.equal(destination.searchParams.get(name), value)
  })
}
