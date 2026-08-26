import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PreviewRuntimeConfigurationError,
  loadPreviewRuntimeConfiguration,
} from '../dist/index.js'

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
