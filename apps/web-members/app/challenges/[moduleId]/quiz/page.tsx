// @ts-nocheck
/* eslint-disable */
'use client'

import { useEffect, useState, useRef } from 'react'
import { saveTrainingQuiz } from '@/lib/training-quiz-receipt'
import { useAuth } from '@/components/auth-provider'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { TrainingQuestion } from '@/types/training'
import QuizEngine from '@/components/training/QuizEngine'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ModuleQuizPage() {
    const params = useParams()
    const moduleId = params.moduleId as string
    const { user } = useAuth()
    const currentMember = useRef(user?.sub)
    currentMember.current = user?.sub
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const pendingScore = useRef<number | null>(null)
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

    useEffect(() => { setSaveStatus('idle'); pendingScore.current = null }, [user?.sub, moduleId])

    const handleQuizComplete = async (score: number) => {
        if (saveStatus === 'saving') return
        const member = user?.sub
        pendingScore.current = score
        setSaveStatus('saving')
        const receipt = await saveTrainingQuiz({ module_id: moduleId, score, total_questions: questions.length })
        if (currentMember.current === member) setSaveStatus(receipt.saved ? 'saved' : 'error')
    }

    if (loading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading assessment...</div>
    }

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto mb-8">
                <Link
                    href={`/challenges/${moduleId}`}
                    className="inline-flex items-center text-sm text-slate-500 hover:text-brand-copper transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Module
                </Link>
                <h1 className="text-3xl font-bold text-brand-dark mt-4">Module Assessment</h1>
                <p className="text-slate-600 mt-2">Complete this quiz to prove your mastery of the material.</p>
            </div>

            <QuizEngine
                key={String(user?.sub) + moduleId}
                questions={questions}
                saveStatus={saveStatus}
                onRetrySave={() => { if (pendingScore.current !== null) void handleQuizComplete(pendingScore.current) }}
                onComplete={handleQuizComplete}
                moduleId={moduleId}
            />
        </main>
    )
}
