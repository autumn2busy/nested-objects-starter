import {
  AdminControlPlaneAuthorizationError,
  AdminControlPlaneConflictError,
  AdminControlPlaneNotFoundError,
  AdminControlPlaneReplayError,
} from '../persistence/admin-control-plane-store.js'
import { DurableRuntimeConfigurationError } from '../runtime/durable-runtime.js'
import { AdminRuntimeConfigurationError } from '../runtime/admin-runtime.js'
import { StagingDestinationBindingError } from '../runtime/staging-destination.js'
import { AdminRequestPayloadTooLargeError, AdminRequestValidationError } from './admin-contracts.js'
import { AdminServiceAuthenticationError, AdminServiceAuthorizationError } from './admin-request-auth.js'
import { jsonResponse } from './web.js'

export function adminErrorResponse(error: unknown, operation: string): Response {
  if (error instanceof AdminServiceAuthenticationError) {
    return jsonResponse({ ok: false, error: { code: error.code, message: 'Unauthorized.' } }, 401)
  }
  if (error instanceof AdminServiceAuthorizationError || error instanceof AdminControlPlaneAuthorizationError) {
    return jsonResponse({ ok: false, error: { code: error.code, message: 'Forbidden.' } }, 403)
  }
  if (error instanceof AdminRequestPayloadTooLargeError) {
    return jsonResponse({
      ok: false,
      error: { code: error.code, message: 'Request body is too large.', maximumBytes: error.maximumBytes },
    }, 413)
  }
  if (error instanceof AdminRequestValidationError) {
    return jsonResponse({ ok: false, error: { code: error.code, message: error.message } }, 400)
  }
  if (error instanceof AdminControlPlaneReplayError || error instanceof AdminControlPlaneConflictError) {
    return jsonResponse({ ok: false, error: { code: error.code, message: error.message } }, 409)
  }
  if (error instanceof AdminControlPlaneNotFoundError) {
    return jsonResponse({ ok: false, error: { code: error.code, message: 'Not found.' } }, 404)
  }
  if (
    error instanceof AdminRuntimeConfigurationError
    || error instanceof DurableRuntimeConfigurationError
    || error instanceof StagingDestinationBindingError
  ) {
    return jsonResponse({
      ok: false,
      error: { code: 'ADMIN_RUNTIME_CONFIGURATION_FAILED', message: 'Protected staging admin is not configured.' },
    }, 503)
  }
  console.error('Protected Intelligence OS admin request failed', { operation, code: errorCode(error) })
  return jsonResponse({
    ok: false,
    error: { code: 'ADMIN_REQUEST_FAILED', message: 'Protected admin request failed.' },
  }, 500)
}

function errorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) return String(error.code)
  return 'UNHANDLED_ERROR'
}
