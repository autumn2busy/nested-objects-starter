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

// Public checkout is intentionally allowlisted. Legacy plans stay valid for
// existing members but cannot reappear because a display flag changes.
export const PUBLIC_PLAN_UIDS: readonly string[] = [
    PLAN_UIDS.FREE,
    PLAN_UIDS.PRO,
    PLAN_UIDS.ELITE,
    PLAN_UIDS.AGENCY,
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
]

export const PRO_OR_HIGHER: readonly string[] = [
    PLAN_UIDS.PRO,
    PLAN_UIDS.ELITE,
    PLAN_UIDS.AGENCY,
]
