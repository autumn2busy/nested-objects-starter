import 'server-only'
import { PAID_TRAINING_PLANS } from './training-access-policy'

type Member = { sub?: unknown; 'outseta:accountUid'?: unknown; 'outseta:subscriptionUid'?: unknown; 'outseta:planUid'?: unknown }
type JsonObject = Record<string, unknown>
const object = (value: unknown): JsonObject | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : null
const identifier = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(value)

// Outseta full timestamps without a zone are UTC. Date-only or invalid dates
// cannot establish a currently eligible paid subscription.
function timestamp(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,7})?(Z|[+-]\d{2}:\d{2})?$/.exec(value)
  if (!match) return null
  const [, year, month, day, hour, minute, second, zone] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1
    || date.getUTCDate() !== Number(day) || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return null
  const parsed = Date.parse(zone ? value : value + 'Z')
  return Number.isFinite(parsed) ? parsed : null
}

/** Narrow waiver eligibility; this does not replace general member entitlement policy. */
export function currentPaidTrainingWaiverEligible(raw: unknown, user: Member, now: number): boolean {
  const account = object(raw), subscription = object(account?.CurrentSubscription), plan = object(subscription?.Plan)
  if (!Number.isFinite(now) || !identifier(user.sub) || !identifier(user['outseta:accountUid'])
    || !identifier(user['outseta:subscriptionUid']) || !identifier(user['outseta:planUid'])
    || !account || account.Uid !== user['outseta:accountUid'] || account.IsDemo !== false
    || !subscription || subscription.Uid !== user['outseta:subscriptionUid']
    || !plan || plan.Uid !== user['outseta:planUid'] || !PAID_TRAINING_PLANS.includes(String(plan.Uid))) return false
  const links = Array.isArray(account.PersonAccount) ? account.PersonAccount.map(object) : []
  if (links.filter(link => object(link?.Person)?.Uid === user.sub).length !== 1) return false
  const linkedAccount = object(subscription.Account)
  if (linkedAccount && linkedAccount.Uid !== account.Uid) return false
  const start = timestamp(subscription.StartDate)
  const end = subscription.EndDate === null ? Infinity : timestamp(subscription.EndDate)
  if (start === null || start > now || end === null || end <= now) return false
  // Official stages: Subscribing=3; Canceling=4 retains only its known paid term.
  // https://go.outseta.com/support/kb/articles/Kj9boWnd/account-billing-stages
  const label = typeof account.AccountStageLabel === 'string' ? account.AccountStageLabel.trim().toLowerCase() : ''
  if (account.AccountStage === 3) return label === 'subscribing'
  return account.AccountStage === 4 && ['canceling', 'cancelling'].includes(label) && Number.isFinite(end)
}

/** Existing server credential, one exact account, no cache, no mutations or broad lookup. */
export async function verifyCurrentTrainingWaiverEntitlement(user: Member, now = Date.now(), fetcher: typeof fetch = fetch): Promise<boolean> {
  const apiKey = process.env.OUTSETA_API_KEY || process.env.NEXT_PUBLIC_OUTSETA_PUBLIC_KEY
  const apiSecret = process.env.OUTSETA_API_SECRET
  if (!apiKey || !apiSecret || !identifier(user.sub) || !identifier(user['outseta:accountUid'])
    || !identifier(user['outseta:subscriptionUid']) || !identifier(user['outseta:planUid'])
    || !PAID_TRAINING_PLANS.includes(user['outseta:planUid'])) return false
  const url = new URL('https://nested-objects.outseta.com/api/v1/crm/accounts/' + encodeURIComponent(user['outseta:accountUid']))
  url.searchParams.set('fields', [
    'Uid', 'IsDemo', 'AccountStage', 'AccountStageLabel',
    'CurrentSubscription.Uid', 'CurrentSubscription.StartDate', 'CurrentSubscription.EndDate',
    'CurrentSubscription.Plan.Uid', 'CurrentSubscription.Account.Uid', 'PersonAccount.Person.Uid',
  ].join(','))
  url.searchParams.set('donotlog', '1')
  try {
    const response = await fetcher(url, {
      method: 'GET', headers: { Authorization: 'Outseta ' + apiKey + ':' + apiSecret, Accept: 'application/json' },
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return false
    return currentPaidTrainingWaiverEligible(await response.json(), user, now)
  } catch {
    console.warn('[Training] Current waiver membership unavailable')
    return false
  }
}
