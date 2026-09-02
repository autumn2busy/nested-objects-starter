import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { createLocalJWKSet, exportJWK, generateKeyPair, jwtVerify, SignJWT } from 'jose'

const require = createRequire(import.meta.url)
const { NextRequest, NextResponse } = require('next/server')
const origin = 'https://synthetic-members.example'
const issuer = 'https://nested-objects.outseta.com'
const keys = await generateKeyPair('RS256')
const jwk = await exportJWK(keys.publicKey)
const localJwks = createLocalJWKSet({ keys: [{ ...jwk, kid: 'synthetic', alg: 'RS256' }] })
let sessionToken = null

function load(relativePath, imports) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports, URL, Headers, console: { error() {} }, process: { env: { NODE_ENV: 'production' } },
    require(name) {
      if (name in imports) return imports[name]
      throw new Error(`Unexpected import: ${name}`)
    },
  })
  return exports
}

const redirectHelper = load('../lib/auth-redirect.ts', {})
const auth = load('../lib/auth-server.ts', {
  jose: {
    jwtVerify,
    createRemoteJWKSet(url) {
      assert.equal(url.href, `${issuer}/.well-known/jwks`)
      return localJwks // Real signature/issuer/expiry verification; no external service.
    },
  },
  'next/headers': { cookies: () => ({ get: () => sessionToken ? { value: sessionToken } : undefined }) },
})
const { middleware } = load('../middleware.ts', {
  'next/server': { NextResponse }, './lib/auth-redirect': redirectHelper,
})
const { GET: complete } = load('../app/api/auth/complete/route.ts', {
  'next/server': { NextResponse }, '@/lib/auth-server': auth, '@/lib/auth-redirect': redirectHelper,
})
const { default: portalLayout } = load('../app/(portal)/layout.tsx', {
  'react/jsx-runtime': require('react/jsx-runtime'),
  'next/navigation': { redirect(url) { throw new Error(`redirect:${url}`) } },
  '@/lib/auth-server': auth,
  '@/components/Sidebar': { Sidebar: () => null },
  '@/components/ContentProtection': { ContentProtection: () => null },
})

async function token({ signingKey = keys.privateKey, subject = 'synthetic-member', tokenIssuer = issuer, expiry = '5m' } = {}) {
  const builder = new SignJWT({ name: 'Synthetic Member' }).setProtectedHeader({ alg: 'RS256', kid: 'synthetic' })
    .setIssuer(tokenIssuer).setExpirationTime(expiry)
  if (subject) builder.setSubject(subject)
  return builder.sign(signingKey)
}

test('signed-out dashboard still redirects; a supplied token is not itself authorization', async () => {
  const response = middleware(new NextRequest(`${origin}/inspector-dashboard`))
  assert.equal(response.status, 307)
  assert.equal(response.headers.get('location'), `${issuer}/auth?widgetMode=login#o-anonymous`)
  sessionToken = 'forged-cookie'
  await assert.rejects(portalLayout({ children: 'private' }), /redirect:https:\/\/nested-objects.outseta.com\/auth/)
  sessionToken = null
})

test('valid hosted return verifies JWT, sets cookie, strips token, then passes BOTH portal guards', async () => {
  const signedToken = await token()
  const original = new URL('/inspector-dashboard?tab=activity', origin)
  original.searchParams.set('access_token', signedToken)
  const handoff = middleware(new NextRequest(original))
  const rewrite = new URL(handoff.headers.get('x-middleware-rewrite'))
  assert.equal(rewrite.pathname, '/api/auth/complete')
  assert.equal(handoff.headers.get('location'), null)
  assert.equal(handoff.headers.get('referrer-policy'), 'no-referrer')
  assert.match(handoff.headers.get('cache-control'), /no-store/)
  assert.equal(rewrite.search.includes(signedToken), false)
  const response = await complete(new NextRequest(rewrite, {
    headers: { 'x-outseta-login-token': handoff.headers.get('x-middleware-request-x-outseta-login-token') },
  }))
  assert.equal(response.status, 303)
  assert.equal(response.headers.get('location'), `${origin}/inspector-dashboard?tab=activity`)
  assert.equal(response.cookies.get('outseta_access_token').value, signedToken)
  assert.match(response.headers.get('set-cookie'), /HttpOnly/)
  assert.match(response.headers.get('set-cookie'), /Secure/)
  assert.match(response.headers.get('set-cookie'), /SameSite=lax/)
  assert.match(response.headers.get('cache-control'), /no-store/)
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
  const dashboard = middleware(new NextRequest(response.headers.get('location'), {
    headers: { cookie: `outseta_access_token=${signedToken}` },
  }))
  assert.equal(dashboard.headers.get('x-middleware-next'), '1')
  sessionToken = response.cookies.get('outseta_access_token').value
  assert.ok(await portalLayout({ children: 'private' }))
  sessionToken = null
})

test('all protected destinations and direct callback use the same verified handoff, even with an old cookie', () => {
  for (const path of ['/admin/intelligence-os', '/directory-preview', '/profile', '/security', '/inspector-dashboard', '/members', '/members/11111111-1111-1111-1111-111111111111', '/auth/callback']) {
    const response = middleware(new NextRequest(`${origin}${path}?access_token=synthetic`, {
      headers: { cookie: 'outseta_access_token=old-expired-cookie' },
    }))
    assert.equal(new URL(response.headers.get('x-middleware-rewrite')).pathname, '/api/auth/complete')
    assert.equal(response.cookies.get('outseta_access_token'), undefined)
  }
})

test('expired, wrong-issuer, missing-subject and invalid-signature JWTs never create a session', async () => {
  const foreign = await generateKeyPair('RS256')
  for (const value of [
    await token({ expiry: 1 }), await token({ tokenIssuer: 'https://untrusted.example' }),
    await token({ subject: null }), await token({ signingKey: foreign.privateKey }), 'not-a-token',
  ]) {
    const url = new URL('/api/auth/complete', origin)
    url.searchParams.set('access_token', value)
    const response = await complete(new NextRequest(url))
    assert.equal(response.status, 303)
    assert.equal(response.headers.get('location'), `${origin}/auth/callback?error=invalid_session`)
    assert.equal(response.headers.get('set-cookie'), null)
    assert.equal(response.headers.get('location').includes(value), false)
  }
})

test('missing, empty, oversized and duplicate tokens fail closed, including duplicates through middleware', async () => {
  for (const query of ['', '?access_token=', `?access_token=${'x'.repeat(16_385)}`, '?access_token=one&access_token=two']) {
    const response = await complete(new NextRequest(`${origin}/api/auth/complete${query}`))
    assert.equal(response.headers.get('location'), `${origin}/auth/callback?error=invalid_session`)
    assert.equal(response.headers.get('set-cookie'), null)
  }
  const handoff = middleware(new NextRequest(`${origin}/inspector-dashboard?access_token=one&access_token=two`))
  assert.equal(handoff.headers.get('x-middleware-request-x-outseta-login-token'), '')
  const denied = await complete(new NextRequest(handoff.headers.get('x-middleware-rewrite'), {
    headers: { 'x-outseta-login-token': handoff.headers.get('x-middleware-request-x-outseta-login-token') },
  }))
  assert.equal(denied.headers.get('set-cookie'), null)
})

test('return destinations cannot redirect off-site, leak tokens or reenter the auth/API flow', async () => {
  for (const destination of ['https://evil.example', '//evil.example', '/\\evil.example', '/%2f%2fevil.example',
    '/%5cevil.example', '/%0a/evil.example', '/auth/callback', '/api/auth/complete', '/x/../auth/callback', '/%61uth/callback', '/%']) {
    assert.equal(redirectHelper.safeAuthRedirect(destination), '/inspector-dashboard')
  }
  assert.equal(redirectHelper.safeAuthRedirect('/profile?access_token=private&tab=settings#ignored'), '/profile?tab=settings')
  const url = new URL('/api/auth/complete', origin)
  url.searchParams.set('access_token', await token())
  url.searchParams.set('redirect', 'https://evil.example')
  assert.equal((await complete(new NextRequest(url))).headers.get('location'), `${origin}/inspector-dashboard`)
})

test('error callback has no token handoff and protected POST requests stay gated', () => {
  assert.equal(middleware(new NextRequest(`${origin}/auth/callback?error=invalid_session`)).headers.get('x-middleware-next'), '1')
  assert.equal(middleware(new NextRequest(`${origin}/inspector-dashboard?access_token=synthetic`, { method: 'POST' })).status, 307)
})

test('malformed query values cannot inject forwarding headers or bypass verification', async () => {
  for (const queryValue of ['%0d%0ax-admin%3Atrue', '%F0%9F%92%A9', 'one', '']) {
    const handoff = middleware(new NextRequest(`${origin}/inspector-dashboard?access_token=${queryValue}`, {
      headers: { 'x-outseta-login-token': await token() },
    }))
    assert.equal(handoff.headers.get('x-middleware-request-x-outseta-login-token'), '')
  }
})

test('callback source does not log token-bearing URLs and retains explicit error handling', () => {
  const source = readFileSync(new URL('../app/auth/callback/page.tsx', import.meta.url), 'utf8')
  assert.equal(/console\.(log|error|warn)/.test(source), false)
  assert.ok(source.includes("searchParams.get('error')"))
  assert.ok(source.includes('safeAuthRedirect'))
})
