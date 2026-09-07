import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const RECEIPT_ID = '12345678-1234-4234-9234-123456789abc'
const SUBMISSION = {
  name: 'Synthetic visitor',
  email: 'visitor@example.test',
  topic: 'Billing question',
  message: 'A private synthetic message — not a real email.',
}
const ENV = {
  CONTACT_EMAIL_ENABLED: 'true',
  VERCEL_ENV: 'production',
  CONTACT_GMAIL_CLIENT_ID: 'synthetic-client',
  CONTACT_GMAIL_CLIENT_SECRET: 'synthetic-secret',
  CONTACT_GMAIL_REFRESH_TOKEN: 'synthetic-refresh',
}
const TOKEN = { access_token: 'synthetic-access', token_type: 'Bearer', expires_in: 3600 }
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'

function loadSender({ env = ENV, tokenResponse, sendResponse, intercept } = {}) {
  const calls = { requests: [], logs: [], timeouts: [], bodyReads: [] }
  const controller = new AbortController()
  const context = vm.createContext({
    Buffer,
    URLSearchParams,
    process: { env: { ...env } },
    AbortSignal: {
      timeout(milliseconds) {
        calls.timeouts.push(milliseconds)
        return controller.signal
      },
    },
    console: Object.fromEntries(['log', 'warn', 'error'].map(level => [
      level, (...args) => calls.logs.push([level, ...args]),
    ])),
    fetch: async (url, options) => {
      const index = calls.requests.length
      calls.requests.push({ url, options })
      assert.ok(index < 2, 'No retry or additional network destination is allowed')
      assert.equal(url, index === 0 ? TOKEN_URL : SEND_URL)
      assert.equal(options.signal, controller.signal)
      assert.equal(options.redirect, 'error')
      assert.equal(options.cache, 'no-store')
      if (intercept) {
        const overridden = await intercept({ index, url, options, controller, calls })
        if (overridden !== undefined) return overridden
      }
      const response = index === 0 ? tokenResponse : sendResponse
      if (response) return response
      return {
        ok: true,
        async json() {
          calls.bodyReads.push(index)
          return index === 0 ? TOKEN : { id: 'synthetic-message' }
        },
      }
    },
  })

  const cache = new Map()
  function load(name) {
    if (cache.has(name)) return cache.get(name)
    const source = readFileSync(new URL(`../lib/${name}.ts`, import.meta.url), 'utf8')
    const code = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText
    const exports = {}
    const factory = vm.runInContext(`(function (exports, require) { ${code}\n })`, context)
    factory(exports, dependency => {
      if (dependency === 'server-only') return {}
      if (dependency === 'node:buffer') return { Buffer }
      assert.equal(dependency, './contact-email-message')
      return load('contact-email-message')
    })
    cache.set(name, exports)
    return exports
  }

  return { notify: load('contact-email-sender').notifyContact, calls, controller }
}

function assertSafeFailure(harness, expectedRequests, reason) {
  assert.equal(harness.calls.requests.length, expectedRequests)
  assert.deepEqual(JSON.parse(JSON.stringify(harness.calls.logs)), [
    ['warn', '[CONTACT_NOTIFICATION]', { state: 'failed', reason }],
  ])
  const logs = JSON.stringify(harness.calls.logs)
  for (const privateValue of [...Object.values(SUBMISSION), ...Object.values(ENV).slice(2), TOKEN.access_token, RECEIPT_ID]) {
    assert.ok(!logs.includes(privateValue))
  }
  assert.doesNotMatch(logs, /https:|gmail|private|synthetic/i)
}

test('only explicit Production activation plus all dedicated credentials permits any request', async () => {
  const environments = [undefined, 'preview', 'development', 'staging', 'Production']
    .map(VERCEL_ENV => ({ ...ENV, VERCEL_ENV }))
  environments.push(...[undefined, 'false', 'TRUE', '1', ' true ']
    .map(CONTACT_EMAIL_ENABLED => ({ ...ENV, CONTACT_EMAIL_ENABLED })))
  for (const key of ['CONTACT_GMAIL_CLIENT_ID', 'CONTACT_GMAIL_CLIENT_SECRET', 'CONTACT_GMAIL_REFRESH_TOKEN']) {
    for (const value of [undefined, '', '   ']) environments.push({ ...ENV, [key]: value })
  }
  environments.push({ N8N_AI_CONCIERGE_WEBHOOK_URL: 'https://retired.invalid/private', GOOGLE_CLIENT_ID: 'unrelated-client' })
  for (const env of environments) {
    const harness = loadSender({ env })
    assert.equal(await harness.notify(SUBMISSION, RECEIPT_ID), 'not_configured')
    assert.deepEqual(harness.calls, { requests: [], logs: [], timeouts: [], bodyReads: [] })
  }
})

test('direct OAuth and Gmail requests are pinned and produce correctly routed UTF-8 RFC 2822 MIME', async () => {
  const submission = { ...SUBMISSION, name: 'Test 蔡', topic: 'É'.repeat(100), message: 'First line\nSecond line 👋\r\n<script>untrusted</script>' }
  const harness = loadSender()
  assert.equal(await harness.notify(submission, RECEIPT_ID), 'provider_accepted')
  const [tokenRequest, sendRequest] = harness.calls.requests
  assert.equal(tokenRequest.options.method, 'POST')
  assert.equal(tokenRequest.options.headers['Content-Type'], 'application/x-www-form-urlencoded')
  assert.deepEqual(Object.fromEntries(new URLSearchParams(tokenRequest.options.body)), {
    client_id: ENV.CONTACT_GMAIL_CLIENT_ID,
    client_secret: ENV.CONTACT_GMAIL_CLIENT_SECRET,
    refresh_token: ENV.CONTACT_GMAIL_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  })
  assert.equal(sendRequest.options.method, 'POST')
  assert.equal(sendRequest.options.headers.Authorization, `Bearer ${TOKEN.access_token}`)
  assert.deepEqual(harness.calls.timeouts, [5000])
  assert.equal(tokenRequest.options.signal, sendRequest.options.signal)
  assert.deepEqual(harness.calls.bodyReads, [0, 1])
  assert.deepEqual(harness.calls.logs, [])

  const payload = JSON.parse(sendRequest.options.body)
  assert.deepEqual(Object.keys(payload), ['raw'])
  assert.match(payload.raw, /^[A-Za-z0-9_-]+$/)
  const mime = Buffer.from(payload.raw, 'base64url').toString('utf8')
  const [headers, body] = mime.split('\r\n\r\n')
  assert.match(headers, /^From: info@nestedobjects\.com\r\nTo: info@nestedobjects\.com\r\nReply-To: visitor@example\.test\r\n/)
  assert.match(headers, new RegExp(`Message-ID: <contact-${RECEIPT_ID}@nestedobjects\\.com>`))
  assert.match(headers, /Content-Type: text\/plain; charset=UTF-8/)
  assert.match(headers, /Content-Transfer-Encoding: base64/)
  assert.doesNotMatch(headers, /\r\n(?:Bcc|Cc):/i)
  const words = [...headers.matchAll(/=\?UTF-8\?B\?([^?]+)\?=/g)]
  assert.ok(words.length > 1)
  assert.ok(words.every(word => word[0].length <= 75))
  assert.equal(words.map(word => Buffer.from(word[1], 'base64').toString('utf8')).join(''), `Nested Objects contact: ${submission.topic}`)
  assert.ok(body.trim().split('\r\n').every(line => line.length <= 76))
  const decodedBody = Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf8')
  assert.match(decodedBody, /Name: Test 蔡/)
  assert.ok(decodedBody.includes('Second line 👋\r\n<script>untrusted</script>'))
})

test('unsafe mail headers and receipt identifiers fail before obtaining credentials or sending', async () => {
  for (const [submission, receiptId] of [
    [{ ...SUBMISSION, email: 'visitor@example.test\r\nBcc: other@example.test' }, RECEIPT_ID],
    [{ ...SUBMISSION, email: 'first@example.test,second@example.test' }, RECEIPT_ID],
    [{ ...SUBMISSION, topic: 'Billing\r\nBcc: other@example.test' }, RECEIPT_ID],
    [SUBMISSION, 'invalid\r\nBcc: other@example.test'],
  ]) {
    const harness = loadSender()
    assert.equal(await harness.notify(submission, receiptId), 'failed')
    assertSafeFailure(harness, 0, 'invalid_message')
  }
})

test('OAuth rejection and redirects never send, retry, read error bodies or expose provider errors', async () => {
  for (const status of [302, 400, 401, 403, 429, 500]) {
    const harness = loadSender({ tokenResponse: {
      ok: false, status,
      json() { throw new Error('The error body must not be read') },
    } })
    assert.equal(await harness.notify(SUBMISSION, RECEIPT_ID), 'failed')
    assertSafeFailure(harness, 1, 'token_rejected')
  }
})

test('invalid OAuth token payloads fail closed without a send attempt', async () => {
  for (const token of [
    null, {}, [], 'private provider body', { ...TOKEN, access_token: '' },
    { ...TOKEN, access_token: 'private\r\nInjected: value' },
    { ...TOKEN, access_token: 'a'.repeat(8193) },
    { ...TOKEN, token_type: 'Other' }, { ...TOKEN, expires_in: 0 },
    { ...TOKEN, expires_in: '3600' }, { ...TOKEN, expires_in: undefined },
  ]) {
    const harness = loadSender({ tokenResponse: { ok: true, json: async () => token } })
    assert.equal(await harness.notify(SUBMISSION, RECEIPT_ID), 'failed')
    assertSafeFailure(harness, 1, 'invalid_token')
  }
})

test('Gmail rejection and redirects are failures without automatic retries or error-body logging', async () => {
  for (const status of [302, 400, 401, 403, 429, 500]) {
    const harness = loadSender({ sendResponse: {
      ok: false, status,
      json() { throw new Error('The error body must not be read') },
    } })
    assert.equal(await harness.notify(SUBMISSION, RECEIPT_ID), 'failed')
    assertSafeFailure(harness, 2, 'send_rejected')
  }
})

test('HTTP success from Gmail without a valid message ID is not provider acceptance', async () => {
  for (const sent of [null, {}, [], { id: '' }, { id: 123 }, { id: 'private message' }, { id: 'a'.repeat(257) }]) {
    const harness = loadSender({ sendResponse: { ok: true, json: async () => sent } })
    assert.equal(await harness.notify(SUBMISSION, RECEIPT_ID), 'failed')
    assertSafeFailure(harness, 2, 'invalid_send_response')
  }
})

test('network, redirect-policy and JSON parsing exceptions never expose exception data or retry', async () => {
  for (const index of [0, 1]) {
    for (const stage of ['fetch', 'json']) {
      const harness = loadSender({ intercept: context => {
        if (context.index !== index) return undefined
        if (stage === 'fetch') throw new Error('private provider redirect https://private.invalid/token synthetic-secret')
        return { ok: true, json: async () => { throw new Error('private provider body visitor@example.test') } }
      } })
      assert.equal(await harness.notify(SUBMISSION, RECEIPT_ID), 'failed')
      assertSafeFailure(harness, index + 1, 'request_failed')
    }
  }
})

test('one timeout budget also covers token and send response bodies, including late successful body parsing', async () => {
  for (const index of [0, 1]) {
    for (const lateSuccess of [false, true]) {
      const harness = loadSender({ intercept: context => {
        if (context.index !== index) return undefined
        return {
          ok: true,
          async json() {
            context.controller.abort(new Error('private timeout body'))
            if (!lateSuccess) context.options.signal.throwIfAborted()
            return index === 0 ? TOKEN : { id: 'synthetic-message' }
          },
        }
      } })
      assert.equal(await harness.notify(SUBMISSION, RECEIPT_ID), 'failed')
      assertSafeFailure(harness, index + 1, 'request_failed')
      assert.deepEqual(harness.calls.timeouts, [5000])
    }
  }
})
