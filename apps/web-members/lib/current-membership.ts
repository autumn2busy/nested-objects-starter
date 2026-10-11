import { getPlanName } from './plan-config'

export type MembershipStatus = 'verified' | 'expired' | 'unknown' | 'unavailable'
export type CurrentMembership = {
  status: MembershipStatus
  reason: string
  planUid: string | null
  subscriptionUid: string | null
  accessEndsAt: string | null
}

type Claims = { sub?: unknown; 'outseta:accountUid'?: unknown }
type RecordValue = Record<string, unknown>
const record = (value: unknown): RecordValue | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : null
const identifier = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(value)
// Outseta timestamps are UTC, including responses without a timezone suffix.
// https://docs.outseta.com/ (Conventions); the official SDK also appends Z.
// Normalize before parsing so server/browser timezones cannot move access bounds.
function timestamp(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,7})?(Z|[+-]\d{2}:\d{2})?$/.exec(value)
  if (!parts) return null
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, zone] = parts
  const [year, month, day, hour, minute, second] = [yearText, monthText, dayText, hourText, minuteText, secondText].map(Number)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth
    || hour > 23 || minute > 59 || second > 59) return null
  const normalized = zone ? value : `${value}Z`
  return Number.isFinite(Date.parse(normalized)) ? normalized : null
}

function withheld(status: Exclude<MembershipStatus, 'verified'>, reason: string): CurrentMembership {
  return { status, reason, planUid: null, subscriptionUid: null, accessEndsAt: null }
}

/** Only exact, freshly read Outseta relationships establish current access.
 * LatestSubscription, subscription history, JWT plan/cycle claims and payment
 * amounts are deliberately not inputs to the access decision.
 */
export function evaluateCurrentMembership(
  claims: Claims, profileValue: unknown, now: number,
): CurrentMembership {
  if (!identifier(claims.sub) || !identifier(claims['outseta:accountUid']) || !Number.isFinite(now)) {
    return withheld('unknown', 'identity_unverified')
  }
  const profile = record(profileValue)
  const account = record(profile?.Account)
  if (profile?.Uid !== claims.sub || account?.Uid !== claims['outseta:accountUid']) {
    return withheld('unknown', 'identity_mismatch')
  }

  // Outseta v2 billing stages: 7 is current/past due, not effective expiry.
  // https://go.outseta.com/support/kb/articles/Kj9boWnd/account-billing-stages
  const stage = account.AccountStage
  if (stage === 5 || stage === 6) return withheld('expired', 'account_expired')
  if (![2, 3, 4, 7, 8].includes(stage as number)) return withheld('unknown', 'account_stage_unknown')
  const subscription = record(account.CurrentSubscription)
  const planUid = record(subscription?.Plan)?.Uid
  if (!subscription || !identifier(subscription.Uid) || !identifier(planUid) || !getPlanName(planUid)) {
    return withheld('unknown', 'current_subscription_unverified')
  }
  if (subscription.Account !== undefined && record(subscription.Account)?.Uid !== account.Uid) {
    return withheld('unknown', 'subscription_account_mismatch')
  }
  const start = timestamp(subscription.StartDate)
  if (!start || Date.parse(start) > now) {
    return withheld('unknown', 'subscription_start_unverified')
  }
  // Missing is not null. Never substitute RenewalDate or a cancellation request
  // timestamp for the current subscription's effective EndDate.
  const end = subscription.EndDate === null ? null : timestamp(subscription.EndDate)
  if (subscription.EndDate !== null && end === null) return withheld('unknown', 'subscription_end_unverified')
  if (end !== null && Date.parse(end) < Date.parse(start)) {
    return withheld('unknown', 'subscription_dates_conflict')
  }
  if (end !== null && Date.parse(end) <= now) return withheld('expired', 'subscription_ended')
  if ((stage === 4 || stage === 8) && end === null) return withheld('unknown', 'cancellation_end_unverified')
  return {
    status: 'verified', reason: 'current_subscription_verified', planUid,
    subscriptionUid: subscription.Uid, accessEndsAt: end,
  }
}

type ReadOptions = { fetcher?: typeof fetch; now?: () => number }

// These fixed categories reveal contract failures without logging member data.
function dateShape(value: unknown): string {
  if (value === undefined) return 'missing'
  if (value === null) return 'null'
  if (typeof value !== 'string') return 'not_string'
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(value)) return 'timestamp_without_timezone'
  if (timestamp(value)) return 'timestamp_with_timezone'
  return 'invalid'
}

function reportUnverifiedProfile(result: CurrentMembership, claims: Claims, value: unknown) {
  if (result.status !== 'unknown') return
  const profile = record(value)
  const account = record(profile?.Account)
  const subscription = record(account?.CurrentSubscription)
  const planUid = record(subscription?.Plan)?.Uid
  console.warn('[MEMBERSHIP_LOOKUP]', {
    status: result.status, reason: result.reason,
    personMatches: profile?.Uid === claims.sub,
    accountMatches: account?.Uid === claims['outseta:accountUid'],
    accountStageType: typeof account?.AccountStage,
    subscriptionPresent: Boolean(subscription),
    subscriptionIdValid: identifier(subscription?.Uid),
    planKnown: identifier(planUid) && Boolean(getPlanName(planUid)),
    startShape: dateShape(subscription?.StartDate),
    endShape: dateShape(subscription?.EndDate),
    subscriptionAccountShape: subscription?.Account === undefined ? 'missing'
      : subscription.Account === null ? 'null'
        : record(subscription.Account)?.Uid === account?.Uid ? 'matching' : 'mismatched',
  })
}

/** Read the verified token's own profile, scoped by Outseta to its person/account.
 * This is the same Account.CurrentSubscription projection used by Outseta's SDK,
 * without its browser cache. No admin credentials, account lists or writes.
 */
export async function readCurrentMembership(claims: Claims, token: string, options: ReadOptions = {}): Promise<CurrentMembership> {
  if (!identifier(claims.sub) || !identifier(claims['outseta:accountUid'])) {
    console.warn('[MEMBERSHIP_LOOKUP]', { status: 'unknown', reason: 'identity_unverified' })
    return withheld('unknown', 'identity_unverified')
  }
  // Callers verify the JWT first. Normalize exactly as the verification path does.
  const bearer = typeof token === 'string' ? token.trim().replace(/^["']|["']$/g, '').replace(/^Bearer /, '') : ''
  if (!bearer || /\s/.test(bearer)) return withheld('unavailable', 'membership_token_unavailable')
  const fetcher = options.fetcher ?? fetch
  let failure = 'provider_request_failed'
  try {
    const fields = 'Uid,Account.Uid,Account.AccountStage,Account.CurrentSubscription.Uid,Account.CurrentSubscription.Plan.Uid,Account.CurrentSubscription.StartDate,Account.CurrentSubscription.EndDate,Account.CurrentSubscription.Account.Uid'
    const response = await fetcher(`https://nested-objects.outseta.com/api/v1/profile?fields=${fields}`, {
      method: 'GET', headers: { Authorization: `Bearer ${bearer}` },
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) {
      console.warn('[MEMBERSHIP_LOOKUP]', {
        status: 'unavailable', reason: 'provider_http_error',
        httpStatus: Number.isInteger(response.status) && response.status >= 100 && response.status <= 599 ? response.status : 0,
      })
      return withheld('unavailable', 'membership_read_unavailable')
    }
    failure = 'provider_json_invalid'
    const profile = await response.json()
    const result = evaluateCurrentMembership(claims, profile, (options.now ?? Date.now)())
    reportUnverifiedProfile(result, claims, profile)
    return result
  } catch {
    // Never retain a provider response body, credential, or stale token grant.
    console.warn('[MEMBERSHIP_LOOKUP]', { status: 'unavailable', reason: failure })
    return withheld('unavailable', 'membership_read_unavailable')
  }
}
