import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { createLocalJWKSet, exportJWK, generateKeyPair, jwtVerify, SignJWT } from 'jose'

const require = createRequire(import.meta.url)
const { NextResponse } = require('next/server')
const jsx = require('react/jsx-runtime')
const { renderToStaticMarkup } = require('react-dom/server')
const now = Date.parse('2026-10-08T12:00:00Z')
const issuer = 'https://nested-objects.outseta.com'
const claims = { sub: 'synthetic-person', 'outseta:accountUid': 'synthetic-account', 'outseta:planUid': 'L9nbKV9Z', 'outseta:subscriptionUid': 'old-cycle' }
const person = () => ({ Uid: claims.sub })
const memberToken = 'synthetic-member-token'
const account = (planUid = 'NmdnNO90') => ({
  Uid: claims['outseta:accountUid'], AccountStage: 3,
  CurrentSubscription: { Uid: 'current-cycle', Plan: { Uid: planUid }, StartDate: '2026-10-01T00:00:00Z', EndDate: null },
})
function load(path, imports = {}, globals = {}) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports, URL, AbortSignal, process: { env: {} }, console: { error() {} }, ...globals,
    require(name) {
      if (name === 'react/jsx-runtime') return jsx
      if (name in imports) return imports[name]
      throw new Error(`Unexpected import in ${path}: ${name}`)
    },
  })
  return exports
}
const plans = load('../lib/plan-config.ts')
const membership = load('../lib/current-membership.ts', { './plan-config': plans })
const evaluate = (row, member = person(), token = claims, at = now) => membership.evaluateCurrentMembership(token, member ? { ...member, Account: row } : member, at)
const normalize = value => JSON.parse(JSON.stringify(value))

for (const [name, uid] of Object.entries(plans.PLAN_UIDS)) {
  test(`${name}: fresh current subscription overrides old token plan and cycle`, () => {
    const result = evaluate(account(uid))
    assert.equal(result.status, 'verified')
    assert.equal(result.planUid, uid)
    assert.equal(result.subscriptionUid, 'current-cycle')
  })
}
for (const stage of [2, 3, 7]) {
  test(`current stage ${stage} does not invent expiry from renewal or payment amounts`, () => {
    const row = account()
    Object.assign(row, { AccountStage: stage, RenewalDate: '2026-10-01T00:00:00Z', Mrr: 0, Paid: 0 })
    assert.equal(evaluate(row).status, 'verified')
  })
}
for (const stage of [4, 8]) {
  test(`cancellation stage ${stage} remains entitled until the effective end, then expires`, () => {
    const row = account()
    row.AccountStage = stage
    row.CurrentSubscription.EndDate = '2026-10-09T12:00:00Z'
    row.CancellationDate = '2026-10-01T00:00:00Z'
    assert.equal(evaluate(row).status, 'verified')
    const end = Date.parse(row.CurrentSubscription.EndDate)
    assert.equal(evaluate(row, person(), claims, end - 1).status, 'verified')
    for (const at of [end, end + 1]) {
      const expired = evaluate(row, person(), claims, at)
      assert.equal(expired.status, 'expired')
      assert.equal(expired.planUid, null)
      assert.equal(expired.subscriptionUid, null)
    }
  })
}
const invalidCases = [
  ['missing current subscription with a paid LatestSubscription', row => { row.LatestSubscription = row.CurrentSubscription; delete row.CurrentSubscription }],
  ['unknown current plan', row => { row.CurrentSubscription.Plan.Uid = 'unconfigured-plan' }],
  ['missing subscription UID', row => { delete row.CurrentSubscription.Uid }],
  ['missing plan', row => { delete row.CurrentSubscription.Plan }],
  ['missing effective end', row => { delete row.CurrentSubscription.EndDate }],
  ['malformed effective end', row => { row.CurrentSubscription.EndDate = 'tomorrow' }],
  ['timezone-free effective end', row => { row.CurrentSubscription.EndDate = '2026-10-09T12:00:00' }],
  ['missing start', row => { delete row.CurrentSubscription.StartDate }],
  ['future subscription', row => { row.CurrentSubscription.StartDate = '2026-11-01T00:00:00Z' }],
  ['conflicting dates', row => { row.CurrentSubscription.EndDate = '2026-09-01T00:00:00Z' }],
  ['canceling without effective end', row => { row.AccountStage = 4 }],
  ['canceling trial without effective end', row => { row.AccountStage = 8 }],
  ['unknown account stage', row => { row.AccountStage = 99 }],
  ['absent stage', row => { delete row.AccountStage }],
  ['string stage', row => { row.AccountStage = '3' }],
  ['wrong account identity', row => { row.Uid = 'another-account' }],
  ['subscription linked to another account', row => { row.CurrentSubscription.Account = { Uid: 'another-account' } }],
  ['array instead of subscription', row => { row.CurrentSubscription = [row.CurrentSubscription] }],
]
for (const [name, mutate] of invalidCases) {
  test(`${name}: uncertainty withholds both access and current-cycle evidence`, () => {
    const row = account()
    mutate(row)
    const result = evaluate(row)
    assert.equal(result.status, 'unknown')
    assert.equal(result.planUid, null)
    assert.equal(result.subscriptionUid, null)
  })
}
for (const stage of [5, 6]) {
  test(`expired stage ${stage} overrides an apparently current paid subscription`, () => {
    const row = account()
    row.AccountStage = stage
    assert.equal(evaluate(row).status, 'expired')
    assert.equal(evaluate(row).planUid, null)
  })
}
for (const [name, value] of [
  ['wrong person', { ...person(), Uid: 'other-person' }],
  ['missing person identity', {}],
  ['null person', null],
]) {
  test(`${name}: exact identity linkage is required`, () => assert.equal(evaluate(account(), value).status, 'unknown'))
}
for (const token of [{}, { sub: claims.sub }, { 'outseta:accountUid': claims['outseta:accountUid'] }, { ...claims, sub: '../other' }]) {
  test(`invalid identity ${JSON.stringify(token)} never falls back to another JWT identifier`, async () => {
    let reads = 0
    const result = await membership.readCurrentMembership(token, memberToken, { fetcher: async () => { reads++; throw Error('unexpected') } })
    assert.equal(result.status, 'unknown')
    assert.equal(reads, 0)
  })
}

function reader({ accountValue = account(), profileValue = { ...person(), Account: accountValue }, failAt = 0, invalidJson = false } = {}) {
  const reads = []
  return {
    reads,
    async fetcher(url, init) {
      reads.push({ url: new URL(url), init })
      if (failAt === reads.length) throw new Error('SYNTHETIC_PRIVATE_ERROR')
      return { ok: true, json: async () => {
        if (invalidJson) throw new Error('SYNTHETIC_PRIVATE_BODY')
        return profileValue
      } }
    },
  }
}
const options = transport => ({ ...transport, now: () => now })
test('the transport reads only the verified token profile on the fixed provider host without admin configuration', async () => {
  const transport = reader()
  const result = await membership.readCurrentMembership(claims, memberToken, options(transport))
  assert.equal(result.status, 'verified')
  assert.deepEqual(transport.reads.map(r => r.url.pathname), ['/api/v1/profile'])
  for (const { url, init } of transport.reads) {
    assert.equal(url.origin, issuer)
    assert.equal(init.method, 'GET')
    assert.equal(init.cache, 'no-store')
    assert.equal(init.redirect, 'error')
    assert.equal(init.headers.Authorization, `Bearer ${memberToken}`)
    assert.ok(init.signal instanceof AbortSignal)
  }
  assert.doesNotMatch(transport.reads[0].url.search, /Latest|History|Payment|Renewal|synthetic-member-token/)
  assert.doesNotMatch(JSON.stringify(result), /synthetic-member-token/)
})
test('a pending replacement subscription never displaces the effective current subscription', () => {
  const row = account(plans.PLAN_UIDS.ELITE)
  row.LatestSubscription = { ...account(plans.PLAN_UIDS.FREE).CurrentSubscription, Uid: 'future-cycle', StartDate: '2026-11-01T00:00:00Z' }
  row.Subscriptions = [row.LatestSubscription]
  assert.equal(evaluate(row).planUid, plans.PLAN_UIDS.ELITE)
  assert.equal(evaluate(row).subscriptionUid, 'current-cycle')
})
test('expiry is evaluated after the provider response, not at request start', async () => {
  const row = account()
  row.CurrentSubscription.EndDate = '2026-10-08T12:00:01Z'
  const transport = reader({ accountValue: row })
  const result = await membership.readCurrentMembership(claims, memberToken, { ...options(transport), now: () => {
    assert.equal(transport.reads.length, 1)
    return now + 1000
  } })
  assert.equal(result.status, 'expired')
  assert.equal(result.planUid, null)
})
for (const profileValue of [null, [], person(), { ...person(), Account: [] }, { ...person(), PersonAccount: [{ Account: account() }] }, { ...person(), Account: { ...account(), Uid: 'another-account' } }]) {
  test(`profile requires its exact current Account and never selects from account links: ${JSON.stringify(profileValue)}`, async () => {
    const transport = reader({ profileValue })
    assert.equal((await membership.readCurrentMembership(claims, memberToken, options(transport))).status, 'unknown')
    assert.equal(transport.reads.length, 1)
  })
}
for (const failure of [{ failAt: 1 }, { invalidJson: true }]) {
  test(`transport failure ${JSON.stringify(failure)} returns unavailable without stale grants or raw errors`, async () => {
    const result = await membership.readCurrentMembership(claims, memberToken, options(reader(failure)))
    assert.equal(result.status, 'unavailable')
    assert.equal(result.planUid, null)
    assert.doesNotMatch(JSON.stringify(result), /SYNTHETIC_PRIVATE|synthetic-secret/)
  })
}
test('missing or malformed token and non-success HTTP responses are unavailable', async () => {
  const transport = reader()
  for (const token of ['', undefined, 'a\r\nb']) {
    assert.equal((await membership.readCurrentMembership(claims, token, options(transport))).status, 'unavailable')
  }
  assert.equal(transport.reads.length, 0)
  for (const status of [401, 403, 404, 429, 500]) {
    assert.equal((await membership.readCurrentMembership(claims, memberToken, options({ fetcher: async () => ({ ok: false, status }) }))).status, 'unavailable')
  }
})

// Real JWT verification + actual resolver + actual server/session functions.
// Only cookie storage and the provider HTTP response are synthetic.
const keys = await generateKeyPair('RS256')
const jwk = await exportJWK(keys.publicKey)
const localKeys = createLocalJWKSet({ keys: [{ ...jwk, kid: 'synthetic', alg: 'RS256' }] })
async function sessionHarness(transport = reader(), tokenClaims = claims) {
  let cookie = await new SignJWT(tokenClaims).setProtectedHeader({ alg: 'RS256', kid: 'synthetic' })
    .setIssuer(issuer).setExpirationTime('5m').sign(keys.privateKey)
  const writes = []
  const headers = { cookies: () => ({ get: () => cookie ? { value: cookie } : undefined,
    set: (name, value, config) => { writes.push({ name, value, config }); cookie = value }, delete: () => { cookie = null },
  }) }
  const liveResolver = load('../lib/current-membership.ts', { './plan-config': plans }, {
    fetch: transport.fetcher,
    Date: class extends Date { static now() { return now } },
  })
  const auth = load('../lib/auth-server.ts', { './plan-config': plans, './current-membership': liveResolver,
    jose: { jwtVerify, createRemoteJWKSet: () => localKeys }, 'next/headers': headers,
  })
  const session = load('../app/api/auth/session/route.ts', { '@/lib/auth-server': auth, 'next/headers': headers, 'next/server': { NextResponse } }, { process: { env: { NODE_ENV: 'production' } } })
  return { auth, session, writes, transport, get cookie() { return cookie }, setCookie(value) { cookie = value } }
}
test('session and server gates resolve upgraded Elite access from an unchanged Free login token', async () => {
  const h = await sessionHarness()
  const oldToken = h.cookie
  const response = await h.session.GET()
  const data = await response.json()
  assert.equal(data.isAuthenticated, true)
  assert.equal(data.planUid, plans.PLAN_UIDS.ELITE)
  assert.equal(data.user['outseta:subscriptionUid'], 'current-cycle')
  assert.equal(data.user.membershipStatus, 'verified')
  assert.equal((await h.auth.getCurrentUser())['outseta:planUid'], plans.PLAN_UIDS.ELITE)
  assert.equal(h.cookie, oldToken)
  assert.equal(h.writes.length, 0)
  assert.ok(h.transport.reads.every(read => read.init.headers.Authorization === `Bearer ${oldToken}`))
  assert.match(response.headers.get('cache-control'), /private, no-store/)
})
for (const scenario of [{ failAt: 1 }, { accountValue: { ...account(), AccountStage: 5 } }]) {
  test(`unavailable/expired membership preserves signed-in identity but strips plan and cycle: ${JSON.stringify(scenario)}`, async () => {
    const h = await sessionHarness(reader(scenario))
    const data = await (await h.session.GET()).json()
    assert.equal(data.isAuthenticated, true)
    assert.equal(data.user.sub, claims.sub)
    assert.equal(data.planUid, null)
    assert.equal(data.user['outseta:subscriptionUid'], '')
    assert.doesNotMatch(JSON.stringify(data), /synthetic-key|synthetic-secret|SYNTHETIC_PRIVATE/)
  })
}
test('invalid or missing cookies never call the membership provider', async () => {
  const h = await sessionHarness()
  for (const cookie of [null, 'forged-token']) {
    h.setCookie(cookie)
    assert.equal((await (await h.session.GET()).json()).isAuthenticated, false)
    assert.equal(await h.auth.getCurrentUser(), null)
  }
  assert.equal(h.transport.reads.length, 0)
})
test('callback exchange retains secure HttpOnly cookies even when membership is unavailable', async () => {
  const h = await sessionHarness(reader({ failAt: 1 }))
  const response = await h.session.POST({ json: async () => ({ accessToken: h.cookie }) })
  assert.equal(response.status, 200)
  assert.equal((await response.json()).user.membershipStatus, 'unavailable')
  assert.deepEqual(normalize(h.writes[0].config), { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 604800 })
  await h.session.DELETE()
  assert.equal(h.cookie, null)
})

const notice = load('../components/MembershipAccessNotice.tsx')
test('unknown membership directory returns recovery before querying or serializing firm data', async () => {
  const constants = load('../app/hiring-firms/constants.ts')
  const stateData = load('../app/hiring-firms/state-data.ts', { './constants': constants })
  let reads = 0
  let user
  const page = load('../app/hiring-firms/page.tsx', {
    'next/link': { default: 'a' }, './DirectoryView': { DirectoryView: () => { throw Error('Protected directory must not render') } },
    '@/lib/seo': { generatePageMetadata: x => x, getFAQPageSchema: x => x }, './constants': constants, './state-data': stateData,
    '@/lib/testimonials': { TESTIMONIALS: [], getAverageRating: () => 0 }, '@/lib/plan-config': plans,
    '@/components/MembershipAccessNotice': notice, '@/lib/auth-server': { getCurrentUser: async () => user },
  }, { fetch: () => { reads++; throw Error('Unexpected firm read') } })
  for (const status of ['unknown', 'unavailable', 'expired']) {
    user = { sub: claims.sub, 'outseta:planUid': '', membershipStatus: status }
    const html = renderToStaticMarkup(await page.default({ searchParams: Promise.resolve({ search: 'private', page: '5' }) }))
    assert.match(html, /Check your membership/)
    assert.match(html, /href="\/profile"/)
    assert.doesNotMatch(html, /Upgrade|membership-pricing|private|<article/)
  }
  assert.equal(reads, 0)
})

test('the actual firm detail route gates before its detail query for every plan and unknown state', async () => {
  let user
  let queries = 0
  const page = load('../app/firms/[slug]/page.tsx', {
    '@supabase/supabase-js': { createClient: () => { queries++; throw Error('authorized-detail-query') } },
    'next/cache': { unstable_cache: fn => fn },
    'next/navigation': { redirect: url => { throw Error(`redirect:${url}`) }, notFound: () => { throw Error('not-found') } },
    'next/script': { default: 'script' }, 'next/link': { default: 'a' }, 'lucide-react': {},
    '@/components/FirmServiceArea': {}, '@/lib/seo': {}, './FirmDetailTabs': {}, '@/components/directory/FirmReviews': {},
    './FirmGatedContent': {}, './AuthCTA': {}, './FirmViewTracker': {}, './firm-helpers': {},
    '@/lib/auth-server': { getCurrentUser: async () => user }, '@/lib/plan-config': plans, '@/components/MembershipAccessNotice': notice,
  }, { process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://synthetic.invalid', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'synthetic' } } })
  const visit = () => page.default({ params: Promise.resolve({ slug: 'synthetic-firm' }) })
  user = null
  await assert.rejects(visit, /reason=login-required/)
  for (const planUid of [null, '', 'unknown-plan']) {
    user = { 'outseta:planUid': planUid, membershipStatus: 'unknown' }
    assert.match(renderToStaticMarkup(await visit()), /Check your membership/)
  }
  user = { 'outseta:planUid': plans.PLAN_UIDS.FREE }
  await assert.rejects(visit, /reason=upgrade-required/)
  assert.equal(queries, 0)
  for (const planUid of plans.PAID_PLANS) {
    user = { 'outseta:planUid': planUid, membershipStatus: 'verified' }
    await assert.rejects(visit, /authorized-detail-query/)
  }
  assert.equal(queries, plans.PAID_PLANS.length)
})

for (const path of ['concierge', 'resume', 'resume/generate', 'resume/parse']) {
  for (const stage of [3, 5]) {
    test(`${path}: bearer authorization uses the actual current provider plan (stage ${stage}) before quota or AI access`, async () => {
      const h = await sessionHarness(reader({ accountValue: { ...account(plans.PLAN_UIDS.FREE), AccountStage: stage } }), { ...claims, 'outseta:planUid': plans.PLAN_UIDS.ELITE })
      const token = h.cookie
      h.setCookie(null)
      let quotaCalls = 0
      const route = load(`../app/api/ai/${path}/route.ts`, {
        'next/server': { NextResponse }, 'next/headers': { headers: () => new Headers({ authorization: `Bearer ${token}` }) },
        '@/lib/auth-server': h.auth,
        '@/lib/rate-limit': { rateLimit: () => ({ check: async () => {} }), isRateLimitUnavailableError: () => false },
        '@/lib/ai-quota': { checkAIQuota: () => { quotaCalls++; throw Error('Unexpected quota call') }, trackAIUsage: () => { throw Error('Unexpected usage write') } },
      }, { Headers, fetch: () => { throw Error('Unexpected connected AI request') } })
      const response = await route.POST(new Request('https://synthetic.invalid/api/ai', { method: 'POST', body: new FormData() }))
      assert.equal(response.status, 403)
      assert.equal(h.transport.reads.length, 1)
      assert.equal(quotaCalls, 0)
    })
  }
}
