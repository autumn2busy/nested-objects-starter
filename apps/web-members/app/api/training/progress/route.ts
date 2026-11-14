import { NextResponse } from 'next/server'
import { canOpenTrainingModule, readTrainingAccess } from '@/lib/training-access'

import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-admin'
import {
    resolveTrainingIdentity,
    runTrainingUserIdMigrationOncePerRuntime,
} from '@/lib/training-identity'

export const dynamic = 'force-dynamic'

const PROFILE_SELECT = 'id, user_id, outseta_person_uid'

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser()
        if (!user?.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const supabase = createServiceRoleClient()
        const state = await readTrainingAccess(supabase, user)
        const moduleId = new URL(request.url).searchParams.get('moduleId')
        if (moduleId) {
            const trainingModule = state.modules.find(item => item.id === moduleId || item.slug === moduleId)
            if (!trainingModule || !canOpenTrainingModule(user['outseta:planUid'], trainingModule, state)) {
                return NextResponse.json({ error: 'Training access required' }, { status: 403 })
            }
            const { data, error } = await supabase.from('training_progress')
                .select('lesson_id,resource_type,status').in('user_id', state.lookupUserIds).eq('module_id', trainingModule.id)
            if (error) throw new Error('Training lesson progress unavailable')
            return NextResponse.json({ progress: data || [], completedModuleIds: state.completedModuleIds, waivedModuleIds: state.waivedModuleIds })
        }
        return NextResponse.json({ completedModuleIds: state.completedModuleIds, waivedModuleIds: state.waivedModuleIds })
    } catch {
        return NextResponse.json({ error: 'Training progress is temporarily unavailable' }, { status: 503 })
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

        const state = await readTrainingAccess(supabase, user)
        const trainingModule = state.modules.find(item => item.id === module_id)
        if (!trainingModule || !canOpenTrainingModule(user['outseta:planUid'], trainingModule, state)) {
            return NextResponse.json({ error: 'Training access required' }, { status: 403 })
        }
        // Quiz results belong to the dedicated persistence path, never lesson updates.
        if (resource_type !== 'lesson' || status !== 'completed' || quiz_passed !== undefined || quiz_score !== undefined) {
            return NextResponse.json({ error: 'Unsupported progress update' }, { status: 400 })
        }
        const lesson = await supabase.from('training_lessons').select('id').eq('id', lesson_id).eq('module_id', trainingModule.id).maybeSingle()
        if (lesson.error) throw new Error('Lesson lookup unavailable')
        if (!lesson.data) return NextResponse.json({ error: 'Lesson not found' }, { status: 400 })
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
