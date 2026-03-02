import { NextResponse } from 'next/server'
import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-admin'
import {
    getLookupUserIds,
    logRowsetTelemetry,
    resolveTrainingIdentity,
    runTrainingUserIdMigrationPerRuntime,
} from '@/lib/training-identity'

export const dynamic = 'force-dynamic'

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

        const identity = await resolveTrainingIdentity({ supabase, outsetaId, user })

        if (!identity) {
            return NextResponse.json({ completedModuleIds: [], progress: [] })
        }

        await runTrainingUserIdMigrationPerRuntime(supabase, identity)
        const lookupIds = getLookupUserIds(identity)

        // IF moduleId is provided, fetch granular progress for that module
        if (moduleId) {
            const { data: progress } = await supabase
                .from('training_progress')
                .select('lesson_id, resource_type, status')
                .in('user_id', lookupIds)
                .eq('module_id', moduleId)

            if (!progress?.length) {
                logRowsetTelemetry('PROGRESS:GET_MODULE', identity, { moduleId })
            }

            return NextResponse.json({ progress: progress || [], completedModuleIds: [] })
        }

        // ELSE fetch ALL completed modules based on PASSED QUIZZES (Source of Truth)
        const { data: passedQuizzes } = await supabase
            .from('quiz_attempts')
            .select('module_id')
            .in('user_id', lookupIds)
            .eq('passed', true)

        if (!passedQuizzes?.length) {
            logRowsetTelemetry('PROGRESS:GET_COMPLETED_MODULES', identity)
        }

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

        const identity = await resolveTrainingIdentity({ supabase, outsetaId, user })

        if (!identity) {
            return NextResponse.json({
                error: 'Profile not found and creation failed',
                outsetaId
            }, { status: 500 })
        }

        await runTrainingUserIdMigrationPerRuntime(supabase, identity)

        // 2. Upsert Progress
        const { error: progressError } = await supabase
            .from('training_progress')
            .upsert({
                user_id: identity.canonicalUserId,
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
                    user_id: identity.canonicalUserId,
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
