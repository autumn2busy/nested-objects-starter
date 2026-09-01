import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export const ADMIN_SIGNATURE_HEADERS = {
  subject: 'x-intelligence-subject',
  timestamp: 'x-intelligence-timestamp',
  nonce: 'x-intelligence-nonce',
  origin: 'x-intelligence-origin',
  bodyDigest: 'x-intelligence-body-sha256',
  signature: 'x-intelligence-signature',
} as const

export interface AdminServiceAuthConfiguration {
  sharedSecret: string
  autumnSubjectId: string
  allowedOrigin: string
  maximumClockSkewMs?: number
}

export interface VerifiedAdminServiceRequest {
  actorSubject: string
  nonce: string
  nonceDigest: string
  timestamp: string
  origin: string
  bodyDigest: string
}

export function createAdminServiceHeaders(input: {
  method: string
  pathname: string
  bodyText: string
  actorSubject: string
  origin: string
  timestamp: string
  nonce: string
  sharedSecret: string
}): Record<string, string> {
  assertSharedSecret(input.sharedSecret)
  const bodyDigest = sha256(input.bodyText)
  const signature = signCanonicalRequest({ ...input, bodyDigest })
  return {
    [ADMIN_SIGNATURE_HEADERS.subject]: input.actorSubject,
    [ADMIN_SIGNATURE_HEADERS.timestamp]: input.timestamp,
    [ADMIN_SIGNATURE_HEADERS.nonce]: input.nonce,
    [ADMIN_SIGNATURE_HEADERS.origin]: input.origin,
    [ADMIN_SIGNATURE_HEADERS.bodyDigest]: bodyDigest,
    [ADMIN_SIGNATURE_HEADERS.signature]: signature,
  }
}

export function verifyAdminServiceRequest(
  request: Request,
  bodyText: string,
  configuration: AdminServiceAuthConfiguration,
  now = new Date(),
): VerifiedAdminServiceRequest {
  assertSharedSecret(configuration.sharedSecret)
  const headers = request.headers
  const actorSubject = requiredHeader(headers, ADMIN_SIGNATURE_HEADERS.subject)
  const timestamp = requiredHeader(headers, ADMIN_SIGNATURE_HEADERS.timestamp)
  const nonce = requiredHeader(headers, ADMIN_SIGNATURE_HEADERS.nonce)
  const origin = requiredHeader(headers, ADMIN_SIGNATURE_HEADERS.origin)
  const providedBodyDigest = requiredHeader(headers, ADMIN_SIGNATURE_HEADERS.bodyDigest)
  const providedSignature = requiredHeader(headers, ADMIN_SIGNATURE_HEADERS.signature)

  if (actorSubject !== configuration.autumnSubjectId) {
    throw new AdminServiceAuthorizationError('The authenticated subject is not the configured owner')
  }
  if (normalizeOrigin(origin) !== normalizeOrigin(configuration.allowedOrigin)) {
    throw new AdminServiceAuthorizationError('The signed request origin is not owner-allowlisted')
  }
  if (!/^[0-9a-f]{64}$/.test(providedBodyDigest) || providedBodyDigest !== sha256(bodyText)) {
    throw new AdminServiceAuthenticationError('The signed request body digest does not match')
  }
  if (!/^[0-9a-f-]{36}$/i.test(nonce)) {
    throw new AdminServiceAuthenticationError('The signed request nonce is invalid')
  }
  const timestampMs = Date.parse(timestamp)
  const maximumClockSkewMs = configuration.maximumClockSkewMs ?? 5 * 60_000
  if (!Number.isFinite(timestampMs) || Math.abs(now.getTime() - timestampMs) > maximumClockSkewMs) {
    throw new AdminServiceAuthenticationError('The signed request timestamp is outside the accepted window')
  }

  const expectedSignature = signCanonicalRequest({
    method: request.method,
    pathname: new URL(request.url).pathname,
    bodyText,
    bodyDigest: providedBodyDigest,
    actorSubject,
    origin,
    timestamp,
    nonce,
    sharedSecret: configuration.sharedSecret,
  })
  if (!secureHexEqual(providedSignature, expectedSignature)) {
    throw new AdminServiceAuthenticationError('The admin service signature is invalid')
  }

  return {
    actorSubject,
    nonce,
    nonceDigest: sha256(nonce),
    timestamp,
    origin: normalizeOrigin(origin),
    bodyDigest: providedBodyDigest,
  }
}

export function payloadDigest(payload: Record<string, unknown>): string {
  return sha256(stableJson(payload))
}

export function stableJson(value: unknown): string {
  return JSON.stringify(sortJson(value))
}

function signCanonicalRequest(input: {
  method: string
  pathname: string
  bodyText: string
  bodyDigest: string
  actorSubject: string
  origin: string
  timestamp: string
  nonce: string
  sharedSecret: string
}): string {
  const canonical = [
    'nested-objects-admin-v1',
    input.method.toUpperCase(),
    normalizePathname(input.pathname),
    input.actorSubject,
    input.timestamp,
    input.nonce,
    normalizeOrigin(input.origin),
    input.bodyDigest,
  ].join('\n')
  return createHmac('sha256', input.sharedSecret).update(canonical).digest('hex')
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, sortJson(entry)]))
}

function normalizeOrigin(value: string): string {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new AdminServiceAuthorizationError('The admin request origin is invalid')
  }
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new AdminServiceAuthorizationError('The admin request origin must contain only scheme and host')
  }
  return url.origin.toLowerCase()
}

function normalizePathname(value: string): string {
  if (!value.startsWith('/') || value.includes('?') || value.includes('#')) {
    throw new AdminServiceAuthenticationError('The signed request pathname is invalid')
  }
  return value
}

function requiredHeader(headers: Headers, name: string): string {
  const value = headers.get(name)?.trim()
  if (!value) throw new AdminServiceAuthenticationError(`Missing required admin service header: ${name}`)
  return value
}

function assertSharedSecret(value: string): void {
  if (value.trim().length < 32) {
    throw new AdminServiceAuthenticationError('The admin service shared secret must contain at least 32 characters')
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function secureHexEqual(left: string, right: string): boolean {
  if (!/^[0-9a-f]{64}$/i.test(left) || !/^[0-9a-f]{64}$/i.test(right)) return false
  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'))
}

export class AdminServiceAuthenticationError extends Error {
  readonly code = 'ADMIN_SERVICE_AUTHENTICATION_FAILED'

  constructor(message: string) {
    super(message)
    this.name = 'AdminServiceAuthenticationError'
  }
}

export class AdminServiceAuthorizationError extends Error {
  readonly code = 'ADMIN_SERVICE_AUTHORIZATION_FAILED'

  constructor(message: string) {
    super(message)
    this.name = 'AdminServiceAuthorizationError'
  }
}
