import { NextResponse } from 'next/server'
import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-admin'
import {
    getLookupUserIds,
    logNoRowsTelemetry,
    resolveTrainingIdentity,
    runTrainingUserIdMigrationOncePerRuntime,
} from '@/lib/training-identity'

export const dynamic = 'force-dynamic'

const PROFILE_SELECT = 'id, user_id, outseta_person_uid'

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

        const identity = await resolveTrainingIdentity({
            supabase,
            outsetaId,
            user,
            profileSelect: PROFILE_SELECT,
        })

        if (!identity) {
            return NextResponse.json({ completedModuleIds: [], progress: [] })
        }

        await runTrainingUserIdMigrationOncePerRuntime(supabase, identity)

        const lookupIds = getLookupUserIds(identity)

        if (moduleId) {
            const { data: canonicalProgress } = await supabase
                .from('training_progress')
                .select('lesson_id, resource_type, status')
                .eq('user_id', identity.canonicalUserId)
                .eq('module_id', moduleId)

            if ((canonicalProgress?.length || 0) > 0) {
                return NextResponse.json({ progress: canonicalProgress || [], completedModuleIds: [] })
            }

            const { data: fallbackProgress } = await supabase
                .from('training_progress')
                .select('lesson_id, resource_type, status')
                .in('user_id', lookupIds)
                .eq('module_id', moduleId)

            if ((fallbackProgress?.length || 0) === 0) {
                logNoRowsTelemetry('PROGRESS:GET_MODULE', identity, { moduleId })
            }

            return NextResponse.json({ progress: fallbackProgress || [], completedModuleIds: [] })
        }

        const { data: canonicalPassedQuizzes } = await supabase
            .from('quiz_attempts')
            .select('module_id')
            .eq('user_id', identity.canonicalUserId)
            .eq('passed', true)

        let passedQuizzes = canonicalPassedQuizzes || []

        if (passedQuizzes.length === 0) {
            const { data: fallbackPassedQuizzes } = await supabase
                .from('quiz_attempts')
                .select('module_id')
                .in('user_id', lookupIds)
                .eq('passed', true)

            passedQuizzes = fallbackPassedQuizzes || []

            if (passedQuizzes.length === 0) {
                logNoRowsTelemetry('PROGRESS:GET_COMPLETED_MODULES', identity)
            }
        }

        const completedModuleIds = Array.from(new Set(passedQuizzes.map((q: any) => q.module_id)))

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

        const identity = await resolveTrainingIdentity({
            supabase,
            outsetaId,
            user,
            profileSelect: PROFILE_SELECT,
        })

        if (!identity) {
            return NextResponse.json({ error: 'Profile not found and creation failed', outsetaId }, { status: 500 })
        }

        await runTrainingUserIdMigrationOncePerRuntime(supabase, identity)

        const { error: progressError } = await supabase
            .from('training_progress')
            .upsert(
                {
                    user_id: identity.canonicalUserId,
                    module_id,
                    lesson_id,
                    resource_type,
                    status,
                    quiz_score,
                    quiz_passed,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'user_id, module_id, lesson_id, resource_type',
                }
            )

        if (progressError) {
            console.error('[PROGRESS] Error inserting into training_progress:', progressError)
            throw progressError
        }

        if (quiz_passed || (status === 'completed' && resource_type === 'quiz')) {
            const { error: qaError } = await supabase.from('quiz_attempts').upsert({
                user_id: identity.canonicalUserId,
                module_id,
                passed: true,
                score: quiz_score || 100,
                completed_at: new Date().toISOString(),
            })
            if (qaError) {
                console.error('[PROGRESS] Error inserting into quiz_attempts:', qaError)
            }
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error updating progress POST:', error)
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                details: error?.message,
                code: error?.code,
            },
            { status: 500 }
        )
    }
}
