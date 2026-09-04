import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { createLocalJWKSet, exportJWK, generateKeyPair, jwtVerify, SignJWT } from 'jose'

const require = createRequire(import.meta.url)
const { NextRequest, NextResponse } = require('next/server')
const { renderToStaticMarkup } = require('react-dom/server')
const issuer = 'https://nested-objects.outseta.com'
const keys = await generateKeyPair('RS256')
const jwk = await exportJWK(keys.publicKey)
const localKeys = createLocalJWKSet({ keys: [{ ...jwk, kid: 'synthetic', alg: 'RS256' }] })
const ownId = '11111111-1111-1111-1111-111111111111'
const peerId = '22222222-2222-2222-2222-222222222222'
const hiddenId = '33333333-3333-3333-3333-333333333333'
const nullId = '44444444-4444-4444-4444-444444444444'
const rows = [
  { id: ownId, outseta_person_uid: 'person-one', display_name: 'Synthetic Owner', is_published: false },
  { id: peerId, outseta_person_uid: 'person-two', display_name: 'Synthetic Published Peer', is_published: true },
  { id: hiddenId, outseta_person_uid: 'person-three', display_name: 'Synthetic Hidden Peer', is_published: false },
  { id: nullId, outseta_person_uid: 'person-four', display_name: 'Synthetic Null Publication', is_published: null },
].map((row) => ({ ...row, email: 'PRIVATE_EMAIL_SENTINEL', outseta_data: 'PRIVATE_BILLING_SENTINEL' }))
let sessionToken = null
let databaseError = false
let queries = []
const env = { MEMBER_DIRECTORY_FIRM_SUBJECT_IDS: 'firm-person' }

function load(path, imports, environment = env) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports, URL, Headers, console: { error() {} }, process: { env: environment },
    require(name) {
      if (name in imports) return imports[name]
      throw new Error(`Unexpected import: ${name}`)
    },
  })
  return exports
}

const navigation = {
  redirect(url) { throw new Error(`redirect:${url}`) },
  notFound() { throw new Error('not-found') },
}
const planConfig = load('../lib/plan-config.ts', {})
const auth = load('../lib/auth-server.ts', {
  jose: { jwtVerify, createRemoteJWKSet: () => localKeys },
  'next/headers': { cookies: () => ({ get: () => sessionToken ? { value: sessionToken } : undefined }) },
  './plan-config': planConfig,
})
const access = load('../lib/member-profile-access.ts', {
  'server-only': {},
  'next/navigation': navigation,
  '@/lib/auth-server': auth,
  '@/lib/supabase-server': {
    createServiceRoleClient() {
      return {
        from(table) {
          assert.equal(table, 'profiles', 'Private resume workspaces must never be read')
          const query = { columns: [], filters: [] }
          queries.push(query)
          const result = () => ({
            error: databaseError ? { message: 'PRIVATE_DATABASE_ERROR' } : null,
            data: rows.filter((row) => query.filters.every(([key, value]) => row[key] === value))
              .map((row) => Object.fromEntries(query.columns.map((key) => [key, row[key] ?? null]))),
          })
          return {
            select(columns) { query.columns = columns.split(','); return this },
            eq(key, value) { query.filters.push([key, value]); return this },
            async maybeSingle() { const data = result(); return { ...data, data: data.data[0] ?? null } },
            async order() { return result() },
          }
        },
      }
    },
  },
})

async function signIn(subject, claims = {}, expiry = '5m') {
  let token = new SignJWT(claims).setProtectedHeader({ alg: 'RS256', kid: 'synthetic' })
    .setIssuer(issuer).setExpirationTime(expiry)
  if (subject) token = token.setSubject(subject)
  sessionToken = await token.sign(keys.privateKey)
}

test.beforeEach(() => {
  sessionToken = null
  databaseError = false
  queries = []
  env.MEMBER_DIRECTORY_FIRM_SUBJECT_IDS = 'firm-person'
})

test('visitors are redirected before either protected data read', async () => {
  await assert.rejects(access.redirectToOwnProfile(), /redirect:.*outseta.*auth/)
  await assert.rejects(access.getAuthorizedMemberProfile(peerId), /redirect:.*outseta.*auth/)
  assert.equal(queries.length, 0)
})

test('forged and expired cookies cannot turn into directory access', async () => {
  sessionToken = 'forged-cookie'
  await assert.rejects(access.getAuthorizedMemberProfile(peerId), /redirect:/)
  await signIn('firm-person', {}, 1)
  await assert.rejects(access.redirectToOwnProfile(), /redirect:/)
  assert.equal(queries.length, 0)
})

test('account and subscription identity do not substitute for a verified person subject', async () => {
  await signIn(null, { 'outseta:accountUid': 'firm-person', 'outseta:subscriptionUid': 'person-one' })
  await assert.rejects(access.getAuthorizedMemberProfile(ownId), /redirect:/)
  assert.equal(queries.length, 0)
})

test('every individual tier redirects directory requests to their own profile settings', async () => {
  for (const tier of Object.values(auth.PLAN_UIDS)) {
    await signIn('person-one', { 'outseta:planUid': tier })
    await assert.rejects(access.redirectToOwnProfile(), /redirect:\/profile$/)
  }
  assert.equal(queries.length, 0)
})

test('paid/Agency users cannot view another published member by URL', async () => {
  for (const tier of Object.values(auth.PLAN_UIDS)) {
    await signIn('person-one', { 'outseta:planUid': tier, role: 'firm', is_firm: true })
    await assert.rejects(access.getAuthorizedMemberProfile(peerId), /not-found/)
  }
  assert.ok(queries.every((query) => query.filters.some(([key, value]) => key === 'outseta_person_uid' && value === 'person-one')))
})

test('owners can view their own unpublished profile including on Free', async () => {
  await signIn('person-one', { 'outseta:planUid': auth.PLAN_UIDS.FREE })
  const result = await access.getAuthorizedMemberProfile(ownId)
  assert.equal(result.profile.id, ownId)
  assert.equal(result.profile.is_published, false)
  assert.deepEqual(queries[0].filters, [['id', ownId], ['outseta_person_uid', 'person-one']])
})

test('email/account/name matches cannot confer profile ownership', async () => {
  await signIn('unmapped-person', { email: 'PRIVATE_EMAIL_SENTINEL', name: 'Synthetic Owner', 'outseta:accountUid': 'person-one' })
  await assert.rejects(access.getAuthorizedMemberProfile(ownId), /not-found/)
})

test('firm-directory access stays disabled even with a stale firm-subject environment setting', async () => {
  await signIn('firm-person')
  await assert.rejects(access.redirectToOwnProfile(), /redirect:\/profile$/)
  env.MEMBER_DIRECTORY_FIRM_SUBJECT_IDS = ''
  await assert.rejects(access.redirectToOwnProfile(), /redirect:\/profile$/)
  assert.equal(queries.length, 0)
  env.MEMBER_DIRECTORY_FIRM_SUBJECT_IDS = 'other-firm-person'
  await assert.rejects(access.redirectToOwnProfile(), /redirect:\/profile$/)
})

test('a firm claim cannot access any peer profile regardless of publication state', async () => {
  await signIn('firm-person')
  for (const id of [ownId, peerId, hiddenId, nullId, '55555555-5555-5555-5555-555555555555']) {
    await assert.rejects(access.getAuthorizedMemberProfile(id), /not-found/)
  }
})

test('private emails, raw records and identity keys are never selected or serialized', async () => {
  await signIn('person-one')
  const result = await access.getAuthorizedMemberProfile(ownId)
  for (const field of ['email', 'user_email', 'outseta_person_uid', 'outseta_data', 'phone', 'outputs', '*']) {
    assert.equal(queries[0].columns.includes(field), false)
  }
  assert.equal(JSON.stringify(result).includes('PRIVATE_'), false)
})

test('malformed detail IDs are rejected before privileged queries', async () => {
  await signIn('person-one')
  for (const id of ['', 'person-one', '../profile', `${ownId},is_published.eq.true`]) {
    await assert.rejects(access.getAuthorizedMemberProfile(id), /not-found/)
  }
  assert.equal(queries.length, 0)
})

test('database failures never fall back to anonymous data or an unrestricted lookup', async () => {
  await signIn('firm-person')
  databaseError = true
  await assert.rejects(access.getAuthorizedMemberProfile(peerId), /Unable to load your member profile/)
  assert.equal(queries.length, 1)
  await assert.rejects(access.redirectToOwnProfile(), /redirect:\/profile$/)
  assert.equal(queries.length, 1)
})

test('authorization is evaluated afresh after another owner request', async () => {
  await signIn('person-two')
  await access.getAuthorizedMemberProfile(peerId)
  await signIn('person-one')
  await assert.rejects(access.redirectToOwnProfile(), /redirect:\/profile$/)
  await assert.rejects(access.getAuthorizedMemberProfile(peerId), /not-found/)
})

const routeImports = {
  'react/jsx-runtime': require('react/jsx-runtime'),
  '@/lib/member-profile-access': access,
  'next/link': { default: ({ children }) => children },
  'lucide-react': { LockKeyhole: () => null, MapPin: () => null, ShieldCheck: () => null },
  '@/components/ui/VerifiedBadge': { VerifiedBadge: () => null },
  '@/components/ui/StarRating': { StarRating: () => null },
}
const detail = load('../app/members/[memberId]/page.tsx', routeImports)
const directory = load('../app/members/page.tsx', routeImports)

test('real route components deny access and metadata performs no profile lookup', async () => {
  for (const page of [detail, directory]) {
    assert.equal(page.dynamic, 'force-dynamic')
    assert.equal(page.revalidate, 0)
    assert.equal(page.metadata.robots.index, false)
    assert.equal(page.metadata.robots.follow, false)
    assert.equal(page.generateMetadata, undefined)
  }
  await assert.rejects(directory.default(), /redirect:/)
  await assert.rejects(detail.default({ params: { memberId: peerId } }), /redirect:/)
  assert.equal(queries.length, 0)
  await signIn('person-one')
  await assert.rejects(detail.default({ params: { memberId: peerId } }), /not-found/)
  const html = renderToStaticMarkup(await detail.default({ params: { memberId: ownId } }))
  assert.match(html, /Synthetic Owner/)
  assert.match(html, /Only you can view it/)
  assert.doesNotMatch(html, /PRIVATE_|Synthetic Published Peer|mailto:/)
})

test('middleware denies visitors and marks member responses private/nonindexable', () => {
  const redirectHelper = load('../lib/auth-redirect.ts', {})
  const memberToolAccess = load('../lib/member-tool-access.ts', {
    './plan-config': planConfig,
  })
  const { middleware } = load('../middleware.ts', {
    'next/server': { NextResponse },
    './lib/auth-redirect': redirectHelper,
    './lib/member-tool-access': memberToolAccess,
  })
  for (const path of ['/members', `/members/${peerId}`]) {
    for (const headers of [{}, { cookie: 'outseta_access_token=synthetic' }]) {
      const response = middleware(new NextRequest(`https://synthetic.example${path}`, { headers }))
      assert.match(response.headers.get('cache-control'), /private, no-store/)
      assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive')
      if (!headers.cookie) assert.equal(response.status, 307)
    }
  }
})

test('individual onboarding points to the actual hiring-firms route, not the private member directory', () => {
  const widget = readFileSync(new URL('../components/onboarding/onboarding-widget.tsx', import.meta.url), 'utf8')
  const source = readFileSync(new URL('../components/onboarding/inspector-start-guide.tsx', import.meta.url), 'utf8')
  assert.match(widget, /<InspectorStartGuide\s*\/>/)
  assert.match(source, /href="\/hiring-firms"/)
  assert.doesNotMatch(source, /href(?:: |=)["']\/members/)
  assert.ok(readFileSync(new URL('../app/hiring-firms/page.tsx', import.meta.url), 'utf8').length > 0)
})

test('profile settings describe current private access instead of offering immediate firm discovery', () => {
  const source = readFileSync(new URL('../app/(portal)/profile/ProfileView.tsx', import.meta.url), 'utf8')
  assert.match(source, /Only you can view your profile/)
  assert.match(source, /Sharing with firms is not available yet/)
  assert.doesNotMatch(source, /hiring firms can discover you|Turn this on to publish|<Switch/)
})

test('profile subscription labels use the authoritative Outseta plan UID without a stale profile-tier fallback', () => {
  const expectedLabels = new Map([
    [planConfig.PLAN_UIDS.FREE, 'Free Plan'],
    [planConfig.PLAN_UIDS.STARTER, 'Starter Plan'],
    [planConfig.PLAN_UIDS.FOUNDERS, 'Founders Directory Annual'],
    [planConfig.PLAN_UIDS.PRO, 'Pro Plan'],
    [planConfig.PLAN_UIDS.ELITE, 'Elite Plan'],
    [planConfig.PLAN_UIDS.AGENCY, 'Agency Plan'],
  ])

  for (const [planUid, label] of expectedLabels) {
    assert.equal(planConfig.getPlanDisplayLabel(planUid), label)
  }
  assert.equal(planConfig.getPlanDisplayLabel('unknown-plan'), null)
  assert.equal(auth.getPlanName(planConfig.PLAN_UIDS.FOUNDERS), 'Founders Directory Annual')

  const source = readFileSync(new URL('../app/(portal)/profile/ProfileView.tsx', import.meta.url), 'utf8')
  assert.match(source, /getPlanDisplayLabel\(planUid\)/)
  assert.match(source, /Membership plan unavailable/)
  assert.doesNotMatch(source, /const planNames|profile\?\.subscription_tier\) return/)
})
