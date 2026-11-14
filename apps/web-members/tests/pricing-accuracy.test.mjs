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
let stateUpdates
let handoffTimers
let effects
const browser = { location: { href: '' }, setTimeout: callback => { handoffTimers.push(callback); return handoffTimers.length }, clearTimeout() {} }

function load(relativePath, imports = {}) {
  const code = ts.transpileModule(readFileSync(new URL(relativePath, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports, URL, console, AbortController, window: browser, process: { env: { NEXT_PUBLIC_OUTSETA_DIRECTORY_PASS_PLAN_UID: 'PassTest1' } },
    document: { body: {}, querySelectorAll: () => [] },
    MutationObserver: class { observe() {} disconnect() {} },
    crypto: { randomUUID: () => 'synthetic-pricing-attempt' },
    require(name) {
      if (name === 'react/jsx-runtime') return jsxRuntime
      if (name === 'react') return { ...React, useState: initial => [initial, value => stateUpdates.push(value)], useRef: initial => ({current:initial}), useEffect: callback => effects.push(callback) }
      if (name === 'lucide-react') return require('lucide-react')
      if (name in imports) return imports[name]
      throw new Error(`Unexpected import in ${relativePath}: ${name}`)
    },
  })
  return exports
}

const planConfig = load('../lib/plan-config.ts')
const management = load('../components/outseta/MembershipManagement.tsx', {
  '@/lib/membership-management': load('../lib/membership-management.ts'),
})
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
const mobileActions = load('../components/MobileActionBar.tsx', {
  '@/components/auth-provider': auth,
  'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
})
const analytics = Object.fromEntries([
  'trackJoinFreeClick', 'trackOutsetaModalOpen', 'trackPricingCtaClick',
  'trackPricingView', 'trackSignupStarted', 'trackStartTrial', 'trackUpgradeStarted', 'trackEvent',
].map(name => [name, payload => analyticsCalls.push({ name, payload })]))
analytics.trackEvent = (event, payload) => analyticsCalls.push({ name: 'trackEvent', event, payload })
const interactions = load('../app/membership-pricing/PricingInteractions.tsx', {
  '@/components/outseta/MembershipManagement': management,
  '@/components/auth-provider': auth,
  '@/lib/ai-datasets': datasets,
  '@/lib/plan-config': planConfig,
  '@/lib/ac-events': analytics,
  '@/lib/pricing-handoff': load('../lib/pricing-handoff.ts'),
  '../../../../packages/acquisition-attribution': { decorateAcquisitionUrl: href => href },
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
  'DeferredGoogleTagManager', 'DeferredOutsetaLoader', 'AcquisitionJourneyTracker',
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
  { name: 'Directory Pass', planUid: 'PassTest1', price: '$199', period: '12 months' },
  { name: 'Pro', planUid: 'rQVqlLm6', price: '$49', period: 'month' },
  { name: 'Agency', planUid: 'rmk5Xk9g', price: '$297', period: 'month' },
]
const publicPlans = datasets.membershipPlans.filter(plan => planConfig.isPublicPlanUid(plan.planUid))
const scenarios = [
  { name: 'visitor', planUid: null, finalLabel: 'Start Pro — $49/month', finalTarget: 'Pro' },
  { name: 'Free', planUid: 'L9nbKV9Z', finalLabel: 'Upgrade to Pro', finalTarget: 'Pro' },
  { name: 'Pro', planUid: 'rQVqlLm6', finalLabel: 'Manage or cancel membership', finalTarget: null },
  { name: 'Elite', planUid: 'NmdnNO90', finalLabel: 'Manage or cancel membership', finalTarget: null },
  { name: 'Agency', planUid: 'rmk5Xk9g', finalLabel: 'Manage or cancel membership', finalTarget: null },
]

function reset(scenario = scenarios[0]) {
  authState = { isAuthenticated: scenario.planUid !== null, isLoading: false, planUid: scenario.planUid,
    user: scenario.planUid ? { sub: 'synthetic-pricing-member' } : null }
  sdkCalls = []
  analyticsCalls = []
  stateUpdates = []
  handoffTimers = []
  effects = []
  browser.location.href = ''
  browser.Outseta = {
    getJwtPayload: () => ({ sub: 'synthetic-pricing-member', exp: Date.now() / 1000 + 3600 }),
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
  } else if (planName === 'Directory Pass') {
    assert.match(text, /directory/i)
    assert.match(text, /Pro|training/i)
  } else if (planName === 'Pro') {
    for (const tool of ['client and company tracking', 'AI Concierge', 'AI Resume', 'job tracking', 'weather', 'route planning']) {
      assert.ok(text.includes(tool), `Pro purchase copy omits ${tool}`)
    }
  } else if (planName === 'Elite' || planName === 'Agency') {
    assert.match(text, /every member tool/i)
    assert.match(text, /route economics/i)
  } else {
    assert.match(text, /Directory Pass/i)
    assert.match(text, /Pro.*(?:core|training)/i)
    assert.match(text, /Existing members (?:keep their purchased|retain their) access and terms/i)
  }
  assert.doesNotMatch(text, /connected tools.*remain unavailable/i)
  assert.doesNotMatch(text, /member tools.*preview.only|disabled on every plan|disabled on all plans/i)
}

test('approved public offers have exact prices and separate checkout UIDs', () => {
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

  test(`${scenario.name}: plan and final CTAs preserve checkout intent and describe current access`, async () => {
    reset(scenario)
    for (const plan of publicPlans) {
      sdkCalls.length = 0
      analyticsCalls.length = 0
      const button = findButton(interactions.PricingPlanButton({ plan }))
      assert.ok(button)
      const current = plan.planUid === scenario.planUid
      const unavailable = plan.waitlist === true || plan.checkoutUnavailable === true
      assert.equal(button.props.disabled, current || unavailable)
      await button.props.onClick()
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
      assert.equal(analyticsCalls.some(event => event.name === 'trackStartTrial'), false)
      const signupStarts = analyticsCalls.filter(event => event.name === 'trackSignupStarted')
      if (scenario.planUid === null) {
        assert.deepEqual(normalized(signupStarts.map(event => event.payload)), [plan.name])
      } else {
        assert.equal(signupStarts.length, 0)
      }
      assert.deepEqual(normalized(sdkCalls), scenario.planUid ? [
        { widget: 'profile', options: { tab: 'planChange', ...(plan.name === 'Directory Pass' ? { stateProps: { planUid: plan.planUid, planPaymentTerm: 'oneTime' } } : {}) } },
      ] : [
        { widget: 'auth', options: {
          widgetMode: 'register', planUid: plan.planUid, skipPlanOptions: true,
          ...(plan.paymentTerm ? { planPaymentTerm: plan.paymentTerm } : plan.period === 'month' ? { planPaymentTerm: 'month' } : {}),
        } },
      ])
    }

    sdkCalls.length = 0
    analyticsCalls.length = 0
    const proPlan = publicPlans.find(plan => plan.name === 'Pro')
    const finalCta = interactions.PricingFinalCta({ proPlan })
    assert.equal(plain(renderToStaticMarkup(finalCta)), scenario.finalLabel)
    if (scenario.finalTarget) {
      await findButton(finalCta).props.onClick()
      await Promise.resolve()
      assert.equal(analyticsCalls.find(event => event.name === 'trackPricingCtaClick')?.payload.targetPlanUid,
        expectedPlans.find(plan => plan.name === scenario.finalTarget).planUid)
      assert.deepEqual(normalized(analyticsCalls
        .filter(event => event.name === 'trackSignupStarted')
        .map(event => event.payload)), scenario.planUid === null ? [scenario.finalTarget] : [])
    } else {
      assert.match(renderToStaticMarkup(finalCta), /href="https:\/\/nested-objects\.outseta\.com\/profile\?tab=plan"/)
      assert.deepEqual(normalized(sdkCalls), [])
      assert.equal(analyticsCalls.length, 0)
    }

    const html = render(membership.MembershipView)
    const finalSection = [...html.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)]
      .map(match => match[0]).find(section => section.includes('Ready to build routes'))
    assert.ok(finalSection)
    assertToolAccessCopy(finalSection)
    assert.doesNotMatch(plain(finalSection), /firms, intel, and tools/i)
  })
}

test('every signed-in plan has a management link by its pricing plan badge without calling the SDK', () => {
  for (const scenario of [...scenarios.slice(1), { name: 'Founders', planUid: planConfig.PLAN_UIDS.FOUNDERS }]) {
    reset(scenario)
    browser.Outseta = new Proxy({}, { get() { throw new Error('SDK must not be read for management navigation') } })
    const html = render(interactions.PricingHeroAccountStatus)
    assert.match(html, /Manage or cancel membership/)
    assert.match(html, /href="https:\/\/nested-objects\.outseta\.com\/profile\?tab=plan"/)
    assert.equal(analyticsCalls.length, 0)
  }
  reset()
  assert.doesNotMatch(render(interactions.PricingHeroAccountStatus), /Manage or cancel membership/)
})

test('checkout fallback destinations preserve the public plan UIDs and authenticated billing path', async () => {
  browser.Outseta = undefined
  for (const plan of publicPlans.filter(plan => !plan.waitlist)) {
    const opening = findButton(interactions.PricingPlanButton({ plan })).props.onClick()
    handoffTimers.at(-2)() // bounded SDK-readiness deadline, before visibility timeout
    await opening
    assert.equal(browser.location.href,
      `https://nested-objects.outseta.com/auth?widgetMode=register&planUid=${plan.planUid}&skipPlanOptions=true${plan.paymentTerm ? `&planPaymentTerm=${plan.paymentTerm}` : plan.period === 'month' ? '&planPaymentTerm=month' : ''}`)
  }
  assert.deepEqual(normalized(analyticsCalls
    .filter(event => event.name === 'trackSignupStarted')
    .map(event => event.payload)), ['Free', 'Directory Pass', 'Pro'])
  const agency = publicPlans.find(plan => plan.name === 'Agency')
  browser.location.href = ''
  const agencyButton = findButton(interactions.PricingPlanButton({ plan: agency }))
  assert.equal(agencyButton.props.disabled, true)
  agencyButton.props.onClick()
  assert.equal(browser.location.href, '')
  authState = { isAuthenticated: true, isLoading: false, planUid: expectedPlans[0].planUid }
  const opening = findButton(interactions.PricingPlanButton({ plan: publicPlans.find(plan => plan.name === 'Pro') })).props.onClick()
  handoffTimers.at(-2)()
  await opening
  assert.equal(browser.location.href, 'https://nested-objects.outseta.com/profile?tab=planChange')
  assert.equal(analyticsCalls.filter(event => event.name === 'trackSignupStarted').length, 3)
})

test('Free paid-plan click catches SDK failure and offers keyboard-accessible explicit recovery', async () => {
  reset(scenarios[1])
  browser.Outseta.profile.open = () => { throw new Error('private-provider-error-with-email@example.test') }
  const button = findButton(interactions.PricingPlanButton({ plan: publicPlans.find(plan => plan.name === 'Pro') }))
  await button.props.onClick()
  const diagnostic = analyticsCalls.filter(event => event.event === 'checkout_handoff')
  assert.deepEqual(diagnostic.map(event => event.payload.handoffStatus), ['requested', 'open_failed'])
  assert.equal(new Set(diagnostic.map(event => event.payload.handoffId)).size, 1)
  assert.equal(analyticsCalls.find(event => event.name === 'trackPricingCtaClick').payload.handoffId, diagnostic[0].payload.handoffId)
  assert.equal(browser.location.href, '')
  assert.doesNotMatch(JSON.stringify(diagnostic), /private-provider-error|email@example/)
  const recovery = stateUpdates.findLast(value => value && typeof value === 'object' && value.href)
  const html = renderToStaticMarkup(interactions.PricingHandoffRecovery({ recovery }))
  assert.match(html, /role="status"/)
  assert.match(html, /href="https:\/\/nested-objects.outseta.com\/profile\?tab=planChange"/)
  assert.match(html, /Continue on secure plan page/)
  recovery.record()
  assert.equal(analyticsCalls.at(-1).payload.handoffStatus, 'recovery_redirect_requested')
})

test('silent SDK call permits no duplicate click and timeout stays unknown', async () => {
  reset(scenarios[1])
  const button = findButton(interactions.PricingPlanButton({ plan: publicPlans.find(plan => plan.name === 'Pro') }))
  await Promise.all([button.props.onClick(), button.props.onClick()])
  assert.equal(sdkCalls.length, 1)
  handoffTimers.at(-1)()
  assert.deepEqual(analyticsCalls.filter(event => event.event === 'checkout_handoff').map(event => event.payload.handoffStatus), ['requested','unobserved_timeout'])
  assert.equal(browser.location.href, '')
})

test('auth hydration cannot open anonymous registration for a signed-in member', async () => {
  reset(scenarios[0])
  authState.isLoading = true
  for (const button of [findButton(interactions.PricingPlanButton({plan:publicPlans.find(plan => plan.name === 'Pro')})),
    findButton(interactions.PricingFinalCta({proPlan:publicPlans.find(plan => plan.name === 'Pro')}))]) {
    assert.equal(button.props.disabled,true)
    assert.equal(button.props['aria-busy'],true)
    assert.match(plain(renderToStaticMarkup(button)),/Checking your plan/)
    await button.props.onClick()
  }
  assert.equal(sdkCalls.length,0)
  assert.equal(analyticsCalls.length,0)
  assert.equal(browser.location.href,'')
})

test('Free member waits for the profile module and opens once instead of redirecting to hosted login', async () => {
  reset(scenarios[1])
  delete browser.Outseta.profile
  const button=findButton(interactions.PricingPlanButton({plan:publicPlans.find(plan => plan.name === 'Pro')}))
  const opening=button.props.onClick()
  await button.props.onClick()
  assert.equal(sdkCalls.length,0)
  assert.equal(browser.location.href,'')
  browser.Outseta.profile={open:options=>sdkCalls.push({widget:'profile',options})}
  handoffTimers.at(-1)() // next readiness poll
  await opening
  assert.deepEqual(normalized(sdkCalls),[{widget:'profile',options:{tab:'planChange'}}])
  assert.equal(browser.location.href,'')
  assert.equal(analyticsCalls.filter(e=>e.name==='trackPricingCtaClick').length,1)
  assert.deepEqual(analyticsCalls.filter(e=>e.event==='checkout_handoff').map(e=>e.payload.handoffStatus),['requested'])
})

test('cookie-only, stale and different-account SDK sessions use the existing secure hosted route without a blank widget', async () => {
  for (const claims of [null, {sub:'someone-else',exp:Date.now()/1000+3600},
    {sub:'synthetic-pricing-member',exp:0}, {sub:'synthetic-pricing-member'}]) {
    reset(scenarios.find(scenario=>scenario.name==='Free'))
    browser.Outseta.getJwtPayload = () => claims
    const button = interactions.PricingPlanButton({plan: datasets.membershipPlans.find(plan=>plan.name==='Pro')})
    await findButton(button).props.onClick()
    assert.equal(sdkCalls.length,0)
    assert.equal(browser.location.href,'https://nested-objects.outseta.com/profile?tab=planChange')
    const events=analyticsCalls.filter(call=>call.event==='checkout_handoff')
    assert.deepEqual(events.map(event=>event.payload.handoffStatus),['requested','hosted_redirect_requested'])
    assert.equal(events.at(-1).payload.reason,'provider_session_unavailable')
    assert.equal(analyticsCalls.some(call=>JSON.stringify(call.payload).includes('someone-else')),false)
  }
})

test('unmount while the SDK loads prevents a later widget open or hosted redirect', async () => {
  reset(scenarios[1])
  delete browser.Outseta.profile
  const button=findButton(interactions.PricingPlanButton({plan:publicPlans.find(plan => plan.name === 'Pro')}))
  const cleanup=effects[0]()
  const opening=button.props.onClick()
  cleanup()
  browser.Outseta.profile={open:options=>sdkCalls.push(options)}
  handoffTimers.forEach(timer=>timer())
  await opening
  assert.equal(sdkCalls.length,0)
  assert.equal(browser.location.href,'')
  assert.deepEqual(analyticsCalls.filter(e=>e.event==='checkout_handoff').map(e=>e.payload.handoffStatus),['requested'])
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
  assert.match(toolFaq.acceptedAnswer.text, /Existing members keep their purchased access and terms/)
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

test('new Pro signup shows the monthly price and paid terms without a zero-due or trial promotion', () => {
  const html = render(membership.MembershipView)
  const text = plain(html)
  assert.match(text, /Start Pro — \$49\/month/)
  assert.match(text, /New Pro subscriptions are billed at signup\. No free trial\./)
  assert.doesNotMatch(text, /\$0 due today|7.day (?:Pro |free )?trial|test Pro for seven days|before paid billing begins/i)
  assert.match(text, /Existing trials and subscriptions retain their current terms/)
  assert.match(text, /Your first 7 days inside the hub/)
  assert.match(text, /Day 6 to 7/)
  const pro = publicPlans.find(plan => plan.name === 'Pro')
  assert.equal(pro.price, '$49')
  assert.equal(pro.features.some(feature => /trial/i.test(feature)), false)
})

test('anonymous Pro selection records intent and handoff, never a trial, subscription or payment outcome', async () => {
  const pro = publicPlans.find(plan => plan.name === 'Pro')
  for (const component of [() => interactions.PricingPlanButton({ plan: pro }),
    () => interactions.PricingFinalCta({ proPlan: pro })]) {
    reset()
    await findButton(component()).props.onClick()
    assert.deepEqual(analyticsCalls.map(call => call.name),
      ['trackEvent', 'trackPricingCtaClick', 'trackSignupStarted', 'trackOutsetaModalOpen'])
    const receipt = analyticsCalls[0]
    assert.equal(receipt.event, 'checkout_handoff')
    assert.equal(receipt.payload.handoffStatus, 'requested')
    assert.equal(receipt.payload.targetPlanUid, 'rQVqlLm6')
    assert.equal(receipt.payload.handoffId, analyticsCalls[1].payload.handoffId)
    assert.equal(analyticsCalls[2].payload, 'Pro')
    assert.equal(analyticsCalls.some(call => /purchase|subscription|trial/i.test(call.name + (call.event || ''))), false)
    assert.deepEqual(normalized(sdkCalls), [{ widget: 'auth', options: {
      widgetMode: 'register', planUid: 'rQVqlLm6', planPaymentTerm: 'month', skipPlanOptions: true,
    } }])
  }
})

test('billing FAQ matches rendered JSON-LD and preserves existing trial terms', () => {
  const html = render(page.default)
  const faq = schemasFrom(html).find(schema => schema['@type'] === 'FAQPage')
  const billing = faq.mainEntity.find(question => question.name === 'When does a new Pro subscription start billing?')
  assert.ok(billing)
  assert.match(billing.acceptedAnswer.text, /\$49\/month.*billed at signup, with no free trial/)
  assert.match(billing.acceptedAnswer.text, /Existing trials and subscriptions retain their current terms/)
  assert.ok(plain(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')).includes(billing.acceptedAnswer.text))
})

test('Free preview and legacy plans retain their prices and promised features', () => {
  const free = publicPlans.find(plan => plan.name === 'Free')
  assert.equal(free.price, '$0')
  assert.equal(free.period, 'forever')
  assert.ok(free.features.includes('Preview up to 3 free firms'))
  assert.ok(free.features.includes('Income scenario planner using your own assumptions'))
  assert.match(plain(render(interactions.PricingPlanButton.bind(null, { plan: free }))), /No credit card required/)
  for (const [uid, price, period] of [[planConfig.PLAN_UIDS.FOUNDERS, '$37', 'year'], [planConfig.PLAN_UIDS.STARTER, '$99', 'quarter']]) {
    const plan = datasets.membershipPlans.find(item => item.planUid === uid)
    assert.equal(plan.price, price)
    assert.equal(plan.period, period)
    assert.equal(plan.hidden, true)
    assert.ok(plan.features.some(feature => /Full directory access/.test(feature)))
    assert.ok(plan.features.includes('Full training portal access'))
  }
})

test('mobile pricing entry says Plans while authenticated Hub navigation stays unchanged', () => {
  const guest = render(mobileActions.MobileActionBar)
  assert.match(guest, /href="\/membership-pricing"/)
  assert.match(plain(guest), /^Plans Firms Tools$/)
  reset(scenarios[1])
  const member = render(mobileActions.MobileActionBar)
  assert.match(member, /href="\/inspector-dashboard"/)
  assert.match(plain(member), /^Hub Firms Tools$/)
})

test('retired Elite and an unconfigured Directory Pass cannot open checkout or emit signup intent', async () => {
  for (const plan of [datasets.membershipPlans.find(plan => plan.name === 'Elite'),
    { ...datasets.membershipPlans.find(plan => plan.name === 'Directory Pass'), planUid: '', checkoutUnavailable: true }]) {
    reset()
    const button = findButton(interactions.PricingPlanButton({ plan }))
    assert.equal(button.props.disabled, true)
    await button.props.onClick()
    assert.equal(sdkCalls.length, 0)
    assert.equal(analyticsCalls.length, 0)
    assert.equal(browser.location.href, '')
  }
})

test('Directory Pass uses a one-time checkout and explicitly excludes automatic renewal', async () => {
  const plan = publicPlans.find(plan => plan.name === 'Directory Pass')
  await findButton(interactions.PricingPlanButton({ plan })).props.onClick()
  assert.equal(sdkCalls[0].options.planPaymentTerm, 'oneTime')
  assert.equal(sdkCalls[0].options.planUid, 'PassTest1')
  assert.match(plain(render(membership.MembershipView)), /no automatic renewal/i)
  assert.equal(plan.price, '$199')
  assert.equal(plan.period, '12 months')
  assert.equal(planConfig.PAID_PLANS.includes(planConfig.PLAN_UIDS.ELITE), true)
  assert.equal(planConfig.isPublicPlanUid(planConfig.PLAN_UIDS.ELITE), false)
})

test('signed-in Directory Pass handoff selects the one-time plan using profile stateProps', async () => {
  reset(scenarios[1])
  const plan = publicPlans.find(plan => plan.name === 'Directory Pass')
  await findButton(interactions.PricingPlanButton({ plan })).props.onClick()
  assert.deepEqual(normalized(sdkCalls), [{ widget: 'profile', options: { tab: 'planChange', stateProps: { planUid: 'PassTest1', planPaymentTerm: 'oneTime' } } }])
})

test('Directory Pass never falls back to an unpinned provider plan selector', async () => {
  reset(scenarios[1])
  browser.Outseta.getJwtPayload = () => ({ sub: 'different-account', exp: Date.now() / 1000 + 3600 })
  await findButton(interactions.PricingPlanButton({ plan: publicPlans.find(plan => plan.name === 'Directory Pass') })).props.onClick()
  assert.equal(browser.location.href, '')
  assert.equal(sdkCalls.length, 0)
  assert.deepEqual(analyticsCalls.filter(event => event.event === 'checkout_handoff').map(event => event.payload.handoffStatus), ['requested', 'open_failed'])
  assert.equal(stateUpdates.findLast(value => value && typeof value === 'object' && value.href).href, '/membership-pricing')
})