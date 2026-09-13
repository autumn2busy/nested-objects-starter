import { PLAN_UIDS } from './plan-config'

export const ELITE_OPPORTUNITY_ALERTS_OPT_IN_URL = 'https://awilliams.activehosted.com/f/88'

type OpportunityAlertViewer = {
  sub?: unknown
  'outseta:accountUid'?: unknown
  'outseta:subscriptionUid'?: unknown
  'outseta:planUid'?: unknown
} | null

type OpportunityAlertProfile = {
  outseta_person_uid?: unknown
  outseta_account_id?: unknown
  subscription_tier?: unknown
  subscription_status?: unknown
  subscription_start_date?: unknown
  subscription_end_date?: unknown
  plan_uid?: unknown
  outseta_data?: unknown
} | null

export type OpportunityAlertConsentOffer = {
  allowed: boolean
  reason:
    | 'allowed'
    | 'identity_unverified'
    | 'membership_projection_unavailable'
    | 'not_elite'
    | 'subscription_unverified'
    | 'membership_inactive'
    | 'membership_window_invalid'
    | 'demo_or_unknown'
}

function exactId(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function findProjectedAccount(profile: NonNullable<OpportunityAlertProfile>) {
  const raw = record(profile.outseta_data)
  if (!raw) return null

  if (exactId(raw.Uid) === exactId(profile.outseta_account_id)) return raw

  const personAccounts = Array.isArray(raw.PersonAccount) ? raw.PersonAccount : []
  for (const value of personAccounts) {
    const account = record(record(value)?.Account)
    if (account && exactId(account.Uid) === exactId(profile.outseta_account_id)) return account
  }

  return null
}

function findProjectedSubscription(account: Record<string, unknown> | null) {
  if (!account) return null
  return record(account.CurrentSubscription) ?? record(account.LatestSubscription)
}

function parseOptionalDate(value: unknown): number | null | 'invalid' {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') return 'invalid'
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 'invalid'
}

/**
 * Controls whether the portal may offer the existing double-opt-in form.
 * This is deliberately narrower than plan display logic and never authorizes
 * an opportunity send; the Runtime must still re-read consent, suppressions,
 * audience traits, and current Outseta membership before every approved send.
 */
export function evaluateEliteOpportunityAlertConsentOffer(
  viewer: OpportunityAlertViewer,
  profile: OpportunityAlertProfile,
  now = new Date(),
): OpportunityAlertConsentOffer {
  const personId = exactId(viewer?.sub)
  const accountId = exactId(viewer?.['outseta:accountUid'])
  const subscriptionId = exactId(viewer?.['outseta:subscriptionUid'])

  if (!personId || !accountId || !subscriptionId) {
    return { allowed: false, reason: 'identity_unverified' }
  }
  if (!profile) {
    return { allowed: false, reason: 'membership_projection_unavailable' }
  }
  if (viewer?.['outseta:planUid'] !== PLAN_UIDS.ELITE
    || profile.plan_uid !== PLAN_UIDS.ELITE
    || profile.subscription_tier !== 'elite') {
    return { allowed: false, reason: 'not_elite' }
  }
  if (profile.outseta_person_uid !== personId || profile.outseta_account_id !== accountId) {
    return { allowed: false, reason: 'identity_unverified' }
  }

  const account = findProjectedAccount(profile)
  const subscription = findProjectedSubscription(account)
  if (!account || exactId(subscription?.Uid) !== subscriptionId) {
    return { allowed: false, reason: 'subscription_unverified' }
  }
  if (account.IsDemo !== false) {
    return { allowed: false, reason: 'demo_or_unknown' }
  }
  if (profile.subscription_status !== 'active') {
    return { allowed: false, reason: 'membership_inactive' }
  }

  const nowMs = now.getTime()
  const startsAt = parseOptionalDate(profile.subscription_start_date)
  const endsAt = parseOptionalDate(profile.subscription_end_date)
  if (!Number.isFinite(nowMs)
    || startsAt === 'invalid'
    || endsAt === 'invalid'
    || (startsAt !== null && startsAt > nowMs)
    || (endsAt !== null && endsAt <= nowMs)) {
    return { allowed: false, reason: 'membership_window_invalid' }
  }

  return { allowed: true, reason: 'allowed' }
}
