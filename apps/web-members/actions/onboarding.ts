'use server'

import { createServiceRoleClient } from '@/lib/supabase-server'
import { getCurrentUser, getOutsetaUserId, PLAN_UIDS } from '@/lib/auth-server'
import { reconcileFreeOnboardingCompletionFromEnvironment } from '@/lib/free-onboarding-completion'
import { revalidatePath } from 'next/cache'

export async function completeOnboardingAction() {
    const user = await getCurrentUser()
    const userId = getOutsetaUserId(user)

    if (!userId) {
        throw new Error('Unauthorized')
    }

    const supabase = createServiceRoleClient()

    const completion = await reconcileFreeOnboardingCompletionFromEnvironment({
        supabase,
        outsetaPersonUid: userId,
        subscriptionUid: user?.['outseta:subscriptionUid'],
        planUid: user?.['outseta:planUid'],
        freePlanUid: PLAN_UIDS.FREE,
    })

    const success = completion.status === 'completed' || completion.status === 'already_completed'
    if (success) revalidatePath('/inspector-dashboard')
    return { success, status: completion.status }
}

export async function getOnboardingStatus() {
    const user = await getCurrentUser()
    const userId = getOutsetaUserId(user)

    if (!userId) return { completed: false }

    const supabase = createServiceRoleClient()
    const { data } = await supabase
        .from('profiles')
        .select('onboarding_completed_at')
        .eq('outseta_person_uid', userId)
        .single()

    return {
        completed: !!data?.onboarding_completed_at
    }
}
