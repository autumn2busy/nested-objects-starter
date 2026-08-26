import assert from 'node:assert/strict'
import test from 'node:test'

import {
  handleHealthRequest,
  handleLifecycleIntegrityRequest,
  handleReadinessRequest,
  loadPreviewDeploymentConfiguration,
} from '../dist/preview/index.js'

const fixedNow = '2026-08-26T12:00:00.000Z'
const stagingProjectRef = 'abcdefghijklmnopqrst'
const apiSecret = 'phase-c2-preview-secret-0123456789abcdef'
const correlationId = '11111111-1111-4111-8111-111111111111'
const invocationId = '22222222-2222-4222-8222-222222222222'
const profileId = '33333333-3333-4333-8333-333333333333'

function previewEnvironment(overrides = {}) {
  return {
    AGENT_RUNTIME_ENV: 'preview',
    AGENT_RUNTIME_MODE: 'dry_run',
    AGENT_MUTATIONS_ENABLED: 'false',
    AGENT_MODEL_EXECUTION_ENABLED: 'false',
    AGENT_WORKFLOW_PROVIDER: 'in_memory',
    AGENT_RUNTIME_VERSION: 'phase-c2-preview-v1',
    AGENT_TRACE_NAMESPACE: 'nested-objects-intelligence-os',
    AGENT_RUNTIME_API_SECRET: apiSecret,
    AGENT_STAGING_SUPABASE_PROJECT_REF: stagingProjectRef,
    SUPABASE_URL: `https://${stagingProjectRef}.supabase.co`,
    SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-role-key-used-only-with-injected-tests',
    VERCEL_ENV: 'preview',
    VERCEL_GIT_COMMIT_SHA: '0123456789abcdef0123456789abcdef01234567',
    ...overrides,
  }
}

function invocation(overrides = {}) {
  return {
    invocationId,
    idempotencyKey: 'phase-c2:test:synthetic-lifecycle-integrity',
    synthetic: true,
    persist: false,
    purpose: 'Validate the protected staging-only lifecycle workflow.',
    input: {
      metricDate: '2026-08-26',
      profiles: [{
        id: profileId,
        created_at: fixedNow,
        user_email: 'member@example.invalid',
        subscription_tier: 'free',
        subscription_status: 'active',
      }],
      conversionEvents: [],
      activeCampaignContacts: [],
      marketingConfig: { now: fixedNow },
      correlation: {
        correlationId,
        causationId: null,
        traceId: 'phase-c2-test-trace',
      },
    },
    ...overrides,
  }
}

function authorizedHeaders() {
  return {
    authorization: `Bearer ${apiSecret}`,
    'content-type': 'application/json',
  }
}

function fakeDependencies(overrides = {}) {
  const calls = {
    readiness: 0,
    begin: 0,
    persist: 0,
    complete: 0,
    fail: 0,
  }
  return {
    calls,
    dependency: {
      async checkReadiness() {
        calls.readiness += 1
      },
      async beginRun() {
        calls.begin += 1
        return {
          duplicate: false,
          runId: '44444444-4444-4444-8444-444444444444',
          status: 'running',
        }
      },
      async persistResult() {
        calls.persist += 1
      },
      async completeRun() {
        calls.complete += 1
      },
      async failRun() {
        calls.fail += 1
      },
      ...overrides,
    },
  }
}

async function responseJson(response) {
  return JSON.parse(await response.text())
}

test('public health endpoint exposes safety posture without secrets', async () => {
  const response = await handleHealthRequest(new Request('https://runtime.example/api/health'), {
    environment: previewEnvironment(),
    now: () => fixedNow,
  })
  const body = await responseJson(response)

  assert.equal(response.status, 200)
  assert.equal(body.status, 'healthy')
  assert.equal(body.capabilities.externalMutations, false)
  assert.equal(body.capabilities.modelExecution, false)
  assert.equal(body.capabilities.syntheticOnly, true)
  assert.equal(JSON.stringify(body).includes(apiSecret), false)
  assert.equal(JSON.stringify(body).includes(stagingProjectRef), false)
})

test('preview configuration rejects production deployment and staging project mismatch', () => {
  assert.throws(
    () => loadPreviewDeploymentConfiguration(previewEnvironment({ VERCEL_ENV: 'production' })),
    /VERCEL_ENV must be preview/,
  )
  assert.throws(
    () => loadPreviewDeploymentConfiguration(previewEnvironment({
      SUPABASE_URL: 'https://differentprojectref.supabase.co',
    })),
    /does not match the explicitly approved staging project/,
  )
})

test('protected readiness endpoint rejects missing bearer credentials before database access', async () => {
  const fake = fakeDependencies()
  const response = await handleReadinessRequest(new Request('https://runtime.example/api/readiness'), {
    environment: previewEnvironment(),
    dependencies: fake.dependency,
    now: () => fixedNow,
  })
  const body = await responseJson(response)

  assert.equal(response.status, 401)
  assert.equal(body.error.code, 'UNAUTHORIZED')
  assert.equal(fake.calls.readiness, 0)
})

test('protected readiness endpoint verifies staging contracts with injected dependency', async () => {
  const fake = fakeDependencies()
  const response = await handleReadinessRequest(new Request('https://runtime.example/api/readiness', {
    headers: { authorization: `Bearer ${apiSecret}` },
  }), {
    environment: previewEnvironment(),
    dependencies: fake.dependency,
    now: () => fixedNow,
  })
  const body = await responseJson(response)

  assert.equal(response.status, 200)
  assert.equal(body.status, 'ready')
  assert.equal(fake.calls.readiness, 1)
  assert.ok(body.requiredContracts.includes('projection_runs'))
})

test('workflow endpoint blocks non-synthetic email data', async () => {
  const fake = fakeDependencies()
  const payload = invocation({
    input: {
      ...invocation().input,
      profiles: [{
        id: profileId,
        created_at: fixedNow,
        user_email: 'real-person@example.com',
      }],
    },
  })
  const response = await handleLifecycleIntegrityRequest(new Request(
    'https://runtime.example/api/workflows/lifecycle-integrity',
    {
      method: 'POST',
      headers: authorizedHeaders(),
      body: JSON.stringify(payload),
    },
  ), {
    environment: previewEnvironment(),
    dependencies: fake.dependency,
    now: () => fixedNow,
  })
  const body = await responseJson(response)

  assert.equal(response.status, 422)
  assert.equal(body.error.code, 'NON_SYNTHETIC_DATA_BLOCKED')
  assert.equal(fake.calls.begin, 0)
})

test('workflow endpoint executes deterministic synthetic analysis without persistence by default', async () => {
  const fake = fakeDependencies()
  const response = await handleLifecycleIntegrityRequest(new Request(
    'https://runtime.example/api/workflows/lifecycle-integrity',
    {
      method: 'POST',
      headers: authorizedHeaders(),
      body: JSON.stringify(invocation()),
    },
  ), {
    environment: previewEnvironment(),
    dependencies: fake.dependency,
    now: () => fixedNow,
  })
  const body = await responseJson(response)

  assert.equal(response.status, 200)
  assert.equal(body.status, 'succeeded')
  assert.equal(body.persisted, false)
  assert.equal(body.counts.projections, 1)
  assert.equal(body.correlationId, correlationId)
  assert.equal(fake.calls.begin, 1)
  assert.equal(fake.calls.persist, 0)
  assert.equal(fake.calls.complete, 1)
  assert.equal(JSON.stringify(body).includes('member@example.invalid'), false)
})

test('workflow endpoint persists only after an explicit synthetic persist request', async () => {
  const fake = fakeDependencies()
  const response = await handleLifecycleIntegrityRequest(new Request(
    'https://runtime.example/api/workflows/lifecycle-integrity',
    {
      method: 'POST',
      headers: authorizedHeaders(),
      body: JSON.stringify(invocation({ persist: true })),
    },
  ), {
    environment: previewEnvironment(),
    dependencies: fake.dependency,
    now: () => fixedNow,
  })

  assert.equal(response.status, 200)
  assert.equal(fake.calls.persist, 1)
  assert.equal(fake.calls.complete, 1)
})

test('idempotent duplicate runs return the existing status without rerunning analysis', async () => {
  const fake = fakeDependencies({
    async beginRun() {
      fake.calls.begin += 1
      return {
        duplicate: true,
        runId: '55555555-5555-4555-8555-555555555555',
        status: 'succeeded',
        completedAt: fixedNow,
      }
    },
  })
  const response = await handleLifecycleIntegrityRequest(new Request(
    'https://runtime.example/api/workflows/lifecycle-integrity',
    {
      method: 'POST',
      headers: authorizedHeaders(),
      body: JSON.stringify(invocation()),
    },
  ), {
    environment: previewEnvironment(),
    dependencies: fake.dependency,
    now: () => fixedNow,
  })
  const body = await responseJson(response)

  assert.equal(response.status, 200)
  assert.equal(body.duplicate, true)
  assert.equal(body.counts, null)
  assert.equal(fake.calls.persist, 0)
  assert.equal(fake.calls.complete, 0)
})

test('workflow endpoint enforces method and request-size boundaries', async () => {
  const methodResponse = await handleLifecycleIntegrityRequest(
    new Request('https://runtime.example/api/workflows/lifecycle-integrity'),
    { environment: previewEnvironment() },
  )
  assert.equal(methodResponse.status, 405)

  const oversized = JSON.stringify({ padding: 'x'.repeat(300_000) })
  const sizeResponse = await handleLifecycleIntegrityRequest(new Request(
    'https://runtime.example/api/workflows/lifecycle-integrity',
    {
      method: 'POST',
      headers: authorizedHeaders(),
      body: oversized,
    },
  ), {
    environment: previewEnvironment(),
    dependencies: fakeDependencies().dependency,
  })
  const body = await responseJson(sizeResponse)
  assert.equal(sizeResponse.status, 413)
  assert.equal(body.error.code, 'REQUEST_TOO_LARGE')
})
