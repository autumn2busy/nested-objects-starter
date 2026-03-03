export type PersistQuizCompletionParams = {
  supabase: any
  userId: string
  moduleId: string
  score: number
  passed: boolean
}

export type PersistQuizCompletionResult =
  | {
    ok: true
    attemptNumber: number
    modulesCompleted?: number
    completedModuleIds?: string[]
  }
  | {
    ok: false
    status: number
    error: {
      code: string
      message: string
      retryable: boolean
    }
  }

export function persistQuizCompletion(
  params: PersistQuizCompletionParams,
): Promise<PersistQuizCompletionResult>
