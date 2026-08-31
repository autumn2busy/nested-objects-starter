import { start } from 'workflow/api'
import { defineEventHandler } from 'nitro/h3'

import {
  parsePreviewEvaluationRequest,
  PreviewRequestValidationError,
} from '../../../src/http/preview-contract.js'
import {
  authenticatePreviewRequest,
  PreviewAuthenticationError,
} from '../../../src/http/preview-runtime.js'
import {
  jsonResponse,
  PreviewPayloadTooLargeError,
  readBoundedJson,
} from '../../../src/http/web.js'
import {
  DurableRuntimeConfigurationError,
  loadDurableRuntimeConfiguration,
} from '../../../src/runtime/durable-runtime.js'
import { StagingDestinationBindingError } from '../../../src/runtime/staging-destination.js'
import { stableUuid } from '../../../src/stable-id.js'
import { lifecycleIntegrityStagingWorkflow } from '../../../workflows/lifecycle-integrity.js'

export default defineEventHandler(async ({ req }) => {
  try {
    const configuration = loadDurableRuntimeConfiguration(process.env)
    authenticatePreviewRequest(req, configuration.apiToken)
    const fixture = parsePreviewEvaluationRequest(await readBoundedJson(req))
    const idempotencyKey = `phase-c3:lifecycle-integrity:${fixture.idempotencyKey}`
    const correlationId = stableUuid('phase-c3-lifecycle-integrity-correlation', idempotencyKey)
    const run = await start(lifecycleIntegrityStagingWorkflow, [{
      fixture,
      binding: configuration.binding,
      idempotencyKey,
      requestedAt: new Date().toISOString(),
      correlation: {
        correlationId,
        causationId: fixture.causationId ?? null,
        traceId: null,
      },
    }])

    return jsonResponse({
      ok: true,
      status: 'queued',
      workflowRunId: run.runId,
      workflowName: 'lifecycle-integrity-check',
      workflowVersion: 'phase-c3-v1',
      correlationId,
      persistenceEnabled: true,
      syntheticOnly: true,
      destinationVerifiedInFirstStep: true,
    }, 202, { 'x-correlation-id': correlationId })
  } catch (error) {
    if (error instanceof PreviewAuthenticationError) {
      return jsonResponse(
        { ok: false, error: { code: error.code, message: 'Unauthorized.' } },
        401,
        { 'www-authenticate': 'Bearer' },
      )
    }
    if (error instanceof PreviewPayloadTooLargeError) {
      return jsonResponse({
        ok: false,
        error: {
          code: error.code,
          message: 'Request body is too large.',
          maximumBytes: error.maximumBytes,
        },
      }, 413)
    }
    if (error instanceof PreviewRequestValidationError) {
      return jsonResponse({
        ok: false,
        error: { code: error.code, message: error.message, details: error.details },
      }, 400)
    }
    if (error instanceof DurableRuntimeConfigurationError || error instanceof StagingDestinationBindingError) {
      return jsonResponse({
        ok: false,
        error: { code: 'DURABLE_RUNTIME_CONFIGURATION_FAILED', message: 'Durable staging runtime is not safely configured.' },
      }, 503)
    }

    console.error('Phase C3 durable workflow start failed', { code: errorCode(error) })
    return jsonResponse({
      ok: false,
      error: { code: 'DURABLE_WORKFLOW_START_FAILED', message: 'Durable workflow start failed.' },
    }, 500)
  }
})

function errorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) return String(error.code)
  return 'UNHANDLED_ERROR'
}
