import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PreviewRuntimeConfigurationError,
  loadPreviewRuntimeConfiguration,
} from '../dist/index.js'
import previewEvaluationEndpoint from '../dist-api/api/preview/evaluate.js'

const baseEnvironment = {
  AGENT_RUNTIME_ENV: 'preview',
  AGENT_RUNTIME_MODE: 'dry_run',
  AGENT_MUTATIONS_ENABLED: 'false',
  AGENT_MODEL_EXECUTION_ENABLED: 'false',
  AGENT_WORKFLOW_PROVIDER: 'in_memory',
  AGENT_PREVIEW_API_TOKEN: 'phase-c2-preview-token-with-more-than-32-characters',
  AGENT_PREVIEW_SYNTHETIC_ONLY: 'true',
  AGENT_PREVIEW_PERSISTENCE_ENABLED: 'false',
}

const runtimeEnvironmentKeys = [
  ...Object.keys(baseEnvironment),
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'AGENT_STAGING_PROJECT_REF',
  'VERCEL_ENV',
  'OPENAI_API_KEY',
  'OPENAI_AGENT_MODEL',
  'OPENAI_AGENT_MAX_TURNS',
]

test('base runtime contract errors normalize to PreviewRuntimeConfigurationError', () => {
  assert.throws(
    () => loadPreviewRuntimeConfiguration({
      ...baseEnvironment,
      AGENT_MUTATIONS_ENABLED: 'true',
    }),
    (error) => {
      assert.ok(error instanceof PreviewRuntimeConfigurationError)
      assert.equal(error.code, 'PREVIEW_RUNTIME_CONFIGURATION_FAILED')
      return true
    },
  )

  assert.throws(
    () => loadPreviewRuntimeConfiguration({
      ...baseEnvironment,
      AGENT_MUTATIONS_ENABLED: 'not-a-boolean',
    }),
    (error) => {
      assert.ok(error instanceof PreviewRuntimeConfigurationError)
      assert.equal(error.code, 'PREVIEW_RUNTIME_CONFIGURATION_FAILED')
      return true
    },
  )
})

test('preview endpoint maps invalid base configuration to a sanitized 503 response', async () => {
  const previousEnvironment = Object.fromEntries(
    runtimeEnvironmentKeys.map((key) => [key, process.env[key]]),
  )

  try {
    for (const key of runtimeEnvironmentKeys) delete process.env[key]
    Object.assign(process.env, baseEnvironment, {
      AGENT_MUTATIONS_ENABLED: 'not-a-boolean',
    })

    const response = await previewEvaluationEndpoint.fetch(new Request(
      'https://preview.invalid/api/preview/evaluate',
      { method: 'POST', body: '{not-json' },
    ))

    assert.equal(response.status, 503)
    assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0')
    assert.deepEqual(await response.json(), {
      ok: false,
      error: {
        code: 'PREVIEW_RUNTIME_CONFIGURATION_FAILED',
        message: 'Preview runtime is not safely configured.',
      },
    })
  } finally {
    for (const key of runtimeEnvironmentKeys) {
      const value = previousEnvironment[key]
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})
