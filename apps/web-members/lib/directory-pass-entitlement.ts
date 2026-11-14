import 'server-only'
import { DIRECTORY_PASS_PLAN_UID } from './plan-config'

type DirectoryPassIdentity = {
  sub?: unknown
  'outseta:accountUid'?: unknown
  'outseta:subscriptionUid'?: unknown
  'outseta:planUid'?: unknown
}

type JsonObject = Record<string, unknown>
const object = (value: unknown): JsonObject | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : null
const identifier = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(value)

/** Outseta v2 emits full timestamps with Z or without a zone; zone-less values are UTC. */
export function parseOutsetaUtcTimestamp(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,7}))?(Z)?$/.exec(value)
  if (!match) return null
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fraction = ''] = match
  const year = Number(yearText), month = Number(monthText), day = Number(dayText)
  const hour = Number(hourText), minute = Number(minuteText), second = Number(secondText)
  const millisecond = Number(fraction.slice(0, 3).padEnd(3, '0'))
  if (year < 1970 || month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59 || second > 59) return null
  const parsed = Date.UTC(year, month - 1, day, hour, minute, second, millisecond)
  const date = new Date(parsed)
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day
    || date.getUTCHours() !== hour || date.getUTCMinutes() !== minute || date.getUTCSeconds() !== second) return null
  return parsed
}

/** Calendar-month arithmetic clamps leap-day/month-end starts instead of adding 365 days. */
export function addUtcCalendarMonthsClamped(start: number, months: number): number | null {
  if (!Number.isFinite(start) || !Number.isInteger(months) || months < 0) return null
  const date = new Date(start)
  const monthIndex = date.getUTCMonth() + months
  const targetYear = date.getUTCFullYear() + Math.floor(monthIndex / 12)
  const targetMonth = ((monthIndex % 12) + 12) % 12
  const lastTargetDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()
  return Date.UTC(targetYear, targetMonth, Math.min(date.getUTCDate(), lastTargetDay),
    date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds())
}

/** Pure evaluator for one freshly fetched Outseta account. Earlier expiry is honored; extension past 12 calendar months is denied. */
export function currentDirectoryPassEntitlement(
  raw: unknown,
  user: DirectoryPassIdentity,
  now: number,
  configuredPlanUid = DIRECTORY_PASS_PLAN_UID,
): boolean {
  const account = object(raw), subscription = object(account?.CurrentSubscription), plan = object(subscription?.Plan)
  if (!Number.isFinite(now) || !identifier(configuredPlanUid) || !identifier(user.sub)
    || !identifier(user['outseta:accountUid']) || !identifier(user['outseta:subscriptionUid'])
    || user['outseta:planUid'] !== configuredPlanUid || !account || account.Uid !== user['outseta:accountUid']
    || account.IsDemo !== false || account.AccountStage !== 3
    || typeof account.AccountStageLabel !== 'string' || account.AccountStageLabel.trim().toLowerCase() !== 'subscribing'
    || !subscription || subscription.Uid !== user['outseta:subscriptionUid']
    || object(subscription.Account)?.Uid !== account.Uid || subscription.BillingRenewalTerm !== 4
    || !plan || plan.Uid !== configuredPlanUid || plan.OneTimeRate !== 199
    || plan.ExpiresAfterMonths !== 12 || plan.TrialPeriodDays !== 0) return false

  const links = Array.isArray(account.PersonAccount) ? account.PersonAccount.map(object) : []
  if (links.filter(link => object(link?.Person)?.Uid === user.sub).length !== 1) return false

  const start = parseOutsetaUtcTimestamp(subscription.StartDate)
  const expiration = parseOutsetaUtcTimestamp(subscription.ExpirationDate)
  if (start === null || expiration === null || start > now || now >= expiration || expiration <= start) return false
  const maximumExpiration = addUtcCalendarMonthsClamped(start, 12)
  if (maximumExpiration === null || expiration > maximumExpiration) return false

  if (subscription.EndDate !== null) {
    const end = parseOutsetaUtcTimestamp(subscription.EndDate)
    if (end === null || end <= now || end > expiration || end > maximumExpiration) return false
  }
  return true
}

/** Fresh server-only account read. Missing configuration and every provider/shape error fail closed. */
export async function verifyCurrentDirectoryPassEntitlement(
  user: DirectoryPassIdentity,
  now = Date.now(),
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  const apiKey = process.env.OUTSETA_API_KEY
  const apiSecret = process.env.OUTSETA_API_SECRET
  if (!DIRECTORY_PASS_PLAN_UID || !apiKey || !apiSecret || !identifier(user.sub)
    || !identifier(user['outseta:accountUid']) || !identifier(user['outseta:subscriptionUid'])
    || user['outseta:planUid'] !== DIRECTORY_PASS_PLAN_UID) return false

  const url = new URL('https://nested-objects.outseta.com/api/v1/crm/accounts/' + encodeURIComponent(user['outseta:accountUid']))
  url.searchParams.set('fields', [
    'Uid', 'IsDemo', 'AccountStage', 'AccountStageLabel',
    'CurrentSubscription.Uid', 'CurrentSubscription.StartDate', 'CurrentSubscription.ExpirationDate',
    'CurrentSubscription.EndDate', 'CurrentSubscription.BillingRenewalTerm',
    'CurrentSubscription.Plan.Uid', 'CurrentSubscription.Plan.OneTimeRate',
    'CurrentSubscription.Plan.ExpiresAfterMonths', 'CurrentSubscription.Plan.TrialPeriodDays',
    'CurrentSubscription.Account.Uid', 'PersonAccount.Person.Uid',
  ].join(','))
  url.searchParams.set('donotlog', '1')

  try {
    const response = await fetcher(url, {
      method: 'GET',
      headers: { Authorization: 'Outseta ' + apiKey + ':' + apiSecret, Accept: 'application/json' },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return false
    return currentDirectoryPassEntitlement(await response.json(), user, now)
  } catch {
    return false
  }
}
