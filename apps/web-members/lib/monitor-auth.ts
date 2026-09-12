/**
 * Shared authentication and publication-gate logic for SEO/AEO/content monitor cron routes.
 *
 * SEO-004 hardening requirements:
 * - Fail closed when the dedicated secret (SEO_MONITOR_CRON_SECRET) is missing.
 * - Never accept secrets via query parameters.
 * - Never treat x-vercel-cron header as authentication.
 * - Never bypass authentication in development mode.
 * - Dry-run/non-publication is the safe default.
 * - Publication requires an explicit, separate server-side gate (MONITOR_PUBLICATION_ENABLED).
 * - A request cannot gain publication authority through commit=1 or a cron header alone.
 */

export interface MonitorAuthResult {
  authorized: boolean
  reason: string
}

export interface PublicationGateResult {
  publish: boolean
  reason: string
}

/**
 * Authenticates a monitor cron request.
 *
 * Requires:
 * - SEO_MONITOR_CRON_SECRET environment variable to be configured
 * - Authorization: Bearer <secret> header with the exact secret value
 *
 * Rejects:
 * - Missing or empty SEO_MONITOR_CRON_SECRET
 * - Missing or wrong Bearer token
 * - Secrets provided via query parameters (even if correct)
 * - x-vercel-cron header alone (not authentication)
 * - NODE_ENV=development without valid credentials
 */
export function authenticateMonitorRequest(request: Request): MonitorAuthResult {
  const dedicatedSecret = process.env.SEO_MONITOR_CRON_SECRET

  // Fail closed: dedicated secret must be configured
  if (!dedicatedSecret) {
    return {
      authorized: false,
      reason: 'Monitor cron secret is not configured.',
    }
  }

  // Reject query-string secrets: extract the URL to check for leaked secrets
  const url = new URL(request.url)
  if (url.searchParams.has('secret') || url.searchParams.has('token') || url.searchParams.has('key')) {
    return {
      authorized: false,
      reason: 'Secrets must not be provided via query parameters.',
    }
  }

  // Require exact Bearer token from Authorization header
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    return {
      authorized: false,
      reason: 'Authorization header is required.',
    }
  }

  const match = /^Bearer\s+(.+)$/i.exec(authHeader)
  if (!match) {
    return {
      authorized: false,
      reason: 'Authorization header must use Bearer scheme.',
    }
  }

  const providedToken = match[1]

  // Use timing-safe comparison to prevent timing attacks
  if (!timingSafeEqual(providedToken, dedicatedSecret)) {
    return {
      authorized: false,
      reason: 'Invalid bearer token.',
    }
  }

  return {
    authorized: true,
    reason: 'Authenticated via dedicated cron secret.',
  }
}

/**
 * Determines whether a monitor request has publication authority.
 *
 * Publication requires ALL of:
 * 1. The request is already authenticated (caller must verify separately)
 * 2. MONITOR_PUBLICATION_ENABLED is explicitly set to 'true'
 *
 * Rejects:
 * - commit=1 query parameter (does not grant publication authority)
 * - x-vercel-cron header alone (does not grant publication authority)
 * - Missing or non-'true' MONITOR_PUBLICATION_ENABLED
 *
 * Dry-run is always the safe default.
 */
export function checkPublicationGate(): PublicationGateResult {
  const enabled = process.env.MONITOR_PUBLICATION_ENABLED

  if (enabled !== 'true') {
    return {
      publish: false,
      reason: 'Publication gate is not enabled (MONITOR_PUBLICATION_ENABLED != "true"). Dry-run is the default.',
    }
  }

  return {
    publish: true,
    reason: 'Publication gate is enabled.',
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks on secret comparison.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to avoid leaking length via timing
    const dummy = Buffer.from(a)
    const dummyB = Buffer.alloc(dummy.length)
    try {
      require('crypto').timingSafeEqual(dummy, dummyB)
    } catch {
      // Swallow — we already know they differ
    }
    return false
  }

  try {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    const crypto = require('crypto')
    return crypto.timingSafeEqual(bufA, bufB)
  } catch {
    // Fallback: constant-time comparison
    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return result === 0
  }
}
