
import { NextResponse } from 'next/server'
import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-admin'

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

        // 1. Get Supabase User ID from Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', outsetaId)
            .single()

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

        // ELSE fetch ALL completed modules (Source of Truth)
        const { data: completed } = await supabase
            .from('training_progress')
            .select('module_id')
            .eq('user_id', outsetaId) // Use Outseta string ID lookup
            .eq('status', 'completed')

        const completedModuleIds = Array.from(new Set(completed?.map((c: any) => c.module_id) || []))

        return NextResponse.json({ completedModuleIds })

    } catch (error) {
        console.error('Error in training/progress:', error)
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

        // 1. Get Profile ID
        let { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', outsetaId)
            .single()

        if (!profile) {
            console.log(`Profile not found for outsetaId: ${outsetaId}. Attempting to create...`)

            // Attempt to create profile (Auto-provisioning)
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                    user_id: outsetaId,
                    user_email: user.email || `missing_email_${outsetaId}@placeholder.com`,
                    full_name: user.name || 'Unknown User',
                    updated_at: new Date().toISOString()
                })
                .select('id')
                .single()

            if (createError || !newProfile) {
                console.error('Failed to create profile:', createError)
                return NextResponse.json({
                    error: 'Profile not found and creation failed',
                    details: createError?.message,
                    outsetaId
                }, { status: 500 })
            }

            profile = newProfile
        }

        // 2. Upsert Progress
        const { error } = await supabase
            .from('training_progress')
            .upsert({
                user_id: outsetaId, // Using string Outseta ID as required by new schema
                // profile_id: profile.id, // Optional link to UUID if column exists
                module_id,
                lesson_id,
                resource_type,
                status,
                quiz_score,
                quiz_passed,
                updated_at: new Date().toISOString()
            })

        if (error) throw error

        // 3. Sync to quiz_attempts (Legacy/Dashboard support) if quiz passed
        if (quiz_passed || (status === 'completed' && resource_type === 'quiz')) {
            await supabase
                .from('quiz_attempts')
                .upsert({
                    user_id: outsetaId, // Using string Outseta ID
                    module_id,
                    passed: true,
                    score: quiz_score || 100,
                    completed_at: new Date().toISOString()
                })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error updating progress:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
