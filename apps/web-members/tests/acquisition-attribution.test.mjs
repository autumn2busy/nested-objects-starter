import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const helperCode = ts.transpileModule(readFileSync(new URL('../../../packages/acquisition-attribution.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const trackerCode = ts.transpileModule(readFileSync(new URL('../lib/ac-events.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function harness({ url = 'https://nestedobjects.com/guides/example?utm_source=google&utm_medium=cpc&utm_campaign=inspectors&utm_content=hero&utm_term=field+work', denied = false } = {}) {
  const stores = { localStorage: new Map(), sessionStorage: new Map() }, requests = []
  const window = { location: new URL(url), dataLayer: [] }
  for (const key of Object.keys(stores)) window[key] = {
    getItem(name) { if (denied) throw new Error('Synthetic denied storage'); return stores[key].get(name) || null },
    setItem(name, value) { if (denied) throw new Error('Synthetic denied storage'); stores[key].set(name, value) },
  }
  const context = { window, exports: {}, URL, URLSearchParams, localStorage: window.localStorage, sessionStorage: window.sessionStorage,
    fetch: async (url, options) => { requests.push({ url, body: JSON.parse(options.body) }); return { ok: true } },
  }
  vm.runInNewContext(helperCode, context)
  const helper = context.exports
  const trackerContext = { ...context, exports: {}, require: () => helper }
  vm.runInNewContext(trackerCode, trackerContext)
  return { helper, tracker: trackerContext.exports, window, stores, requests, context }
}
const plain = value => JSON.parse(JSON.stringify(value))

test('captures all five UTMs and original entry page', () => {
  const h = harness(), data = plain(h.helper.journeyAttribution())
  assert.equal(data.utm_source, 'google'); assert.equal(data.utm_medium, 'cpc')
  assert.equal(data.utm_campaign, 'inspectors'); assert.equal(data.utm_content, 'hero')
  assert.equal(data.utm_term, 'field work'); assert.equal(data.landing_page, '/guides/example')
  assert.equal(data.first_utm_source, 'google'); assert.equal(data.last_utm_source, 'google')
})

test('new URL campaign wins, first touch remains separate, and old partial campaign fields are not mixed', () => {
  const h = harness(); h.helper.captureJourneyAttribution()
  h.window.location = new URL('https://members.nestedobjects.com/membership-pricing?utm_source=new-source')
  const data = h.helper.journeyAttribution()
  assert.equal(data.utm_source, 'new-source'); assert.equal(data.first_utm_source, 'google')
  assert.equal(data.last_utm_source, 'new-source'); assert.equal(data.utm_medium, undefined)
  assert.equal(data.last_utm_medium, undefined); assert.equal(data.landing_page, '/guides/example')
})

test('same-origin navigation retains campaign data without adding internal UTMs', () => {
  const h = harness(); h.helper.captureJourneyAttribution()
  h.window.location = new URL('https://nestedobjects.com/guides/next')
  assert.equal(h.helper.journeyAttribution().utm_campaign, 'inspectors')
  assert.equal(h.helper.decorateAcquisitionUrl('/guides/next'), '/guides/next')
  assert.equal(h.helper.decorateAcquisitionUrl('#section'), '#section')
})

test('public-to-member URLs carry campaign, entry page and placement without changing existing filters or hash', () => {
  const h = harness()
  const result = new URL(h.helper.decorateAcquisitionUrl('https://members.nestedobjects.com/hiring-firms?state=GA#sample', 'public_guide_directory'))
  assert.equal(result.searchParams.get('utm_term'), 'field work')
  assert.equal(result.searchParams.get('utm_content'), 'hero')
  assert.equal(result.searchParams.get('entry_page'), '/guides/example')
  assert.equal(result.searchParams.get('source'), 'public_guide_directory')
  assert.equal(result.searchParams.get('state'), 'GA'); assert.equal(result.hash, '#sample')
  assert.equal(result.hostname, 'members.nestedobjects.com')
})

test('hosted signup keeps exact plan, payment term, skip options and fragment', () => {
  const h = harness({ url: 'https://members.nestedobjects.com/membership-pricing?utm_source=newsletter&utm_medium=email&utm_campaign=fall' })
  const result = new URL(h.helper.decorateAcquisitionUrl('https://nested-objects.outseta.com/auth?widgetMode=register&planUid=synthetic-plan&planPaymentTerm=month&skipPlanOptions=true#o-anonymous', 'pricing'))
  for (const [key, value] of [['planUid','synthetic-plan'],['planPaymentTerm','month'],['skipPlanOptions','true'],['widgetMode','register'],['utm_source','newsletter']]) assert.equal(result.searchParams.get(key), value)
  assert.equal(result.hash, '#o-anonymous')
})

test('explicit destination campaign is kept whole instead of mixing campaign fields', () => {
  const h = harness()
  const result = new URL(h.helper.decorateAcquisitionUrl('https://members.nestedobjects.com/membership-pricing?utm_source=explicit'))
  assert.equal(result.searchParams.get('utm_source'), 'explicit')
  assert.equal(result.searchParams.get('utm_campaign'), null)
})

test('login, billing, unrelated external links, javascript and deceptive hosts are unchanged', () => {
  const h = harness()
  for (const href of ['https://nested-objects.outseta.com/auth?widgetMode=login',
    'https://nested-objects.outseta.com/profile#o-plan-change', 'https://example.invalid/',
    'https://members.nestedobjects.com.attacker.invalid/', 'javascript:alert(1)', 'mailto:synthetic@example.invalid']) {
    assert.equal(h.helper.decorateAcquisitionUrl(href), href)
  }
})

test('corrupt, array and denied storage never break campaign handoffs', () => {
  for (const invalid of ['{broken', '["synthetic"]']) {
    const h = harness(); h.stores.sessionStorage.set('ac_utm_first_touch', invalid)
    h.stores.localStorage.set('ac_utm_last_touch', invalid)
    assert.equal(h.helper.journeyAttribution().utm_source, 'google')
  }
  const h = harness({ denied: true })
  assert.doesNotThrow(() => h.helper.captureJourneyAttribution())
  assert.equal(new URL(h.helper.decorateAcquisitionUrl('https://members.nestedobjects.com/membership-pricing')).searchParams.get('utm_source'), 'google')
})

test('identity, arbitrary parameters, email-looking UTMs and calculator values are never decorated', () => {
  const h = harness({ url: 'https://nestedobjects.com/?utm_source=synthetic%40example.invalid&email=synthetic%40example.invalid&memberUid=synthetic-person&income=100&token=secret' })
  const result = new URL(h.helper.decorateAcquisitionUrl('https://members.nestedobjects.com/membership-pricing'))
  for (const key of ['utm_source','email','memberUid','income','token']) assert.equal(result.searchParams.get(key), null)
})

test('GA4 payload includes safe journey labels but no identity, provider IDs or financial inputs', () => {
  const h = harness()
  const data = plain(h.helper.acquisitionGa4Data({ ...h.helper.journeyAttribution(), sourcePage: '/membership-pricing?token=synthetic', source: 'hero', targetPlan: 'Pro', currentPlan: 'Free', mode: 'register', isAuthenticated: true, email: 'synthetic@example.invalid', planUid: 'synthetic-uid', income: 10 }))
  assert.equal(data.source_page, '/membership-pricing'); assert.equal(data.cta_source, 'hero')
  assert.equal(data.target_plan, 'pro'); assert.equal(data.current_plan, 'free')
  assert.equal(data.widget_mode, 'register'); assert.equal(data.is_authenticated, true)
  for (const key of ['email','planUid','income','memberUid','anonymousId','sessionId']) assert.equal(data[key], undefined)
  assert.ok(Object.keys(data).length <= 25)
})

test('each GA4 event resets absent parameters, avoiding stale CTA plan and UTM leakage', () => {
  const h = harness(), first = h.helper.acquisitionGa4Data({ targetPlan: 'Pro', utm_source: 'old' })
  assert.equal(first.target_plan, 'pro')
  const second = h.helper.acquisitionGa4Data({})
  assert.equal(second.target_plan, null); assert.equal(second.utm_source, null)
  assert.deepEqual(Object.keys(first), Object.keys(second))
})

test('dynamic firm/member IDs and protected pages are withheld from custom GA4 page labels', () => {
  const h = harness()
  assert.equal(h.helper.safePage('/firms/synthetic-id?email=hidden'), '/firms/[id]')
  assert.equal(h.helper.safePage('/members/synthetic-id'), '/members/[id]')
  for (const page of ['/api/auth', '/admin/report', '/inspector-dashboard', '/profile']) assert.equal(h.helper.safePage(page), undefined)
})

test('intent-page allowlist includes guides, pricing, directory and tools; protected/private pages are not intent views', () => {
  const h = harness()
  for (const page of ['/', '/membership-pricing', '/hiring-firms', '/guides/example', '/tools']) assert.equal(h.helper.isIntentPage(page), true)
  for (const page of ['/admin', '/inspector-dashboard', '/members/synthetic', '/api/auth', '/tools/income-calculator']) assert.equal(h.helper.isIntentPage(page), false)
})

test('real tracker preserves the single first-party ledger and includes attribution without sending identities to added GA4 mappings', () => {
  const h = harness()
  h.tracker.trackPricingCtaClick({ targetPlan: 'Pro', source: 'hero', email: 'synthetic@example.invalid' })
  assert.equal(h.requests.length, 1); assert.equal(h.requests[0].url, '/api/conversion-events')
  assert.equal(h.requests[0].body.eventData.utm_content, 'hero')
  assert.equal(h.requests[0].body.eventData.email, 'synthetic@example.invalid')
  assert.equal(h.window.dataLayer.length, 1)
  assert.equal(h.window.dataLayer[0].acquisition.target_plan, 'pro')
  assert.equal(h.window.dataLayer[0].acquisition.email, undefined)
  assert.equal(h.window.dataLayer[0].event, 'pricing_cta_click')
})

test('direct GA4 path uses the exact stream and does not queue a second GTM event', () => {
  const h = harness(), direct = []; h.window.gtag = (...args) => direct.push(args)
  h.tracker.trackSignupStarted('Free')
  assert.equal(direct.length, 1); assert.equal(direct[0][2].send_to, 'G-NCQC8C8V6J')
  assert.equal(direct[0][2].target_plan, 'free'); assert.equal(h.window.dataLayer.length, 0)
  assert.equal(h.requests.length, 1)
})

test('server-side attribution calls are inert', () => {
  const context = { exports: {}, URL, URLSearchParams }; vm.runInNewContext(helperCode, context)
  assert.deepEqual(plain(context.exports.journeyAttribution()), {})
  assert.equal(context.exports.decorateAcquisitionUrl('/pricing'), '/pricing')
})

test('route tracker emits one intent view under Strict Mode replay and another on navigation', () => {
  const h = harness(), refs = [], listeners = new Map()
  let path = '/guides/example', query = 'utm_source=google', effect, cursor = 0
  const code = ts.transpileModule(readFileSync(new URL('../components/AcquisitionJourneyTracker.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  h.context.document = { querySelectorAll: () => [], addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: type => listeners.delete(type) }
  const module = { exports: {}, window: h.window, document: h.context.document,
    MutationObserver: class { observe() {} disconnect() {} },
    require(name) {
      if (name === 'react') return { useRef(initial) { return refs[cursor++] ||= { current: initial } }, useEffect(fn) { effect = fn } }
      if (name === 'next/navigation') return { usePathname: () => path, useSearchParams: () => ({ toString: () => query }) }
      return h.helper
    },
  }
  vm.runInNewContext(code, module)
  module.exports.AcquisitionJourneyTracker(); const cleanup = effect()
  cleanup(); effect()
  assert.equal(h.window.dataLayer.length, 1)
  assert.equal(h.window.dataLayer[0].event, 'intent_page_view')
  path = '/membership-pricing'; query = ''; cursor = 0
  h.window.location = new URL('https://members.nestedobjects.com/membership-pricing')
  module.exports.AcquisitionJourneyTracker(); effect()
  assert.equal(h.window.dataLayer.length, 2)
  assert.equal(h.window.dataLayer[1].acquisition.utm_source, 'google')
  assert.deepEqual([...listeners.keys()], ['pointerdown','click','auxclick'])
  effect()(); assert.equal(listeners.size, 0)
})

test('dynamic links support pointer and keyboard intent without duplicate pointerdown events or stale React destinations', () => {
  const h = harness()
  class Element {}
  class Anchor extends Element {
    dataset = { acquisitionSource: 'guide_directory' }
    href = 'https://members.nestedobjects.com/hiring-firms'
    getAttribute() { return this.href }
    closest() { return this }
  }
  h.context.Element = Element
  const anchor = new Anchor()
  h.helper.decorateJourneyClick({ type: 'pointerdown', target: anchor })
  assert.equal(h.window.dataLayer.length, 0)
  h.helper.decorateJourneyClick({ type: 'click', target: anchor })
  assert.equal(h.window.dataLayer.length, 1)
  assert.equal(h.window.dataLayer[0].acquisition.cta_source, 'guide_directory')
  anchor.href = 'https://members.nestedobjects.com/membership-pricing'
  h.helper.decorateJourneyClick({ type: 'auxclick', target: anchor })
  assert.equal(new URL(anchor.href).pathname, '/membership-pricing')
  assert.equal(h.window.dataLayer.length, 2)
})

test('original campaign survives a real fresh-browser-storage public to member handoff', () => {
  const publicSite = harness(); publicSite.helper.captureJourneyAttribution()
  publicSite.window.location = new URL('https://nestedobjects.com/guides/next?utm_source=second')
  const handoff = publicSite.helper.decorateAcquisitionUrl('https://members.nestedobjects.com/membership-pricing')
  const memberSite = harness({ url: handoff }), data = memberSite.helper.journeyAttribution()
  assert.equal(data.first_utm_source, 'google'); assert.equal(data.first_utm_campaign, 'inspectors')
  assert.equal(data.utm_source, 'second'); assert.equal(data.utm_campaign, undefined)
  assert.equal(data.last_utm_source, 'second'); assert.equal(data.landing_page, '/guides/example')
})

test('state directories and readiness guide entry pages are included', () => {
  const h = harness()
  for (const page of ['/hiring-firms/georgia', '/inspector-resource-center', '/inspector-resource-center/readiness-guides']) assert.equal(h.helper.isIntentPage(page), true)
})

test('public pricing links use the campaign-preserving destination and internal guides stay clean', () => {
  const layout=readFileSync(new URL('../../web-public/app/layout.tsx',import.meta.url),'utf8')
  const testimonials=readFileSync(new URL('../../web-public/components/TestimonialsSection.tsx',import.meta.url),'utf8')
  assert.equal(layout.includes('href="/pricing"'),false)
  assert.equal(testimonials.includes('href="/membership-pricing"'),false)
  assert.ok(layout.includes('data-acquisition-source="public_pricing_navigation"'))
  assert.ok(layout.includes('href="/guides"'))
})

test('public homepage retains Organization metadata and visible testimonials without self-serving rating schema', () => {
  const page=readFileSync(new URL('../../web-public/app/page.tsx',import.meta.url),'utf8')
  assert.ok(page.includes("canonical: 'https://nestedobjects.com/'"))
  assert.ok(page.includes("'@type': 'Organization'")); assert.ok(page.includes('<TestimonialsSection'))
  assert.equal(page.includes('aggregateRating'),false); assert.equal(page.includes("'@type': 'Review'"),false)
})

test('repeated link decoration is idempotent and does not trigger href mutation loops', () => {
  const h=harness(); let href='https://members.nestedobjects.com/membership-pricing', writes=0
  class Element {}
  class Anchor extends Element {
    dataset={}
    get href(){ return href }
    set href(value){ href=value; writes++ }
    getAttribute(){ return href }
    closest(){ return this }
  }
  h.context.Element=Element; const anchor=new Anchor()
  h.context.document={ querySelectorAll:()=>[anchor] }
  h.helper.decorateJourneyLinks(); h.helper.decorateJourneyLinks(); h.helper.decorateJourneyLinks()
  assert.equal(writes,1)
})

test('guide title relies on the existing brand template only once', () => {
  const page=readFileSync(new URL('../../web-public/app/guides/[slug]/page.tsx',import.meta.url),'utf8')
  assert.ok(page.includes('title: fm.title,'))
  assert.equal(page.includes('fm.title} | Nested Objects'),false)
})
