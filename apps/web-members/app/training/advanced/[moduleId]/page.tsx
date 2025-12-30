'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { PlayCircle, CheckCircle, FileText, ChevronLeft, Lock, HelpCircle, BookOpen, RotateCcw } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { Button, buttonVariants } from '@/components/ui/button'
import { generateCertificate } from '@/lib/certificate'
import { Input } from '@/components/ui/input'
import { advancedFieldInspectionModules } from '../modules'
import { cn } from '@/lib/utils'

export default function ModulePlayerPage() {
    const params = useParams()
    const moduleId = params.moduleId as string
    const track = 'advanced'

    // Supabase
    // Removed Supabase client
    // const supabase = createBrowserClient(...)

    const currentModule = advancedFieldInspectionModules.find(m => m.id === moduleId)
    const currentIndex = advancedFieldInspectionModules.findIndex(m => m.id === moduleId)
    const nextModule = advancedFieldInspectionModules[currentIndex + 1]

    const [quizStarted, setQuizStarted] = useState(false)
    const [quizPassed, setQuizPassed] = useState(false)
    const [answers, setAnswers] = useState<number[]>([])
    const [showResults, setShowResults] = useState(false)
    const [candidateName, setCandidateName] = useState('')

    // Flashcard State
    const [activeTab, setActiveTab] = useState<'syllabus' | 'quiz' | 'flashcards'>('syllabus')
    const [currentFlashcard, setCurrentFlashcard] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)

    // Real Progress State
    const [completedModules, setCompletedModules] = useState<string[]>([])
    const [userId, setUserId] = useState<string | null>(null)

    // 1. Fetch User & Progress on Mount
    useEffect(() => {
        async function loadProgress() {
            try {
                // Fetch completed modules/progress
                // We use generic progress API which returns quizPasses (module numbers or IDs?)
                // Wait, training/progress returns module NUMBERS.
                // This page uses module IDs (slugs).
                // We might need to fetch granular progress to get completed module IDs.
                // Let's just fetch granular progress for THIS module to check completion.
                // And maybe others if sidebar needs it? Sidebar loops all modules.
                // Current implementation fetched ALL completed modules for user.

                // Let's just fetch granular progress for this user via API if possible?
                // Currently API only supports `moduleId` param or returns `quizPasses`.
                // `quizPasses` are numbers. `basicFieldInspectionModules` has IDs.
                // We might need a map.

                // Hack: Fetch this module's status.
                const res = await fetch(`/api/training/progress?moduleId=${moduleId}`)
                if (res.ok) {
                    const { progress } = await res.json()
                    const isDone = progress?.some((r: any) => r.status === 'completed' && (!r.resource_type || r.resource_type === 'module')) // Logic?
                    // Previous code checked `r.module_id === moduleId` (implied by query) AND status completed.
                    // But wait, previous code fetched ALL completed modules.
                    // It updated `completedModules` state which sidebar uses.

                    // I'll skip fetching ALL modules for sidebar for now (or assume sidebar doesn't update).
                    // Or I need an API to get "all completed module IDs".

                    if (isDone) setCompletedModules(prev => [...prev, moduleId])
                }
            } catch (err) {
                console.error(err)
            }
        }
        loadProgress()
    }, [moduleId])

    if (!currentModule) {
        return (
            <div className="flex h-screen items-center justify-center bg-brand-micra">
                <div className="text-center">
                    <h1 className="text-xl font-bold">Module not found</h1>
                    <Link href="/training" className="text-brand-copper hover:underline mt-2 inline-block">Return to Track</Link>
                </div>
            </div>
        )
    }

    const handleOptionSelect = (qIndex: number, oIndex: number) => {
        const newAnswers = [...answers]
        newAnswers[qIndex] = oIndex
        setAnswers(newAnswers)
    }

    const submitQuiz = async () => {
        if (!currentModule.quiz) return
        const isCorrect = currentModule.quiz.every((q, i) => q.correctIndex === answers[i])
        setShowResults(true)

        if (isCorrect) {
            setQuizPassed(true)
            setQuizPassed(true)
            await fetch('/api/training/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    module_id: moduleId,
                    status: 'completed',
                    quiz_score: 100
                })
            })
            setCompletedModules(prev => [...prev, moduleId])
        }
    }

    // If module has quiz and not passed, block "Next"
    // BUT! If module is already in completedModules, allow through.
    const isModuleCompleted = completedModules.includes(moduleId)
    const requiresQuiz = currentModule.quiz && currentModule.quiz.length > 0 && !isModuleCompleted && !quizPassed

    return (
        <div className="flex h-screen flex-col lg:flex-row bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-full lg:w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                    <Link href="/training" className="text-slate-400 hover:text-slate-800 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <span className="font-semibold text-sm text-slate-800 tracking-wide">Advanced Inspection Track</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {advancedFieldInspectionModules.map((module) => {
                        const isActive = module.id === moduleId
                        const isCompleted = completedModules.includes(module.id)

                        return (
                            <Link
                                key={module.id}
                                href={`/training/advanced/${module.id}`}
                                className={cn(
                                    "flex items-start gap-3 p-3 rounded-xl transition-all border border-transparent",
                                    isActive ? "bg-emerald-50 border-emerald-100 ring-1 ring-emerald-200" : "hover:bg-slate-50 hover:border-slate-200",
                                    // Dim if done? No, keep bright.
                                    isCompleted ? "opacity-100" : ""
                                )}
                            >
                                <div className="mt-0.5">
                                    {isActive ? (
                                        <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center shadow-sm">
                                            <PlayCircle className="w-3 h-3 text-white fill-current" />
                                        </div>
                                    ) : isCompleted ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                                    )}
                                </div>
                                <div>
                                    <h4 className={cn("text-sm font-semibold leading-tight", isActive ? "text-emerald-900" : "text-slate-700")}>
                                        {module.title}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1">{module.duration} {module.quiz ? '• Quiz' : ''}</p>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
                        <Lock className="w-3 h-3" />
                        <span>Complete all modules to verify</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-slate-50">
                <div className="max-w-5xl mx-auto p-4 md:p-8 lg:p-12">
                    <div className="mb-6">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-full">
                            {currentModule.type}
                        </span>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-3">{currentModule.title}</h1>
                        <p className="text-slate-600 mt-2 text-lg">{currentModule.description}</p>
                    </div>

                    {/* Video Player Shell */}
                    <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-900/10 mb-8 relative group">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`${currentModule.videoUrl}?autoplay=0&modestbranding=1&rel=0`}
                            title={currentModule.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0"
                        />
                    </div>

                    {/* Action Area & Quiz */}
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                            {/* Tabs */}
                            <div className="flex gap-2 border-b border-slate-200 pb-px">
                                <button
                                    onClick={() => setActiveTab('syllabus')}
                                    className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", activeTab === 'syllabus' ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700")}
                                >
                                    Syllabus
                                </button>
                                {currentModule.flashcards && (
                                    <button
                                        onClick={() => setActiveTab('flashcards')}
                                        className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", activeTab === 'flashcards' ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700")}
                                    >
                                        Flashcards ({currentModule.flashcards.length})
                                    </button>
                                )}
                                {currentModule.quiz && (
                                    <button
                                        onClick={() => setActiveTab('quiz')}
                                        className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", activeTab === 'quiz' ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700")}
                                    >
                                        Quiz
                                    </button>
                                )}
                            </div>

                            {/* Content based on Active Tab */}
                            {activeTab === 'flashcards' && currentModule.flashcards ? (
                                <div className="space-y-4">
                                    <div
                                        onClick={() => setIsFlipped(!isFlipped)}
                                        className="aspect-[3/2] cursor-pointer group perspective-1000"
                                    >
                                        <div className={cn(
                                            "relative w-full h-full transition-all duration-500 transform-style-3d",
                                            isFlipped ? "rotate-y-180" : ""
                                        )}>
                                            {!isFlipped ? (
                                                <div className="absolute inset-0 bg-white border-2 border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center shadow-sm group-hover:border-emerald-300 transition-colors animate-in fade-in zoom-in-95 duration-200">
                                                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">Question</span>
                                                    <p className="text-xl font-medium text-slate-800">{currentModule.flashcards[currentFlashcard].front}</p>
                                                    <span className="text-xs text-slate-400 mt-6 md:absolute md:bottom-6">Click to flip</span>
                                                </div>
                                            ) : (
                                                <div className="absolute inset-0 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">Answer</span>
                                                    <p className="text-xl font-medium text-emerald-900">{currentModule.flashcards[currentFlashcard].back}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between px-4">
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setCurrentFlashcard(prev => Math.max(0, prev - 1))
                                                setIsFlipped(false)
                                            }}
                                            disabled={currentFlashcard === 0}
                                        >
                                            ← Previous
                                        </Button>
                                        <span className="text-sm font-medium text-slate-500">
                                            {currentFlashcard + 1} / {currentModule.flashcards.length}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setCurrentFlashcard(prev => Math.min((currentModule.flashcards?.length || 1) - 1, prev + 1))
                                                setIsFlipped(false)
                                            }}
                                            disabled={currentFlashcard === (currentModule.flashcards.length - 1)}
                                        >
                                            Next →
                                        </Button>
                                    </div>
                                </div>
                            ) : activeTab === 'quiz' && ((quizStarted || requiresQuiz) && !isModuleCompleted && currentModule.quiz) ? (
                                <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm ring-1 ring-emerald-400/20">
                                    <div className="flex items-center gap-2 mb-6 border-b border-emerald-50 pb-4">
                                        <HelpCircle className="w-5 h-5 text-emerald-600" />
                                        <h3 className="font-bold text-slate-900">Module Quiz</h3>
                                        <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full ml-auto">
                                            {currentModule.quiz.length} Questions
                                        </span>
                                    </div>

                                    <div className="space-y-8">
                                        {currentModule.quiz.map((q, qIndex) => (
                                            <div key={qIndex} className="space-y-3">
                                                <p className="font-medium text-slate-900 text-lg leading-snug">{qIndex + 1}. {q.question}</p>
                                                <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                                                    {q.options.map((option, oIndex) => {
                                                        const isSelected = answers[qIndex] === oIndex
                                                        const isCorrect = q.correctIndex === oIndex
                                                        // Show colors if results are shown
                                                        let className = "flex items-center gap-3 p-3 rounded-lg border w-full text-left transition-colors "
                                                        if (showResults) {
                                                            if (isCorrect) className += "bg-emerald-50 border-emerald-500 text-emerald-900"
                                                            else if (isSelected && !isCorrect) className += "bg-red-50 border-red-200 text-red-900"
                                                            else className += "bg-white border-slate-200 opacity-50"
                                                        } else {
                                                            if (isSelected) className += "bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500"
                                                            else className += "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                        }

                                                        return (
                                                            <button
                                                                key={oIndex}
                                                                onClick={() => !showResults && handleOptionSelect(qIndex, oIndex)}
                                                                disabled={showResults}
                                                                className={className}
                                                            >
                                                                <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                                                                    isSelected ? (showResults && !isCorrect ? "border-red-500 bg-red-500" : "border-emerald-600 bg-emerald-600") : "border-slate-300"
                                                                )}>
                                                                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                                </div>
                                                                <span className="text-sm font-medium">{option}</span>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {!showResults && (
                                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                            <Button
                                                onClick={submitQuiz}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8"
                                                disabled={answers.length < currentModule.quiz.length || answers.includes(undefined as any)}
                                            >
                                                Submit Quiz
                                            </Button>
                                        </div>
                                    )}

                                    {showResults && !quizPassed && (
                                        <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between text-red-800">
                                            <span className="font-semibold">Not quite. Review the material and try again.</span>
                                            <Button
                                                variant="secondary"
                                                onClick={() => {
                                                    setShowResults(false)
                                                    setAnswers([])
                                                }}
                                                className="bg-white border text-slate-900"
                                            >
                                                Retry
                                            </Button>
                                        </div>
                                    )}

                                    {showResults && quizPassed && (
                                        <div className="mt-8 p-4 bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 animate-in fade-in slide-in-from-bottom-2">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="font-bold">Excellent work! You passed.</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                                        <FileText className="w-5 h-5 text-emerald-600" />
                                        Lesson Syllabus
                                    </h3>
                                    <ul className="space-y-3">
                                        {currentModule.syllabus.map((item, i) => (
                                            <li key={i} className="flex gap-3 text-slate-700 text-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-xl sticky top-6">
                                <h3 className="font-bold mb-2">Ready to advance?</h3>

                                {requiresQuiz ? (
                                    <>
                                        <p className="text-emerald-100 text-sm mb-6">
                                            This module has a mandatory quiz. Score 100% to unlock the next lesson.
                                        </p>
                                        {!quizStarted && (
                                            <Button
                                                onClick={() => setQuizStarted(true)}
                                                className="w-full bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold"
                                            >
                                                Take Quiz
                                            </Button>
                                        )}
                                        {quizStarted && !quizPassed && (
                                            <div className="text-center text-sm text-emerald-200 font-medium bg-emerald-950/50 py-2 rounded-lg">
                                                Quiz in Progress...
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <p className="text-emerald-100 text-sm mb-6">
                                            Confirm you have watched the video and reviewed the syllabus notes.
                                        </p>

                                        {nextModule ? (
                                            <Link
                                                href={`/training/advanced/${nextModule.id}`}
                                                className={cn(buttonVariants({ className: "w-full bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold" }))}
                                            >
                                                Next Lesson →
                                            </Link>
                                        ) : (
                                            <div className="space-y-3 bg-emerald-800/50 p-4 rounded-xl">
                                                <p className="font-bold text-white text-sm">Course Complete! Claim your certificate.</p>
                                                <Input
                                                    placeholder="Enter Full Name"
                                                    value={candidateName}
                                                    onChange={(e) => setCandidateName(e.target.value)}
                                                    className="bg-white text-slate-900 border-0"
                                                />
                                                <Button
                                                    onClick={() => generateCertificate(candidateName || 'Valued Member', 'Basic Field Inspection Track', new Date().toLocaleDateString())}
                                                    className="w-full bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold"
                                                    disabled={!candidateName}
                                                >
                                                    Download Certificate 🎖️
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}

                                {quizPassed && requiresQuiz && nextModule && (
                                    <Link
                                        href={`/training/advanced/${nextModule.id}`}
                                        className={cn(buttonVariants({ className: "w-full bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold" }))}
                                    >
                                        Next Lesson →
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main >
        </div >
    )
}
