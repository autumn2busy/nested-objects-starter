import { FIRM_PLAN_IDS, FirmProfileError, type VerifiedFirmIdentity } from './contracts'
type Claims = { sub?: unknown; 'outseta:accountUid'?: unknown; 'outseta:subscriptionUid'?: unknown; 'outseta:planUid'?: unknown; 'outseta:isPrimary'?: unknown }
type Account = { Uid?: string; IsDemo?: boolean; AccountStage?: number; PrimaryContact?: { Uid?: string }; CurrentSubscription?: { Uid?: string; EndDate?: string | null; Plan?: { Uid?: string }; Account?: { Uid?: string } }; PersonAccount?: Array<{ Person?: { Uid?: string } }> }
const uid = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9]{4,40}$/.test(value)
// Only invoke with verified JWT claims and a freshly fetched authoritative account.
export function authorizeFirm(claims: Claims, account: Account, now = Date.now()): VerifiedFirmIdentity {
  const accountUid = claims['outseta:accountUid'], personUid = claims.sub, subscriptionUid = claims['outseta:subscriptionUid'], planUid = claims['outseta:planUid']
  if (![accountUid, personUid, subscriptionUid, planUid].every(uid)) throw new FirmProfileError(403, 'Firm membership could not be verified.')
  if (!FIRM_PLAN_IDS.includes(planUid as typeof FIRM_PLAN_IDS[number])) throw new FirmProfileError(403, 'An active firm plan is required.')
  const subscription = account.CurrentSubscription
  const end = subscription?.EndDate ? Date.parse(subscription.EndDate.endsWith('Z') || /[+-]\d\d:\d\d$/.test(subscription.EndDate) ? subscription.EndDate : `${subscription.EndDate}Z`) : null
  if (account.Uid !== accountUid || account.IsDemo !== false || account.AccountStage !== 3 || !subscription || subscription.Uid !== subscriptionUid || subscription.Plan?.Uid !== planUid || subscription.Account?.Uid !== accountUid || (end !== null && (!Number.isFinite(end) || end <= now)) || !account.PersonAccount?.some(relation => relation.Person?.Uid === personUid)) throw new FirmProfileError(403, 'An active verified firm account is required.')
  const primary = claims['outseta:isPrimary']
  if (primary !== '0' && primary !== '1') throw new FirmProfileError(403, 'Firm role could not be verified.')
  // A signed but stale primary claim cannot create or edit a customer tenant.
  if (!uid(account.PrimaryContact?.Uid) || (primary === '1') !== (account.PrimaryContact.Uid === personUid)) throw new FirmProfileError(403, 'Current firm role could not be verified.')
  return { accountUid: accountUid as string, personUid: personUid as string, subscriptionUid: subscriptionUid as string, planUid: planUid as string, isPrimary: primary === '1' }
}
