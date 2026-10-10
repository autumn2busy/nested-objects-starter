import { createHash, createHmac, randomUUID } from 'crypto'

const CONTRACT_VERSION = 'free_journey_event_v1'
const REQUEST_NAMESPACE = 'nested-objects-free-journey-v1'
const ENDPOINT_PATH = '/api/operations/free-journey'
const TIMEOUT_MS = 10_000
const MAX_RECEIPT_BYTES = 16_384
const identifierPattern = /^[A-Za-z0-9_-]{1,160}$/

export const FREE_JOURNEY_OPERATION_HEADERS = {
  subject: 'x-free-journey-subject',
  timestamp: 'x-free-journey-timestamp',
  nonce: 'x-free-journey-nonce',
  origin: 'x-free-journey-origin',
  bodyDigest: 'x-free-journey-body-sha256',
  signature: 'x-free-journey-signature',
} as const

export type FreeJourneySourceEventKind =
  | 'signup'
  | 'profile_saved'
  | 'income_scenario_completed'
  | 'day_30'

export interface FreeJourneySourceEventInput {
  kind: FreeJourneySourceEventKind
  occurredAt: unknown
  outsetaPersonUid: unknown
  subscriptionUid: unknown
}

export interface FreeJourneyProducerResult {
  status: 'disabled' | 'delivered' | 'withheld' | 'failed'
  code: string
  recoveryRequired: boolean
  automaticRetry: false
  httpStatus: number | null
  evaluationId: string | null
}

interface ProducerConfiguration {
  endpoint: URL
  subject: string
  origin: string
  sharedSecret: string
}

interface ProducerDependencies {
  environment?: Record<string, string | undefined>
  fetch?: typeof fetch
  now?: () => string
  nonce?: () => string
}

/**
 * Delivers one deterministic source event to the server-side Runtime boundary.
 * The producer is disabled unless every explicit setting is present. It never
 * retries because a missing response does not prove the Runtime failed before
 * or after a durable claim.
 */
export async function emitFreeJourneySourceEvent(
  input: FreeJourneySourceEventInput,
  dependencies: ProducerDependencies = {},
): Promise<FreeJourneyProducerResult> {
  const environment = dependencies.environment ?? process.env
  if (environment.FREE_JOURNEY_PRODUCER_ENABLED !== 'true') {
    return result('disabled', 'producer_disabled')
  }

  const configuration = loadConfiguration(environment)
  if (!configuration) return result('withheld', 'producer_configuration_invalid')

  const sourceEvent = buildFreeJourneySourceEvent(input)
  if (!sourceEvent) return result('withheld', 'source_event_invalid')

  const requestedAt = dependencies.now?.() ?? new Date().toISOString()
  if (!validTimestamp(requestedAt)) return result('withheld', 'request_timestamp_invalid')
  const nonce = dependencies.nonce?.() ?? randomUUID()
  if (!/^[0-9a-f-]{36}$/i.test(nonce)) return result('withheld', 'request_nonce_invalid')

  const bodyText = JSON.stringify({ sourceEvent })
  const bodyDigest = sha256(bodyText)
  const canonical = [
    REQUEST_NAMESPACE,
    'POST',
    ENDPOINT_PATH,
    configuration.subject,
    requestedAt,
    nonce,
    configuration.origin,
    bodyDigest,
  ].join('\n')
  const signature = createHmac('sha256', configuration.sharedSecret).update(canonical).digest('hex')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await (dependencies.fetch ?? fetch)(configuration.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [FREE_JOURNEY_OPERATION_HEADERS.subject]: configuration.subject,
        [FREE_JOURNEY_OPERATION_HEADERS.timestamp]: requestedAt,
        [FREE_JOURNEY_OPERATION_HEADERS.nonce]: nonce,
        [FREE_JOURNEY_OPERATION_HEADERS.origin]: configuration.origin,
        [FREE_JOURNEY_OPERATION_HEADERS.bodyDigest]: bodyDigest,
        [FREE_JOURNEY_OPERATION_HEADERS.signature]: signature,
      },
      body: bodyText,
      signal: controller.signal,
      redirect: 'error',
      cache: 'no-store',
    })
    if (!response.ok) {
      return result('failed', 'runtime_request_failed', response.status)
    }
    const receiptText = await response.text()
    if (receiptText.length > MAX_RECEIPT_BYTES) {
      return result('failed', 'runtime_receipt_invalid', response.status)
    }
    const receipt = parseReceipt(receiptText, response.headers.get('x-free-journey-evaluation-id'))
    if (!receipt) return result('failed', 'runtime_receipt_invalid', response.status)
    if (receipt.recoveryRequired) {
      return withEvaluationId(result('failed', 'runtime_recovery_required', response.status), receipt.evaluationId)
    }
    if (receipt.status === 'withheld') {
      return withEvaluationId(result('withheld', 'runtime_evaluation_withheld', response.status), receipt.evaluationId)
    }
    return {
      ...result('delivered', 'runtime_request_accepted', response.status),
      evaluationId: receipt.evaluationId,
    }
  } catch {
    return result('failed', 'runtime_request_uncertain')
  } finally {
    clearTimeout(timer)
  }
}

function parseReceipt(value: string, headerEvaluationId: string | null) {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
  const receipt = parsed as Record<string, unknown>
  if (receipt.ok !== true
    || typeof receipt.status !== 'string'
    || typeof receipt.recoveryRequired !== 'boolean'
    || typeof receipt.evaluationId !== 'string'
    || !/^[0-9a-f]{64}$/.test(receipt.evaluationId)
    || receipt.evaluationId !== headerEvaluationId) return null
  return {
    status: receipt.status,
    recoveryRequired: receipt.recoveryRequired,
    evaluationId: receipt.evaluationId,
  }
}

export function buildFreeJourneySourceEvent(input: FreeJourneySourceEventInput) {
  const outsetaPersonUid = identifier(input.outsetaPersonUid)
  const subscriptionUid = identifier(input.subscriptionUid)
  const occurredAt = typeof input.occurredAt === 'string' && validTimestamp(input.occurredAt)
    ? new Date(input.occurredAt).toISOString()
    : null
  if (!outsetaPersonUid || !subscriptionUid || !occurredAt) return null

  const digest = sha256(JSON.stringify([
    CONTRACT_VERSION,
    input.kind,
    outsetaPersonUid,
    subscriptionUid,
    occurredAt,
  ]))
  return {
    contractVersion: CONTRACT_VERSION,
    kind: input.kind,
    idempotencyKey: `free-journey:${input.kind}:${digest}`,
    occurredAt,
    outsetaPersonUid,
    subscriptionUid,
  }
}

function loadConfiguration(environment: Record<string, string | undefined>): ProducerConfiguration | null {
  const subject = identifier(environment.FREE_JOURNEY_OPERATION_PRODUCER_SUBJECT)
  const sharedSecret = environment.FREE_JOURNEY_OPERATION_SHARED_SECRET?.trim() ?? ''
  if (!subject || sharedSecret.length < 32) return null

  let endpoint: URL
  let origin: URL
  try {
    endpoint = new URL(environment.FREE_JOURNEY_OPERATION_ENDPOINT_URL ?? '')
    origin = new URL(environment.FREE_JOURNEY_OPERATION_PRODUCER_ORIGIN ?? '')
  } catch {
    return null
  }
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.port
    || endpoint.pathname !== ENDPOINT_PATH || endpoint.search || endpoint.hash) return null
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.port
    || (origin.pathname !== '/' && origin.pathname !== '') || origin.search || origin.hash) return null

  return { endpoint, subject, origin: origin.origin.toLowerCase(), sharedSecret }
}

function identifier(value: unknown) {
  return typeof value === 'string' && identifierPattern.test(value.trim()) ? value.trim() : null
}

function validTimestamp(value: string) {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) && /(?:Z|[+-]\d{2}:\d{2})$/.test(value)
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function result(
  status: FreeJourneyProducerResult['status'],
  code: string,
  httpStatus: number | null = null,
): FreeJourneyProducerResult {
  return {
    status,
    code,
    recoveryRequired: status === 'failed',
    automaticRetry: false,
    httpStatus,
    evaluationId: null,
  }
}

function withEvaluationId(value: FreeJourneyProducerResult, evaluationId: string): FreeJourneyProducerResult {
  return { ...value, evaluationId }
}
