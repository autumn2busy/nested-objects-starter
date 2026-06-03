export type SubscriptionTier = 'free' | 'starter' | 'founders' | 'pro' | 'elite' | 'agency'

type ProfileOperation = 'insert' | 'update' | string

export interface LifecycleProfileSnapshot {
    subscription_tier?: SubscriptionTier | null
    plan_name?: string | null
    plan_uid?: string | null
}

export interface PurchasePayload {
    value: number
    currency: 'USD'
    plan: string
    planUid?: string | null
    tier: SubscriptionTier
    fromPlan: string
    fromTier: string
    source: 'outseta_webhook'
    transition: 'direct_paid_signup' | 'free_to_paid_upgrade' | 'paid_plan_change'
}

export interface PaidLifecycleDecision {
    shouldTrack: boolean
    reason: string
    purchasePayload?: PurchasePayload
    subscriptionEvent?: 'subscription_created' | 'subscription_upgraded'
    subscriptionPlan?: string
    subscriptionAmount?: number
    previousPlan?: string
}

export function isPaidTier(tier?: SubscriptionTier | null): boolean {
    return !!tier && tier !== 'free'
}

export function getPlanValue(tier: SubscriptionTier): number {
    switch (tier) {
        case 'starter': return 99
        case 'founders': return 37
        case 'pro': return 49
        case 'elite': return 97
        case 'agency': return 297
        default: return 0
    }
}

export function buildPaidLifecycleDecision({
    operation,
    previous,
    current,
}: {
    operation: ProfileOperation
    previous?: LifecycleProfileSnapshot | null
    current: LifecycleProfileSnapshot
}): PaidLifecycleDecision {
    const previousTier = previous?.subscription_tier ?? null
    const previousPlanName = previous?.plan_name ?? null
    const previousPlanUid = previous?.plan_uid ?? null
    const newTier = current.subscription_tier ?? 'free'
    const newPlanName = current.plan_name || newTier
    const newPlanUid = current.plan_uid
    const previousWasPaid = isPaidTier(previousTier)
    const newIsPaid = isPaidTier(newTier)
    const planChanged =
        previousPlanUid !== newPlanUid ||
        (previousPlanName || '').toLowerCase() !== newPlanName.toLowerCase()

    if (!newIsPaid) {
        return {
            shouldTrack: false,
            reason: 'new_plan_is_free',
        }
    }

    if (operation !== 'insert' && previousWasPaid && !planChanged) {
        return {
            shouldTrack: false,
            reason: 'paid_plan_unchanged',
        }
    }

    const purchaseValue = getPlanValue(newTier)
    const transition =
        operation === 'insert'
            ? 'direct_paid_signup'
            : previousWasPaid
                ? 'paid_plan_change'
                : 'free_to_paid_upgrade'

    return {
        shouldTrack: true,
        reason: transition,
        purchasePayload: {
            value: purchaseValue,
            currency: 'USD',
            plan: newPlanName,
            planUid: newPlanUid,
            tier: newTier,
            fromPlan: previousPlanName || previousTier || 'none',
            fromTier: previousTier || 'none',
            source: 'outseta_webhook',
            transition,
        },
        subscriptionEvent: operation === 'insert' ? 'subscription_created' : 'subscription_upgraded',
        subscriptionPlan: newPlanName,
        subscriptionAmount: purchaseValue,
        previousPlan: previousPlanName || previousTier || 'free',
    }
}
