import {
  evaluateSignedFreeJourneyOperationRequest,
  FreeJourneyOperationAuthenticationError,
  FreeJourneyOperationAuthorizationError,
  FreeJourneyOperationConfigurationError,
  FreeJourneyOperationPayloadTooLargeError,
  FreeJourneyOperationValidationError,
} from '../../src/http/free-journey-operation-request.js'
import { jsonResponse, methodNotAllowed } from '../../src/http/web.js'

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return methodNotAllowed(['POST'])
    try {
      const result = await evaluateSignedFreeJourneyOperationRequest(request)
      return jsonResponse(result, 200, { 'x-free-journey-evaluation-id': result.evaluationId })
    } catch (error) {
      if (error instanceof FreeJourneyOperationAuthenticationError) {
        return jsonResponse({ ok: false, error: { code: error.code, message: 'Unauthorized.' } }, 401)
      }
      if (error instanceof FreeJourneyOperationAuthorizationError) {
        return jsonResponse({ ok: false, error: { code: error.code, message: 'Forbidden.' } }, 403)
      }
      if (error instanceof FreeJourneyOperationPayloadTooLargeError) {
        return jsonResponse({ ok: false, error: {
          code: error.code, message: 'Request body is too large.', maximumBytes: error.maximumBytes,
        } }, 413)
      }
      if (error instanceof FreeJourneyOperationValidationError) {
        return jsonResponse({ ok: false, error: { code: error.code, message: 'Request is invalid.' } }, 400)
      }
      if (error instanceof FreeJourneyOperationConfigurationError) {
        return jsonResponse({ ok: false, error: {
          code: error.code, message: 'Free journey preview is not safely configured.',
        } }, 503)
      }
      console.error('Free journey preview failed', {
        code: error && typeof error === 'object' && 'code' in error ? String(error.code) : 'UNHANDLED_ERROR',
      })
      return jsonResponse({ ok: false, error: {
        code: 'FREE_JOURNEY_EVALUATION_FAILED', message: 'Free journey preview failed.',
      } }, 500)
    }
  },
}
