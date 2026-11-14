export async function saveTrainingQuiz(input: { module_id: string; score: number; total_questions: number }, fetcher: typeof fetch = fetch): Promise<{ saved: boolean; passed: boolean }> {
  try {
    const response = await fetcher('/api/training/quiz-complete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
      body: JSON.stringify({ ...input, passed: input.score >= 80 }),
    })
    if (response.status !== 200) return { saved: false, passed: false }
    const receipt = await response.json()
    if (receipt?.success !== true || typeof receipt.passed !== 'boolean' || receipt.score !== input.score) return { saved: false, passed: false }
    if (receipt.passed && !receipt.completedModuleIds?.includes(input.module_id)) return { saved: false, passed: false }
    return { saved: true, passed: receipt.passed }
  } catch { return { saved: false, passed: false } }
}
