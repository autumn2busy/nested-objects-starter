'use server'

import { revalidateTag } from 'next/cache'
import { getCurrentUser } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-admin'

export async function submitReview(firmId: string, rating: number, comment: string) {
    try {
        const user = await getCurrentUser()
        if (!user || !user.email) {
            throw new Error('Authentication required to submit a review.')
        }

        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5.')
        }

        const trimmedComment = comment.trim()
        if (!trimmedComment || trimmedComment.length < 10) {
            throw new Error('Review comment is too short. Please provide at least 10 characters.')
        }

        const supabaseAdmin = createServiceRoleClient()

        // First, resolve the profile_id using the authenticated user's email
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('user_email', user.email)
            .maybeSingle()

        if (profileError || !profile) {
            throw new Error('Could not resolve your member profile. Make sure you set it up first in your dashboard.')
        }

        // Insert the review
        const { error: insertError } = await supabaseAdmin
            .from('firm_reviews')
            .insert({
                firm_id: firmId,
                profile_id: profile.id,
                rating,
                comment: trimmedComment,
                status: 'approved', // Auto-approve for the community directory
            })

        if (insertError) {
            // 23505 is PostgreSQL unique constraint violation
            if (insertError.code === '23505') {
                throw new Error('You have already reviewed this firm.')
            }
            console.error('[submitReview database error]:', insertError)
            throw new Error('Failed to submit review due to a server error.')
        }

        // Bust the firm cache so the new review immediately appears and updates the AggregateRating schema
        revalidateTag('firms')
        revalidateTag(`firm-${firmId}`)

        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message || 'Unknown error occurred.' }
    }
}
