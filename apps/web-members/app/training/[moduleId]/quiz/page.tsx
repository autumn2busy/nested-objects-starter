'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, CheckCircle, AlertCircle, Lock } from 'lucide-react'

type QuizQuestion = {
    id: string
    question: string
    options: string[]
    correct_answer: number // Index of correct option
    explanation?: string
}

export default function ModuleQuizPage() {
    const params = useParams()
    const router = useRouter()
    const moduleId = params.moduleId as string
    const [loading, setLoading] = useState(true)
    const [authorized, setAuthorized] = useState(false)
    const [questions, setQuestions] = useState<QuizQuestion[]>([])

    // Quiz State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<number, number>>({}) // qIndex -> selectedOptionIndex
    const [submitted, setSubmitted] = useState(false)
    const [score, setScore] = useState(0)

    const supabase = createClient()

    useEffect(() => {
        async function init() {
            if (!moduleId) return
            try {
                // 1. Verify Eligibility (All lessons must be complete)
                let isComplete = false
                try {
                    const res = await fetch(`/api/training/progress?moduleId=${moduleId}`)
                    if (res.ok) {
                        const { progress } = await res.json()
                        // We need access to total lessons count to verify "all"
                        // For this implementation, we'll fetch lessons count from Supabase again to be safe
                        const { count, error } = await supabase
                            .from('training_lessons')
                            .select('*', { count: 'exact', head: true })
                            .eq('module_id', moduleId)

                        // Count completed lessons
                        const completedCount = Array.isArray(progress)
                            ? progress.filter((p: any) => p.status === 'completed' && (p.resource_type === 'lesson' || !p.resource_type)).length
                            : 0

                        if (!error && count !== null && completedCount >= count) {
                            isComplete = true
                        }
                    }
                } catch (err) { console.error(err) }

                if (!isComplete) {
                    setAuthorized(false)
                    setLoading(false)
                    return
                }
                setAuthorized(true)

                // 2. Fetch Quiz Questions
                // Note: In a real app, you might want to fetch these from a dedicated table or JSON field in modules.
                // For this MVP, we will MOCK questions if none exist in DB, or fetch from a 'training_questions' table if created.
                // Checking if table exists or using Mock for demonstration as requested "Quiz Eligible Concepts" logic.

                // MOCK DATA for safety/demo if no DB table yet
                const mockQuestions: QuizQuestion[] = [
                    {
                        id: 'q1',
                        question: "What is the primary purpose of a Field Inspection?",
                        options: [
                            "To judge the homeowner's lifestyle",
                            "To verify the property condition and occupancy status",
                            "To repair minor damages found on site",
                            "To appraise the exact market value"
                        ],
                        correct_answer: 1
                    },
                    {
                        id: 'q2',
                        question: "When should you take photos of the street sign?",
                        options: [
                            "Only if it's a corner lot",
                            "Never, it violates privacy",
                            "At the beginning and end of every inspection to prove location",
                            "Only if the client specifically requests it in bold text"
                        ],
                        correct_answer: 2
                    },
                    {
                        id: 'q3',
                        question: "True or False: Personal opinions about the neighborhood should be included in the report.",
                        options: [
                            "True, it helps the bank decide",
                            "False, reports must be factual and objective"
                        ],
                        correct_answer: 1
                    }
                ]
                setQuestions(mockQuestions)

            } catch (error) {
                console.error("Quiz init error:", error)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [moduleId])

    const handleSelectOption = (optionIndex: number) => {
        if (submitted) return
        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }))
    }

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        } else {
            handleSubmit()
        }
    }

    const handleSubmit = async () => {
        // Calculate Score
        let correctCount = 0
        questions.forEach((q, index) => {
            if (answers[index] === q.correct_answer) correctCount++
        })
        const finalScore = Math.round((correctCount / questions.length) * 100)
        setScore(finalScore)
        setSubmitted(true)

        // Save Result
        try {
            await fetch('/api/training/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    module_id: moduleId,
                    status: 'completed', // Updates module level status if needed
                    quiz_score: finalScore
                })
            })
        } catch (err) { console.error('Failed to save quiz score', err) }
    }

    if (loading) return <div className="p-12 text-center text-slate-500">Loading Assessment...</div>

    if (!authorized) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center max-w-md">
                    <div className="mx-auto w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Assessment Locked</h1>
                    <p className="text-slate-600 mb-6">
                        You must complete all lessons in this module before taking the final assessment.
                    </p>
                    <Link href={`/training/${moduleId}`} className="btn-primary w-full justify-center">
                        Return to Lessons
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="mx-auto max-w-3xl px-4 py-6">
                    <Link
                        href={`/training/${moduleId}`}
                        className="text-sm font-semibold text-slate-500 hover:text-brand-dark flex items-center gap-2 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" /> Cancel & Exit
                    </Link>
                    <h1 className="text-2xl font-bold text-brand-dark">Module Assessment: Readiness Check</h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        This quiz only covers concepts explicitly taught in the lessons.
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-3xl px-4 py-8">
                {!submitted ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                        {/* Progress */}
                        <div className="mb-8 flex justify-between text-sm font-medium text-slate-400">
                            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                        </div>

                        {/* Question */}
                        <h2 className="text-lg font-bold text-slate-800 mb-6">
                            {questions[currentQuestionIndex].question}
                        </h2>

                        {/* Options */}
                        <div className="space-y-3">
                            {questions[currentQuestionIndex].options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectOption(idx)}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${answers[currentQuestionIndex] === idx
                                            ? 'border-brand-copper bg-brand-copper/5 text-brand-dark font-medium'
                                            : 'border-slate-100 hover:border-slate-300 text-slate-600'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleNext}
                                disabled={answers[currentQuestionIndex] === undefined}
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {currentQuestionIndex === questions.length - 1 ? 'Submit Assessment' : 'Next Question'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${score >= 70 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {score >= 70 ? <CheckCircle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                        </div>

                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            {score >= 70 ? 'Assessment Passed!' : 'Review Needed'}
                        </h2>
                        <div className="text-5xl font-black text-slate-900 mb-4">{score}%</div>

                        <p className="text-slate-600 mb-8 max-w-md mx-auto">
                            {score >= 70
                                ? "Excellent work. You have demonstrated readiness for this topic."
                                : "You seem to be missing some key concepts. Please review the Visual Reference Library and Lessons before retrying."
                            }
                        </p>

                        <div className="flex justify-center gap-4">
                            <Link href={`/training/${moduleId}`} className="btn-secondary">
                                Return to Module
                            </Link>
                            {score < 70 && (
                                <button onClick={() => window.location.reload()} className="btn-primary">
                                    Retry Quiz
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
