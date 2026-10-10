import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const { NextResponse } = require('next/server')
const source = ts.transpileModule(readFileSync(new URL('../app/api/ai/concierge/route.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const allowed = ['zWZD0rQp', 'rQVqlLm6', 'NmdnNO90', 'rmk5Xk9g', 'pWrBRnWn']
function harness({ plan = 'NmdnNO90', authenticated = true, configured = true,
  provider = async () => Response.json({ response: 'Synthetic route advice.' }) } = {}) {
  const calls = { quota: 0, usage: 0, provider: [], logs: [] }
  const exports = {}
  const imports = {
    'next/server': { NextResponse },
    'next/headers': { headers: () => new Headers({ authorization: 'Bearer synthetic' }) },
    '@/lib/auth-server': {
      getCurrentUser: async () => null,
      verifyOutsetaToken: async () => authenticated ? { sub: 'synthetic-person', 'outseta:planUid': plan } : null,
      getOutsetaUserId: user => user?.sub,
      hasAccess: (uid, feature) => feature === 'ai_chatbot' && allowed.includes(uid),
    },
    '@/lib/rate-limit': { rateLimit: () => ({ check: async () => {} }), isRateLimitUnavailableError: () => false },
    '@/lib/ai-quota': { checkAIQuota: async () => { calls.quota++ }, trackAIUsage: async () => { calls.usage++ } },
  }
  vm.runInNewContext(source, {
    exports, AbortSignal, Response,
    process: { env: configured ? { N8N_AI_CONCIERGE_WEBHOOK_URL: 'https://provider.invalid/private-hook' } : {} },
    console: { error: (...args) => calls.logs.push(args) },
    fetch: async (url, init) => { calls.provider.push({ url, init }); return provider() },
    require: name => { if (!(name in imports)) throw Error(`Unexpected import ${name}`); return imports[name] },
  })
  return { calls, send: () => exports.POST(new Request('https://members.invalid/api/ai/concierge', {
    method: 'POST', body: JSON.stringify({ prompt: ' A fictional three-stop route. ' }),
  })) }
}
for (const plan of allowed) {
  test(`${plan}: a permitted plan receives a usable provider answer`, async () => {
    const h = harness({ plan })
    const response = await h.send()
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { message: { role: 'assistant', content: 'Synthetic route advice.' } })
    assert.equal(h.calls.provider.length, 1)
    assert.equal(h.calls.usage, 1)
    const request = h.calls.provider[0].init
    assert.equal(request.redirect, 'error')
    assert.ok(request.signal instanceof AbortSignal)
    assert.deepEqual(JSON.parse(request.body), { user_id: 'synthetic-person', plan_uid: plan, prompt: 'A fictional three-stop route.' })
  })
}
for (const scenario of [{ authenticated: false }, { plan: 'L9nbKV9Z' }, { plan: '' }, { plan: 'unknown' }]) {
  test(`denied access never invokes quota, usage or provider: ${JSON.stringify(scenario)}`, async () => {
    const h = harness(scenario)
    assert.equal((await h.send()).status, scenario.authenticated === false ? 401 : 403)
    assert.equal(h.calls.quota, 0)
    assert.equal(h.calls.usage, 0)
    assert.equal(h.calls.provider.length, 0)
  })
}
for (const [name, provider] of [
  ['HTML success response', async () => new Response('<!DOCTYPE html>PRIVATE_PROVIDER_BODY', { status: 200 })],
  ['HTML error response', async () => new Response('<!DOCTYPE html>PRIVATE_PROVIDER_BODY', { status: 503 })],
  ['JSON provider error', async () => Response.json({ error: 'PRIVATE_PROVIDER_BODY' }, { status: 403 })],
  ['malformed JSON', async () => new Response('{PRIVATE_PROVIDER_BODY')],
  ['empty object', async () => Response.json({})],
  ['empty answer', async () => Response.json({ response: '  ' })],
  ['array', async () => Response.json([{ response: 'PRIVATE_PROVIDER_BODY' }])],
  ['null', async () => Response.json(null)],
]) {
  test(`${name}: bounded friendly 502 without raw upstream data or retries`, async () => {
    const h = harness({ provider })
    const response = await h.send()
    assert.equal(response.status, 502)
    const data = await response.json()
    assert.match(data.error, /temporarily unavailable.*try again later/i)
    assert.doesNotMatch(JSON.stringify([data, h.calls.logs]), /PRIVATE_PROVIDER_BODY|private-hook/)
    assert.equal(h.calls.provider.length, 1)
    assert.equal(h.calls.usage, 1)
  })
}
test('network timeout is a friendly 503, with no raw exception or automatic retry', async () => {
  const h = harness({ provider: async () => { throw new Error('PRIVATE_PROVIDER_BODY') } })
  const response = await h.send()
  assert.equal(response.status, 503)
  assert.doesNotMatch(JSON.stringify([await response.json(), h.calls.logs]), /PRIVATE_PROVIDER_BODY/)
  assert.equal(h.calls.provider.length, 1)
})
test('missing provider configuration incurs no usage or provider request', async () => {
  const h = harness({ configured: false })
  assert.equal((await h.send()).status, 503)
  assert.equal(h.calls.usage, 0)
  assert.equal(h.calls.provider.length, 0)
})
test('message-shaped success is normalized and extra provider fields are not exposed', async () => {
  const h = harness({ provider: async () => Response.json({ message: { role: 'system', content: 'A usable answer.' }, debug: 'PRIVATE_PROVIDER_BODY' }) })
  assert.deepEqual(await (await h.send()).json(), { message: { role: 'assistant', content: 'A usable answer.' } })
})
