import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const VALID_SUBMISSION = {
  name: 'Private Person',
  email: 'private@example.test',
  topic: 'Billing question',
  message: 'Private account details',
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function loadRoute({
  storageError = null,
  storageThrows = false,
  notification = null,
  environment = {},
  profileError = null,
  rateLimitError = null,
} = {}) {
  const calls = {
    auth: 0,
    clients: 0,
    errors: [],
    warnings: [],
    limits: [],
    notifications: [],
    oauth: [],
    notificationTimeouts: [],
    writes: [],
  }
  const supabase = {
    from(table) {
      if (table === 'profiles') {
        return {
          select() { return this },
          eq() { return this },
          async maybeSingle() {
            return { data: { id: 'synthetic-profile' }, error: profileError }
          },
        }
      }

      assert.equal(table, 'contact_submissions')
      return {
        async insert(row) {
          calls.writes.push(clone(row))
          if (storageThrows) throw new Error('private@example.test')
          return { error: storageError }
        },
      }
    },
  }
  const globals = {
    Request,
    Response,
    Buffer,
    URLSearchParams,
    process: { env: {
      ...(notification ? {
        CONTACT_EMAIL_ENABLED: 'true',
        VERCEL_ENV: 'production',
        CONTACT_GMAIL_CLIENT_ID: 'synthetic-client',
        CONTACT_GMAIL_CLIENT_SECRET: 'synthetic-secret',
        CONTACT_GMAIL_REFRESH_TOKEN: 'synthetic-refresh',
      } : {}),
      ...environment,
    } },
    AbortSignal: {
      timeout(milliseconds) {
        calls.notificationTimeouts.push(milliseconds)
        return { throwIfAborted() {} }
      },
    },
    console: {
      error: (...args) => calls.errors.push(clone(args)),
      warn: (...args) => calls.warnings.push(clone(args)),
    },
    fetch: async (url, options) => {
      assert.equal(calls.writes.length, 1, 'storage must precede every provider request')
      if (url === 'https://oauth2.googleapis.com/token') {
        calls.oauth.push(url)
        return Response.json({ access_token: 'synthetic-access', token_type: 'Bearer', expires_in: 3600 })
      }
      assert.equal(url, 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send')
      calls.notifications.push(clone({ url, options: { ...options, signal: undefined } }))
      return notification(url, options)
    },
    require(name) {
      const imports = {
        'server-only': {},
        crypto: require('node:crypto'),
        'node:buffer': { Buffer },
        'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) } },
        '@/lib/auth-server': {
          getCurrentUser: async () => {
            calls.auth++
            return { sub: 'synthetic-outseta-subject' }
          },
          getOutsetaUserId: user => user?.sub ?? null,
        },
        '@/lib/supabase-server': {
          createServiceRoleClient: () => {
            calls.clients++
            return supabase
          },
        },
        '@/lib/rate-limit': {
          rateLimit: () => ({
            check: async key => {
              calls.limits.push(key)
              if (rateLimitError) throw rateLimitError
            },
          }),
          isRateLimitExceededError: error => error?.code === 'RATE_LIMIT_EXCEEDED',
          isRateLimitUnavailableError: error => error?.code === 'RATE_LIMIT_BACKEND_UNAVAILABLE',
        },
      }
      const localModules = {
        '@/lib/contact-email-message': '../lib/contact-email-message.ts',
        './contact-email-message': '../lib/contact-email-message.ts',
        '@/lib/contact-email-sender': '../lib/contact-email-sender.ts',
      }
      if (Object.hasOwn(localModules, name)) return loadModule(localModules[name])
      assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`)
      return imports[name]
    },
  }
  function loadModule(path) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8')
    const code = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText
    const exports = {}
    vm.runInNewContext(code, { ...globals, exports })
    return exports
  }
  const exports = loadModule('../app/api/contact/route.ts')

  function post(submission = VALID_SUBMISSION, { rawBody, headers = {} } = {}) {
    return exports.POST(new Request('https://synthetic.invalid/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: rawBody ?? JSON.stringify(submission),
    }))
  }

  return { calls, post }
}

test('invalid scalar values, email, topic and lengths are rejected before auth or storage', async () => {
  const invalidBodies = [
    { ...VALID_SUBMISSION, name: ['Private Person'] },
    { ...VALID_SUBMISSION, email: 'not-an-email' },
    { ...VALID_SUBMISSION, email: 'private@example.test,second@example.test' },
    { ...VALID_SUBMISSION, email: 'private@example.test\r\nBcc: second@example.test' },
    { ...VALID_SUBMISSION, topic: 'Unapproved topic' },
    { ...VALID_SUBMISSION, name: 'x'.repeat(121) },
    { ...VALID_SUBMISSION, message: 'x'.repeat(5_001) },
  ]

  for (const body of invalidBodies) {
    const harness = loadRoute()
    const response = await harness.post(body)
    assert.equal(response.status, 400)
    assert.equal(harness.calls.auth, 0)
    assert.equal(harness.calls.clients, 0)
    assert.equal(harness.calls.writes.length, 0)
  }
})

test('rate-limit denial and unavailable protection stop all downstream work', async () => {
  for (const [code, status, retryAfter] of [
    ['RATE_LIMIT_EXCEEDED', 429, '60'],
    ['RATE_LIMIT_BACKEND_UNAVAILABLE', 503, '30'],
  ]) {
    const error = Object.assign(new Error('synthetic'), { code })
    const harness = loadRoute({ rateLimitError: error })
    const response = await harness.post(VALID_SUBMISSION, {
      headers: { 'x-forwarded-for': '192.0.2.10' },
    })

    assert.equal(response.status, status)
    assert.equal(response.headers.get('retry-after'), retryAfter)
    assert.match(harness.calls.limits[0], /^contact:[a-f0-9]{24}$/)
    assert.equal(harness.calls.limits[0].includes('192.0.2.10'), false)
    assert.equal(harness.calls.auth, 0)
    assert.equal(harness.calls.clients, 0)
    assert.equal(harness.calls.writes.length, 0)
    assert.equal(harness.calls.notifications.length, 0)
  }
})

test('oversized or malformed JSON is rejected before auth or storage', async () => {
  for (const options of [
    { rawBody: 'x'.repeat(8_193) },
    { rawBody: '{not-json' },
    { rawBody: JSON.stringify(VALID_SUBMISSION), headers: { 'content-length': '8193' } },
  ]) {
    const harness = loadRoute()
    const response = await harness.post(VALID_SUBMISSION, options)
    assert.ok(response.status === 400 || response.status === 413)
    assert.equal(harness.calls.auth, 0)
    assert.equal(harness.calls.clients, 0)
  }
})

test('durable storage error returns truthful state and never attempts notification', async () => {
  const harness = loadRoute({
    storageError: { code: 'PGRST205', message: 'private@example.test' },
    notification: async () => new Response(null, { status: 204 }),
  })
  const response = await harness.post()

  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), {
    success: false,
    stored: false,
    notification: 'not_attempted',
    error: 'We could not receive your message. Please try again.',
  })
  assert.equal(harness.calls.notifications.length, 0)
  assert.equal(harness.calls.oauth.length, 0)
  assert.deepEqual(harness.calls.errors, [['[CONTACT_DB_WRITE_FAILED]']])
})

test('durable storage throw returns truthful state without logging PII', async () => {
  const harness = loadRoute({ storageThrows: true })
  const response = await harness.post()

  assert.equal(response.status, 503)
  assert.equal((await response.json()).stored, false)
  assert.equal(JSON.stringify(harness.calls.errors).includes('private@example.test'), false)
  assert.equal(JSON.stringify(harness.calls.errors).includes('Private Person'), false)
})

test('stored submission uses no Outseta subject as the Supabase auth UUID', async () => {
  const harness = loadRoute()
  const response = await harness.post()
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(body, {
    success: true,
    stored: true,
    notification: 'not_configured',
    message: 'Thank you for reaching out. Your message has been received.',
  })
  assert.equal(harness.calls.writes[0].user_id, null)
  assert.match(harness.calls.writes[0].id, /^[a-f0-9-]{36}$/)
  assert.equal(harness.calls.writes[0].profile_id, 'synthetic-profile')
  assert.deepEqual(harness.calls.errors, [])
})

test('successful storage awaits direct email acceptance with the stored receipt ID', async () => {
  let releaseNotification
  let completed = false
  const notification = () => new Promise(resolve => {
    releaseNotification = () => resolve(Response.json({ id: 'synthetic-message' }))
  })
  const harness = loadRoute({ notification })
  const responsePromise = harness.post().then(response => {
    completed = true
    return response
  })

  await new Promise(resolve => setImmediate(resolve))
  assert.equal(completed, false)
  assert.deepEqual(harness.calls.notificationTimeouts, [5_000])
  releaseNotification()
  const response = await responsePromise
  const body = await response.json()

  assert.equal(body.stored, true)
  assert.equal(body.notification, 'provider_accepted')
  const payload = JSON.parse(harness.calls.notifications[0].options.body)
  const mime = Buffer.from(payload.raw, 'base64url').toString('utf8')
  assert.match(mime, /To: info@nestedobjects\.com\r\n/)
  assert.match(mime, /Reply-To: private@example\.test\r\n/)
  assert.ok(mime.includes(`<contact-${harness.calls.writes[0].id}@nestedobjects.com>`))
  assert.equal(mime.includes('synthetic-profile'), false)
  assert.equal(mime.includes('synthetic-outseta-subject'), false)
})

test('notification rejection and timeout preserve stored truth without PII logs', async () => {
  for (const error of [
    new Error('private@example.test'),
    Object.assign(new Error('private@example.test'), { name: 'TimeoutError' }),
  ]) {
    const harness = loadRoute({ notification: async () => { throw error } })
    const response = await harness.post()
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.stored, true)
    assert.equal(body.notification, 'failed')
    assert.deepEqual(harness.calls.warnings, [['[CONTACT_NOTIFICATION]', { state: 'failed', reason: 'request_failed' }]])
    assert.equal(JSON.stringify([harness.calls.errors, harness.calls.warnings]).includes('private@example.test'), false)
    assert.equal(harness.calls.notifications.length, 1, 'do not retry ambiguous sends')
  }
})

test('non-success provider response is reported without claiming notification delivery', async () => {
  const harness = loadRoute({ notification: async () => new Response(null, { status: 502 }) })
  const response = await harness.post()
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.stored, true)
  assert.equal(body.notification, 'failed')
  assert.deepEqual(harness.calls.warnings, [['[CONTACT_NOTIFICATION]', { state: 'failed', reason: 'send_rejected' }]])
})

test('retired n8n configuration never receives contact submissions', async () => {
  const harness = loadRoute({ environment: {
    N8N_AI_CONCIERGE_WEBHOOK_URL: 'https://retired.invalid/contact',
  } })
  const response = await harness.post()
  assert.equal((await response.json()).notification, 'not_configured')
  assert.equal(harness.calls.writes.length, 1)
  assert.equal(harness.calls.notifications.length, 0)
  assert.equal(harness.calls.oauth.length, 0)
})

test('Preview and disabled sending still save receipts without contacting Google', async () => {
  for (const environment of [
    { VERCEL_ENV: 'preview' },
    { CONTACT_EMAIL_ENABLED: 'false' },
  ]) {
    const harness = loadRoute({
      environment,
      notification: () => { throw new Error('must not send') },
    })
    const body = await (await harness.post()).json()
    assert.equal(body.stored, true)
    assert.equal(body.notification, 'not_configured')
    assert.equal(harness.calls.notifications.length, 0)
    assert.equal(harness.calls.oauth.length, 0)
  }
})
