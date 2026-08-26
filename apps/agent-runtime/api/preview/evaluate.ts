import {
  PreviewRequestValidationError,
} from '../../src/http/preview-contract.js'
import {
  authenticatePreviewRequest,
  loadPreviewRuntimeConfiguration,
  PreviewAuthenticationError,
  PreviewRuntimeConfigurationError,
} from '../../src/http/preview-runtime.js'
import {
  jsonResponse,
  methodNotAllowed,
  PreviewPayloadTooLargeError,
  readBoundedJson,
} from '../../src/http/web.js'
import {
  evaluatePreviewRequest,
  PreviewPersistenceDisabledError,
} from '../../src/runtime/preview-evaluation.js'

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return methodNotAllowed(['POST'])

    try {
      const configuration = loadPreviewRuntimeConfiguration(process.env)
      authenticatePreviewRequest(request, configuration.apiToken)
      const payload = await readBoundedJson(request)
      const result = await evaluatePreviewRequest(payload, configuration)
      return jsonResponse(result, 200, { 'x-correlation-id': result.correlationId })
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
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        }, 400)
      }
      if (error instanceof PreviewPersistenceDisabledError) {
        return jsonResponse(
          { ok: false, error: { code: error.code, message: error.message } },
          403,
        )
      }
      if (error instanceof PreviewRuntimeConfigurationError) {
        return jsonResponse(
          { ok: false, error: { code: error.code, message: 'Preview runtime is not safely configured.' } },
          503,
        )
      }

      console.error('Phase C2 preview evaluation failed', {
        code: errorCode(error),
        message: error instanceof Error ? error.message : 'Unknown error',
      })
      return jsonResponse(
        { ok: false, error: { code: 'PREVIEW_EVALUATION_FAILED', message: 'Preview evaluation failed.' } },
        500,
      )
    }
  },
}

function errorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) return String(error.code)
  return 'UNHANDLED_ERROR'
}
