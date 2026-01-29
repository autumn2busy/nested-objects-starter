'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
    PlayCircle, CheckCircle, Lock, ArrowRight, Brain, Camera, 
    FileText, Target, Play, BookOpen, Zap, Award, ChevronRight,
    ChevronLeft, Clock, Users, Calculator, X, AlertTriangle
} from 'lucide-react'

// Import interactive components
import FlashcardDeck from '@/components/training/FlashcardDeck'
import IncomeCalculator from '@/components/training/IncomeCalculator'
import InteractiveScenario from '@/components/training/InteractiveScenario'
import Module1Quiz from '@/components/training/Module1Quiz'

// =============================================================================
// TYPES
// =============================================================================

interface TrainingModule {
    id: string
    slug: string
    module_number: number
    title: string
    subtitle: string | null
    description: string | null
    estimated_duration_minutes: number | null
    is_active: boolean
}

interface TrainingLesson {
    id: string
    module_id: string
    lesson_number: number
    title: string
    content_type: string
    estimated_minutes: number | null
    video_url: string | null
    content: string | null
    is_required: boolean
}

interface ModuleSection {
    id: string
    module_id: string
    slug: string
    section_type: string
    title: string
    description: string | null
    estimated_duration_minutes: number | null
    is_required: boolean
    display_order: number
}

interface ParsedLessonContent {
    coreConcept?: string
    steps?: Array<{
        id: string
        title: string
        content: string
        critical?: boolean
    }>
    sixAngleSequence?: Array<{
        angle: number
        name: string
        purpose: string
        tip: string
    }>
    quickWin?: string
    warningSign?: string
    audienceWarnings?: Record<string, { mistake: string; correct: string }>
}

type ActiveView = 'overview' | 'lesson' | 'flashcards' | 'quiz' | 'calculator' | 'scenario'

// =============================================================================
// COMPONENT
// =============================================================================

export default function ModuleOverviewPage() {
    const params = useParams()
    const moduleId = params.moduleId as string
    
    // Data state
    const [module, setModule] = useState<TrainingModule | null>(null)
    const [lessons, setLessons] = useState<TrainingLesson[]>([])
    const [sections, setSections] = useState<ModuleSection[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // UI state
    const [activeView, setActiveView] = useState<ActiveView>('overview')
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
    const [quizPassed, setQuizPassed] = useState(false)
    
    const supabase = createClient()

    // Load data from Supabase
    useEffect(() => {
        async function fetchData() {
            if (!moduleId) return

            try {
                // Try to find module by slug first, then by ID
                let { data: mod, error: modError } = await supabase
                    .from('training_modules')
                    .select('*')
                    .or(`slug.eq.${moduleId},id.eq.${moduleId}`)
                    .single()

                if (modError) {
                    // If not found by slug/id, try finding the first active module
                    const { data: firstMod } = await supabase
                        .from('training_modules')
                        .select('*')
                        .eq('is_active', true)
                        .order('module_number')
                        .limit(1)
                        .single()
                    
                    mod = firstMod
                }

                if (!mod) {
                    setError('Module not found')
                    setLoading(false)
                    return
                }

                setModule(mod)

                // Fetch lessons for this module
                const { data: lessonData } = await supabase
                    .from('training_lessons')
                    .select('*')
                    .eq('module_id', mod.id)
                    .order('lesson_number')

                setLessons(lessonData || [])

                // Fetch sections (flashcards, quiz, tools, etc.)
                const { data: sectionData } = await supabase
                    .from('module_sections')
                    .select('*')
                    .eq('module_id', mod.id)
                    .order('display_order')

                setSections(sectionData || [])

            } catch (err) {
                console.error('Error fetching module:', err)
                setError('Failed to load module')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [moduleId])

    // Load progress from localStorage
    useEffect(() => {
        if (!module) return
        try {
            const saved = localStorage.getItem(`module_${module.id}_progress`)
            if (saved) {
                const progress = JSON.parse(saved)
                setCompletedLessons(new Set(progress.completedLessons || []))
                setQuizPassed(progress.quizPassed || false)
            }
        } catch (e) {
            console.error('Failed to load progress:', e)
        }
    }, [module])

    // Save progress to localStorage
    const saveProgress = (newCompletedLessons: Set<string>, newQuizPassed: boolean) => {
        if (!module) return
        try {
            localStorage.setItem(`module_${module.id}_progress`, JSON.stringify({
                completedLessons: Array.from(newCompletedLessons),
                quizPassed: newQuizPassed,
                lastUpdated: new Date().toISOString()
            }))
        } catch (e) {
            console.error('Failed to save progress:', e)
        }
    }

    // Mark lesson as complete
    const markLessonComplete = (lessonId: string) => {
        const newCompleted = new Set(completedLessons)
        newCompleted.add(lessonId)
        setCompletedLessons(newCompleted)
        saveProgress(newCompleted, quizPassed)
    }

    // Handle quiz completion
    const handleQuizComplete = (passed: boolean) => {
        if (passed) {
            setQuizPassed(true)
            saveProgress(completedLessons, true)
        }
    }

    // Calculate progress
    const totalItems = lessons.length + 1 // lessons + quiz
    const completedItems = completedLessons.size + (quizPassed ? 1 : 0)
    const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

    // Get current lesson
    const currentLesson = activeLessonId ? lessons.find(l => l.id === activeLessonId) : null

    // Parse lesson content JSON
    const parseLessonContent = (content: string | null): ParsedLessonContent | null => {
        if (!content) return null
        try {
            return JSON.parse(content)
        } catch {
            return null
        }
    }

    // Get icon for content type
    const getContentIcon = (type: string) => {
        switch (type) {
            case 'video': return Play
            case 'lesson': return BookOpen
            case 'quiz': return Award
            case 'flashcards': return Brain
            case 'tool': return Calculator
            case 'scenario': return Users
            default: return FileText
        }
    }

    // Get color for content type
    const getContentColor = (type: string) => {
        switch (type) {
            case 'video': return 'bg-purple-100 text-purple-600'
            case 'lesson': return 'bg-blue-100 text-blue-600'
            case 'quiz': return 'bg-red-100 text-red-600'
            case 'flashcards': return 'bg-amber-100 text-amber-600'
            case 'tool': return 'bg-emerald-100 text-emerald-600'
            case 'scenario': return 'bg-pink-100 text-pink-600'
            default: return 'bg-slate-100 text-slate-600'
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-500">Loading module...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error || !module) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Module Not Found</h2>
                    <p className="text-slate-500 mb-4">{error || 'The requested module could not be loaded.'}</p>
                    <Link href="/training" className="text-emerald-600 hover:underline">
                        ← Back to Training
                    </Link>
                </div>
            </div>
        )
    }

    // ==========================================================================
    // RENDER: Overview
    // ==========================================================================
    const renderOverview = () => (
        <div className="space-y-8">
            {/* Module Header */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full">
                            <Target className="w-3 h-3" /> Module {module.module_number}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                            {module.title}
                        </h1>
                        {module.subtitle && (
                            <p className="text-lg text-emerald-600 font-medium">{module.subtitle}</p>
                        )}
                        <p className="text-lg text-slate-600 leading-relaxed">
                            {module.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {module.estimated_duration_minutes} min
                            </span>
                            <span className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                {lessons.length} lessons
                            </span>
                            <span className="flex items-center gap-1">
                                <Brain className="w-4 h-4" />
                                74 flashcards
                            </span>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <button
                                onClick={() => {
                                    if (lessons.length > 0) {
                                        setActiveLessonId(lessons[0].id)
                                        setActiveView('lesson')
                                    }
                                }}
                                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                            >
                                <PlayCircle className="w-5 h-5" />
                                {completedLessons.size > 0 ? 'Continue Learning' : 'Start Module'}
                            </button>
                            <span className="text-sm text-slate-500">
                                {completedLessons.size} of {lessons.length} lessons completed
                            </span>
                        </div>
                    </div>

                    {/* Progress Circle */}
                    <div className="relative w-32 h-32 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                className="text-slate-100"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                strokeDasharray={351.86}
                                strokeDashoffset={351.86 - (351.86 * progressPercent) / 100}
                                className="text-emerald-500 transition-all duration-1000 ease-out"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-900">
                            <span className="text-2xl font-bold">{progressPercent}%</span>
                            <span className="text-[10px] uppercase font-semibold text-slate-400">Complete</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Links Grid */}
            <div className="grid md:grid-cols-4 gap-4">
                <button
                    onClick={() => setActiveView('flashcards')}
                    className="bg-white p-6 rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition text-left group"
                >
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Brain className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">Flashcards</h3>
                    <p className="text-sm text-slate-500">Master 74 key terms</p>
                </button>

                <button
                    onClick={() => setActiveView('calculator')}
                    className="bg-white p-6 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition text-left group"
                >
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Calculator className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">Income Calculator</h3>
                    <p className="text-sm text-slate-500">Project your earnings</p>
                </button>

                <button
                    onClick={() => setActiveView('scenario')}
                    className="bg-white p-6 rounded-xl border border-slate-200 hover:border-pink-300 hover:shadow-md transition text-left group"
                >
                    <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6 text-pink-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">Scenarios</h3>
                    <p className="text-sm text-slate-500">Practice decisions</p>
                </button>

                <button
                    onClick={() => setActiveView('quiz')}
                    className="bg-white p-6 rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-md transition text-left group"
                >
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Award className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">Assessment</h3>
                    <p className="text-sm text-slate-500">
                        {quizPassed ? '✓ Passed' : 'Earn certificate'}
                    </p>
                </button>
            </div>

            {/* Lessons List */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">Lessons</h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {lessons.map((lesson, index) => {
                        const Icon = getContentIcon(lesson.content_type)
                        const isComplete = completedLessons.has(lesson.id)
                        
                        return (
                            <button
                                key={lesson.id}
                                onClick={() => {
                                    setActiveLessonId(lesson.id)
                                    setActiveView('lesson')
                                }}
                                className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition text-left"
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    isComplete ? 'bg-emerald-100' : getContentColor(lesson.content_type)
                                }`}>
                                    {isComplete ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                    ) : (
                                        <Icon className="w-5 h-5" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400 font-medium">
                                            LESSON {lesson.lesson_number}
                                        </span>
                                        {lesson.video_url && (
                                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-bold rounded">
                                                VIDEO
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-slate-900 truncate">
                                        {lesson.title}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-400">
                                    <span>{lesson.estimated_minutes} min</span>
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )

    // ==========================================================================
    // RENDER: Lesson
    // ==========================================================================
    const renderLesson = () => {
        if (!currentLesson) return null
        
        const content = parseLessonContent(currentLesson.content)
        const currentIndex = lessons.findIndex(l => l.id === activeLessonId)
        
        return (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Lesson Header */}
                <div className="border-b border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                                <span className="px-2 py-0.5 bg-slate-100 rounded text-xs uppercase font-medium">
                                    Lesson {currentLesson.lesson_number}
                                </span>
                                <span>{currentLesson.estimated_minutes} min</span>
                                {currentLesson.video_url && (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded text-xs uppercase font-medium">
                                        Video
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">{currentLesson.title}</h2>
                        </div>
                        <button
                            onClick={() => setActiveView('overview')}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Video Embed */}
                {currentLesson.video_url && (
                    <div className="aspect-video bg-slate-900">
                        <iframe
                            src={currentLesson.video_url.replace('youtu.be/', 'www.youtube.com/embed/').replace('watch?v=', 'embed/')}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                )}

                {/* Lesson Content */}
                <div className="p-8 space-y-8">
                    {/* Core Concept */}
                    {content?.coreConcept && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                            <h3 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                                <Target className="w-5 h-5" /> Core Concept
                            </h3>
                            <p className="text-emerald-700 text-lg">{content.coreConcept}</p>
                        </div>
                    )}

                    {/* 6-Angle Sequence (Lesson 4 specific) */}
                    {content?.sixAngleSequence && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-900">The 6-Angle Sequence</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {content.sixAngleSequence.map((angle) => (
                                    <div key={angle.angle} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                                                {angle.angle}
                                            </div>
                                            <h4 className="font-semibold text-slate-900">{angle.name}</h4>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-2">{angle.purpose}</p>
                                        <p className="text-xs text-emerald-600 flex items-start gap-1">
                                            <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                            {angle.tip}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Steps */}
                    {content?.steps && content.steps.length > 0 && (
                        <div className="space-y-6">
                            {content.steps.map((step, i) => (
                                <div key={step.id} className={`rounded-xl p-6 ${
                                    step.critical 
                                        ? 'bg-red-50 border border-red-200' 
                                        : 'bg-slate-50 border border-slate-200'
                                }`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                            step.critical 
                                                ? 'bg-red-500 text-white' 
                                                : 'bg-slate-300 text-slate-700'
                                        }`}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-semibold text-slate-900">{step.title}</h4>
                                                {step.critical && (
                                                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">
                                                        CRITICAL
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-slate-700 whitespace-pre-line leading-relaxed">
                                                {step.content}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quick Win & Warning */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {content?.quickWin && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                <h4 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                                    <Zap className="w-4 h-4" /> Quick Win
                                </h4>
                                <p className="text-emerald-700 text-sm">{content.quickWin}</p>
                            </div>
                        )}
                        {content?.warningSign && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Warning Sign
                                </h4>
                                <p className="text-amber-700 text-sm">{content.warningSign}</p>
                            </div>
                        )}
                    </div>

                    {/* Audience-Specific Warnings */}
                    {content?.audienceWarnings && Object.keys(content.audienceWarnings).length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900">Role-Specific Guidance</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {Object.entries(content.audienceWarnings).map(([role, warning]) => (
                                    <div key={role} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                        <h4 className="font-semibold text-slate-900 capitalize mb-2">
                                            For {role.replace('-', ' ')}s
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <p className="text-red-600">
                                                <span className="font-medium">✗ Mistake:</span> {warning.mistake}
                                            </p>
                                            <p className="text-emerald-600">
                                                <span className="font-medium">✓ Correct:</span> {warning.correct}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Lesson Footer - Navigation */}
                <div className="border-t border-slate-200 p-6 bg-slate-50 flex items-center justify-between">
                    <button
                        onClick={() => {
                            if (currentIndex > 0) {
                                setActiveLessonId(lessons[currentIndex - 1].id)
                            }
                        }}
                        disabled={currentIndex === 0}
                        className="px-4 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </button>

                    <button
                        onClick={() => {
                            markLessonComplete(currentLesson.id)
                            if (currentIndex < lessons.length - 1) {
                                setActiveLessonId(lessons[currentIndex + 1].id)
                            } else {
                                setActiveView('overview')
                            }
                        }}
                        className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
                    >
                        {completedLessons.has(currentLesson.id) ? 'Continue' : 'Mark Complete'}
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )
    }

    // ==========================================================================
    // MAIN RENDER
    // ==========================================================================
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {activeView !== 'overview' ? (
                            <button
                                onClick={() => setActiveView('overview')}
                                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                <span className="font-medium">Back to Module</span>
                            </button>
                        ) : (
                            <Link
                                href="/training"
                                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                <span className="font-medium">All Training</span>
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-500">{progressPercent}% Complete</span>
                        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {activeView === 'overview' && renderOverview()}
                {activeView === 'lesson' && renderLesson()}
                {activeView === 'flashcards' && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Flashcards</h2>
                            <button
                                onClick={() => setActiveView('overview')}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <FlashcardDeck />
                    </div>
                )}
                {activeView === 'calculator' && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Income Calculator</h2>
                            <button
                                onClick={() => setActiveView('overview')}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <IncomeCalculator />
                    </div>
                )}
                {activeView === 'scenario' && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Interactive Scenarios</h2>
                            <button
                                onClick={() => setActiveView('overview')}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <InteractiveScenario />
                    </div>
                )}
                {activeView === 'quiz' && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Module Assessment</h2>
                            <button
                                onClick={() => setActiveView('overview')}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <Module1Quiz onComplete={handleQuizComplete} />
                    </div>
                )}
            </div>
        </div>
    )
}