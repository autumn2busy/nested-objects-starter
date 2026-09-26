import { z } from 'zod'

import type { ConversionEventSourceRow } from '../projections/member-projection.js'
import type { FreeOnboardingProfileRow } from './free-onboarding-evidence.js'
import type { MilestoneReadSnapshot } from './income-scenario-evidence.js'

const ref = z.string().regex(/^[A-Za-z0-9_-]{1,160}$/)
const timestamp = z.string().datetime({ offset: true })
const policySchema = z.object({
  reviewRef: ref, reviewedAt: timestamp, expiresAt: timestamp,
  projectRef: z.string().regex(/^[a-z]{20}$/),
  outsetaPersonUid: ref, subscriptionUid: ref,
  timeoutMs: z.number().int().min(1).max(30000),
}).strict()
const text = z.string().max(10000).nullable()
const profileSchema = z.object({
  id: z.string().uuid(), outseta_person_uid: ref,
  headline: text, bio: text, city: text, state: text, experience_level: text,
  primary_services: text, service_areas: z.array(z.string().max(200)).max(100).nullable(),
  updated_at: timestamp,
})
const eventSchema = z.object({
  id: z.string().uuid(), client_event_id: z.string().max(255), event_name: z.string(),
  member_uid: ref, source_page: z.string().max(255), source: z.string().max(100), occurred_at: timestamp,
  event_data: z.object({
    sourcePage: z.string().max(255), source: z.string().max(100), lifecycleCycleId: ref,
    completionContract: z.string().max(20).optional(), consentContract: z.string().max(20).optional(),
    purpose: z.string().max(100).optional(),
  }).strict(),
})
const profileColumns = 'id,outseta_person_uid,headline,bio,city,state,experience_level,primary_services,service_areas,updated_at'
const eventColumns = 'id,client_event_id,event_name,member_uid,source_page,source,occurred_at,event_data'
type Resource = 'profile' | 'income' | 'consent_request'
export type OnboardingReceiptReadPolicy = z.infer<typeof policySchema>
export interface OnboardingReceiptReadRequest {
  method: 'GET'; url: string; headers: Readonly<Record<string, string>>
  signal: AbortSignal; redirect: 'error'; cache: 'no-store'
}
export type OnboardingReceiptReadTransport = (request: OnboardingReceiptReadRequest) => Promise<{
  status: number; body: unknown; contentRange: string | null; preferenceApplied: string | null
}>
export interface OnboardingStoredSources {
  profiles: MilestoneReadSnapshot<FreeOnboardingProfileRow>
  completionEvents: MilestoneReadSnapshot<ConversionEventSourceRow>
  consentRequests: MilestoneReadSnapshot<ConversionEventSourceRow>
  reads: Array<{ resource: Resource; reason: string }>
  reviewRef: string
  mode: 'fixture' | 'approved_live'
  mutationAllowed: false
  attemptedWrites: 0
}

/** One member/cycle, three GETs at most, no environment discovery, persistence or writer call.
 * Exact-count completeness is for the filtered query under the supplied server credential only.
 * It establishes neither membership authority nor consent, activation or marketing eligibility.
 */
export class OnboardingReceiptReadOnlyClient {
  readonly #policy: OnboardingReceiptReadPolicy
  readonly #transport: OnboardingReceiptReadTransport
  readonly #headers: Readonly<Record<string, string>>
  readonly #now: () => string
  readonly #mode: 'fixture' | 'approved_live'
  #used = false

  constructor(config: {
    policy: OnboardingReceiptReadPolicy; mode: 'fixture' | 'approved_live'
    liveReadsEnabled?: boolean; serviceRoleKey?: string
    transport?: OnboardingReceiptReadTransport; now?: () => string
  }) {
    const parsed = policySchema.safeParse(config.policy)
    if (!parsed.success) throw new Error('Invalid onboarding read policy')
    this.#policy = parsed.data
    this.#mode = config.mode
    this.#now = config.now ?? (() => new Date().toISOString())
    if (!['fixture', 'approved_live'].includes(config.mode)) throw new Error('Invalid onboarding reader mode')
    if (config.mode === 'fixture' && (!config.transport || config.serviceRoleKey !== undefined)) {
      throw new Error('Fixture reads require injected transport and no credentials')
    }
    if (config.mode === 'approved_live' && (config.liveReadsEnabled !== true || !isServiceRoleKey(config.serviceRoleKey))) {
      throw new Error('Live onboarding reads require explicit enablement and server credentials')
    }
    const key = config.mode === 'fixture' ? 'fixture-not-a-secret' : config.serviceRoleKey!
    this.#headers = { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json', Prefer: 'count=exact' }
    this.#transport = config.transport ?? boundedFetch
    this.#assertReview()
  }

  async collect(): Promise<OnboardingStoredSources> {
    if (this.#used) throw new Error('Onboarding read budget exhausted')
    this.#used = true
    const profiles = await this.#read('profile', profileSchema)
    const completionEvents = await this.#read('income', eventSchema)
    const consentRequests = await this.#read('consent_request', eventSchema)
    return {
      profiles: profiles.snapshot, completionEvents: completionEvents.snapshot, consentRequests: consentRequests.snapshot,
      reads: [profiles, completionEvents, consentRequests].map(({ resource, reason }) => ({ resource, reason })),
      reviewRef: this.#policy.reviewRef, mode: this.#mode, mutationAllowed: false, attemptedWrites: 0,
    }
  }

  #assertReview(): string {
    const now = this.#now()
    if (!timestamp.safeParse(now).success || Date.parse(now) < Date.parse(this.#policy.reviewedAt)
      || Date.parse(now) >= Date.parse(this.#policy.expiresAt)) throw new Error('Onboarding read review expired or not yet valid')
    return now
  }

  async #read<T extends { id: string }>(resource: Resource, schema: z.ZodType<T>): Promise<{
    resource: Resource; reason: string; snapshot: MilestoneReadSnapshot<T>
  }> {
    let observedAt = ''
    const result = (coverage: 'complete' | 'partial' | 'unknown', reason: string, rows: T[] = []) => ({
      resource, reason, snapshot: { coverage, observedAt, rows },
    })
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.#policy.timeoutMs)
    try {
      observedAt = this.#assertReview()
      const url = new URL(`https://${this.#policy.projectRef}.supabase.co/rest/v1/${resource === 'profile' ? 'profiles' : 'conversion_events'}`)
      url.searchParams.set('select', resource === 'profile' ? profileColumns : eventColumns)
      url.searchParams.set(resource === 'profile' ? 'outseta_person_uid' : 'member_uid', `eq.${this.#policy.outsetaPersonUid}`)
      const eventName = resource === 'income' ? 'income_scenario_completed' : 'lifecycle_email_consent_requested'
      if (resource !== 'profile') {
        url.searchParams.set('event_name', `eq.${eventName}`)
        url.searchParams.set('event_data->>lifecycleCycleId', `eq.${this.#policy.subscriptionUid}`)
      }
      // Two rows expose ambiguity; exact totals expose truncation. Never select an arbitrary winner.
      url.searchParams.set('limit', '2')
      url.searchParams.set('offset', '0')
      url.searchParams.set('order', 'id.asc')
      const response = await this.#transport({ method: 'GET', url: url.toString(), headers: this.#headers,
        signal: controller.signal, redirect: 'error', cache: 'no-store' })
      this.#assertReview()
      if (controller.signal.aborted) return result('unknown', 'read_timeout')
      if (![200, 206].includes(response.status)) return result('unknown', 'source_unavailable')
      const parsed = z.array(schema).max(2).safeParse(response.body)
      if (!parsed.success) return result('unknown', 'source_shape_invalid')
      const rows = parsed.data
      if (new Set(rows.map(row => row.id)).size !== rows.length) return result('unknown', 'duplicate_source_rows')
      for (const row of rows) {
        const item = row as Record<string, unknown>
        if (resource === 'profile' ? item.outseta_person_uid !== this.#policy.outsetaPersonUid
          : item.member_uid !== this.#policy.outsetaPersonUid || item.event_name !== eventName
            || (item.event_data as Record<string, unknown>).lifecycleCycleId !== this.#policy.subscriptionUid) {
          return result('unknown', 'source_binding_mismatch')
        }
      }
      // A short/empty array alone is not evidence of absence. Require exact total and matching range.
      if (!response.preferenceApplied?.split(',').some(value => value.trim() === 'count=exact')) {
        return result('unknown', 'exact_count_unconfirmed')
      }
      const range = /^(\*|0-(\d+))\/(\d+)$/.exec(response.contentRange ?? '')
      if (!range) return result('unknown', 'range_unconfirmed')
      const total = Number(range[3])
      if (!Number.isSafeInteger(total) || total < rows.length
        || (rows.length === 0 ? range[1] !== '*' || total !== 0
          : Number(range[2]) !== rows.length - 1 || range[1] === '*')) return result('unknown', 'range_conflict')
      if (total > rows.length) return result('partial', 'bounded_lookup_truncated')
      return result('complete', 'exact_filtered_lookup', rows)
    } catch {
      // Never expose provider response bodies, URL query identifiers or credential-bearing errors.
      return result('unknown', 'read_unavailable_or_review_invalid')
    } finally {
      clearTimeout(timer)
    }
  }
}

function isServiceRoleKey(value: unknown): value is string {
  if (typeof value !== 'string' || value.length < 20 || /\s/.test(value)) return false
  if (/^sb_secret_[A-Za-z0-9_-]+$/.test(value)) return true
  try {
    const parts = value.split('.')
    return parts.length === 3 && JSON.parse(Buffer.from(parts[1]!, 'base64url').toString()).role === 'service_role'
  } catch { return false }
}

async function boundedFetch(request: OnboardingReceiptReadRequest) {
  const response = await fetch(request.url, request)
  if (![200, 206].includes(response.status)) {
    await response.body?.cancel()
    return { status: response.status, body: null, contentRange: null, preferenceApplied: null }
  }
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Missing onboarding source body')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 200000) throw new Error('Onboarding source body too large')
      chunks.push(value)
    }
  } finally { await reader.cancel() }
  return { status: response.status, body: JSON.parse(Buffer.concat(chunks).toString('utf8')),
    contentRange: response.headers.get('content-range'), preferenceApplied: response.headers.get('preference-applied') }
}
