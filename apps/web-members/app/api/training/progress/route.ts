import { NextResponse } from 'next/server'
import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// Shared robust profile lookup/creation function
async function getOrCreateProfile(supabase: any, outsetaId: string, user: any) {
    // 1. Try lookup by outseta_person_uid or user_id
    let { data: profile } = await supabase
        .from('profiles')
        .select('id, user_id, outseta_person_uid')
        .or(`outseta_person_uid.eq.${outsetaId},user_id.eq.${outsetaId}`)
        .limit(1)
        .single()

    // 2. Try by email if not found
    if (!profile && user.email) {
        const { data: emailProfile } = await supabase
            .from('profiles')
            .select('id, user_id, outseta_person_uid')
            .eq('email', user.email)
            .single()

        if (emailProfile) {
            // Self-heal: update missing Outseta IDs
            const updatePayload: any = {}
            if (!emailProfile.outseta_person_uid) updatePayload.outseta_person_uid = outsetaId
            if (!emailProfile.user_id) updatePayload.user_id = outsetaId

            if (Object.keys(updatePayload).length > 0) {
                await supabase.from('profiles').update(updatePayload).eq('id', emailProfile.id)
            }
            profile = emailProfile
        }
    }

    // 3. Create if still not found
    if (!profile) {
        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
                user_id: outsetaId,
                outseta_person_uid: outsetaId,
                email: user.email,
                full_name: user.name || 'Unknown User',
                updated_at: new Date().toISOString()
            })
            .select('id, user_id, outseta_person_uid')
            .single()

        if (createError || !newProfile) {
            console.error('[PROGRESS] Failed to create profile:', createError)
            return null
        }
        profile = newProfile
    }

    return profile
}

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser()
        const outsetaId = getOutsetaUserId(user)

        if (!user || !outsetaId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = createServiceRoleClient()
        const { searchParams } = new URL(request.url)
        const moduleId = searchParams.get('moduleId')

        // Fetch or create profile on GET to ensure it's ready for any future saves
        const profile = await getOrCreateProfile(supabase, outsetaId, user)

        if (!profile) {
            return NextResponse.json({ completedModuleIds: [], progress: [] })
        }

        // IF moduleId is provided, fetch granular progress for that module
        if (moduleId) {
            const { data: progress } = await supabase
                .from('training_progress')
                .select('lesson_id, resource_type, status')
                .eq('user_id', outsetaId) // Use Outseta string ID lookup
                .eq('module_id', moduleId)

            return NextResponse.json({ progress: progress || [], completedModuleIds: [] })
        }

        // ELSE fetch ALL completed modules based on PASSED QUIZZES (Source of Truth)
        const { data: passedQuizzes } = await supabase
            .from('quiz_attempts')
            .select('module_id')
            .eq('user_id', outsetaId)
            .eq('passed', true)

        const completedModuleIds = Array.from(new Set(passedQuizzes?.map((q: any) => q.module_id) || []))

        return NextResponse.json({ completedModuleIds })

    } catch (error) {
        console.error('Error in training/progress GET:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()
        const outsetaId = getOutsetaUserId(user)

        if (!user || !outsetaId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const json = await request.json()
        const { module_id, lesson_id, resource_type, status, quiz_score, quiz_passed } = json

        const supabase = createServiceRoleClient()

        // 1. Get or Create Profile ID 
        const profile = await getOrCreateProfile(supabase, outsetaId, user)

        if (!profile) {
            return NextResponse.json({
                error: 'Profile not found and creation failed',
                outsetaId
            }, { status: 500 })
        }

        // 2. Upsert Progress
        const { error: progressError } = await supabase
            .from('training_progress')
            .upsert({
                user_id: outsetaId, // String Outseta ID
                module_id,
                lesson_id,
                resource_type,
                status,
                quiz_score,
                quiz_passed,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id, module_id, lesson_id, resource_type' // Need explicitly granular key
            })

        if (progressError) {
            console.error('[PROGRESS] Error inserting into training_progress:', progressError)
            throw progressError
        }

        // 3. Sync to quiz_attempts (Legacy/Dashboard support) if quiz passed
        if (quiz_passed || (status === 'completed' && resource_type === 'quiz')) {
            const { error: qaError } = await supabase
                .from('quiz_attempts')
                .upsert({
                    user_id: outsetaId,     // String Outseta ID
                    module_id,
                    passed: true,
                    score: quiz_score || 100,
                    completed_at: new Date().toISOString()
                })
            if (qaError) {
                console.error('[PROGRESS] Error inserting into quiz_attempts:', qaError)
            }
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Error updating progress POST:', error)
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error?.message,
            code: error?.code
        }, { status: 500 })
    }
}