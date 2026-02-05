// This file centralizes the Plan UIDs to make it easy to swap them out
// when creating the new plans in Outseta.

export const PLAN_UIDS = {
    FREE: 'L9nbKV9Z',    // formerly Starter
    STARTER: 'zWZD0rQp', // formerly Directory
    PRO: 'rQVqlLm6',
    ELITE: 'NmdnNO90',
    AGENCY: 'rmk5Xk9g',
    FOUNDERS: 'pWrBRnWn',
} as const

// Helper to check plan levels
// This is a naive check; ideally valid plans are fetched from Outseta API.
export const PAID_PLANS: readonly string[] = [
    PLAN_UIDS.STARTER, // $99/3mo
    PLAN_UIDS.PRO,     // $49/mo
    PLAN_UIDS.ELITE,   // $97/mo
    PLAN_UIDS.AGENCY,  // $297/mo
]

export const PRO_OR_HIGHER: readonly string[] = [
    PLAN_UIDS.PRO,
    PLAN_UIDS.ELITE,
    PLAN_UIDS.AGENCY,
]
