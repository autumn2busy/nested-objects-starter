'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, CheckCircle, XCircle, Award, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { basicFieldInspectionModules } from '../../modules'
import { generateCertificate } from '@/lib/certificate'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input' // Ensure Input component exists or adapt

import { useParams } from 'next/navigation'
// ... imports

export default function QuizPage() {
    const router = useRouter()
    const params = useParams()
    const moduleId = params.moduleId as string

    const moduleData = basicFieldInspectionModules.find(m => m.id === moduleId)
    const questions = moduleData?.quiz || []

    // State
    const [started, setStarted] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(-1))
    const [submitted, setSubmitted] = useState(false)
    const [score, setScore] = useState(0)
    const [passed, setPassed] = useState(false)
    const [candidateName, setCandidateName] = useState('')
    const [userId, setUserId] = useState<string | null>(null)

    // Safety check - AFTER hooks
    if (!moduleData) return <div>Module not found</div>

    const handleAnswer = (optionIndex: number) => {
        const newAnswers = [...answers]
        newAnswers[currentIndex] = optionIndex
        setAnswers(newAnswers)
    }

    const submitQuiz = async () => {
        // Calculate Score
        let correctCount = 0
        questions.forEach((q, i) => {
            if (q.correctIndex === answers[i]) correctCount++
        })
        const finalScore = Math.round((correctCount / questions.length) * 100)
        const isPassed = finalScore >= 80

        setScore(finalScore)
        setPassed(isPassed)
        setSubmitted(true)

        // Submit to API
        try {
            await fetch('/api/challenges/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    module_id: moduleId,
                    resource_type: 'quiz',
                    quiz_score: finalScore,
                    quiz_passed: isPassed,
                    status: isPassed ? 'completed' : 'failed'
                })
            })
        } catch (err) {
            console.error('Failed to save quiz result', err)
        }
    }

    if (!started) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="max-w-xl w-full bg-white rounded-2xl p-8 shadow-2xl text-center">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Award className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Module 1 Final Exam</h1>
                    <p className="text-slate-600 mb-8">
                        You are about to start the orientation exam. There are {questions.length} questions.
                        You need 80% to pass and earn your certificate.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href={`/challenges/basic/${moduleId}`}>
                            <Button variant="secondary">Cancel</Button>
                        </Link>
                        <Button
                            className="bg-blue-600 hover:bg-blue-500"
                            onClick={() => setStarted(true)}
                        >
                            Begin Exam
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-white rounded-2xl p-8 shadow-xl">
                    <div className="text-center mb-8">
                        {passed ? (
                            <>
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
                                    <CheckCircle className="w-10 h-10" />
                                </div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">Congratulations!</h1>
                                <p className="text-emerald-700 font-medium">You passed with {score}%.</p>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
                                    <XCircle className="w-10 h-10" />
                                </div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">Keep Studying</h1>
                                <p className="text-red-700 font-medium">You scored {score}%. You need 80% to pass.</p>
                            </>
                        )}
                    </div>

                    {passed ? (
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center space-y-4">
                            <h3 className="font-bold text-slate-900">Claim Your Certificate</h3>
                            <Input
                                placeholder="Enter your full name"
                                className="text-center max-w-sm mx-auto"
                                value={candidateName}
                                onChange={(e) => setCandidateName(e.target.value)}
                            />
                            <Button
                                onClick={() => generateCertificate(candidateName || 'Valued Member', moduleData.title, new Date().toLocaleDateString())}
                                className="w-full max-w-sm mx-auto bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold"
                                disabled={!candidateName}
                            >
                                Download Certificate 🎖️
                            </Button>

                            <div className="pt-4 border-t border-slate-100">
                                <Link href="/challenges">
                                    <Button className="w-full max-w-sm bg-slate-900 text-white hover:bg-slate-800 py-3">
                                        Return to Dashboard
                                    </Button>
                                </Link>
                                <p className="text-xs text-slate-500 mt-2">
                                    Your progress has been saved.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <Button
                                onClick={() => {
                                    setSubmitted(false)
                                    setAnswers(new Array(questions.length).fill(-1))
                                    setCurrentIndex(0)
                                    setScore(0)
                                }}
                                className="w-full max-w-sm mx-auto"
                            >
                                Retake Exam
                            </Button>
                            <div className="text-sm text-slate-500">
                                <Link href={`/challenges/basic/${moduleId}`} className="hover:underline">Review Material</Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const currentQ = questions[currentIndex]

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-4 lg:p-12">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <span className="font-bold text-slate-400 text-sm uppercase tracking-wider">Question {currentIndex + 1} of {questions.length}</span>
                    <span className="text-sm font-semibold text-slate-500">
                        {Math.round(((currentIndex) / questions.length) * 100)}% Complete
                    </span>
                </div>

                {/* Question Card */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm mb-8 min-h-[400px] flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-8 leading-snug">{currentQ.question}</h2>

                        <div className="space-y-3">
                            {currentQ.options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(i)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center gap-4 group",
                                        answers[currentIndex] === i ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : ""
                                    )}
                                >
                                    <div className={cn(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                        answers[currentIndex] === i ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 group-hover:border-blue-400"
                                    )}>
                                        {answers[currentIndex] === i && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <span className={cn(
                                        "font-medium text-lg",
                                        answers[currentIndex] === i ? "text-blue-800" : "text-slate-700"
                                    )}>{opt}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Nav */}
                <div className="flex justify-between items-center">
                    <Button
                        variant="ghost"
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex(prev => prev - 1)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                    </Button>

                    {currentIndex === questions.length - 1 ? (
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 font-bold"
                            disabled={answers.includes(-1)}
                            onClick={submitQuiz}
                        >
                            Submit Final Answer
                        </Button>
                    ) : (
                        <Button
                            className="bg-slate-900 text-white px-8"
                            onClick={() => setCurrentIndex(prev => prev + 1)}
                            disabled={answers[currentIndex] === -1}
                        >
                            Next Question
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
