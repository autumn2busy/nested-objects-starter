import { createHash, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import type { RuntimeEnvironmentVariables } from '../env.js'
import { freeJourneyConsentSourceRowSchema } from '../sensors/free-journey-consent-receipt.js'
import {
  evaluateFreeJourneySourceEvent, loadFreeJourneyOperationRuntimeConfiguration,
  type FreeJourneyOperationDependencies,
} from './free-journey-operation-request.js'

const ref = z.string().regex(/^[A-Za-z0-9_-]{1,160}$/)
const memberScope = z.object({ outsetaPersonUid: ref, subscriptionUid: ref }).strict()
const scopeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('approved_members'), members: z.array(memberScope).min(1).max(24) }).strict(),
  z.object({ kind: z.literal('consented_cohort'), approvalRef: ref }).strict(),
])
const MAX_COHORT = 500
const PAGE_SIZE = 24
const RUN_BUDGET_MS = 240_000
const intentionalWithholds = new Set(['not_current_free_member', 'excluded_audience', 'scoped_doi_unconfirmed'])
const eventColumns = 'id,client_event_id,event_name,member_uid,source_page,source,occurred_at,event_data'

export class FreeJourneyRefreshError extends Error {
  constructor(readonly code: string, readonly httpStatus = 503) { super(code) }
}

export interface FreeJourneyRefreshDependencies extends FreeJourneyOperationDependencies {
  discoveryFetch?: typeof fetch
  evaluate?: typeof evaluateFreeJourneySourceEvent
  clock?: () => number
}

export function createEligibilityRecheckEvent(personUid: string, subscriptionUid: string, now: string) {
  const member = memberScope.parse({ outsetaPersonUid: personUid, subscriptionUid })
  const time = Date.parse(now)
  if (!Number.isFinite(time)) throw new FreeJourneyRefreshError('REFRESH_TIME_INVALID')
  const occurredAt = new Date(Math.floor(time / 3_600_000) * 3_600_000).toISOString()
  const base = { contractVersion: 'free_journey_event_v1' as const, kind: 'eligibility_recheck' as const,
    occurredAt, ...member }
  const digest = hash(JSON.stringify([base.contractVersion, base.kind, personUid, subscriptionUid, occurredAt]))
  return { ...base, idempotencyKey: 'free-journey:eligibility_recheck:' + digest }
}

/** Bounded recurring review of existing consent receipts, not an opt-in/activity producer.
 * A stable <=500-row cohort is covered over <=21 hourly windows only when every page completes.
 * Budget/source failures explicitly report partial coverage; they are not a freshness guarantee.
 * Every selected person/cycle is independently reconciled; page presence is not eligibility.
 * Only aggregate verification results leave this handler. No direct enrollment or send call. */
export async function evaluateScheduledFreeJourneyRefresh(
  request: Request,
  environment: RuntimeEnvironmentVariables = process.env,
  dependencies: FreeJourneyRefreshDependencies = {},
) {
  if (request.method !== 'GET') throw new FreeJourneyRefreshError('REFRESH_METHOD_INVALID', 405)
  const url = new URL(request.url)
  if (url.search) throw new FreeJourneyRefreshError('REFRESH_QUERY_NOT_ALLOWED', 400)
  if (environment.VERCEL_ENV !== 'production' || environment.AGENT_RUNTIME_ENV !== 'production'
    || environment.FREE_JOURNEY_REFRESH_ENABLED !== 'true') throw new FreeJourneyRefreshError('REFRESH_DISABLED')
  const secret = environment.CRON_SECRET?.trim()
  const authorization = request.headers.get('authorization') ?? ''
  if (!secret || secret.length < 32 || !timingSafeEqual(
    createHash('sha256').update(authorization).digest(),
    createHash('sha256').update('Bearer ' + secret).digest(),
  )) throw new FreeJourneyRefreshError('REFRESH_UNAUTHORIZED', 401)

  const configuration = loadFreeJourneyOperationRuntimeConfiguration(environment, 'scheduled')
  let scope: z.infer<typeof scopeSchema>
  try { scope = scopeSchema.parse(JSON.parse(environment.FREE_JOURNEY_REFRESH_SCOPE_JSON ?? '')) }
  catch { throw new FreeJourneyRefreshError('REFRESH_SCOPE_INVALID') }
  if (scope.kind === 'consented_cohort' && scope.approvalRef !== configuration.sourcePolicy.reviewRef) {
    throw new FreeJourneyRefreshError('REFRESH_SCOPE_REVIEW_MISMATCH')
  }
  if (scope.kind === 'approved_members' && new Set(scope.members.map(m => m.outsetaPersonUid + ':' + m.subscriptionUid)).size !== scope.members.length) {
    throw new FreeJourneyRefreshError('REFRESH_SCOPE_AMBIGUOUS')
  }
  const clock = dependencies.clock ?? Date.now
  const now = dependencies.now?.() ?? new Date(clock()).toISOString()
  const time = Date.parse(now)
  if (!Number.isFinite(time) || time < Date.parse(configuration.sourcePolicy.reviewedAt)
    || time >= Date.parse(configuration.sourcePolicy.expiresAt)) throw new FreeJourneyRefreshError('REFRESH_REVIEW_EXPIRED')
  const deadline = clock() + RUN_BUDGET_MS
  const reader = dependencies.discoveryFetch ?? fetch
  const headers = { apikey: configuration.supabaseServiceRoleKey,
    Authorization: 'Bearer ' + configuration.supabaseServiceRoleKey, Prefer: 'count=exact' }
  async function read(url: URL) {
    const remaining = Math.min(10_000, deadline - clock())
    if (remaining <= 0) throw new FreeJourneyRefreshError('REFRESH_BUDGET_EXHAUSTED')
    const response = await reader(url, { method: 'GET', headers, redirect: 'error', cache: 'no-store',
      signal: AbortSignal.timeout(remaining) })
    if (![200, 206].includes(response.status)) throw new FreeJourneyRefreshError('REFRESH_SOURCE_UNAVAILABLE')
    if (!response.headers.get('preference-applied')?.split(',').some(v => v.trim() === 'count=exact')) {
      throw new FreeJourneyRefreshError('REFRESH_COUNT_UNCONFIRMED')
    }
    const match = /^(\*|([0-9]+)-([0-9]+))\/([0-9]+)$/.exec(response.headers.get('content-range') ?? '')
    if (!match) throw new FreeJourneyRefreshError('REFRESH_RANGE_UNCONFIRMED')
    const rows: unknown = await response.json()
    const total = Number(match[4])
    if (!Array.isArray(rows) || !Number.isSafeInteger(total) || total < rows.length
      || (rows.length === 0 ? match[1] !== '*' : Number(match[3]) - Number(match[2]) + 1 !== rows.length)) {
      throw new FreeJourneyRefreshError('REFRESH_SOURCE_SHAPE_INVALID')
    }
    return { rows, total, start: match[1] === '*' ? null : Number(match[2]) }
  }
  const candidatesUrl = new URL('https://' + configuration.projectRef + '.supabase.co/rest/v1/conversion_events')
  candidatesUrl.searchParams.set('select', eventColumns)
  candidatesUrl.searchParams.set('event_name', 'eq.lifecycle_email_consent_requested')
  candidatesUrl.searchParams.set('event_data->>purpose', 'eq.free_onboarding_and_conversion_email')
  candidatesUrl.searchParams.set('order', 'id.asc')
  if (scope.kind === 'approved_members') candidatesUrl.searchParams.set('or', '(' + scope.members.map(m =>
    'and(member_uid.eq.' + m.outsetaPersonUid + ',event_data->>lifecycleCycleId.eq.' + m.subscriptionUid + ')').join(',') + ')')
  candidatesUrl.searchParams.set('limit', '1')
  candidatesUrl.searchParams.set('offset', '0')
  const first = await read(candidatesUrl)
  if (first.total > MAX_COHORT || first.rows.length !== Math.min(1, first.total)
    || (first.rows.length > 0 && first.start !== 0)) throw new FreeJourneyRefreshError('REFRESH_COHORT_BOUND_EXCEEDED')
  const batches = Math.max(1, Math.ceil(first.total / PAGE_SIZE))
  const slot = Math.floor(time / 3_600_000)
  const offset = (slot % batches) * PAGE_SIZE
  candidatesUrl.searchParams.set('limit', String(PAGE_SIZE))
  candidatesUrl.searchParams.set('offset', String(offset))
  const page = await read(candidatesUrl)
  if (page.total !== first.total || page.rows.length !== Math.min(PAGE_SIZE, page.total - offset)
    || (page.rows.length > 0 && page.start !== offset)) throw new FreeJourneyRefreshError('REFRESH_COHORT_CHANGED_OR_PARTIAL')
  const parsed = z.array(freeJourneyConsentSourceRowSchema).max(PAGE_SIZE).safeParse(page.rows)
  if (!parsed.success || new Set(parsed.data.map(r => r.id)).size !== parsed.data.length
    || parsed.data.some(r => scope.kind === 'approved_members'
      && !scope.members.some(m => m.outsetaPersonUid === r.member_uid && m.subscriptionUid === r.event_data.lifecycleCycleId))) {
    throw new FreeJourneyRefreshError('REFRESH_CANDIDATE_INVALID')
  }
  const reasonCounts: Record<string, number> = Object.create(null)
  let sourceHealthUnknown = false
  const outcomes: Record<string, number> = {}
  const stages: Record<string, number> = {}
  let processed = 0, attemptedWrites = 0, confirmedWrites = 0, recoveryRequired = false, countsKnown = true
  for (const row of parsed.data) {
    if (clock() >= deadline || Date.parse(dependencies.now?.() ?? new Date(clock()).toISOString()) >= Date.parse(configuration.sourcePolicy.expiresAt)) break
    const event = createEligibilityRecheckEvent(row.member_uid, row.event_data.lifecycleCycleId, now)
    const evaluationId = hash(event.idempotencyKey)
    try {
      const result = await (dependencies.evaluate ?? evaluateFreeJourneySourceEvent)(event, configuration, evaluationId, {
        ...dependencies,
        activeCampaignFetch: async (input, init = {}) => {
          const remaining = Math.min(deadline - clock(),
            Date.parse(configuration.sourcePolicy.expiresAt) - clock(),
            configuration.writeConfiguration ? Date.parse(configuration.writeConfiguration.expiresAt) - clock() : Infinity)
          if (remaining <= 0) throw new FreeJourneyRefreshError('REFRESH_BUDGET_OR_APPROVAL_EXPIRED')
          const signal = AbortSignal.any([AbortSignal.timeout(Math.max(1, Math.floor(remaining))),
            ...(init.signal ? [init.signal] : [])])
          return (dependencies.activeCampaignFetch ?? fetch)(input, { ...init, signal })
        },
        beforeScheduledWrite: async contactId => {
          if (clock() >= deadline || clock() >= Date.parse(configuration.writeConfiguration?.expiresAt ?? '')) return false
          const recoveryUrl = new URL('https://' + configuration.projectRef + '.supabase.co/rest/v1/agent_runs')
          recoveryUrl.searchParams.set('select', 'id,status')
          recoveryUrl.searchParams.set('workflow_name', 'eq.free_journey_operation')
          recoveryUrl.searchParams.set('input->>contactDigest', 'eq.' + hash(contactId))
          recoveryUrl.searchParams.set('status', 'neq.succeeded')
          recoveryUrl.searchParams.set('limit', '1')
          const recovery = await read(recoveryUrl)
          return recovery.total === 0 && recovery.rows.length === 0 && clock() < deadline
        },
      })
      const key = 'state' in result && result.state === 'reused' ? 'reused' : result.status ?? 'held'
      outcomes[key] = (outcomes[key] ?? 0) + 1
      for (const reason of result.reasons) {
        const safe = /^[a-z0-9_:-]{1,200}$/i.test(reason) ? reason : 'unclassified_internal_failure'
        reasonCounts[safe] = (reasonCounts[safe] ?? 0) + 1
        sourceHealthUnknown ||= !intentionalWithholds.has(safe)
      }
      if (result.desiredStage) stages[result.desiredStage] = (stages[result.desiredStage] ?? 0) + 1
      if (key !== 'reused') { attemptedWrites += result.attemptedWrites; confirmedWrites += result.confirmedWrites }
      recoveryRequired ||= result.recoveryRequired
    } catch {
      outcomes.unknown = (outcomes.unknown ?? 0) + 1
      recoveryRequired = true
      sourceHealthUnknown = true
      reasonCounts.unclassified_internal_failure = (reasonCounts.unclassified_internal_failure ?? 0) + 1
      countsKnown = false // An exception is not proof that no provider write occurred.
    }
    processed++
  }
  return {
    ok: processed === page.rows.length && !recoveryRequired && !sourceHealthUnknown,
    sourceHealth: sourceHealthUnknown || processed !== page.rows.length ? 'partial' as const : 'evaluated' as const,
    previewOnly: configuration.previewOnly,
    sourceReviewRef: configuration.sourcePolicy.reviewRef,
    sourceReviewExpiresAt: configuration.sourcePolicy.expiresAt,
    writeApprovalExpiresAt: configuration.writeConfiguration?.expiresAt ?? null,
    windowStartedAt: new Date(slot * 3_600_000).toISOString(),
    coverage: { cohortTotal: page.total, pageOffset: offset, selected: page.rows.length, processed,
      pageComplete: processed === page.rows.length, fullCohortThisRun: offset === 0 && page.rows.length === page.total },
    outcomes, stages, reasonCounts,
    attemptedWrites: countsKnown ? attemptedWrites : null,
    confirmedWrites: countsKnown ? confirmedWrites : null,
    recoveryRequired, automaticRetry: false as const,
  }
}

function hash(value: string) { return createHash('sha256').update(value).digest('hex') }
