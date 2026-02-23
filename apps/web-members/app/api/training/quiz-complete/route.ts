import { NextResponse } from 'next/server'
import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

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

        // 1. Get or create profile
        let { data: profile } = await supabase
            .from('profiles')
            .select('id, user_id, trust_score, trust_score_breakdown, training_modules_completed, background_check_status')
            .or(`outseta_person_uid.eq.${outsetaId},user_id.eq.${outsetaId}`)
            .limit(1)
            .single()

        if (!profile) {
            // Try by email
            if (user.email) {
                const { data: emailProfile } = await supabase
                    .from('profiles')
                    .select('id, user_id, trust_score, trust_score_breakdown, training_modules_completed, background_check_status')
                    .eq('email', user.email)
                    .single()
                if (emailProfile) {
                    profile = emailProfile
                    // Self-heal user_id
                    await supabase.from('profiles').update({ user_id: outsetaId }).eq('id', emailProfile.id)
                }
            }
        }

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        // 2. Record quiz attempt
        const { error: attemptError } = await supabase
            .from('quiz_attempts')
            .upsert({
                user_id: outsetaId,
                module_id,
                score,
                passed,
                total_questions: total_questions || 0,
                completed_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,module_id'
            })

        if (attemptError) {
            console.error('Quiz attempt upsert error:', attemptError)
            // Don't fail — continue with progress update
        }

        // 3. Also update training_progress table
        await supabase
            .from('training_progress')
            .upsert({
                user_id: outsetaId,
                module_id,
                lesson_id: 'quiz',
                resource_type: 'quiz',
                status: passed ? 'completed' : 'failed',
                quiz_score: score,
                quiz_passed: passed,
                updated_at: new Date().toISOString()
            })

        // 4. If passed, count total passed modules and recalculate trust score
        if (passed) {
            // Count all passed quiz attempts for this user
            const { data: allPassed } = await supabase
                .from('quiz_attempts')
                .select('module_id, score')
                .eq('user_id', outsetaId)
                .eq('passed', true)

            const modulesCompleted = allPassed?.length || 0

            // Get total modules count
            const { count: totalModules } = await supabase
                .from('training_modules')
                .select('id', { count: 'exact', head: true })
                .eq('is_active', true)

            // 5. Calculate trust score
            const breakdown = calculateTrustScore({
                modulesCompleted,
                totalModules: totalModules || 6,
                quizScores: allPassed?.map(a => a.score) || [],
                backgroundCheckStatus: profile.background_check_status || 'not_started',
                profileComplete: true, // TODO: check actual profile completeness
                existingBreakdown: profile.trust_score_breakdown as Record<string, number> | null,
            })

            // 6. Update profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    training_modules_completed: modulesCompleted,
                    training_modules_total: totalModules || 6,
                    trust_score: breakdown.total,
                    trust_tier: breakdown.tier,
                    trust_score_breakdown: breakdown.breakdown,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile.id)

            if (profileError) {
                console.error('Profile update error:', profileError)
            }

            return NextResponse.json({
                success: true,
                passed: true,
                score,
                modulesCompleted,
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
            message: 'You need 80% to pass. Review the material and try again.'
        })

    } catch (error: any) {
        console.error('Quiz complete error:', error)
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
 *   - 5 pts per module passed (up to 30 pts for 6 modules)
 *   - 10 pts bonus for average quiz score ≥ 90%
 * 
 * Background Check (25 pts max)
 *   - 25 pts if completed/verified
 *   - 5 pts if in_progress
 *   - 0 pts if not_started
 * 
 * Profile Completeness (15 pts max)
 *   - 15 pts for a complete profile
 *   - Partial credit based on fields filled
 * 
 * Platform Activity (20 pts max)
 *   - Reserved for future: inspections completed, response rate, etc.
 *   - For now, give 5 pts base for being an active member
 */
function calculateTrustScore(params: {
    modulesCompleted: number
    totalModules: number
    quizScores: number[]
    backgroundCheckStatus: string
    profileComplete: boolean
    existingBreakdown: Record<string, number> | null
}) {
    const { modulesCompleted, quizScores, backgroundCheckStatus, profileComplete, existingBreakdown } = params

    // Training score (max 40)
    const modulePoints = Math.min(modulesCompleted * 5, 30)
    const avgScore = quizScores.length > 0 ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length : 0
    const quizBonus = avgScore >= 90 ? 10 : avgScore >= 80 ? 5 : 0
    const trainingScore = modulePoints + quizBonus

    // Background check score (max 25)
    let backgroundScore = 0
    if (backgroundCheckStatus === 'completed' || backgroundCheckStatus === 'verified') {
        backgroundScore = 25
    } else if (backgroundCheckStatus === 'in_progress') {
        backgroundScore = 5
    }

    // Profile completeness (max 15)
    // For now, use existing value if available, or give base 8 pts
    const profileScore = existingBreakdown?.profile || (profileComplete ? 8 : 3)

    // Platform activity (max 20)
    // Preserve existing activity score, or give base 5 pts for being a member
    const activityScore = existingBreakdown?.activity || 5

    const total = Math.min(trainingScore + backgroundScore + profileScore + activityScore, 100)

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
            activity: activityScore,
        }
    }
}