'use server'

import { createServiceRoleClient } from '@/lib/supabase-server'
import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { applyACContactTag } from '@/lib/ac-event-tracking'
import { revalidatePath } from 'next/cache'

export async function completeOnboardingAction() {
    const user = await getCurrentUser()
    const userId = getOutsetaUserId(user)

    if (!userId) {
        throw new Error('Unauthorized')
    }

    const supabase = createServiceRoleClient()

    // We use service role to ensure update happens regardless of strict RLS on 'updated_at' etc
    // Assuming 'outseta_person_uid' is the connector
    const { error } = await supabase
        .from('profiles')
        .update({
            onboarding_completed_at: new Date().toISOString()
        })
        .eq('outseta_person_uid', userId)

    if (error) {
        console.error('Failed to complete onboarding:', error)
        throw new Error('Failed to update profile')
    }

    if (user?.email) {
        const tagged = await applyACContactTag({
            email: user.email,
            tag: 'onboarding-complete',
        })

        if (!tagged) {
            console.warn(`[Onboarding] Failed to apply onboarding-complete AC tag for ${user.email}`)
        }
    }

    revalidatePath('/inspector-dashboard')
    return { success: true }
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
