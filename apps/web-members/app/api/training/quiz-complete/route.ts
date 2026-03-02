import { NextResponse } from 'next/server'
import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-admin'
import { persistQuizCompletion } from './quiz-complete-service'
import {
    getLookupUserIds,
    logNoRowsTelemetry,
    resolveTrainingIdentity,
    runTrainingUserIdMigrationOncePerRuntime,
} from '@/lib/training-identity'

export const dynamic = 'force-dynamic'

const PROFILE_SELECT =
    'id, user_id, outseta_person_uid, trust_score, trust_score_breakdown, training_modules_completed, background_check_status'

/**
 * POST /api/training/quiz-complete
 * 
 * Called when a member finishes a module quiz.
 * - Records the quiz attempt
 * - If passed (≥80%), marks module as complete
 * - Recalculates trust score
 * - Updates profile with new score and training count
 * 
 * Body: { module_id: string, score: number, passed: boolean, total_questions: number }
 */
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()
        const outsetaId = getOutsetaUserId(user)

        if (!user || !outsetaId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { module_id, score, passed, total_questions } = await request.json()

        if (!module_id || score === undefined || passed === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = createServiceRoleClient()

        const identity = await resolveTrainingIdentity({
            supabase,
            outsetaId,
            user,
            profileSelect: PROFILE_SELECT,
        })

        if (!identity) {
            console.error(`[QUIZ] Profile not found or could not be created for outsetaId: ${outsetaId}, email: ${user.email}`)
            return NextResponse.json({ error: 'Profile not found and creation failed', outsetaId, email: user.email }, { status: 404 })
        }

        await runTrainingUserIdMigrationOncePerRuntime(supabase, identity)

        const profile = identity.profile
        const lookupIds = getLookupUserIds(identity)

        console.log(`[QUIZ] User ${identity.canonicalUserId} (profile ${profile.id}) completed quiz for module ${module_id}: score=${score}, passed=${passed}`)

        const persistenceResult = await persistQuizCompletion({
            supabase,
            outsetaId,
            moduleId: module_id,
            score,
            passed,
        })

        if (!persistenceResult.ok) {
            return NextResponse.json({
                success: false,
                error: persistenceResult.error.message,
                code: persistenceResult.error.code,
                retryable: persistenceResult.error.retryable,
            }, { status: persistenceResult.status })
        }

        const { attemptNumber } = persistenceResult

        // 5. If passed, count total passed modules and recalculate trust score
        if (passed) {
            const modulesCompleted = persistenceResult.modulesCompleted || 0
            const completedModuleIds = persistenceResult.completedModuleIds || []

            // Re-query scores to preserve trust score behavior
            const { data: allPassed } = await supabase
                .from('quiz_attempts')
                .select('module_id, score')
                .eq('user_id', identity.canonicalUserId)
                .eq('passed', true)

            const passedScoresByModule = new Map<string, number>()
            ;(allPassed || []).forEach((a: { module_id: string; score: number }) => {
                const existing = passedScoresByModule.get(a.module_id) || 0
                passedScoresByModule.set(a.module_id, Math.max(existing, a.score))
            })
            const quizScores = Array.from(passedScoresByModule.values())

            // Get total modules count
            const { count: totalModules } = await supabase
                .from('training_modules')
                .select('id', { count: 'exact', head: true })
                .eq('is_active', true)

            // 6. Calculate trust score
            const breakdown = calculateTrustScore({
                modulesCompleted,
                totalModules: totalModules || 8,
                quizScores,
                backgroundCheckStatus: profile.background_check_status || 'not_started',
                existingBreakdown: profile.trust_score_breakdown as Record<string, number> | null,
            })

            // 7. Update profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    training_modules_completed: modulesCompleted,
                    training_modules_total: totalModules || 8,
                    trust_score: breakdown.total,
                    trust_tier: breakdown.tier,
                    trust_score_breakdown: breakdown.breakdown,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile.id)

            if (profileError) {
                console.error('[QUIZ] Profile update error:', profileError)
            }

            return NextResponse.json({
                success: true,
                passed: true,
                score,
                attemptNumber,
                modulesCompleted,
                completedModuleIds,
                trustScore: breakdown.total,
                trustTier: breakdown.tier,
                trustScoreBreakdown: breakdown.breakdown,
            })
        }

        // Quiz failed — return without updating trust score
        return NextResponse.json({
            success: true,
            passed: false,
            score,
            attemptNumber,
            message: 'You need 80% to pass. Review the material and try again.'
        })

    } catch (error: any) {
        console.error('[QUIZ] Unexpected error:', error)
        return NextResponse.json({
            error: 'Internal server error',
            details: error?.message
        }, { status: 500 })
    }
}

/**
 * Trust Score Calculation
 * 
 * Max 100 points distributed across categories:
 * 
 * Training (40 pts max)
 *   - 5 pts per module passed (up to 40 pts for 8 modules)
 * 
 * Background Check (25 pts max)
 *   - 25 pts if completed/verified
 *   - 5 pts if in_progress/pending_verification
 *   - 0 pts if not_started
 * 
 * Profile/Identity/Tenure/Inspections/Activity
 *   - Preserved from existing breakdown values
 */
function calculateTrustScore(params: {
    modulesCompleted: number
    totalModules: number
    quizScores: number[]
    backgroundCheckStatus: string
    existingBreakdown: Record<string, number> | null
}) {
    const { modulesCompleted, backgroundCheckStatus, existingBreakdown } = params

    // Training score (max 40) — 5 pts per module
    const trainingScore = Math.min(modulesCompleted * 5, 40)

    // Background check score (max 25)
    let backgroundScore = existingBreakdown?.background || 0
    if (backgroundCheckStatus === 'completed' || backgroundCheckStatus === 'verified') {
        backgroundScore = 25
    } else if (backgroundCheckStatus === 'in_progress' || backgroundCheckStatus === 'pending_verification') {
        backgroundScore = 5
    }

    // Preserve all other existing breakdown values
    const profileScore = existingBreakdown?.profile || existingBreakdown?.profile_completeness || 0
    const identityScore = existingBreakdown?.identity || 0
    const tenureScore = existingBreakdown?.tenure || 0
    const inspectionsScore = existingBreakdown?.inspections || 0
    const activityScore = existingBreakdown?.activity || 0

    const total = Math.min(
        trainingScore + backgroundScore + profileScore + identityScore + tenureScore + inspectionsScore + activityScore,
        100
    )

    // Determine tier
    let tier = 'bronze'
    if (total >= 80) tier = 'platinum'
    else if (total >= 60) tier = 'gold'
    else if (total >= 40) tier = 'silver'

    return {
        total,
        tier,
        breakdown: {
            training: trainingScore,
            background: backgroundScore,
            profile: profileScore,
            identity: identityScore,
            tenure: tenureScore,
            inspections: inspectionsScore,
            activity: activityScore,
        }
    }
}
