import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { createLocalJWKSet, exportJWK, generateKeyPair, jwtVerify, SignJWT } from 'jose'

const require = createRequire(import.meta.url)
const { NextRequest, NextResponse } = require('next/server')
const issuer = 'https://nested-objects.outseta.com'
const keys = await generateKeyPair('RS256')
const jwk = await exportJWK(keys.publicKey)
const localKeys = createLocalJWKSet({ keys: [{ ...jwk, kid: 'fixture', alg: 'RS256' }] })
const noSideEffect = () => { throw new Error('Unexpected downstream effect') }
function load(path, imports = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, URL, Headers, AbortSignal,
    console: { log() {}, warn() {}, error() {} }, fetch: noSideEffect,
    process: { env: { NODE_ENV: 'test', OUTSETA_WEBHOOK_SECRET: 'fixture-secret' } },
    require(name) { if (name in imports) return imports[name]; throw new Error('Unexpected import ' + name) },
  })
  return exports
}
function fixture() {
  let rows = [], error = null, token = null, queries = 0
  const cookiesSet = []
  const db = { from(table) {
    assert.equal(table, 'member_offboarding_holds')
    queries++
    const filters = []
    const chain = {
      select(columns) { assert.equal(columns, 'account_uid'); return chain },
      is(k, v) { filters.push([k, v]); return chain },
      eq(k, v) { filters.push([k, v]); return chain },
      limit(n) { assert.equal(n, 1); return chain },
      async abortSignal(signal) { assert.ok(signal); return {
        data: rows.filter(r => filters.every(([k, v]) => r[k] === v)).slice(0, 1), error,
      } },
    }
    return chain
  } }
  const hold = load('../lib/member-offboarding.ts', { './supabase-server': { createServiceRoleClient: () => db } })
  const cookies = () => ({ get: () => token ? { value: token } : undefined,
    set: (...args) => cookiesSet.push(args), delete() {} })
  const plans = load('../lib/plan-config.ts')
  const auth = load('../lib/auth-server.ts', {
    jose: { jwtVerify, createRemoteJWKSet: () => localKeys },
    'next/headers': { cookies }, './plan-config': plans, './member-offboarding': hold,
  })
  return { hold, auth, cookies, cookiesSet, get queries() { return queries },
    setToken: t => { token = t }, setError: e => { error = e },
    block: (account_uid = 'Acct0001', person_uid = 'Pers0001') => rows.push({ account_uid, person_uid, released_at: null }),
    release: () => { rows = rows.map(r => ({ ...r, released_at: '2026-10-30T12:00:00Z' })) },
  }
}
async function sign({ accountUid = 'Acct0001', personUid = 'Pers0001', signingKey = keys.privateKey } = {}) {
  const claims = { email: 'fixture@example.invalid', name: 'Fixture', 'outseta:planUid': 'fixture-plan' }
  if (accountUid !== undefined) claims['outseta:accountUid'] = accountUid
  return new SignJWT(claims).setSubject(personUid).setIssuer(issuer)
    .setProtectedHeader({ alg: 'RS256', kid: 'fixture' }).setExpirationTime('5m').sign(signingKey)
}

test('the same genuinely signed JWT is denied immediately after a hold; explicit release restores it', async () => {
  const f = fixture(), token = await sign()
  assert.ok(await f.auth.verifyOutsetaToken(token))
  f.block()
  assert.equal(await f.auth.verifyOutsetaToken(token), null)
  assert.equal(await f.auth.verifyOutsetaToken('Bearer ' + token), null)
  f.release()
  assert.ok(await f.auth.verifyOutsetaToken(token))
  assert.equal(f.queries, 4)
})

test('unrelated signed account stays allowed and malformed identities fail closed', async () => {
  const f = fixture(); f.block()
  assert.equal(await f.hold.readMemberOffboardingState({ accountUid: 'Acct0002', personUid: 'Pers0001' }), 'allowed')
  assert.equal(await f.hold.readMemberOffboardingState({ personUid: 'Pers0001' }), 'blocked')
  assert.equal(await f.hold.readMemberOffboardingState({ accountUid: 'Acct0001', personUid: 'Pers0002' }), 'blocked')
  for (const id of [{}, { accountUid: 'a,b' }, { accountUid: '' }, { personUid: {} }]) {
    assert.equal(await f.hold.readMemberOffboardingState(id), 'unavailable')
  }
  assert.equal(f.queries, 3)
})

test('invalid JWT signatures are rejected before any hold lookup', async () => {
  const f = fixture(), foreign = await generateKeyPair('RS256')
  assert.equal(await f.auth.verifyOutsetaToken(await sign({ signingKey: foreign.privateKey })), null)
  assert.equal(f.queries, 0)
})

test('database errors, missing table, or missing credentials cannot reopen access', async () => {
  const f = fixture(); f.setError({ code: '42P01' })
  assert.equal(await f.auth.verifyOutsetaToken(await sign()), null)
  const unavailable = load('../lib/member-offboarding.ts', { './supabase-server': { createServiceRoleClient: noSideEffect } })
  assert.equal(await unavailable.readMemberOffboardingState({ accountUid: 'Acct0001' }), 'unavailable')
})

test('held existing cookie and session exchange are rejected without issuing a new cookie', async () => {
  const f = fixture(), token = await sign(); f.block(); f.setToken(token)
  const route = load('../app/api/auth/session/route.ts', {
    'next/server': { NextResponse }, 'next/headers': { cookies: f.cookies }, '@/lib/auth-server': f.auth,
  })
  assert.equal((await route.GET()).status, 401)
  assert.equal((await route.POST({ json: async () => ({ accessToken: token }) })).status, 401)
  assert.equal(f.cookiesSet.length, 0)
  const completion = load('../app/api/auth/complete/route.ts', {
    'next/server': { NextResponse }, '@/lib/auth-server': f.auth,
    '@/lib/auth-redirect': load('../lib/auth-redirect.ts'),
  })
  const response = await completion.GET(new NextRequest('https://members.example.invalid/api/auth/complete', {
    headers: { 'x-outseta-login-token': token },
  }))
  assert.equal(response.cookies.get('outseta_access_token'), undefined)
  assert.match(response.headers.get('location'), /error=invalid_session/)
})

test('held profile GET and PATCH stop before profile reads, recreation or journey events', async () => {
  const f = fixture(); f.block(); f.setToken(await sign())
  const route = load('../app/api/profile/route.ts', {
    'next/server': { NextResponse }, '@/lib/auth-server': f.auth,
    '@/lib/supabase-server': { createServiceRoleClient: noSideEffect },
    '@/lib/free-onboarding-completion': { reconcileFreeOnboardingCompletionFromEnvironment: noSideEffect },
    '@/lib/free-journey-operation-producer': { emitFreeJourneySourceEvent: noSideEffect },
    '@/lib/trust-score': { calculateTrustScore: noSideEffect },
    './schema': load('../app/api/profile/schema.ts'),
  })
  assert.equal((await route.GET()).status, 401)
  assert.equal((await route.PATCH({ json: noSideEffect })).status, 401)
})

function webhook(hold, signature = true) {
  return load('../app/api/webhooks/outseta/route.ts', {
    'next/server': { NextResponse }, '@supabase/supabase-js': { createClient: noSideEffect },
    crypto: { randomUUID: () => 'fixture-request' }, '@/lib/security': { verifyOutsetaSignature: () => signature },
    '@/lib/member-offboarding': hold,
    '@/lib/free-to-pro-lifecycle': { buildPaidLifecycleDecision: noSideEffect },
    '@/lib/conversion-events': { recordConversionEvent: noSideEffect },
    '@/lib/free-journey-operation-producer': { emitFreeJourneySourceEvent: noSideEffect },
    '@/lib/outseta-billing-stage': load('../lib/outseta-billing-stage.ts'),
  })
}
const person = { Uid: 'Pers0001', Email: 'fixture@example.invalid', Updated: '2026-10-30T12:00:00Z' }
const account = { Uid: 'Acct0001', AccountStage: 3, PersonAccount: [{ IsPrimary: true, Person: person }] }
const request = payload => ({ text: async () => JSON.stringify(payload), headers: { get: () => 'fixture-signature' } })

test('held person-only and account webhooks cannot recreate profiles, sync AC or emit lifecycle events', async () => {
  const f = fixture(); f.block(); const route = webhook(f.hold)
  for (const payload of [person, account, { ...person, Updated: '2026-01-01T00:00:00Z' },
    { ...person, PersonAccount: [{ IsPrimary: true, Account: account }] }]) {
    const response = await route.POST(request(payload))
    assert.equal(response.status, 200)
    assert.equal((await response.json()).reason, 'offboarded')
  }
})

test('unavailable hold storage retries the webhook without downstream effects; invalid signatures do not query', async () => {
  const f = fixture(); f.setError({ code: '08006' })
  assert.equal((await webhook(f.hold).POST(request(person))).status, 503)
  const before = f.queries
  assert.equal((await webhook(f.hold, false).POST(request(person))).status, 401)
  assert.equal(f.queries, before)
})
