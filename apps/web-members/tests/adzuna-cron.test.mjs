import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const CRON_SECRET = 'synthetic-cron-secret'
const SOURCE_COUNT = 5

function job(id, title = 'Field Inspector') {
  return {
    id,
    title,
    company: { display_name: 'Synthetic Firm' },
    description: 'Synthetic opportunity',
    location: { display_name: 'Austin, Texas', area: ['US', 'Texas', 'Austin'] },
    redirect_url: 'https://example.test/opportunity',
    created: '2026-09-04T00:00:00.000Z',
  }
}

function successfulSources() {
  return Array.from({ length: SOURCE_COUNT }, (_, index) => ({
    status: 200,
    body: { results: [job(`job-${index + 1}`)] },
  }))
}

function loadRoute({
  environment = {},
  sources = successfulSources(),
  clientThrows = false,
  upsertError = null,
  deactivateError = null,
} = {}) {
  const calls = {
    clients: 0,
    errors: [],
    infos: [],
    operations: [],
    requests: [],
    upserts: [],
    deactivations: [],
  }
  const sourceQueue = [...sources]
  const supabase = {
    from(table) {
      assert.equal(table, 'jobs')
      return {
        async upsert(rows, options) {
          calls.operations.push('upsert')
          calls.upserts.push({ rows: structuredClone(rows), options: structuredClone(options) })
          return { error: upsertError }
        },
        update(values) {
          return {
            eq(column, value) {
              return {
                async not(notColumn, operator, filter) {
                  calls.operations.push('deactivate')
                  calls.deactivations.push({
                    values: structuredClone(values),
                    column,
                    value,
                    notColumn,
                    operator,
                    filter,
                  })
                  return { error: deactivateError }
                },
              }
            },
          }
        },
      }
    },
  }
  const source = readFileSync(new URL('../app/api/cron/sync-adzuna/route.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}

  vm.runInNewContext(code, {
    exports,
    Request,
    Response,
    URL,
    Map,
    console: {
      error: (...args) => calls.errors.push(structuredClone(args)),
      info: (...args) => calls.infos.push(structuredClone(args)),
    },
    process: {
      env: {
        CRON_SECRET,
        ADZUNA_APP_ID: 'synthetic-app-id',
        ADZUNA_APP_KEY: 'synthetic-app-key',
        ...environment,
      },
    },
    setTimeout(callback) {
      callback()
      return 0
    },
    fetch: async url => {
      calls.requests.push(url)
      const next = sourceQueue.shift()
      if (!next) throw new Error('Unexpected source request')
      if (next.error) throw next.error
      return Response.json(next.body, { status: next.status })
    },
    require(name) {
      const imports = {
        'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) } },
        '@/lib/supabase-server': {
          createServiceRoleClient() {
            calls.clients++
            if (clientThrows) throw new Error('Synthetic storage configuration failure')
            return supabase
          },
        },
      }
      assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`)
      return imports[name]
    },
  })

  function request({ secret = CRON_SECRET, vercelHeader = false } = {}) {
    const headers = {}
    if (secret !== null) headers.authorization = `Bearer ${secret}`
    if (vercelHeader) headers['x-vercel-cron'] = '1'
    return exports.GET(new Request('https://example.test/api/cron/sync-adzuna', { headers }))
  }

  return { calls, request }
}

test('missing cron configuration fails closed and a spoofable Vercel header cannot bypass it', async () => {
  const harness = loadRoute({ environment: { CRON_SECRET: '' } })
  const response = await harness.request({ secret: null, vercelHeader: true })

  assert.equal(response.status, 503)
  assert.equal((await response.json()).error, 'Cron authentication is not configured.')
  assert.equal(harness.calls.requests.length, 0)
  assert.equal(harness.calls.clients, 0)
})

test('incorrect bearer authentication stops source and database activity', async () => {
  const harness = loadRoute()
  const response = await harness.request({ secret: 'incorrect' })

  assert.equal(response.status, 401)
  assert.equal(harness.calls.requests.length, 0)
  assert.equal(harness.calls.clients, 0)
})

test('a partial Adzuna outage returns 503 and preserves every existing job', async () => {
  const sources = successfulSources()
  sources[2] = { status: 503, body: { error: 'synthetic upstream failure' } }
  const harness = loadRoute({ sources })
  const response = await harness.request()
  const body = await response.json()

  assert.equal(response.status, 503)
  assert.equal(body.preservedExisting, true)
  assert.equal(harness.calls.requests.length, SOURCE_COUNT)
  assert.equal(harness.calls.clients, 0)
  assert.deepEqual(harness.calls.operations, [])
})

test('request failures and invalid payloads never reach storage', async () => {
  for (const failedSource of [
    { error: new Error('synthetic network failure') },
    { status: 200, body: { results: null } },
  ]) {
    const sources = successfulSources()
    sources[0] = failedSource
    const harness = loadRoute({ sources })
    const response = await harness.request()

    assert.equal(response.status, 503)
    assert.equal((await response.json()).preservedExisting, true)
    assert.equal(harness.calls.clients, 0)
    assert.deepEqual(harness.calls.operations, [])
  }
})

test('an empty accepted source set returns 503 without deactivating prior jobs', async () => {
  const sources = Array.from({ length: SOURCE_COUNT }, () => ({ status: 200, body: { results: [] } }))
  const harness = loadRoute({ sources })
  const response = await harness.request()

  assert.equal(response.status, 503)
  assert.equal((await response.json()).preservedExisting, true)
  assert.equal(harness.calls.clients, 0)
  assert.deepEqual(harness.calls.operations, [])
})

test('an upsert failure occurs before stale-job deactivation and stays redacted', async () => {
  const privateDetail = 'do-not-log-database-detail'
  const harness = loadRoute({ upsertError: { message: privateDetail } })
  const response = await harness.request()

  assert.equal(response.status, 503)
  assert.equal((await response.json()).preservedExisting, true)
  assert.deepEqual(harness.calls.operations, ['upsert'])
  assert.equal(JSON.stringify(harness.calls.errors).includes(privateDetail), false)
  assert.equal(JSON.stringify(harness.calls.errors).includes(CRON_SECRET), false)
})

test('a stale-job cleanup failure leaves the new source set active and reports failure', async () => {
  const harness = loadRoute({ deactivateError: { message: 'synthetic cleanup failure' } })
  const response = await harness.request()
  const body = await response.json()

  assert.equal(response.status, 503)
  assert.equal(body.preservedExisting, true)
  assert.equal(body.insertedOrUpdated, SOURCE_COUNT)
  assert.deepEqual(harness.calls.operations, ['upsert', 'deactivate'])
})

test('a complete run deduplicates, upserts first, and deactivates only missing source IDs', async () => {
  const sources = successfulSources()
  sources[1] = { status: 200, body: { results: [job('job-1')] } }
  const harness = loadRoute({ sources })
  const response = await harness.request()
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  assert.equal(body.insertedOrUpdated, SOURCE_COUNT - 1)
  assert.equal(body.sourceCount, SOURCE_COUNT)
  assert.deepEqual(harness.calls.operations, ['upsert', 'deactivate'])
  assert.equal(harness.calls.upserts[0].rows.length, SOURCE_COUNT - 1)
  assert.deepEqual(harness.calls.upserts[0].options, {
    onConflict: 'source_id',
    ignoreDuplicates: false,
  })
  assert.deepEqual(harness.calls.deactivations[0], {
    values: { is_active: false },
    column: 'source',
    value: 'Adzuna',
    notColumn: 'source_id',
    operator: 'in',
    filter: '(adzuna_job-1,adzuna_job-3,adzuna_job-4,adzuna_job-5)',
  })
  assert.equal(harness.calls.infos[0][0], '[ADZUNA_SYNC_COMPLETED]')
})
