import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const plain = value => JSON.parse(JSON.stringify(value))

function loadRateLimit({ environment = {}, remoteLimit } = {}) {
  const source = readFileSync(new URL('../lib/rate-limit.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const logs = []
  const exports = {}

  class SyntheticRedis {
    constructor(configuration) {
      this.configuration = configuration
    }
  }

  class SyntheticRatelimit {
    static slidingWindow(limit, interval) {
      return { limit, interval }
    }

    constructor(configuration) {
      this.configuration = configuration
    }

    async limit(id) {
      if (!remoteLimit) throw new Error('Synthetic remote limiter was not configured')
      return remoteLimit(id)
    }
  }

  vm.runInNewContext(code, {
    exports,
    process: { env: environment },
    console: {
      warn: (...values) => logs.push(['warn', ...values]),
      info: (...values) => logs.push(['info', ...values]),
    },
    require(name) {
      if (name === '@upstash/ratelimit') return { Ratelimit: SyntheticRatelimit }
      if (name === '@upstash/redis') return { Redis: SyntheticRedis }
      throw new Error(`Unexpected import: ${name}`)
    },
  })

  return { ...exports, logs }
}

test('unconfigured Upstash uses an observable degraded in-memory limiter', async () => {
  const { rateLimit, logs } = loadRateLimit()
  const limiter = rateLimit({ limit: 1, intervalMs: 1_000 })

  assert.deepEqual(plain(limiter.getState()), {
    backend: 'memory', degraded: true, reason: 'upstash_unconfigured',
  })
  assert.deepEqual(plain(await limiter.check('synthetic-user')), plain(limiter.getState()))
  await assert.rejects(limiter.check('synthetic-user'), { code: 'RATE_LIMIT_EXCEEDED' })
  assert.equal(logs.length, 1)
  assert.equal(logs[0][0], 'warn')
  assert.equal(logs[0][2].reason, 'upstash_unconfigured')
})

test('complete Upstash configuration reports healthy remote decisions', async () => {
  const seen = []
  const { rateLimit, logs } = loadRateLimit({
    environment: {
      UPSTASH_REDIS_REST_URL: 'https://synthetic-upstash.invalid',
      UPSTASH_REDIS_REST_TOKEN: 'synthetic-secret-token',
    },
    remoteLimit: async id => {
      seen.push(id)
      return { success: true }
    },
  })
  const limiter = rateLimit({ limit: 2, intervalMs: 60_000 })

  assert.deepEqual(plain(await limiter.check('synthetic-user')), {
    backend: 'upstash', degraded: false, reason: null,
  })
  assert.deepEqual(seen, ['synthetic-user'])
  assert.equal(logs.length, 0)
})

test('Upstash rejection remains a client throttle rather than a degraded backend', async () => {
  const { rateLimit } = loadRateLimit({
    environment: {
      UPSTASH_REDIS_REST_URL: 'https://synthetic-upstash.invalid',
      UPSTASH_REDIS_REST_TOKEN: 'synthetic-secret-token',
    },
    remoteLimit: async () => ({ success: false }),
  })
  const limiter = rateLimit({ limit: 1, intervalMs: 60_000 })

  await assert.rejects(limiter.check('synthetic-user'), { code: 'RATE_LIMIT_EXCEEDED' })
  assert.equal(limiter.getState().degraded, false)
})

test('partial Upstash configuration fails closed without logging credentials or request keys', async () => {
  const secret = 'do-not-log-partial-token'
  const requestKey = 'do-not-log-request-key'
  const { rateLimit, logs } = loadRateLimit({
    environment: { UPSTASH_REDIS_REST_TOKEN: secret },
  })
  const limiter = rateLimit({ limit: 1, intervalMs: 60_000 })

  await assert.rejects(limiter.check(requestKey), { code: 'RATE_LIMIT_BACKEND_UNAVAILABLE' })
  assert.deepEqual(plain(limiter.getState()), {
    backend: 'upstash', degraded: true, reason: 'upstash_configuration_incomplete',
  })
  const serializedLogs = JSON.stringify(logs)
  assert.equal(serializedLogs.includes(secret), false)
  assert.equal(serializedLogs.includes(requestKey), false)
})

test('Upstash runtime failures fail closed, expose degraded state, and redact the remote error', async () => {
  const secret = 'do-not-log-runtime-token'
  const requestKey = 'do-not-log-runtime-key'
  const remoteDetail = 'do-not-log-remote-detail'
  const { rateLimit, isRateLimitUnavailableError, logs } = loadRateLimit({
    environment: {
      UPSTASH_REDIS_REST_URL: 'https://synthetic-upstash.invalid',
      UPSTASH_REDIS_REST_TOKEN: secret,
    },
    remoteLimit: async () => { throw new Error(remoteDetail) },
  })
  const limiter = rateLimit({ limit: 1, intervalMs: 60_000 })

  await assert.rejects(async () => {
    try {
      await limiter.check(requestKey)
    } catch (error) {
      assert.equal(isRateLimitUnavailableError(error), true)
      throw error
    }
  }, { code: 'RATE_LIMIT_BACKEND_UNAVAILABLE' })
  assert.deepEqual(plain(limiter.getState()), {
    backend: 'upstash', degraded: true, reason: 'upstash_unavailable',
  })
  const serializedLogs = JSON.stringify(logs)
  for (const privateValue of [secret, requestKey, remoteDetail]) {
    assert.equal(serializedLogs.includes(privateValue), false)
  }
})
