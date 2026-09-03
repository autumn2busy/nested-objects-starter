import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { headers } from 'next/headers'

import { getCurrentUser } from '@/lib/auth-server'

const ADMIN_REQUEST_VERSION = 'nested-objects-admin-v1'
const ADMIN_FORM_VERSION = 'nested-objects-admin-form-v1'
const FORM_TOKEN_TTL_MS = 10 * 60_000
const REQUEST_TIMEOUT_MS = 15_000

export interface IntelligenceOwnerSession {
  subject: string
}

export interface IntelligenceRunSummary {
  id: string
  workflowName: string
  status: string
  verificationStatus: string
  conciseRationale: string | null
  correlationId: string
  createdAt: string
  completedAt: string | null
}

export interface IntelligenceSignalSummary {
  id: string
  signalType: string
  domain: string
  title: string
  summary: string
  severity: string
  priority: number
  evidence: unknown[]
  sourceRefs: unknown[]
  correlationId: string
  lastDetectedAt: string
}

export interface IntelligenceActionSummary {
  id: string
  actionType: string
  targetSystem: string
  status: string
  riskLevel: string
  conciseRationale: string
  payload: Record<string, unknown>
  payloadDigest: string
  decisionVersion: number
  evidence: unknown[]
  sourceRefs: unknown[]
  correlationId: string
  createdAt: string
}

export interface IntelligenceSourceWarning {
  sensorName: string
  provenanceMode: string
  healthStatus: string
  sourceHealth: unknown[]
  sourceGeneratedAt: string | null
  lastObservedAt: string
  correlationId: string
}

export interface IntelligenceExperimentSummary {
  id: string
  name: string
  status: string
  primaryMetric: string
  minimumSampleSize: number
  minimumDurationDays: number
  observedSampleSize: number
  observedDurationDays: number
  analysisState: string
  sampleReady: boolean
  durationReady: boolean
  correlationId: string
}

export interface IntelligenceReviewSummary {
  id: string
  workflowName: string
  reviewDate: string
  status: string
  executiveSummary: string
  priorities: Array<Record<string, unknown>>
  autumnDecisions: Array<Record<string, unknown>>
  correlationId: string
}

export interface IntelligenceAdminSnapshot {
  generatedAt: string
  runs: IntelligenceRunSummary[]
  unresolvedSignals: IntelligenceSignalSummary[]
  awaitingActions: IntelligenceActionSummary[]
  sourceWarnings: IntelligenceSourceWarning[]
  topPriorities: Array<Record<string, unknown>>
  experiments: IntelligenceExperimentSummary[]
  reviews: IntelligenceReviewSummary[]
  delegationEnabled: false
  executionEnabled: false
}

export interface SyntheticTriggerInput {
  triggerCategory: 'event' | 'daily' | 'weekly' | 'manual'
  eventType?: string
  sourceEventId?: string
  workflowName?: 'conversion_review' | 'daily_business_health' | 'weekly_operating_review'
  businessKey: string
  fixtureMode: 'synthetic'
}

export async function getIntelligenceOwnerSession(): Promise<IntelligenceOwnerSession | null> {
  const configuredSubject = process.env.INTELLIGENCE_OS_AUTUMN_SUBJECT_ID?.trim()
  if (!configuredSubject) return null
  const user = await getCurrentUser()
  const subject = user?.sub?.trim()
  if (!subject || subject !== configuredSubject) return null
  return { subject }
}

export function issueIntelligenceAdminFormToken(purpose: string, subject: string): string {
  const configuration = loadWebAdminConfiguration()
  const expiresAt = String(Date.now() + FORM_TOKEN_TTL_MS)
  const nonce = randomUUID()
  const signature = formSignature({ purpose, subject, expiresAt, nonce }, configuration.sharedSecret)
  return `${expiresAt}.${nonce}.${signature}`
}

export function verifyIntelligenceAdminFormToken(token: string, purpose: string, subject: string): void {
  const configuration = loadWebAdminConfiguration()
  const [expiresAt, nonce, signature, extra] = token.split('.')
  if (extra !== undefined || !expiresAt || !nonce || !signature || !/^[0-9]+$/.test(expiresAt)) {
    throw new IntelligenceAdminRequestError('ADMIN_FORM_TOKEN_INVALID', 'The review form expired or is invalid.')
  }
  if (Number(expiresAt) <= Date.now() || Number(expiresAt) > Date.now() + FORM_TOKEN_TTL_MS + 60_000) {
    throw new IntelligenceAdminRequestError('ADMIN_FORM_TOKEN_EXPIRED', 'The review form expired. Reload and try again.')
  }
  if (!/^[0-9a-f-]{36}$/i.test(nonce)) {
    throw new IntelligenceAdminRequestError('ADMIN_FORM_TOKEN_INVALID', 'The review form expired or is invalid.')
  }
  const expected = formSignature({ purpose, subject, expiresAt, nonce }, configuration.sharedSecret)
  if (!secureHexEqual(signature, expected)) {
    throw new IntelligenceAdminRequestError('ADMIN_FORM_TOKEN_INVALID', 'The review form expired or is invalid.')
  }
}

export function assertIntelligenceAdminSameOrigin(): void {
  const configuration = loadWebAdminConfiguration()
  const requestHeaders = headers()
  const origin = requestHeaders.get('origin')
  const fetchSite = requestHeaders.get('sec-fetch-site')
  if (!origin || normalizeOrigin(origin) !== configuration.allowedOrigin) {
    throw new IntelligenceAdminRequestError('ADMIN_ORIGIN_REJECTED', 'The review request origin was rejected.')
  }
  if (fetchSite && fetchSite !== 'same-origin') {
    throw new IntelligenceAdminRequestError('ADMIN_ORIGIN_REJECTED', 'The review request origin was rejected.')
  }
}

export async function fetchIntelligenceAdminSnapshot(
  session: IntelligenceOwnerSession,
): Promise<IntelligenceAdminSnapshot> {
  const response = await adminRuntimeRequest<unknown>(
    '/api/admin/snapshot',
    'GET',
    null,
    session.subject,
  )
  return parseIntelligenceAdminSnapshotResponse(response)
}

function parseIntelligenceAdminSnapshotResponse(value: unknown): IntelligenceAdminSnapshot {
  if (!isRecord(value) || value.ok !== true || !isRecord(value.snapshot)) {
    throw invalidAdminRuntimeResponse()
  }
  const snapshot = value.snapshot
  for (const field of [
    'runs',
    'unresolvedSignals',
    'awaitingActions',
    'sourceWarnings',
    'topPriorities',
    'experiments',
    'reviews',
  ]) {
    if (!Array.isArray(snapshot[field])) throw invalidAdminRuntimeResponse()
  }
  if (
    typeof snapshot.generatedAt !== 'string'
    || !Number.isFinite(Date.parse(snapshot.generatedAt))
    || snapshot.delegationEnabled !== false
    || snapshot.executionEnabled !== false
  ) {
    throw invalidAdminRuntimeResponse()
  }
  return snapshot as unknown as IntelligenceAdminSnapshot
}

function invalidAdminRuntimeResponse(): IntelligenceAdminRequestError {
  return new IntelligenceAdminRequestError(
    'ADMIN_RUNTIME_RESPONSE_INVALID',
    'The protected staging control plane returned an invalid response.',
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export async function startSyntheticIntelligenceWorkflow(
  session: IntelligenceOwnerSession,
  input: SyntheticTriggerInput,
): Promise<{ workflowName: string; correlationId: string; status: string }> {
  return adminRuntimeRequest('/api/admin/triggers', 'POST', input, session.subject)
}

export async function decideIntelligenceAction(
  session: IntelligenceOwnerSession,
  actionId: string,
  input: {
    decision: 'approved' | 'rejected'
    expectedVersion: number
    expectedPayloadDigest: string
    reason: string
  },
): Promise<{ ok: true; result: { status: string; executionStarted: false } }> {
  if (!isUuid(actionId)) {
    throw new IntelligenceAdminRequestError('ADMIN_ACTION_ID_INVALID', 'The selected action is invalid.')
  }
  return adminRuntimeRequest(`/api/admin/actions/${actionId}/decision`, 'POST', input, session.subject)
}

export function intelligenceAdminErrorMessage(error: unknown): string {
  if (error instanceof IntelligenceAdminRequestError) return error.publicMessage
  return 'The protected staging control plane is unavailable.'
}

async function adminRuntimeRequest<T>(
  pathname: string,
  method: 'GET' | 'POST',
  body: Record<string, unknown> | SyntheticTriggerInput | null,
  subject: string,
): Promise<T> {
  const configuration = loadWebAdminConfiguration()
  if (subject !== configuration.autumnSubjectId) {
    throw new IntelligenceAdminRequestError('ADMIN_SUBJECT_REJECTED', 'This account is not authorized.')
  }
  const bodyText = body === null ? '' : JSON.stringify(body)
  const timestamp = new Date().toISOString()
  const nonce = randomUUID()
  const bodyDigest = sha256(bodyText)
  const canonical = [
    ADMIN_REQUEST_VERSION,
    method,
    pathname,
    subject,
    timestamp,
    nonce,
    configuration.allowedOrigin,
    bodyDigest,
  ].join('\n')
  const signature = createHmac('sha256', configuration.sharedSecret).update(canonical).digest('hex')
  let response: Response
  try {
    response = await fetch(`${configuration.runtimeOrigin}${pathname}`, {
      method,
      headers: {
        accept: 'application/json',
        ...(body === null ? {} : { 'content-type': 'application/json' }),
        'x-intelligence-subject': subject,
        'x-intelligence-timestamp': timestamp,
        'x-intelligence-nonce': nonce,
        'x-intelligence-origin': configuration.allowedOrigin,
        'x-intelligence-body-sha256': bodyDigest,
        'x-intelligence-signature': signature,
        ...(configuration.protectionBypassSecret
          ? { 'x-vercel-protection-bypass': configuration.protectionBypassSecret }
          : {}),
      },
      body: body === null ? undefined : bodyText,
      cache: 'no-store',
      // Never forward service credentials through a platform sign-in redirect.
      redirect: 'error',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    throw new IntelligenceAdminRequestError(
      'ADMIN_RUNTIME_UNAVAILABLE',
      'The protected staging control plane is unavailable.',
    )
  }
  const payload = await safeJson(response)
  if (!response.ok) {
    const code = errorCode(payload) ?? `ADMIN_RUNTIME_HTTP_${response.status}`
    const message = response.status === 401
      ? 'The protected control plane rejected authentication.'
      : response.status === 403
        ? 'This stable account subject is not authorized.'
        : response.status === 409
          ? 'This request was already used or the reviewed record changed. Reload and try again.'
          : 'The protected staging control plane is unavailable.'
    throw new IntelligenceAdminRequestError(code, message)
  }
  return payload as T
}

function loadWebAdminConfiguration(): {
  sharedSecret: string
  autumnSubjectId: string
  allowedOrigin: string
  runtimeOrigin: string
  protectionBypassSecret: string | null
} {
  if (process.env.VERCEL_ENV?.trim().toLowerCase() === 'production') {
    throw new IntelligenceAdminRequestError('ADMIN_PRODUCTION_DISABLED', 'Intelligence OS controls are disabled in Production.')
  }
  if (process.env.INTELLIGENCE_OS_ADMIN_ENABLED?.trim().toLowerCase() !== 'true') {
    throw new IntelligenceAdminRequestError('ADMIN_STAGING_DISABLED', 'Intelligence OS controls are not enabled for this staging deployment.')
  }
  const sharedSecret = requiredEnvironment('INTELLIGENCE_OS_ADMIN_SHARED_SECRET')
  if (sharedSecret.length < 32) {
    throw new IntelligenceAdminRequestError('ADMIN_CONFIGURATION_INVALID', 'The protected staging control plane is unavailable.')
  }
  const autumnSubjectId = requiredEnvironment('INTELLIGENCE_OS_AUTUMN_SUBJECT_ID')
  const allowedOrigin = normalizeOrigin(requiredEnvironment('INTELLIGENCE_OS_ADMIN_ALLOWED_ORIGIN'))
  const runtimeOrigin = normalizeOrigin(requiredEnvironment('INTELLIGENCE_OS_AGENT_RUNTIME_URL'))
  const protectionBypassSecret = process.env.INTELLIGENCE_OS_AGENT_RUNTIME_BYPASS_SECRET?.trim() || null
  if (protectionBypassSecret && (
    !runtimeOrigin.startsWith('https://') || !new URL(runtimeOrigin).hostname.endsWith('.vercel.app')
  )) {
    throw new IntelligenceAdminRequestError('ADMIN_CONFIGURATION_INVALID', 'The protected staging control plane is unavailable.')
  }
  return { sharedSecret, autumnSubjectId, allowedOrigin, runtimeOrigin, protectionBypassSecret }
}

function formSignature(
  input: { purpose: string; subject: string; expiresAt: string; nonce: string },
  secret: string,
): string {
  if (!input.purpose.trim() || input.purpose.length > 200) {
    throw new IntelligenceAdminRequestError('ADMIN_FORM_PURPOSE_INVALID', 'The review form is invalid.')
  }
  return createHmac('sha256', secret).update([
    ADMIN_FORM_VERSION,
    input.purpose,
    input.subject,
    input.expiresAt,
    input.nonce,
  ].join('\n')).digest('hex')
}

function normalizeOrigin(value: string): string {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new IntelligenceAdminRequestError('ADMIN_CONFIGURATION_INVALID', 'The protected staging control plane is unavailable.')
  }
  if (
    !['https:', 'http:'].includes(parsed.protocol)
    || parsed.username
    || parsed.password
    || parsed.pathname !== '/'
    || parsed.search
    || parsed.hash
    || (parsed.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname))
  ) {
    throw new IntelligenceAdminRequestError('ADMIN_CONFIGURATION_INVALID', 'The protected staging control plane is unavailable.')
  }
  return parsed.origin.toLowerCase()
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new IntelligenceAdminRequestError('ADMIN_CONFIGURATION_MISSING', 'The protected staging control plane is unavailable.')
  }
  return value
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    throw new IntelligenceAdminRequestError('ADMIN_RUNTIME_RESPONSE_INVALID', 'The protected staging control plane is unavailable.')
  }
}

function errorCode(value: unknown): string | null {
  if (!value || typeof value !== 'object' || !('error' in value)) return null
  const error = (value as { error?: unknown }).error
  if (!error || typeof error !== 'object' || !('code' in error)) return null
  return String((error as { code: unknown }).code)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function secureHexEqual(left: string, right: string): boolean {
  if (!/^[0-9a-f]{64}$/i.test(left) || !/^[0-9a-f]{64}$/i.test(right)) return false
  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'))
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export class IntelligenceAdminRequestError extends Error {
  constructor(readonly code: string, readonly publicMessage: string) {
    super(publicMessage)
    this.name = 'IntelligenceAdminRequestError'
  }
}
