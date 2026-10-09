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
const timestamp = (value: unknown): value is string => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  && Number.isFinite(Date.parse(value))

function withheld(status: Exclude<MembershipStatus, 'verified'>, reason: string): CurrentMembership {
  return { status, reason, planUid: null, subscriptionUid: null, accessEndsAt: null }
}

/** Only exact, freshly read Outseta relationships establish current access.
 * LatestSubscription, subscription history, JWT plan/cycle claims and payment
 * amounts are deliberately not inputs to the access decision.
 */
export function evaluateCurrentMembership(
  claims: Claims, personValue: unknown, accountValue: unknown, now: number,
): CurrentMembership {
  if (!identifier(claims.sub) || !identifier(claims['outseta:accountUid']) || !Number.isFinite(now)) {
    return withheld('unknown', 'identity_unverified')
  }
  const person = record(personValue)
  const account = record(accountValue)
  if (person?.Uid !== claims.sub || account?.Uid !== claims['outseta:accountUid']) {
    return withheld('unknown', 'identity_mismatch')
  }
  const links = Array.isArray(person.PersonAccount) ? person.PersonAccount : []
  const matches = links.filter(link => record(record(link)?.Account)?.Uid === account.Uid)
  if (matches.length !== 1) return withheld('unknown', 'account_link_missing_or_ambiguous')

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
  if (!timestamp(subscription.StartDate) || Date.parse(subscription.StartDate) > now) {
    return withheld('unknown', 'subscription_start_unverified')
  }
  // Missing is not null. Never substitute RenewalDate or a cancellation request
  // timestamp for the current subscription's effective EndDate.
  const end = subscription.EndDate
  if (end !== null && !timestamp(end)) return withheld('unknown', 'subscription_end_unverified')
  if (end !== null && Date.parse(end as string) < Date.parse(subscription.StartDate)) {
    return withheld('unknown', 'subscription_dates_conflict')
  }
  if (end !== null && Date.parse(end as string) <= now) return withheld('expired', 'subscription_ended')
  if ((stage === 4 || stage === 8) && end === null) return withheld('unknown', 'cancellation_end_unverified')
  return {
    status: 'verified', reason: 'current_subscription_verified', planUid,
    subscriptionUid: subscription.Uid, accessEndsAt: end as string | null,
  }
}

type ReadOptions = { fetcher?: typeof fetch; now?: () => number; apiKey?: string; apiSecret?: string }

/** Two exact GETs, no lists, history fallback, shared cache, or provider writes. */
export async function readCurrentMembership(claims: Claims, options: ReadOptions = {}): Promise<CurrentMembership> {
  if (!identifier(claims.sub) || !identifier(claims['outseta:accountUid'])) {
    return withheld('unknown', 'identity_unverified')
  }
  const apiKey = options.apiKey ?? process.env.OUTSETA_API_KEY
  const apiSecret = options.apiSecret ?? process.env.OUTSETA_API_SECRET
  if (!apiKey || !apiSecret) return withheld('unavailable', 'membership_configuration_unavailable')
  const fetcher = options.fetcher ?? fetch
  const read = async (path: string) => {
    const response = await fetcher(`https://nested-objects.outseta.com/api/v1/${path}`, {
      method: 'GET', headers: { Authorization: `Outseta ${apiKey}:${apiSecret}` },
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) throw new Error('membership_read_unavailable')
    return response.json()
  }
  try {
    const person = await read(`crm/people/${claims.sub}?fields=Uid,PersonAccount.Account.Uid`)
    // Do not request an account until the person read proves the exact link.
    const row = record(person)
    const links = Array.isArray(row?.PersonAccount) ? row.PersonAccount : []
    if (row?.Uid !== claims.sub || links.filter(link => record(record(link)?.Account)?.Uid === claims['outseta:accountUid']).length !== 1) {
      return withheld('unknown', 'account_link_missing_or_ambiguous')
    }
    const account = await read(`crm/accounts/${claims['outseta:accountUid']}?fields=Uid,AccountStage,CurrentSubscription.Uid,CurrentSubscription.Plan.Uid,CurrentSubscription.StartDate,CurrentSubscription.EndDate,CurrentSubscription.Account.Uid`)
    return evaluateCurrentMembership(claims, person, account, (options.now ?? Date.now)())
  } catch {
    // Never retain a provider response body, credential, or stale token grant.
    return withheld('unavailable', 'membership_read_unavailable')
  }
}
