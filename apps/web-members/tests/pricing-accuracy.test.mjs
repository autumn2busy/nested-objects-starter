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
const siteUrl = 'https://synthetic-members.example'

// Render the real pricing, testimonial, layout and schema code. Only auth,
// external SDKs, analytics, fonts and unrelated shared chrome are substituted.
// The synthetic window records checkout intent without making any requests.
let authState
let sdkCalls
let analyticsCalls
const browser = { location: { href: '' } }

function load(relativePath, imports = {}) {
  const code = ts.transpileModule(readFileSync(new URL(relativePath, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports, URL, console, window: browser, process: { env: {} },
    require(name) {
      if (name === 'react/jsx-runtime') return jsxRuntime
      if (name === 'react') return React
      if (name === 'lucide-react') return require('lucide-react')
      if (name in imports) return imports[name]
      throw new Error(`Unexpected import in ${relativePath}: ${name}`)
    },
  })
  return exports
}

const planConfig = load('../lib/plan-config.ts')
const datasets = load('../lib/ai-datasets.ts', { './plan-config': planConfig })
const testimonials = load('../lib/testimonials.ts')
const seo = load('../lib/seo.ts', {
  '@/lib/seo-env': { getSiteUrl: () => siteUrl },
  '@/lib/plan-config': planConfig,
})
const auth = {
  useAuth: () => authState,
  AuthProvider: ({ children }) => children,
}
const analytics = Object.fromEntries([
  'trackJoinFreeClick', 'trackOutsetaModalOpen', 'trackPricingCtaClick',
  'trackPricingView', 'trackStartTrial', 'trackUpgradeStarted',
].map(name => [name, payload => analyticsCalls.push({ name, payload })]))
const interactions = load('../app/membership-pricing/PricingInteractions.tsx', {
  '@/components/auth-provider': auth,
  '@/lib/ai-datasets': datasets,
  '@/lib/plan-config': planConfig,
  '@/lib/ac-events': analytics,
})
const testimonialComponents = load('../components/TestimonialsSection.tsx', {
  '@/lib/testimonials': testimonials,
})
const membership = load('../app/membership-pricing/MembershipView.tsx', {
  '@/lib/ai-datasets': datasets,
  '@/lib/plan-config': planConfig,
  '@/components/TestimonialsSection': testimonialComponents,
  'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
  './PricingInteractions': interactions,
})
const page = load('../app/membership-pricing/page.tsx', {
  './MembershipView': membership,
  '@/lib/seo': seo,
  '@/lib/ai-datasets': datasets,
  '@/lib/plan-config': planConfig,
  '@/lib/testimonials': testimonials,
})
const chromeImports = Object.fromEntries([
  'ActiveCampaignTracker', 'SiteHeader', 'SiteFooter', 'MobileActionBar',
  'DeferredGoogleTagManager', 'DeferredOutsetaLoader',
].map(name => [`@/components/${name}`, { [name]: () => null }]))
const layout = load('../app/layout.tsx', {
  ...chromeImports,
  '@/components/auth-provider': auth,
  '@/lib/seo': seo,
  '@/lib/testimonials': testimonials,
  '@/lib/utils': { cn: (...values) => values.filter(Boolean).join(' ') },
  'next/font/google': { Plus_Jakarta_Sans: () => ({ variable: 'synthetic-font' }) },
  'next/script': { default: () => null },
  '../styles/globals.css': {},
})

const expectedPlans = [
  { name: 'Free', planUid: 'L9nbKV9Z', price: '$0', period: 'forever' },
  { name: 'Pro', planUid: 'rQVqlLm6', price: '$49', period: 'month' },
  { name: 'Elite', planUid: 'NmdnNO90', price: '$97', period: 'month' },
  { name: 'Agency', planUid: 'rmk5Xk9g', price: '$297', period: 'month' },
]
const publicPlans = datasets.membershipPlans.filter(plan => planConfig.isPublicPlanUid(plan.planUid))
const scenarios = [
  { name: 'visitor', planUid: null, finalLabel: 'Start Pro Trial - $0 Due Today', finalTarget: 'Pro' },
  { name: 'Free', planUid: 'L9nbKV9Z', finalLabel: 'Upgrade to Pro', finalTarget: 'Pro' },
  { name: 'Pro', planUid: 'rQVqlLm6', finalLabel: 'Upgrade to Elite', finalTarget: 'Elite' },
  { name: 'Elite', planUid: 'NmdnNO90', finalLabel: 'Open manage plan & billing', finalTarget: null },
  { name: 'Agency', planUid: 'rmk5Xk9g', finalLabel: 'Open manage plan & billing', finalTarget: null },
]

function reset(scenario = scenarios[0]) {
  authState = { isAuthenticated: scenario.planUid !== null, isLoading: false, planUid: scenario.planUid }
  sdkCalls = []
  analyticsCalls = []
  browser.location.href = ''
  browser.Outseta = {
    auth: { open: options => sdkCalls.push({ widget: 'auth', options }) },
    profile: { open: options => sdkCalls.push({ widget: 'profile', options }) },
  }
}
test.beforeEach(() => reset())

const plain = html => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')
  .replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim()
const render = component => renderToStaticMarkup(React.createElement(component))
const normalized = value => JSON.parse(JSON.stringify(value))

function findButton(node) {
  if (!node || typeof node !== 'object') return null
  if (node.type === 'button') return node
  for (const child of React.Children.toArray(node.props?.children)) {
    const match = findButton(child)
    if (match) return match
  }
  return null
}

function schemasFrom(html) {
  return [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .flatMap(match => JSON.parse(match[1]))
}

function assertToolAccessCopy(html, planName) {
  const text = plain(html)
  if (planName === 'Free') {
    assert.match(text, /Free includes the income scenario planner only/i)
  } else if (planName === 'Pro') {
    for (const tool of ['client and company tracking', 'AI Concierge', 'AI Resume', 'job tracking', 'weather', 'route planning']) {
      assert.ok(text.includes(tool), `Pro purchase copy omits ${tool}`)
    }
  } else if (planName === 'Elite' || planName === 'Agency') {
    assert.match(text, /every member tool/i)
    assert.match(text, /route economics/i)
  } else {
    assert.match(text, /Free includes the income scenario planner/i)
    assert.match(text, /Pro includes the core/i)
    assert.match(text, /Elite includes every member tool/i)
  }
  assert.doesNotMatch(text, /connected tools.*remain unavailable/i)
  assert.doesNotMatch(text, /member tools.*preview.only|disabled on every plan|disabled on all plans/i)
}

test('public plan prices, billing periods and checkout UIDs stay unchanged', () => {
  assert.deepEqual(normalized(publicPlans.map(({ name, planUid, price, period }) => ({ name, planUid, price, period }))), expectedPlans)
})

for (const scenario of scenarios) {
  test(`${scenario.name}: each rendered plan states its current tool access before purchase`, () => {
    reset(scenario)
    const html = render(membership.MembershipView)
    const cards = [...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)]
      .map(match => match[0]).filter(card => /<h2\b/.test(card))
    assert.equal(cards.length, expectedPlans.length)
    cards.forEach((card, index) => {
      assert.equal(plain(card.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/)[1]), expectedPlans[index].name)
      assert.ok(plain(card).includes(expectedPlans[index].price))
      const purchaseArea = card.slice(card.lastIndexOf('</ul>') + 5, card.indexOf('<button'))
      assertToolAccessCopy(purchaseArea, expectedPlans[index].name)
    })
  })

  test(`${scenario.name}: plan and final CTAs preserve checkout intent and describe current access`, () => {
    reset(scenario)
    for (const plan of publicPlans) {
      sdkCalls.length = 0
      analyticsCalls.length = 0
      const button = findButton(interactions.PricingPlanButton({ plan }))
      assert.ok(button)
      const current = plan.planUid === scenario.planUid
      const unavailable = plan.waitlist === true
      assert.equal(button.props.disabled, current || unavailable)
      button.props.onClick()
      if (current || unavailable) {
        assert.equal(sdkCalls.length, 0)
        assert.equal(analyticsCalls.length, 0)
        if (unavailable && !current && plan.name === 'Agency') {
          assert.match(plain(renderToStaticMarkup(button)), /Team access in preparation/)
        }
        continue
      }
      const intent = analyticsCalls.find(event => event.name === 'trackPricingCtaClick')
      assert.equal(intent?.payload.targetPlanUid, plan.planUid)
      assert.deepEqual(normalized(sdkCalls), scenario.planUid ? [
        { widget: 'profile', options: { tab: 'planChange' } },
      ] : [
        { widget: 'auth', options: {
          widgetMode: 'register', planUid: plan.planUid, skipPlanOptions: true,
          ...(plan.period === 'month' ? { planPaymentTerm: 'month' } : {}),
        } },
      ])
    }

    sdkCalls.length = 0
    analyticsCalls.length = 0
    const proPlan = publicPlans.find(plan => plan.name === 'Pro')
    const finalButton = findButton(interactions.PricingFinalCta({ proPlan }))
    assert.equal(plain(renderToStaticMarkup(finalButton)), scenario.finalLabel)
    finalButton.props.onClick()
    if (scenario.finalTarget) {
      assert.equal(analyticsCalls.find(event => event.name === 'trackPricingCtaClick')?.payload.targetPlanUid,
        expectedPlans.find(plan => plan.name === scenario.finalTarget).planUid)
    } else {
      assert.deepEqual(normalized(sdkCalls), [{ widget: 'profile', options: { tab: 'billing' } }])
    }

    const html = render(membership.MembershipView)
    const finalSection = [...html.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)]
      .map(match => match[0]).find(section => section.includes('Ready to build routes'))
    assert.ok(finalSection)
    assertToolAccessCopy(finalSection)
    assert.doesNotMatch(plain(finalSection), /firms, intel, and tools/i)
  })
}

test('checkout fallback destinations preserve the public plan UIDs and authenticated billing path', () => {
  browser.Outseta = undefined
  for (const plan of publicPlans.filter(plan => !plan.waitlist)) {
    findButton(interactions.PricingPlanButton({ plan })).props.onClick()
    assert.equal(browser.location.href,
      `https://nested-objects.outseta.com/auth?widgetMode=register&planUid=${plan.planUid}&skipPlanOptions=true`)
  }
  const agency = publicPlans.find(plan => plan.name === 'Agency')
  browser.location.href = ''
  const agencyButton = findButton(interactions.PricingPlanButton({ plan: agency }))
  assert.equal(agencyButton.props.disabled, true)
  agencyButton.props.onClick()
  assert.equal(browser.location.href, '')
  authState = { isAuthenticated: true, isLoading: false, planUid: expectedPlans[0].planUid }
  findButton(interactions.PricingPlanButton({ plan: publicPlans[1] })).props.onClick()
  assert.equal(browser.location.href, 'https://nested-objects.outseta.com/profile#o-plan-change')
})

test('composed pricing JSON-LD removes unsupported ratings while retaining all base schemas and public offers', () => {
  const html = renderToStaticMarkup(React.createElement(layout.default, null, React.createElement(page.default)))
  const schemas = schemasFrom(html)
  assert.deepEqual(schemas.map(schema => schema['@type']).sort(), [
    'Organization', 'WebSite', 'SoftwareApplication', 'BreadcrumbList',
    'Service', 'Service', 'Service', 'Service', 'FAQPage',
  ].sort())
  function checkNoRatings(value) {
    if (!value || typeof value !== 'object') return
    for (const [key, child] of Object.entries(value)) {
      assert.ok(!['aggregateRating', 'review', 'reviewRating'].includes(key), `Unsupported ${key} in pricing JSON-LD`)
      checkNoRatings(child)
    }
  }
  checkNoRatings(schemas)
  const services = schemas.filter(schema => schema['@type'] === 'Service')
  assert.deepEqual(services.map(schema => ({ name: schema.name, price: schema.offers.price })),
    expectedPlans.map(plan => ({ name: `Nested Objects ${plan.name} Plan`, price: plan.price.slice(1) })))
  for (const service of services) {
    assert.equal(service.offers.priceCurrency, 'USD')
    assert.equal(service.offers.url, `${siteUrl}/membership-pricing`)
  }
  const application = schemas.find(schema => schema['@type'] === 'SoftwareApplication')
  assert.equal(application.name, 'Nested Objects Member Hub')
  assert.equal(application.applicationCategory, 'BusinessApplication')
  assert.deepEqual(application.offers.map(offer => ({ name: offer.name, price: offer.price })),
    expectedPlans.map(plan => ({ name: plan.name, price: plan.price.slice(1) })))
})

test('visible tool-availability FAQ and FAQ JSON-LD give the same access boundary', () => {
  const html = render(page.default)
  const faqSchema = schemasFrom(html).find(schema => schema['@type'] === 'FAQPage')
  assert.ok(faqSchema)
  const toolFaq = faqSchema.mainEntity.find(question => /tool/i.test(question.name))
  assert.ok(toolFaq, 'A tool-availability question must be present')
  assertToolAccessCopy(toolFaq.acceptedAnswer.text)
  assert.match(toolFaq.acceptedAnswer.text, /Pro trial/)
  const visibleHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
  assert.ok(plain(visibleHtml).includes(toolFaq.name))
  assert.ok(plain(visibleHtml).includes(toolFaq.acceptedAnswer.text))
})

test('pricing retains the real visible testimonial strip independently of structured ratings', () => {
  const html = render(membership.MembershipView)
  const strip = render(testimonialComponents.TestimonialStrip)
  assert.ok(html.includes(strip))
  assert.match(plain(strip), /verified member reviews/)
  assert.ok(plain(strip).includes(`${testimonials.TESTIMONIALS.length}+`))
  assert.ok(strip.includes('aria-label="5 out of 5 stars"'))
})
