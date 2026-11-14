// This file centralizes the Plan UIDs to make it easy to swap them out
// when creating the new plans in Outseta.

export const PLAN_UIDS = {
    FREE: 'L9nbKV9Z',
    STARTER: 'zWZD0rQp', // Legacy — hidden from public pricing, still valid for existing members
    PRO: 'rQVqlLm6',
    ELITE: 'NmdnNO90',
    AGENCY: 'rmk5Xk9g',
    FOUNDERS: 'pWrBRnWn', // $37/yr legacy plan — same access level as Starter
} as const

// A new provider UID must be verified before checkout is enabled. Never reuse a
// legacy plan: its existing members keep their purchased access and terms.
const configuredDirectoryPassUid = typeof process === 'undefined' ? '' : process.env.NEXT_PUBLIC_OUTSETA_DIRECTORY_PASS_PLAN_UID ?? ''
export const DIRECTORY_PASS_PLAN_UID = /^[A-Za-z0-9]{4,40}$/.test(configuredDirectoryPassUid)
    && !Object.values(PLAN_UIDS).some(uid => uid === configuredDirectoryPassUid)
    ? configuredDirectoryPassUid : ''
export function isDirectoryPassPlanUid(planUid: string | null | undefined): boolean {
    return Boolean(DIRECTORY_PASS_PLAN_UID && planUid === DIRECTORY_PASS_PLAN_UID)
}
// Stop new purchases independently of already-purchased access during staged releases.
export const DIRECTORY_PASS_CHECKOUT_ENABLED = typeof process !== 'undefined'
    && process.env.NEXT_PUBLIC_DIRECTORY_PASS_CHECKOUT_ENABLED === 'true'

export type PlanUid = typeof PLAN_UIDS[keyof typeof PLAN_UIDS]

export const PLAN_NAMES: Record<PlanUid, string> = {
    [PLAN_UIDS.FREE]: 'Free',
    [PLAN_UIDS.STARTER]: 'Starter',
    [PLAN_UIDS.PRO]: 'Pro',
    [PLAN_UIDS.ELITE]: 'Elite',
    [PLAN_UIDS.AGENCY]: 'Agency',
    [PLAN_UIDS.FOUNDERS]: 'Founders Directory Annual',
}

export function getPlanName(planUid: string | null | undefined): string | null {
    if (isDirectoryPassPlanUid(planUid)) return 'Directory Pass'
    if (!planUid || !Object.prototype.hasOwnProperty.call(PLAN_NAMES, planUid)) {
        return null
    }

    return PLAN_NAMES[planUid as PlanUid]
}

export function getPlanDisplayLabel(planUid: string | null | undefined): string | null {
    const planName = getPlanName(planUid)
    if (!planName) return null

    return planUid === PLAN_UIDS.FOUNDERS || isDirectoryPassPlanUid(planUid) ? planName : `${planName} Plan`
}

// Public checkout is intentionally allowlisted. Legacy plans stay valid for
// existing members but cannot reappear because a display flag changes.
export const PUBLIC_PLAN_UIDS: readonly string[] = [
    PLAN_UIDS.FREE,
    PLAN_UIDS.PRO,
    PLAN_UIDS.AGENCY,
    ...(DIRECTORY_PASS_PLAN_UID ? [DIRECTORY_PASS_PLAN_UID] : []),
]
export function isPublicPlanUid(planUid: string): boolean {
    return PUBLIC_PLAN_UIDS.includes(planUid)
}

// All plans that represent a paid subscription
export const PAID_PLANS: readonly string[] = [
    PLAN_UIDS.FOUNDERS, // $37/yr (legacy)
    PLAN_UIDS.STARTER,  // $99/3mo (legacy, hidden)
    PLAN_UIDS.PRO,      // $49/mo
    PLAN_UIDS.ELITE,    // $97/mo
    PLAN_UIDS.AGENCY,   // $297/mo
    ...(DIRECTORY_PASS_PLAN_UID ? [DIRECTORY_PASS_PLAN_UID] : []),
]

export const PRO_OR_HIGHER: readonly string[] = [
    PLAN_UIDS.PRO,
    PLAN_UIDS.ELITE,
    PLAN_UIDS.AGENCY,
]
