// @ts-nocheck
/* eslint-disable */
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { TrainingQuestion } from '@/types/training'
import QuizEngine from '@/components/training/QuizEngine'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ModuleQuizPage() {
    const params = useParams()
    const moduleId = params.moduleId as string
    const router = useRouter()
    const [questions, setQuestions] = useState<TrainingQuestion[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchQuestions = async () => {
            if (!moduleId) return

            try {
                const { data, error } = await supabase
                    .from('training_questions')
                    .select('*')
                    .eq('module_id', moduleId)
                    .order('order_index')

                if (error) throw error
                setQuestions(data as TrainingQuestion[])
            } catch (err) {
                console.error('Error fetching questions:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchQuestions()
    }, [moduleId])

    const handleQuizComplete = async (score: number) => {
        try {
            const passed = score >= 80

            await fetch('/api/training/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    module_id: moduleId,
                    resource_type: 'quiz',
                    status: 'completed',
                    quiz_score: score,
                    quiz_passed: passed
                })
            })

            // Note: QuizEngine handles the "Completed" UI state. 
            // We just save the data here silently or we could redirect?
            // QuizEngine current implementation stays on the "Passed/Failed" screen with a "Return" button.
            // That works.

        } catch (err) {
            console.error('Failed to save quiz results', err)
        }
    }

    if (loading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading assessment...</div>
    }

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto mb-8">
                <Link
                    href={`/training/${moduleId}`}
                    className="inline-flex items-center text-sm text-slate-500 hover:text-brand-copper transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Module
                </Link>
                <h1 className="text-3xl font-bold text-brand-dark mt-4">Module Assessment</h1>
                <p className="text-slate-600 mt-2">Complete this quiz to prove your mastery of the material.</p>
            </div>

            <QuizEngine
                questions={questions}
                onComplete={handleQuizComplete}
                moduleId={moduleId}
            />
        </main>
    )
}
