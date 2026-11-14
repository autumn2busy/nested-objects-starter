import { PLAN_UIDS } from '@/lib/plan-config'

export type MembershipTier = 'free' | 'starter' | 'founders' | 'pro' | 'elite' | 'agency' | 'directory_pass'

export const DIRECTORY_PASS_BILLING = {
  amount: 199, currency: 'USD', renewalTerm: 4, expiresAfterMonths: 12, recurring: false,
} as const

const legacyTiers: Record<string, MembershipTier> = {
  [PLAN_UIDS.FREE]: 'free', [PLAN_UIDS.STARTER]: 'starter', [PLAN_UIDS.FOUNDERS]: 'founders',
  [PLAN_UIDS.PRO]: 'pro', [PLAN_UIDS.ELITE]: 'elite', [PLAN_UIDS.AGENCY]: 'agency',
}

/** This is a product/billing projection, never an entitlement or payment receipt. */
export function isConfiguredDirectoryPass(planUid: string | null | undefined): boolean {
  const configured = process.env.NEXT_PUBLIC_OUTSETA_DIRECTORY_PASS_PLAN_UID ?? ''
  return /^[A-Za-z0-9]{4,40}$/.test(configured) && !Object.hasOwn(legacyTiers, configured) && planUid === configured
}

export function isUnverifiedDirectoryPass(profile: { subscription_tier?: string; plan_name?: string | null; plan_uid?: string | null }): boolean {
  if (isConfiguredDirectoryPass(profile.plan_uid)) return false
  if (profile.subscription_tier === 'directory_pass') return true
  return !Object.hasOwn(legacyTiers, profile.plan_uid ?? '') && /directory[\s_-]*pass/i.test(profile.plan_name ?? '')
}

export function mapOutsetaPlanTier(planName?: string, planUid?: string): MembershipTier {
  if (planUid && Object.hasOwn(legacyTiers, planUid)) return legacyTiers[planUid]
  if (isConfiguredDirectoryPass(planUid)) return 'directory_pass'
  const normalized = planName?.trim().toLowerCase() ?? ''
  // An unconfigured/lookalike pass must not become Free or legacy Starter.
  if (/directory[\s_-]*pass/.test(normalized)) throw new Error('Directory Pass plan UID is not configured or does not match')
  if (normalized.includes('agency')) return 'agency'
  if (normalized.includes('elite')) return 'elite'
  if (normalized.includes('pro')) return 'pro'
  if (normalized.includes('founder')) return 'founders'
  if (normalized.includes('starter') || normalized.includes('directory')) return 'starter'
  return 'free'
}

type SubscriptionDates = {
  Plan?: { Uid?: string }; ExpirationDate?: string | null; EndDate?: string | null; RenewalDate?: string | null
}

function timestamp(value: string | null | undefined): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?(?:Z|[+-]\d{2}:\d{2})?$/.test(value)) return null
  const zoned = /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : value + 'Z'
  const time = Date.parse(zoned)
  return Number.isFinite(time) ? time : null
}

export function outsetaSubscriptionEndDate(subscription: SubscriptionDates | null | undefined): string | null {
  if (!isConfiguredDirectoryPass(subscription?.Plan?.Uid)) return subscription?.RenewalDate || subscription?.EndDate || null
  // Access expiry is not a next charge. Never invent a 12-month expiry or use RenewalDate.
  const expiration = timestamp(subscription?.ExpirationDate)
  if (expiration === null) return null
  if (subscription?.EndDate != null) {
    const end = timestamp(subscription.EndDate)
    if (end === null) return null
    if (end < expiration) return subscription.EndDate
  }
  return subscription?.ExpirationDate ?? null
}
