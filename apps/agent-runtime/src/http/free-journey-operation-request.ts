import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

import type { RuntimeEnvironmentVariables } from '../env.js'
import { runFreeJourneyOperation } from '../operations/free-journey-operation.js'
import {
  FreeJourneyOperationalSourceCollector,
  type FreeJourneyOperationalSourcePolicy,
  type FreeJourneyOperationalSourceTransport,
} from '../sensors/free-journey-operational-source.js'
import {
  OnboardingReceiptReadOnlyClient,
  type OnboardingReceiptReadTransport,
} from '../sensors/onboarding-receipt-reader.js'

export const FREE_JOURNEY_REQUEST_HEADERS = {
  subject: 'x-free-journey-subject',
  timestamp: 'x-free-journey-timestamp',
  nonce: 'x-free-journey-nonce',
  origin: 'x-free-journey-origin',
  bodyDigest: 'x-free-journey-body-sha256',
  signature: 'x-free-journey-signature',
} as const

const BODY_LIMIT_BYTES = 8 * 1024
const FREE_JOURNEY_EVENT_VERSION = 'free_journey_event_v1'
const REQUEST_NAMESPACE = 'nested-objects-free-journey-v1'
const ACCOUNT_TIME_ZONE = 'America/New_York'
const MAX_EVIDENCE_AGE_MS = 3 * 86_400_000
const ref = z.string().regex(/^[A-Za-z0-9_-]{1,160}$/)
const timestamp = z.string().datetime({ offset: true })
const sourceEventSchema = z.object({
  contractVersion: z.literal(FREE_JOURNEY_EVENT_VERSION),
  kind: z.enum(['signup', 'profile_saved', 'income_scenario_completed', 'day_30']),
  idempotencyKey: z.string().min(1).max(240),
  occurredAt: timestamp,
  outsetaPersonUid: ref,
  subscriptionUid: ref,
}).strict()
const requestSchema = z.object({ sourceEvent: sourceEventSchema }).strict()
const exclusionPolicySchema = z.object({
  internalDomains: z.array(z.string().regex(/^[a-z0-9.-]+$/)).max(50),
  approvedInternalMemberEmails: z.array(z.string().email().max(320)).max(50),
  coldTagPatterns: z.array(z.string().trim().min(1).max(100)).max(50),
  wixTagPatterns: z.array(z.string().trim().min(1).max(100)).max(50),
  testPatterns: z.array(z.string().trim().min(1).max(100)).min(1).max(50),
  coworkerContactIds: z.array(z.string().regex(/^\d+$/)).max(100),
  demoContactIds: z.array(z.string().regex(/^\d+$/)).max(100),
  hiringFirmContactIds: z.array(z.string().regex(/^\d+$/)).max(100),
}).strict()

export type FreeJourneyOperationRequest = z.infer<typeof requestSchema>

export interface FreeJourneyOperationRuntimeConfiguration {
  enabled: true
  previewOnly: true
  liveReadsEnabled: true
  sharedSecret: string
  producerSubject: string
  allowedOrigin: string
  projectRef: string
  supabaseServiceRoleKey: string
  outsetaApiKey: string
  outsetaApiSecret: string
  activeCampaignApiKey: string
  activeCampaignApiUrl: string
  sourcePolicy: FreeJourneyOperationalSourcePolicy
}

export interface FreeJourneyOperationDependencies {
  now?: () => string
  mode?: 'fixture' | 'approved_live'
  onboardingTransport?: OnboardingReceiptReadTransport
  sourceTransport?: FreeJourneyOperationalSourceTransport
  activeCampaignFetch?: typeof fetch
}

export function createFreeJourneyOperationHeaders(input: {
  method: string
  pathname: string
  bodyText: string
  producerSubject: string
  origin: string
  timestamp: string
  nonce: string
  sharedSecret: string
}): Record<string, string> {
  assertSecret(input.sharedSecret)
  const bodyDigest = sha256(input.bodyText)
  return {
    [FREE_JOURNEY_REQUEST_HEADERS.subject]: input.producerSubject,
    [FREE_JOURNEY_REQUEST_HEADERS.timestamp]: input.timestamp,
    [FREE_JOURNEY_REQUEST_HEADERS.nonce]: input.nonce,
    [FREE_JOURNEY_REQUEST_HEADERS.origin]: input.origin,
    [FREE_JOURNEY_REQUEST_HEADERS.bodyDigest]: bodyDigest,
    [FREE_JOURNEY_REQUEST_HEADERS.signature]: sign({ ...input, bodyDigest }),
  }
}

export function verifyFreeJourneyOperationRequest(
  request: Request,
  bodyText: string,
  configuration: Pick<FreeJourneyOperationRuntimeConfiguration, 'sharedSecret' | 'producerSubject' | 'allowedOrigin'>,
  now = new Date(),
) {
  assertSecret(configuration.sharedSecret)
  const subject = requiredHeader(request.headers, FREE_JOURNEY_REQUEST_HEADERS.subject)
  const requestTimestamp = requiredHeader(request.headers, FREE_JOURNEY_REQUEST_HEADERS.timestamp)
  const nonce = requiredHeader(request.headers, FREE_JOURNEY_REQUEST_HEADERS.nonce)
  const origin = requiredHeader(request.headers, FREE_JOURNEY_REQUEST_HEADERS.origin)
  const bodyDigest = requiredHeader(request.headers, FREE_JOURNEY_REQUEST_HEADERS.bodyDigest)
  const signature = requiredHeader(request.headers, FREE_JOURNEY_REQUEST_HEADERS.signature)
  if (subject !== configuration.producerSubject) throw new FreeJourneyOperationAuthorizationError()
  let signedOrigin: string
  try { signedOrigin = normalizeOrigin(origin) } catch { throw new FreeJourneyOperationAuthorizationError() }
  if (signedOrigin !== configuration.allowedOrigin) throw new FreeJourneyOperationAuthorizationError()
  if (!/^[0-9a-f-]{36}$/i.test(nonce)) throw new FreeJourneyOperationAuthenticationError()
  const requestedAt = Date.parse(requestTimestamp)
  if (!Number.isFinite(requestedAt) || Math.abs(now.getTime() - requestedAt) > 5 * 60_000) {
    throw new FreeJourneyOperationAuthenticationError()
  }
  const expectedDigest = sha256(bodyText)
  if (!secureEqual(bodyDigest, expectedDigest)) throw new FreeJourneyOperationAuthenticationError()
  const expected = sign({
    method: request.method,
    pathname: new URL(request.url).pathname,
    bodyText,
    bodyDigest,
    producerSubject: subject,
    origin,
    timestamp: requestTimestamp,
    nonce,
    sharedSecret: configuration.sharedSecret,
  })
  if (!secureEqual(signature, expected)) throw new FreeJourneyOperationAuthenticationError()
  return { subject, timestamp: requestTimestamp, nonceDigest: sha256(nonce), bodyDigest }
}

export async function evaluateSignedFreeJourneyOperationRequest(
  request: Request,
  environment: RuntimeEnvironmentVariables = process.env,
  dependencies: FreeJourneyOperationDependencies = {},
) {
  const configuration = loadFreeJourneyOperationRuntimeConfiguration(environment)
  const { bodyText, value } = await readRequestJson(request)
  const now = dependencies.now?.() ?? new Date().toISOString()
  if (!timestamp.safeParse(now).success) throw new FreeJourneyOperationConfigurationError()
  const auth = verifyFreeJourneyOperationRequest(request, bodyText, configuration, new Date(now))
  const parsed = requestSchema.safeParse(value)
  if (!parsed.success || parsed.data.sourceEvent.idempotencyKey !== eventIdempotencyKey(parsed.data.sourceEvent)) {
    throw new FreeJourneyOperationValidationError()
  }
  const sourceEvent = parsed.data.sourceEvent
  const mode = dependencies.mode ?? 'approved_live'
  const onboarding = new OnboardingReceiptReadOnlyClient({
    policy: {
      reviewRef: configuration.sourcePolicy.reviewRef,
      reviewedAt: configuration.sourcePolicy.reviewedAt,
      expiresAt: configuration.sourcePolicy.expiresAt,
      projectRef: configuration.projectRef,
      outsetaPersonUid: sourceEvent.outsetaPersonUid,
      subscriptionUid: sourceEvent.subscriptionUid,
      timeoutMs: configuration.sourcePolicy.timeoutMs,
    },
    mode,
    ...(mode === 'fixture'
      ? { transport: requiredDependency(dependencies.onboardingTransport) }
      : {
        liveReadsEnabled: configuration.liveReadsEnabled,
        serviceRoleKey: configuration.supabaseServiceRoleKey,
      }),
    now: () => now,
  })
  const storedSources = await onboarding.collect()
  const collector = new FreeJourneyOperationalSourceCollector({
    policy: configuration.sourcePolicy,
    mode,
    ...(mode === 'fixture'
      ? { transport: requiredDependency(dependencies.sourceTransport) }
      : {
        liveReadsEnabled: configuration.liveReadsEnabled,
        credentials: {
          outsetaApiKey: configuration.outsetaApiKey,
          outsetaApiSecret: configuration.outsetaApiSecret,
          activeCampaignApiKey: configuration.activeCampaignApiKey,
        },
      }),
    now: () => now,
  })
  const external = await collector.collect({
    storedSources,
    outsetaPersonUid: sourceEvent.outsetaPersonUid,
    subscriptionUid: sourceEvent.subscriptionUid,
  })
  const evaluationId = sha256(`${auth.bodyDigest}:${auth.nonceDigest}`)
  if (external.status === 'withheld') {
    return {
      ok: true,
      evaluationId,
      status: 'withheld' as const,
      sourceStatus: 'withheld' as const,
      desiredStage: null,
      attemptedWrites: 0,
      confirmedWrites: 0,
      recoveryRequired: false,
      automaticRetry: false as const,
      reasons: [external.reason],
      steps: [],
      previewOnly: true as const,
      durableReplayReceipt: false as const,
    }
  }
  const result = await runFreeJourneyOperation({
    mode: 'preview',
    executionPhase: 'operational',
    sourceEvent,
    now,
    maxEvidenceAgeMs: MAX_EVIDENCE_AGE_MS,
    evidenceExpiresAt: futureLocalDate(now, ACCOUNT_TIME_ZONE, 2),
    outsetaPersonUid: sourceEvent.outsetaPersonUid,
    subscriptionUid: sourceEvent.subscriptionUid,
    storedSources,
    external: external.external,
    activeCampaign: {
      apiUrl: configuration.activeCampaignApiUrl,
      apiKey: configuration.activeCampaignApiKey,
      consentListId: '34',
      consentFormId: '90',
      stageFieldId: '193',
      expiryFieldId: '194',
      automationId: '527',
      expectedAutomationStatus: 'active',
      accountTimeZone: ACCOUNT_TIME_ZONE,
      timeoutMs: configuration.sourcePolicy.timeoutMs,
    },
  }, dependencies.activeCampaignFetch)
  return {
    ok: true,
    evaluationId,
    ...result,
    previewOnly: true as const,
    durableReplayReceipt: false as const,
  }
}

export function loadFreeJourneyOperationRuntimeConfiguration(
  environment: RuntimeEnvironmentVariables = process.env,
): FreeJourneyOperationRuntimeConfiguration {
  if (environment.FREE_JOURNEY_OPERATION_API_ENABLED !== 'true'
    || environment.FREE_JOURNEY_OPERATION_PREVIEW_ONLY !== 'true'
    || environment.FREE_JOURNEY_LIVE_READS_ENABLED !== 'true') {
    throw new FreeJourneyOperationConfigurationError()
  }
  const sharedSecret = required(environment.FREE_JOURNEY_OPERATION_SHARED_SECRET)
  assertSecret(sharedSecret)
  const producerSubject = required(environment.FREE_JOURNEY_OPERATION_PRODUCER_SUBJECT)
  if (!ref.safeParse(producerSubject).success) throw new FreeJourneyOperationConfigurationError()
  const allowedOrigin = normalizeOrigin(required(environment.FREE_JOURNEY_OPERATION_ALLOWED_ORIGIN))
  const supabase = originOnly(required(environment.SUPABASE_URL))
  const match = /^([a-z]{20})\.supabase\.co$/.exec(supabase.hostname)
  if (!match?.[1]) throw new FreeJourneyOperationConfigurationError()
  const activeCampaign = originOnly(required(environment.AC_API_URL))
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.api-us1\.com$/.test(activeCampaign.hostname)) {
    throw new FreeJourneyOperationConfigurationError()
  }
  const exclusion = parseExclusionPolicy(required(environment.FREE_JOURNEY_EXCLUSION_POLICY_JSON))
  const supabaseServiceRoleKey = required(environment.SUPABASE_SERVICE_ROLE_KEY)
  const outsetaApiKey = required(environment.OUTSETA_API_KEY)
  const outsetaApiSecret = required(environment.OUTSETA_API_SECRET)
  const activeCampaignApiKey = required(environment.AC_API_KEY)
  if (!isServiceRoleKey(supabaseServiceRoleKey)
    || outsetaApiKey.length < 10 || outsetaApiSecret.length < 10 || activeCampaignApiKey.length < 20) {
    throw new FreeJourneyOperationConfigurationError()
  }
  const sourcePolicy: FreeJourneyOperationalSourcePolicy = {
    reviewRef: required(environment.FREE_JOURNEY_SOURCE_REVIEW_REF),
    reviewedAt: required(environment.FREE_JOURNEY_SOURCE_REVIEWED_AT),
    expiresAt: required(environment.FREE_JOURNEY_SOURCE_REVIEW_EXPIRES_AT),
    outsetaHostname: required(environment.OUTSETA_HOSTNAME).toLowerCase(),
    activeCampaignHostname: activeCampaign.hostname,
    pageSize: 100,
    maxPages: 5,
    maxRequests: 100,
    timeoutMs: 10_000,
    consentAsset: {
      purpose: 'free_onboarding_and_conversion_email',
      listId: '34',
      formId: '90',
      doubleOptInVerified: true,
    },
    exclusionPolicy: exclusion,
  }
  // Constructor validation is intentionally reused so malformed review windows, hosts or policy fail before reads.
  try {
    new FreeJourneyOperationalSourceCollector({
      policy: sourcePolicy,
      mode: 'fixture',
      transport: async () => ({ status: 500, body: null }),
      now: () => sourcePolicy.reviewedAt,
    })
  } catch { throw new FreeJourneyOperationConfigurationError() }
  return {
    enabled: true,
    previewOnly: true,
    liveReadsEnabled: true,
    sharedSecret,
    producerSubject,
    allowedOrigin,
    projectRef: match[1],
    supabaseServiceRoleKey,
    outsetaApiKey,
    outsetaApiSecret,
    activeCampaignApiKey,
    activeCampaignApiUrl: activeCampaign.origin,
    sourcePolicy,
  }
}

function parseExclusionPolicy(value: string): z.infer<typeof exclusionPolicySchema> {
  try {
    const parsed = exclusionPolicySchema.parse(JSON.parse(value))
    return {
      ...parsed,
      internalDomains: parsed.internalDomains.map(item => item.toLowerCase()),
      approvedInternalMemberEmails: parsed.approvedInternalMemberEmails.map(item => item.toLowerCase()),
    }
  } catch { throw new FreeJourneyOperationConfigurationError() }
}

async function readRequestJson(request: Request): Promise<{ bodyText: string; value: unknown }> {
  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    throw new FreeJourneyOperationValidationError()
  }
  const declared = Number.parseInt(request.headers.get('content-length') ?? '', 10)
  if (Number.isFinite(declared) && declared > BODY_LIMIT_BYTES) throw new FreeJourneyOperationPayloadTooLargeError()
  const bodyText = await request.text()
  if (new TextEncoder().encode(bodyText).byteLength > BODY_LIMIT_BYTES) throw new FreeJourneyOperationPayloadTooLargeError()
  if (!bodyText.trim()) throw new FreeJourneyOperationValidationError()
  try { return { bodyText, value: JSON.parse(bodyText) as unknown } } catch { throw new FreeJourneyOperationValidationError() }
}

function eventIdempotencyKey(event: z.infer<typeof sourceEventSchema>) {
  const digest = sha256(JSON.stringify([
    event.contractVersion, event.kind, event.outsetaPersonUid, event.subscriptionUid, event.occurredAt,
  ]))
  return `free-journey:${event.kind}:${digest}`
}

function sign(input: {
  method: string; pathname: string; bodyText: string; bodyDigest: string; producerSubject: string
  origin: string; timestamp: string; nonce: string; sharedSecret: string
}) {
  const canonical = [
    REQUEST_NAMESPACE,
    input.method.toUpperCase(),
    normalizePath(input.pathname),
    input.producerSubject,
    input.timestamp,
    input.nonce,
    normalizeOrigin(input.origin),
    input.bodyDigest,
  ].join('\n')
  return createHmac('sha256', input.sharedSecret).update(canonical).digest('hex')
}

function futureLocalDate(now: string, timeZone: string, days: number) {
  const value = new Date(Date.parse(now) + days * 86_400_000)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(value)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

function requiredDependency<T>(value: T | undefined): T {
  if (!value) throw new FreeJourneyOperationConfigurationError()
  return value
}

function required(value: string | undefined) {
  const result = value?.trim()
  if (!result) throw new FreeJourneyOperationConfigurationError()
  return result
}

function originOnly(value: string, allowLocalHttp = false) {
  let url: URL
  try { url = new URL(value) } catch { throw new FreeJourneyOperationConfigurationError() }
  const localHttp = allowLocalHttp && url.protocol === 'http:'
    && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if ((!localHttp && url.protocol !== 'https:') || url.username || url.password || url.port
    || (url.pathname !== '/' && url.pathname !== '') || url.search || url.hash) {
    throw new FreeJourneyOperationConfigurationError()
  }
  return url
}

function normalizeOrigin(value: string) {
  return originOnly(value, true).origin.toLowerCase()
}

function normalizePath(value: string) {
  if (!value.startsWith('/') || value.includes('?') || value.includes('#')) throw new FreeJourneyOperationAuthenticationError()
  return value
}

function requiredHeader(headers: Headers, name: string) {
  const value = headers.get(name)?.trim()
  if (!value) throw new FreeJourneyOperationAuthenticationError()
  return value
}

function assertSecret(value: string) {
  if (value.trim().length < 32) throw new FreeJourneyOperationConfigurationError()
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function secureEqual(left: string, right: string) {
  if (!/^[0-9a-f]{64}$/i.test(left) || !/^[0-9a-f]{64}$/i.test(right)) return false
  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'))
}

function isServiceRoleKey(value: string) {
  if (/^sb_secret_[A-Za-z0-9_-]+$/.test(value)) return true
  try {
    const parts = value.split('.')
    return parts.length === 3 && JSON.parse(Buffer.from(parts[1]!, 'base64url').toString()).role === 'service_role'
  } catch { return false }
}

export class FreeJourneyOperationAuthenticationError extends Error {
  readonly code = 'FREE_JOURNEY_AUTHENTICATION_FAILED'
}

export class FreeJourneyOperationAuthorizationError extends Error {
  readonly code = 'FREE_JOURNEY_AUTHORIZATION_FAILED'
}

export class FreeJourneyOperationValidationError extends Error {
  readonly code = 'FREE_JOURNEY_REQUEST_INVALID'
}

export class FreeJourneyOperationPayloadTooLargeError extends Error {
  readonly code = 'FREE_JOURNEY_REQUEST_TOO_LARGE'
  readonly maximumBytes = BODY_LIMIT_BYTES
}

export class FreeJourneyOperationConfigurationError extends Error {
  readonly code = 'FREE_JOURNEY_CONFIGURATION_FAILED'
}
