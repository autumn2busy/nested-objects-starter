import { test } from 'node:test'
import assert from 'node:assert/strict'
import { persistQuizCompletion } from '../app/api/training/quiz-complete/quiz-complete-service.js'

class MockSupabase {
    constructor() {
        this.quizAttempts = []
        this.trainingProgress = []
    }

    from(table) {
        const self = this
        const filters = {}

        return {
            select(_fields, options) {
                if (table === 'quiz_attempts' && options?.head && options?.count === 'exact') {
                    return {
                        eq(col, value) {
                            filters[col] = value
                            return this
                        },
                        then(resolve) {
                            const count = self.quizAttempts.filter(
                                (row) => row.user_id === filters.user_id && row.module_id === filters.module_id,
                            ).length
                            resolve({ count, error: null })
                        },
                    }
                }

                return {
                    eq(col, value) {
                        filters[col] = value
                        return this
                    },
                    then(resolve) {
                        if (table === 'quiz_attempts') {
                            const data = self.quizAttempts
                                .filter((row) => row.user_id === filters.user_id && row.passed === filters.passed)
                                .map((row) => ({ module_id: row.module_id, score: row.score }))
                            resolve({ data, error: null })
                            return
                        }
                        resolve({ data: [], error: null })
                    },
                }
            },
            insert(payload) {
                if (table === 'quiz_attempts') self.quizAttempts.push(payload)
                return Promise.resolve({ error: null })
            },
            upsert(payload) {
                if (table === 'training_progress') self.trainingProgress.push(payload)
                return Promise.resolve({ error: null })
            },
        }
    }
}

test('persistQuizCompletion writes passing attempt and returns completedModuleIds including module_id', async () => {
    const supabase = new MockSupabase()
    const result = await persistQuizCompletion({
        supabase,
        userId: 'user-123',
        moduleId: 'module-abc',
        score: 90,
        passed: true,
    })

    assert.equal(result.ok, true)
    assert.equal(result.attemptNumber, 1)
    assert.deepEqual(result.completedModuleIds, ['module-abc'])
    assert.equal(supabase.quizAttempts.length, 1)
    assert.equal(supabase.quizAttempts[0].attempt_number, 1)
})


test('a failed assessment insert returns an explicit retryable failure for passing and failing scores', async () => {
 for (const score of [73,93]) {
  const supabase=new MockSupabase(); const from=supabase.from.bind(supabase);
  supabase.from=(table)=>{const q=from(table);if(table==='quiz_attempts')q.insert=async()=>({error:{code:'fixture_failure'}});return q};
  const result=await persistQuizCompletion({supabase,userId:'user-123',moduleId:'module-abc',score,passed:score>=80});
  assert.equal(result.ok,false);assert.equal(result.error.retryable,true);assert.equal(supabase.trainingProgress.length,0);
 }
});
test('a later failed retake preserves previously saved passing progress', async () => {
 const supabase=new MockSupabase();
 await persistQuizCompletion({supabase,userId:'user-123',moduleId:'module-abc',score:93,passed:true});
 const prior=structuredClone(supabase.trainingProgress);
 const result=await persistQuizCompletion({supabase,userId:'user-123',moduleId:'module-abc',score:73,passed:false,previousCompletedModuleIds:['module-abc']});
 assert.equal(result.ok,true);assert.deepEqual(supabase.trainingProgress,prior);assert.equal(supabase.quizAttempts.length,2);assert.equal(supabase.quizAttempts[1].score,73);assert.equal(supabase.quizAttempts[1].passed,false);
});
