import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = readFileSync(new URL('../lib/intelligence-os-admin.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function loadHelper(overrides = {}, fetchImpl = async () => Response.json({ ok: true, snapshot: {} })) {
  const exports = {}
  const environment = {
    VERCEL_ENV: 'preview',
    INTELLIGENCE_OS_ADMIN_ENABLED: 'true',
    INTELLIGENCE_OS_ADMIN_SHARED_SECRET: 'synthetic-shared-secret-'.repeat(3),
    INTELLIGENCE_OS_AUTUMN_SUBJECT_ID: 'synthetic-owner',
    INTELLIGENCE_OS_ADMIN_ALLOWED_ORIGIN: 'https://synthetic-members.vercel.app',
    INTELLIGENCE_OS_AGENT_RUNTIME_URL: 'https://synthetic-runtime.vercel.app',
    ...overrides,
  }
  vm.runInNewContext(compiled, {
    exports, process: { env: environment }, URL, Buffer, AbortSignal,
    fetch: fetchImpl,
    require(name) {
      if (name === 'node:crypto') return require(name)
      if (name === 'next/headers') return { headers: () => new Headers() }
      if (name === '@/lib/auth-server') return { getCurrentUser: async () => null }
      throw new Error(`Unexpected import: ${name}`)
    },
  })
  return exports
}

test('server request preserves HMAC and keeps the protection credential out of the URL', async () => {
  let captured
  const helper = loadHelper({ INTELLIGENCE_OS_AGENT_RUNTIME_BYPASS_SECRET: 'synthetic-bypass' }, async (url, options) => {
    captured = { url, options }
    return Response.json({ ok: true, snapshot: { fixture: true } })
  })
  const result = await helper.fetchIntelligenceAdminSnapshot({ subject: 'synthetic-owner' })
  assert.equal(result.fixture, true)
  assert.equal(captured.url, 'https://synthetic-runtime.vercel.app/api/admin/snapshot')
  assert.equal(captured.options.headers['x-vercel-protection-bypass'], 'synthetic-bypass')
  assert.match(captured.options.headers['x-intelligence-signature'], /^[a-f0-9]{64}$/)
  assert.equal(captured.options.headers['x-intelligence-subject'], 'synthetic-owner')
  assert.equal(captured.options.redirect, 'error')
  assert.equal(captured.options.cache, 'no-store')
})

test('unprotected local runtime does not receive a bypass header', async () => {
  let captured
  const helper = loadHelper({ INTELLIGENCE_OS_AGENT_RUNTIME_URL: 'http://localhost:3001' }, async (_, options) => {
    captured = options
    return Response.json({ ok: true, snapshot: {} })
  })
  await helper.fetchIntelligenceAdminSnapshot({ subject: 'synthetic-owner' })
  assert.equal('x-vercel-protection-bypass' in captured.headers, false)
})

test('Production, wrong owner and non-Vercel credential destinations fail before fetch', async () => {
  for (const [overrides, subject] of [
    [{ VERCEL_ENV: 'production' }, 'synthetic-owner'],
    [{}, 'synthetic-other'],
    [{ INTELLIGENCE_OS_AGENT_RUNTIME_URL: 'https://example.com', INTELLIGENCE_OS_AGENT_RUNTIME_BYPASS_SECRET: 'synthetic-bypass' }, 'synthetic-owner'],
    [{ INTELLIGENCE_OS_AGENT_RUNTIME_URL: 'http://localhost:3001', INTELLIGENCE_OS_AGENT_RUNTIME_BYPASS_SECRET: 'synthetic-bypass' }, 'synthetic-owner'],
  ]) {
    let called = false
    const helper = loadHelper(overrides, async () => { called = true; return Response.json({}) })
    await assert.rejects(helper.fetchIntelligenceAdminSnapshot({ subject }))
    assert.equal(called, false)
  }
})

test('transport failures are sanitized', async () => {
  const helper = loadHelper({}, async () => { throw new Error('private transport details') })
  await assert.rejects(helper.fetchIntelligenceAdminSnapshot({ subject: 'synthetic-owner' }), error => {
    assert.equal(error.code, 'ADMIN_RUNTIME_UNAVAILABLE')
    assert.equal(error.message.includes('private transport details'), false)
    return true
  })
})

test('acceptance Preview suppresses marketing events and tags, while Production behavior stays available', async () => {
  const trackingSource = readFileSync(new URL('../lib/ac-event-tracking.ts', import.meta.url), 'utf8')
  const trackingCode = ts.transpileModule(trackingSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  for (const vercelEnvironment of ['preview', 'production']) {
    const exports = {}
    let calls = 0
    vm.runInNewContext(trackingCode, {
      exports, URLSearchParams, console,
      process: { env: { VERCEL_ENV: vercelEnvironment, INTELLIGENCE_OS_ADMIN_ENABLED: 'true' } },
      require: () => ({ env: { acEventActId: 'synthetic', acEventKey: 'synthetic', acApiUrl: 'https://synthetic.invalid', acApiKey: 'synthetic' } }),
      fetch: async () => { calls++; return Response.json({ success: true }) },
    })
    await exports.trackACServerEvent({ email: 'synthetic@example.com', event: 'synthetic' })
    if (vercelEnvironment === 'preview') {
      await exports.applyACContactTag({ email: 'synthetic@example.com', tag: 'synthetic' })
      assert.equal(calls, 0)
    } else {
      assert.equal(calls, 1)
    }
  }
})
