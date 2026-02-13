'use client'

import { useState } from 'react'
import { TrainingQuestion } from '@/types/challenges'
import { CheckCircle, XCircle, ArrowRight, RotateCcw } from 'lucide-react'
import Link from 'next/link'

type QuizEngineProps = {
    questions: TrainingQuestion[]
    onComplete: (score: number) => void
    moduleId: string
}

export default function QuizEngine({ questions, onComplete, moduleId }: QuizEngineProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [showFeedback, setShowFeedback] = useState(false)
    const [score, setScore] = useState(0)
    const [completed, setCompleted] = useState(false)

    if (!questions || questions.length === 0) {
        return (
            <div className="text-center p-12">
                <p className="text-slate-500">No questions available for this module.</p>
                <Link href={`/challenges/${moduleId}`} className="text-brand-copper hover:underline mt-4 inline-block">
                    Return to Module
                </Link>
            </div>
        )
    }

    const currentQuestion = questions[currentIndex]

    // Parse options if they come as string (JSON) or use as is
    const options = Array.isArray(currentQuestion.options)
        ? currentQuestion.options
        : typeof currentQuestion.options === 'string'
            ? JSON.parse(currentQuestion.options)
            : []

    const handleOptionSelect = (opt: string) => {
        if (showFeedback) return
        setSelectedOption(opt)
    }

    const handleSubmitAnswer = () => {
        if (!selectedOption) return

        const isCorrect = selectedOption === currentQuestion.correct_answer
        if (isCorrect) {
            setScore(prev => prev + 1)
        }
        setShowFeedback(true)
    }

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setSelectedOption(null)
            setShowFeedback(false)
        } else {
            setCompleted(true)
            onComplete(Math.round(((score + (selectedOption === currentQuestion.correct_answer ? 0 : 0)) / questions.length) * 100))
            // Note: Use stored score. The update inside handleSubmitAnswer might not be reflected immediately if we used it here directly without careful state management,
            // but actually we updated score state. However, render logic puts us in 'completed' state now.
            // Wait, if I updated score in handleSubmit, it's safe.
            // On the LAST question, we need to make sure we count the last one.
            // The score state updates correctly.
        }
    }

    const calculateFinalScore = () => {
        return Math.round((score / questions.length) * 100)
    }

    if (completed) {
        const finalScore = calculateFinalScore()
        const passed = finalScore >= 80

        return (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {passed ? <CheckCircle className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                </div>

                <h2 className="text-3xl font-bold text-slate-800 mb-2">
                    {passed ? 'Assessment Passed!' : 'Assessment Failed'}
                </h2>

                <p className="text-slate-600 mb-8">
                    You scored <span className="font-bold text-slate-900">{finalScore}%</span>.
                    {passed ? ' Great job!' : ' You need 80% to pass.'}
                </p>

                <div className="flex justify-center gap-4">
                    <Link
                        href={`/challenges/${moduleId}`}
                        className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                    >
                        Return to Module
                    </Link>
                    {!passed && (
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 rounded-xl bg-brand-copper text-white font-bold hover:bg-brand-copperDark transition-colors flex items-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" /> Retry
                        </button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Progress Header */}
            <div className="mb-8">
                <div className="flex justify-between text-sm font-medium text-slate-500 mb-2">
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                    <span>Score: {score}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-brand-copper transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 leading-relaxed">
                        {currentQuestion.question_text}
                    </h3>

                    <div className="space-y-3">
                        {options.map((opt: string, idx: number) => {
                            const isSelected = selectedOption === opt
                            let cardClass = "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group "

                            if (showFeedback) {
                                if (opt === currentQuestion.correct_answer) {
                                    cardClass += "border-green-500 bg-green-50 text-green-900"
                                } else if (isSelected) {
                                    cardClass += "border-red-500 bg-red-50 text-red-900"
                                } else {
                                    cardClass += "border-slate-100 opacity-50"
                                }
                            } else {
                                if (isSelected) {
                                    cardClass += "border-brand-copper bg-orange-50 text-brand-dark"
                                } else {
                                    cardClass += "border-slate-100 hover:border-brand-copper/50 hover:bg-slate-50 text-slate-700"
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionSelect(opt)}
                                    disabled={showFeedback}
                                    className={cardClass}
                                >
                                    <span className="font-medium">{opt}</span>
                                    {showFeedback && opt === currentQuestion.correct_answer && (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    )}
                                    {showFeedback && isSelected && opt !== currentQuestion.correct_answer && (
                                        <XCircle className="w-5 h-5 text-red-600" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Footer Action Area */}
                <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end">
                    {!showFeedback ? (
                        <button
                            onClick={handleSubmitAnswer}
                            disabled={!selectedOption}
                            className="px-8 py-3 bg-brand-dark text-white font-bold rounded-xl hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Submit Answer
                        </button>
                    ) : (
                        <div className="w-full">
                            {/* Feedback Text */}
                            <div className="mb-6 p-4 rounded-lg bg-blue-50 text-blue-900 text-sm border border-blue-100">
                                <span className="font-bold block mb-1">Explanation:</span>
                                {currentQuestion.explanation || "No explanation provided."}
                            </div>

                            <button
                                onClick={handleNext}
                                className="w-full px-8 py-3 bg-brand-copper text-white font-bold rounded-xl hover:bg-brand-copperDark transition-all flex items-center justify-center gap-2"
                            >
                                {currentIndex === questions.length - 1 ? 'Finish Assessment' : 'Next Question'}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
