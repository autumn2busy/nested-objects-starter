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
  const source = readFileSync(new URL('../app/api/contact/route.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports,
    Request,
    Response,
    process: { env: notification ? { N8N_AI_CONCIERGE_WEBHOOK_URL: 'https://synthetic.invalid/contact' } : {} },
    AbortSignal: {
      timeout(milliseconds) {
        calls.notificationTimeouts.push(milliseconds)
        return { syntheticTimeoutSignal: true }
      },
    },
    console: {
      error: (...args) => calls.errors.push(clone(args)),
      warn: (...args) => calls.warnings.push(clone(args)),
    },
    fetch: async (url, options) => {
      calls.notifications.push(clone({ url, options: { ...options, signal: undefined } }))
      return notification(url, options)
    },
    require(name) {
      const imports = {
        crypto: { createHash: require('node:crypto').createHash },
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
      assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`)
      return imports[name]
    },
  })

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
  assert.equal(harness.calls.writes[0].profile_id, 'synthetic-profile')
  assert.deepEqual(harness.calls.errors, [])
})

test('successful storage awaits the bounded webhook and reports acceptance only', async () => {
  let releaseNotification
  let completed = false
  const notification = () => new Promise(resolve => {
    releaseNotification = () => resolve(new Response(null, { status: 204 }))
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
  assert.equal(body.notification, 'webhook_accepted')
  const payload = JSON.parse(harness.calls.notifications[0].options.body)
  assert.deepEqual(Object.keys(payload.submission), ['name', 'email', 'topic', 'message'])
  assert.equal('profileId' in payload.submission, false)
  assert.equal('outsetaId' in payload.submission, false)
})

test('notification rejection and timeout preserve stored truth without PII logs', async () => {
  for (const [error, expectedReason] of [
    [new Error('private@example.test'), 'request_error'],
    [Object.assign(new Error('private@example.test'), { name: 'TimeoutError' }), 'timeout'],
  ]) {
    const harness = loadRoute({ notification: async () => { throw error } })
    const response = await harness.post()
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.stored, true)
    assert.equal(body.notification, 'failed')
    assert.deepEqual(harness.calls.errors, [['[CONTACT_NOTIFICATION_FAILED]', { reason: expectedReason }]])
    assert.equal(JSON.stringify(harness.calls.errors).includes('private@example.test'), false)
  }
})

test('non-success webhook response is reported without claiming notification delivery', async () => {
  const harness = loadRoute({ notification: async () => new Response(null, { status: 502 }) })
  const response = await harness.post()
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.stored, true)
  assert.equal(body.notification, 'failed')
  assert.deepEqual(harness.calls.errors, [['[CONTACT_NOTIFICATION_FAILED]', { status: 502 }]])
})
