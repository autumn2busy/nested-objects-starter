import { NextResponse } from 'next/server'
import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-admin'
import { isBackgroundCheckAdmin } from '@/lib/backgroundcheck-admin-auth'
import { calculateTrustScore } from '@/lib/trust-score'

export const dynamic = 'force-dynamic'

/**
 * GET /api/background-check
 * Returns the current background check status for the logged-in user
 */
export async function GET() {
    try {
        const user = await getCurrentUser()
        const outsetaId = getOutsetaUserId(user)

        if (!user || !outsetaId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = createServiceRoleClient()

        const { data: profile } = await supabase
            .from('profiles')
            .select('shield_id, shield_ic_rating, background_check_status, background_check_verified_at, shield_id_submitted_at')
            .or(`outseta_person_uid.eq.${outsetaId},user_id.eq.${outsetaId}`)
            .limit(1)
            .single()

        return NextResponse.json({
            shieldId: profile?.shield_id || null,
            icRating: profile?.shield_ic_rating || null,
            status: profile?.background_check_status || 'not_started',
            verifiedAt: profile?.background_check_verified_at || null,
            submittedAt: profile?.shield_id_submitted_at || null,
        })
    } catch (error: any) {
        console.error('Background check GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * POST /api/background-check
 * Member submits their ShieldID/ABC# for verification
 * 
 * Body: { shield_id: string }
 * 
 * Flow:
 * 1. Member gets their ShieldID from ShieldHub
 * 2. Enters it here
 * 3. Status moves to "pending_verification"
 * 4. Admin reviews via Quick Search portal
 * 5. Admin calls PATCH to verify or reject
 */
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()
        const outsetaId = getOutsetaUserId(user)

        if (!user || !outsetaId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { shield_id } = await request.json()

        if (!shield_id || typeof shield_id !== 'string') {
            return NextResponse.json({ error: 'ShieldID/ABC# is required' }, { status: 400 })
        }

        // Basic format validation for ABC# (e.g., TX750781032)
        // Format: 2-letter state code + 9 digits, or just alphanumeric
        const cleanId = shield_id.trim().toUpperCase()
        if (cleanId.length < 5 || cleanId.length > 20) {
            return NextResponse.json({ error: 'Invalid ShieldID format. Please double-check your ABC#.' }, { status: 400 })
        }

        const supabase = createServiceRoleClient()

        // Get profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, background_check_status')
            .or(`outseta_person_uid.eq.${outsetaId},user_id.eq.${outsetaId}`)
            .limit(1)
            .single()

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        // Don't allow re-submission if already verified
        if (profile.background_check_status === 'verified') {
            return NextResponse.json({ error: 'Background check is already verified' }, { status: 400 })
        }

        // Update profile with ShieldID and set status to pending
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                shield_id: cleanId,
                background_check_status: 'pending_verification',
                shield_id_submitted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id)

        if (updateError) {
            console.error('ShieldID update error:', updateError)
            return NextResponse.json({ error: 'Failed to save ShieldID' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            status: 'pending_verification',
            shieldId: cleanId,
            message: 'Your ShieldID has been submitted. Our team will verify it within 1-2 business days.'
        })

    } catch (error: any) {
        console.error('Background check POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * PATCH /api/background-check
 * Admin verifies or rejects a member's ShieldID
 * 
 * Body: { 
 *   profile_id: string,
 *   action: 'verify' | 'reject',
 *   ic_rating?: string,  // IC01, IC02, IC03, IC04
 *   notes?: string
 * }
 * 
 */
export async function PATCH(request: Request) {
    try {
        const user = await getCurrentUser()
        const outsetaId = getOutsetaUserId(user)

        if (!user || !outsetaId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = createServiceRoleClient()

        let isAdmin = await isBackgroundCheckAdmin(user, outsetaId, async (id) => {
            const roleMappingTable = process.env.ROLE_MAPPING_TABLE || 'user_role_mappings'
            const { data, error } = await supabase
                .from(roleMappingTable)
                .select('role, permissions')
                .or(`outseta_person_uid.eq.${id},user_id.eq.${id}`)
                .limit(1)
                .maybeSingle()

            if (error) {
                console.error('[BACKGROUND_CHECK][ADMIN_AUTH] Failed to load role claims from mapping table', {
                    roleMappingTable,
                    outsetaId: id,
                    code: error.code,
                    message: error.message,
                })
                return null
            }

            return data
        })

        const ADMIN_IDS = process.env.ADMIN_OUTSETA_IDS?.split(',') || []
        if (ADMIN_IDS.includes(outsetaId) || user.email === 'autumn.williams@nestedobjects.com' || user.email === 'syre.gibson@nestedobjects.com' || user.email === 'autumn.s.williams@gmail.com') {
            isAdmin = true
        }

        if (!isAdmin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const { profile_id, action, ic_rating, notes } = await request.json()

        if (!profile_id || !action) {
            return NextResponse.json({ error: 'profile_id and action are required' }, { status: 400 })
        }

        if (!['verify', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Action must be "verify" or "reject"' }, { status: 400 })
        }

        if (action === 'verify') {
            // Verify the background check
            const updateData: any = {
                background_check_status: 'verified',
                background_check_verified_at: new Date().toISOString(),
                background_check_notes: notes || null,
                updated_at: new Date().toISOString(),
            }

            if (ic_rating) {
                updateData.shield_ic_rating = ic_rating
            }

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', profile_id)

            if (error) throw error

            console.info('[BACKGROUND_CHECK][AUDIT]', {
                action: 'verify',
                profile_id,
                verified_by_outseta_id: outsetaId,
                verified_by_email: user.email || null,
                occurred_at: new Date().toISOString(),
            })

            // Recalculate trust score
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', profile_id)
                .single()

            if (profile) {
                // Ensure profileToCalculate has the newly set verified status
                const profileToCalculate = {
                    ...profile,
                    background_check_status: 'verified'
                }
                const { total: newTotal, tier, breakdown } = calculateTrustScore(profileToCalculate)

                await supabase
                    .from('profiles')
                    .update({
                        trust_score: newTotal,
                        trust_tier: tier,
                        trust_score_breakdown: breakdown,
                    })
                    .eq('id', profile_id)
            }

            return NextResponse.json({ success: true, status: 'verified' })

        } else {
            // Reject
            const { error } = await supabase
                .from('profiles')
                .update({
                    background_check_status: 'rejected',
                    background_check_notes: notes || 'ShieldID could not be verified. Please double-check your ABC# and resubmit.',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', profile_id)

            if (error) throw error

            console.info('[BACKGROUND_CHECK][AUDIT]', {
                action: 'reject',
                profile_id,
                verified_by_outseta_id: outsetaId,
                verified_by_email: user.email || null,
                occurred_at: new Date().toISOString(),
            })

            return NextResponse.json({ success: true, status: 'rejected' })
        }

    } catch (error: any) {
        console.error('Background check PATCH error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
