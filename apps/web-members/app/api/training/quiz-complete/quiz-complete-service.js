export async function persistQuizCompletion({
    supabase,
    userId,
    profileId,
    previousCompletedModuleIds = [],
    moduleId,
    score,
    passed,
}) {
    const { count: existingAttempts, error: countError } = await supabase
        .from('quiz_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('module_id', moduleId)

    if (countError) return { ok: false, status: 503, error: { code: 'QUIZ_HISTORY_UNAVAILABLE', message: 'Unable to check assessment history. Please retry.', retryable: true } }
    const attemptNumber = (existingAttempts || 0) + 1

    const { error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
            user_id: userId,
            ...(profileId ? { profile_id: profileId } : {}),
            module_id: moduleId,
            attempt_number: attemptNumber,
            score,
            passed,
            answers: null,
            completed_at: new Date().toISOString(),
        })

    if (attemptError) {
        console.error('[QUIZ] Assessment persistence failed')
        return { ok: false, status: 500, error: { code: 'QUIZ_PERSISTENCE_FAILED', message: 'Unable to save your assessment result. Please retry.', retryable: true } }
    }

    // A later failed retake must not overwrite an already earned completion.
    if (passed || !previousCompletedModuleIds.includes(moduleId)) {
        const { error: progressError } = await supabase
            .from('training_progress')
            .upsert({
                user_id: userId,
                module_id: moduleId,
                lesson_id: 'quiz',
                resource_type: 'quiz',
                status: passed ? 'completed' : 'failed',
                quiz_score: score,
                quiz_passed: passed,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,module_id,lesson_id,resource_type' })
        if (progressError) console.warn('[QUIZ] Assessment saved; progress summary update unavailable')
    }

    if (!passed) {
        return { ok: true, attemptNumber }
    }

    const { data: allPassed, error: historyError } = await supabase
        .from('quiz_attempts')
        .select('module_id, score')
        .eq('user_id', userId)
        .eq('passed', true)

    // The inserted attempt remains authoritative even if the summary read fails.
    if (historyError) console.warn('[QUIZ] Assessment saved; history summary unavailable')
    const passedModuleMap = new Map(previousCompletedModuleIds.map(id => [id, 0]))
    passedModuleMap.set(moduleId, score)
    allPassed?.forEach((attempt) => {
        const existing = passedModuleMap.get(attempt.module_id) || 0
        passedModuleMap.set(attempt.module_id, Math.max(existing, attempt.score))
    })

    return {
        ok: true,
        attemptNumber,
        modulesCompleted: passedModuleMap.size,
        completedModuleIds: Array.from(passedModuleMap.keys()),
    }
}
