export async function persistQuizCompletion({
    supabase,
    outsetaId,
    moduleId,
    score,
    passed,
}) {
    const { count: existingAttempts } = await supabase
        .from('quiz_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', outsetaId)
        .eq('module_id', moduleId)

    const attemptNumber = (existingAttempts || 0) + 1

    const { error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
            user_id: outsetaId,
            module_id: moduleId,
            attempt_number: attemptNumber,
            score,
            passed,
            answers: null,
            completed_at: new Date().toISOString(),
        })

    if (attemptError && passed) {
        return {
            ok: false,
            status: 500,
            error: {
                code: 'QUIZ_PERSISTENCE_FAILED',
                message: 'Unable to save your passing quiz result. Please retry.',
                retryable: true,
            },
        }
    }

    await supabase
        .from('training_progress')
        .upsert({
            user_id: outsetaId,
            module_id: moduleId,
            lesson_id: 'quiz',
            resource_type: 'quiz',
            status: passed ? 'completed' : 'failed',
            quiz_score: score,
            quiz_passed: passed,
            updated_at: new Date().toISOString(),
        })

    if (!passed) {
        return { ok: true, attemptNumber }
    }

    const { data: allPassed } = await supabase
        .from('quiz_attempts')
        .select('module_id, score')
        .eq('user_id', outsetaId)
        .eq('passed', true)

    const passedModuleMap = new Map()
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
