'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
    PlayCircle, CheckCircle, Lock, ArrowRight, Brain,
    Target, BookOpen, Zap, Award, ChevronRight, ChevronLeft,
    Clock, Users, Calculator, X, AlertTriangle, Lightbulb,
    AlertOctagon, Check, Info, Shield
} from 'lucide-react'

import FlashcardDeck from '@/components/training/FlashcardDeck'
import IncomeCalculator from '@/components/training/IncomeCalculator'
import InteractiveScenario from '@/components/training/InteractiveScenario'
import DynamicQuiz from '@/components/training/DynamicQuiz'

// Types
interface TrainingModule {
    id: string; slug: string; module_number: number; title: string
    subtitle: string | null; description: string | null
    estimated_duration_minutes: number | null; video_url: string | null; is_active: boolean
}

interface TrainingLesson {
    id: string; module_id: string; lesson_number: number; title: string
    content_type: string; estimated_minutes: number | null
    video_url: string | null; content: string | null; is_required: boolean
}

type ActiveView = 'overview' | 'lesson' | 'flashcards' | 'quiz' | 'calculator' | 'scenario'
type AudienceType = 'gig-worker' | 'notary' | 'realtor' | 'inspector' | null

// Helper: Parse lesson content JSON
const parseLessonContent = (content: string | null) => {
    if (!content) return null
    try { return JSON.parse(content) } catch { return null }
}

// Helper: Convert YouTube URL to embed format
const getEmbedUrl = (url: string | null): string | null => {
    if (!url) return null
    if (url.includes('youtu.be/')) return `https://www.youtube.com/embed/${url.split('youtu.be/')[1]?.split('?')[0]}`
    if (url.includes('watch?v=')) return `https://www.youtube.com/embed/${url.split('watch?v=')[1]?.split('&')[0]}`
    if (url.includes('/embed/')) return url
    return url
}

// Callout Component
const Callout = ({ type, title, content }: { type: string; title: string; content: string }) => {
    const styles: Record<string, string> = {
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        danger: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    }
    const icons: Record<string, React.ElementType> = { success: CheckCircle, warning: AlertTriangle, danger: AlertOctagon, info: Info }
    const Icon = icons[type] || Info
    return (
        <div className={`rounded-xl border p-4 ${styles[type] || styles.info}`}>
            <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div><h4 className="font-bold">{title}</h4><p className="text-sm mt-1 opacity-90">{content}</p></div>
            </div>
        </div>
    )
}

// Audience Selector Component
const AudienceSelector = ({ selected, onSelect }: { selected: AudienceType; onSelect: (t: AudienceType) => void }) => {
    const audiences = [
        { id: 'gig-worker', label: 'Gig Worker', emoji: '🚗' },
        { id: 'notary', label: 'Notary', emoji: '📋' },
        { id: 'realtor', label: 'Realtor', emoji: '🏠' },
        { id: 'inspector', label: 'Existing Inspector', emoji: '🔍' }
    ]
    return (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-600 mb-3 flex items-center gap-2"><Users className="w-4 h-4" />I&apos;M COMING FROM...</p>
            <div className="flex flex-wrap gap-2">
                {audiences.map(a => (
                    <button key={a.id} onClick={() => onSelect(selected === a.id ? null : a.id as AudienceType)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${selected === a.id ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}><span>{a.emoji}</span>{a.label}</button>
                ))}
            </div>
        </div>
    )
}

// Knowledge Check Component  
const KnowledgeCheck = ({ question, options, correctIndex, explanation }: { question: string; options: string[]; correctIndex: number; explanation: string }) => {
    const [selected, setSelected] = useState<number | null>(null)
    const [revealed, setRevealed] = useState(false)

    const handleSelect = (i: number) => {
        if (revealed) return
        setSelected(i); setRevealed(true)
    }

    return (
        <div className="bg-slate-900 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-3"><Lightbulb className="w-4 h-4" />KNOWLEDGE CHECK</div>
            <p className="text-lg font-medium mb-4">{question}</p>
            <div className="space-y-2">
                {options.map((opt, i) => {
                    const isCorrect = i === correctIndex
                    let style = 'bg-slate-800 border-slate-700 hover:border-slate-500'
                    if (revealed) {
                        if (isCorrect) style = 'bg-emerald-900/50 border-emerald-500'
                        else if (selected === i) style = 'bg-red-900/50 border-red-500'
                        else style = 'bg-slate-800/50 border-slate-700 opacity-50'
                    }
                    return (
                        <button key={i} onClick={() => handleSelect(i)} disabled={revealed}
                            className={`w-full p-3 rounded-lg border text-left transition ${style}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${revealed && isCorrect ? 'bg-emerald-500' : revealed && selected === i ? 'bg-red-500' : 'bg-slate-700'
                                    }`}>
                                    {revealed && isCorrect ? <Check className="w-4 h-4" /> : revealed && selected === i ? <X className="w-4 h-4" /> : String.fromCharCode(65 + i)}
                                </div>
                                <span className="text-sm">{opt}</span>
                            </div>
                        </button>
                    )
                })}
            </div>
            {revealed && (
                <div className={`mt-4 p-4 rounded-lg ${selected === correctIndex ? 'bg-emerald-900/30' : 'bg-amber-900/30'}`}>
                    <p className="text-sm"><span className="font-bold">{selected === correctIndex ? '✓ Correct!' : '✗ Not quite.'}</span> {explanation}</p>
                </div>
            )}
        </div>
    )
}

// Main Component
export default function ModuleOverviewPage() {
    const params = useParams()
    const moduleId = params.moduleId as string

    const [module, setModule] = useState<TrainingModule | null>(null)
    const [lessons, setLessons] = useState<TrainingLesson[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeView, setActiveView] = useState<ActiveView>('overview')
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
    const [quizPassed, setQuizPassed] = useState(false)
    const [selectedAudience, setSelectedAudience] = useState<AudienceType>(null)
    const mainRef = useRef<HTMLElement>(null) // Ref for scrolling

    // Dynamic Data State
    const [flashcards, setFlashcards] = useState<any[]>([])
    const [quizQuestions, setQuizQuestions] = useState<any[]>([])
    const [scenarios, setScenarios] = useState<any[]>([])

    const supabase = createClient()

    // Fetch module and lessons
    useEffect(() => {
        async function fetchData() {
            if (!moduleId) return
            try {
                let { data: mod } = await supabase.from('training_modules').select('*').or(`slug.eq.${moduleId},id.eq.${moduleId}`).single()
                if (!mod) {
                    const { data: fallback } = await supabase.from('training_modules').select('*').eq('is_active', true).order('module_number').limit(1).single()
                    mod = fallback
                }
                if (!mod) { setError('Module not found'); setLoading(false); return }
                setModule(mod)

                const { data: lessonData } = await supabase.from('training_lessons').select('*').eq('module_id', mod.id).order('lesson_number')
                setLessons(lessonData || [])

                // --- FETCH DYNAMIC CONTENT ---

                // 1. Fetch Scenarios
                const { data: scenarioData } = await supabase
                    .from('scenarios')
                    .select('*')
                    .eq('module_id', mod.id)
                    .order('display_order')
                setScenarios(scenarioData || [])

                // 2. Fetch Quiz Questions
                const { data: quizData } = await supabase
                    .from('quiz_questions')
                    .select('*')
                    .eq('module_id', mod.id)
                    .order('question_number')
                setQuizQuestions(quizData || [])

                // 3. Fetch Flashcards (via Decks and Sections)
                // First get relevant decks for this module
                const { data: deckData } = await supabase
                    .from('flashcard_decks')
                    .select('id, section:module_sections!inner(module_id)')
                    .eq('section.module_id', mod.id)

                if (deckData && deckData.length > 0) {
                    const deckIds = deckData.map(d => d.id)
                    const { data: cardData } = await supabase
                        .from('flashcards')
                        .select('*')
                        .in('deck_id', deckIds)
                        .order('display_order')

                    if (cardData) {
                        // Map to component format
                        setFlashcards(cardData.map(c => ({
                            id: c.id,
                            front: c.term,
                            back: c.definition,
                            category: c.category || 'General'
                        })))
                    }
                }

            } catch (err) { setError('Failed to load module') }
            finally { setLoading(false) }
        }
        fetchData()
    }, [moduleId, supabase])

    // Scroll to top on view/lesson change
    useEffect(() => {
        window.scrollTo(0, 0)
        if (mainRef.current) {
            mainRef.current.scrollTop = 0
        }
    }, [activeView, activeLessonId])

    // Load/save progress
    useEffect(() => {
        if (!module) return
        try {
            const saved = localStorage.getItem(`module_${module.id}_progress`)
            if (saved) { const p = JSON.parse(saved); setCompletedLessons(new Set(p.completedLessons || [])); setQuizPassed(p.quizPassed || false) }
            const aud = localStorage.getItem('nested_objects_audience')
            if (aud) setSelectedAudience(aud as AudienceType)
        } catch { }
    }, [module])

    const saveProgress = (completed: Set<string>, passed: boolean) => {
        if (!module) return
        localStorage.setItem(`module_${module.id}_progress`, JSON.stringify({ completedLessons: Array.from(completed), quizPassed: passed }))
    }

    const markLessonComplete = (id: string) => {
        const newSet = new Set(completedLessons); newSet.add(id); setCompletedLessons(newSet); saveProgress(newSet, quizPassed)
    }

    const handleQuizComplete = (score: number, passed: boolean) => { if (passed) { setQuizPassed(true); saveProgress(completedLessons, true) } }
    const handleAudienceSelect = (a: AudienceType) => { setSelectedAudience(a); if (a) localStorage.setItem('nested_objects_audience', a); else localStorage.removeItem('nested_objects_audience') }

    // Calculations
    const progressPercent = lessons.length > 0 ? Math.round((completedLessons.size / lessons.length) * 100) : 0
    const requiredForQuiz = Math.ceil(lessons.length * 0.8)
    const canTakeQuiz = completedLessons.size >= requiredForQuiz
    const currentLesson = activeLessonId ? lessons.find(l => l.id === activeLessonId) : null
    const currentIndex = lessons.findIndex(l => l.id === activeLessonId)

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
    if (error || !module) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-center"><AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" /><p>{error}</p><Link href="/training" className="text-emerald-600 hover:underline">← Back</Link></div></div>

    // Render Sidebar
    const Sidebar = () => (
        <aside className="w-72 bg-white border-r border-slate-200 flex-shrink-0 overflow-y-auto hidden lg:block">
            <div className="p-4 border-b border-slate-100">
                <Link href="/training" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2"><ChevronLeft className="w-3 h-3" />BACK TO CURRICULUM</Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center"><BookOpen className="w-5 h-5 text-emerald-600" /></div>
                    <div><p className="text-xs text-slate-500">Module {module.module_number}</p><h2 className="font-bold text-slate-900 text-sm">{module.title}</h2></div>
                </div>
                <p className="mt-2 text-xs text-slate-500">{progressPercent}% Complete • {completedLessons.size}/{lessons.length}</p>
            </div>
            <div className="p-2">
                <button onClick={() => setActiveView('overview')} className={`w-full p-3 rounded-lg text-left flex items-center gap-3 ${activeView === 'overview' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <Target className="w-4 h-4" /><span className="font-medium text-sm">Overview</span>
                </button>
            </div>
            <div className="px-2 pb-2">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider px-3 py-2">LESSONS</p>
                {lessons.map(lesson => {
                    const done = completedLessons.has(lesson.id), active = activeView === 'lesson' && activeLessonId === lesson.id
                    return (
                        <button key={lesson.id} onClick={() => { setActiveLessonId(lesson.id); setActiveView('lesson') }}
                            className={`w-full p-3 rounded-lg text-left flex items-start gap-3 mb-1 ${active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                {done ? <Check className="w-3 h-3" /> : lesson.lesson_number}
                            </div>
                            <div><p className="font-medium text-sm leading-snug">{lesson.title}</p><p className="text-xs text-slate-400">{lesson.estimated_minutes} min</p></div>
                        </button>
                    )
                })}
            </div>
            <div className="px-4 pb-4">
                <button
                    onClick={() => canTakeQuiz && setActiveView('quiz')}
                    disabled={!canTakeQuiz}
                    className={`w-full text-left p-3 rounded-lg transition-all ${canTakeQuiz
                        ? 'bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:shadow-sm cursor-pointer'
                        : 'bg-slate-50 border border-slate-200 cursor-not-allowed opacity-75'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        {canTakeQuiz ? <Award className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-slate-400" />}
                        <span className={`text-sm font-medium ${canTakeQuiz ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {quizPassed ? 'Assessment Passed ✓' : canTakeQuiz ? 'Assessment Unlocked' : 'Assessment Locked'}
                        </span>
                    </div>
                    {!canTakeQuiz && !quizPassed && <p className="text-xs text-slate-400 mt-1 pl-6">Complete {requiredForQuiz - completedLessons.size} more lessons</p>}
                </button>
            </div>
        </aside>
    )

    // Render Overview
    const Overview = () => (
        <div className="space-y-8">
            {module.video_url && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="aspect-video bg-slate-900">
                        <iframe src={getEmbedUrl(module.video_url) || ''} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                </div>
            )}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <div className="flex gap-8 items-start">
                    <div className="flex-1 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full"><Shield className="w-3 h-3" />Module {module.module_number}</div>
                        <h1 className="text-3xl font-bold text-slate-900">{module.title}</h1>
                        <p className="text-lg text-slate-600">{module.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{module.estimated_duration_minutes} min</span>
                            <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{lessons.length} lessons</span>
                            {flashcards.length > 0 && <span className="flex items-center gap-1"><Brain className="w-4 h-4" />{flashcards.length} flashcards</span>}
                        </div>
                        <button onClick={() => { if (lessons.length > 0) { setActiveLessonId(lessons[0].id); setActiveView('lesson') } }}
                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2">
                            <PlayCircle className="w-5 h-5" />{completedLessons.size > 0 ? 'Continue Learning' : 'Start Module'}
                        </button>
                    </div>
                    <div className="relative w-32 h-32 flex-shrink-0 hidden md:block">
                        <svg className="w-full h-full transform -rotate-90"><circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" /><circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={351.86} strokeDashoffset={351.86 - (351.86 * progressPercent) / 100} className="text-emerald-500" strokeLinecap="round" /></svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-bold">{progressPercent}%</span><span className="text-[10px] uppercase font-semibold text-slate-400">Complete</span></div>
                    </div>
                </div>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
                {/* Dynamically render cards only if data exists for them (or if they are standard features) */}
                {flashcards.length > 0 && (
                    <button onClick={() => setActiveView('flashcards')} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition text-left group">
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Brain className="w-6 h-6 text-amber-600" /></div>
                        <h3 className="font-bold text-slate-900 mb-1">Flashcards</h3><p className="text-sm text-slate-500">Master {flashcards.length} key terms</p>
                    </button>
                )}

                {module.module_number === 1 && (
                    <button onClick={() => setActiveView('calculator')} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition text-left group">
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Calculator className="w-6 h-6 text-emerald-600" /></div>
                        <h3 className="font-bold text-slate-900 mb-1">Income Calculator</h3><p className="text-sm text-slate-500">Project your earnings</p>
                    </button>
                )}

                {scenarios.length > 0 && (
                    <button onClick={() => setActiveView('scenario')} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition text-left group">
                        <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Users className="w-6 h-6 text-pink-600" /></div>
                        <h3 className="font-bold text-slate-900 mb-1">Scenarios</h3><p className="text-sm text-slate-500">{scenarios.length} Practice Decisions</p>
                    </button>
                )}

                <button onClick={() => canTakeQuiz && setActiveView('quiz')} disabled={!canTakeQuiz} className={`p-6 rounded-xl border transition text-left ${canTakeQuiz ? 'bg-white hover:shadow-md' : 'bg-slate-50 opacity-60 cursor-not-allowed'}`}>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${canTakeQuiz ? 'bg-red-100' : 'bg-slate-200'}`}>{canTakeQuiz ? <Award className="w-6 h-6 text-red-600" /> : <Lock className="w-6 h-6 text-slate-400" />}</div>
                    <h3 className="font-bold text-slate-900 mb-1">Assessment</h3><p className="text-sm text-slate-500">{quizPassed ? '✓ Passed' : canTakeQuiz ? 'Earn certificate' : `${requiredForQuiz - completedLessons.size} more lessons`}</p>
                </button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100"><h2 className="text-xl font-bold text-slate-900">Lessons</h2></div>
                <div className="divide-y divide-slate-100">
                    {lessons.map(lesson => (
                        <button key={lesson.id} onClick={() => { setActiveLessonId(lesson.id); setActiveView('lesson') }} className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 text-left">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${completedLessons.has(lesson.id) ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                {completedLessons.has(lesson.id) ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <span className="text-sm font-bold text-slate-400">{lesson.lesson_number}</span>}
                            </div>
                            <div className="flex-1"><h3 className="font-semibold text-slate-900">{lesson.title}</h3><p className="text-sm text-slate-500">{lesson.estimated_minutes} min</p></div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )

    // Render Lesson Content
    const LessonContent = () => {
        if (!currentLesson) return null
        const content = parseLessonContent(currentLesson.content)
        const isComplete = completedLessons.has(currentLesson.id)

        return (
            <div className="space-y-6">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-2"><BookOpen className="w-4 h-4" />Lesson {currentLesson.lesson_number} of {lessons.length}</span>
                        <span className="text-sm text-slate-500 flex items-center gap-1"><Clock className="w-4 h-4" />{currentLesson.estimated_minutes} min</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">{currentLesson.title}</h1>
                </div>

                <AudienceSelector selected={selectedAudience} onSelect={handleAudienceSelect} />

                {
                    content?.coreConcept && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                            <h3 className="font-bold text-emerald-800 mb-2 flex items-center gap-2"><Target className="w-5 h-5" />Core Concept</h3>
                            <p className="text-emerald-700 text-lg">{content.coreConcept}</p>
                        </div>
                    )
                }

                {
                    content?.introduction && (
                        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                            {content.introduction.hook && <p className="text-xl font-medium text-slate-900 italic">&quot;{content.introduction.hook}&quot;</p>}
                            {content.introduction.context && <p className="text-slate-600">{content.introduction.context}</p>}
                            {content.introduction.yourRole && <div className="bg-slate-50 rounded-lg p-4"><p className="text-sm text-slate-500 uppercase font-bold mb-1">Your Role</p><p className="text-slate-700">{content.introduction.yourRole}</p></div>}
                        </div>
                    )
                }

                {
                    content?.sections?.map((section: any) => (
                        <div key={section.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
                                {section.content && <p className="text-slate-600 mt-1">{section.content}</p>}
                            </div>
                            <div className="p-6">
                                {(section.type === 'comparison-table' || section.type === 'info-table') && section.data && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead><tr className="bg-slate-50">{section.data.headers?.map((h: string, i: number) => <th key={i} className="px-4 py-3 text-left font-semibold border-b">{h}</th>)}</tr></thead>
                                            <tbody>{section.data.rows?.map((row: string[], i: number) => <tr key={i} className="border-b last:border-0">{row.map((cell, j) => <td key={j} className={`px-4 py-3 ${j === 0 ? 'font-medium' : ''}`}>{cell}</td>)}</tr>)}</tbody>
                                        </table>
                                    </div>
                                )}
                                {section.type === 'glossary' && section.terms?.map((term: any, i: number) => (
                                    <div key={i} className={`p-4 rounded-lg mb-3 ${term.critical ? 'bg-red-50 border border-red-200' : 'bg-slate-50'}`}>
                                        <div className="flex items-center gap-2 mb-1"><h4 className="font-bold">{term.term}</h4>{term.critical && <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">CRITICAL</span>}</div>
                                        <p className="text-slate-700">{term.definition}</p>{term.usage && <p className="text-sm text-slate-500 mt-2 italic">Example: {term.usage}</p>}
                                    </div>
                                ))}
                                {section.type === 'steps' && section.steps?.map((step: any, i: number) => (
                                    <div key={i} className="flex gap-4 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold flex-shrink-0">{step.number || i + 1}</div>
                                        <div><h4 className="font-semibold">{step.title}</h4><p className="text-slate-600 mt-1">{step.content}</p>{step.timeEstimate && <p className="text-xs text-slate-400 mt-1">⏱ {step.timeEstimate}</p>}</div>
                                    </div>
                                ))}
                                {section.type === 'tips' && <div className="grid md:grid-cols-2 gap-4">{section.tips?.map((tip: any, i: number) => <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-4"><h4 className="font-semibold text-amber-800 flex items-center gap-2"><Lightbulb className="w-4 h-4" />{tip.title}</h4><p className="text-amber-700 text-sm mt-1">{tip.content}</p></div>)}</div>}
                                {section.type === 'danger-list' && section.items?.map((item: any, i: number) => (
                                    <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                                        <h4 className="font-bold text-red-800 flex items-center gap-2"><AlertOctagon className="w-4 h-4" />{item.item}</h4>
                                        {item.detail && <p className="text-red-700 text-sm mt-1">{item.detail}</p>}
                                        {item.bad && <p className="text-sm mt-2"><span className="text-red-600 font-medium">✗ Wrong:</span> {item.bad}</p>}
                                        {item.good && <p className="text-sm"><span className="text-emerald-600 font-medium">✓ Right:</span> {item.good}</p>}
                                    </div>
                                ))}
                                {section.type === 'six-angle' && section.angles && (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {section.angles.map((a: any) => (
                                            <div key={a.number} className="bg-slate-50 rounded-xl p-4 border">
                                                <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">{a.number}</div><h4 className="font-bold">{a.name}</h4></div>
                                                <p className="text-sm text-slate-600 mb-2">{a.purpose}</p>
                                                <p className="text-xs text-emerald-600 flex items-start gap-1"><Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />{a.tip}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {section.callout && <div className="mt-4"><Callout type={section.callout.type} title={section.callout.title} content={section.callout.content} /></div>}
                            </div>
                        </div>
                    ))
                }

                {
                    content?.audienceGuidance && selectedAudience && content.audienceGuidance[selectedAudience] && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5" />{content.audienceGuidance[selectedAudience].title}</h3>
                            <div className="space-y-3">
                                <div><span className="text-xs font-bold text-blue-600 uppercase">Your Edge</span><p className="text-blue-700">{content.audienceGuidance[selectedAudience].edge}</p></div>
                                <div><span className="text-xs font-bold text-blue-600 uppercase">Focus On</span><p className="text-blue-700">{content.audienceGuidance[selectedAudience].focus}</p></div>
                                <div className="bg-amber-100 rounded-lg p-3"><span className="text-xs font-bold text-amber-700 uppercase">⚠️ Watch Out</span><p className="text-amber-800">{content.audienceGuidance[selectedAudience].warning}</p></div>
                            </div>
                        </div>
                    )
                }

                {content?.knowledgeCheck && <KnowledgeCheck question={content.knowledgeCheck.question} options={content.knowledgeCheck.options} correctIndex={content.knowledgeCheck.correctIndex} explanation={content.knowledgeCheck.explanation} />}

                <div className="grid md:grid-cols-2 gap-4">
                    {content?.quickWin && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4"><h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2"><Zap className="w-4 h-4" />Quick Win</h4><p className="text-emerald-700 text-sm">{content.quickWin}</p></div>}
                    {content?.warningSign && <div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Warning Sign</h4><p className="text-amber-700 text-sm">{content.warningSign}</p></div>}
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center justify-between">
                    <button onClick={() => currentIndex > 0 && setActiveLessonId(lessons[currentIndex - 1].id)} disabled={currentIndex === 0} className="px-4 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-50 flex items-center gap-2"><ChevronLeft className="w-4 h-4" />Previous</button>
                    <button onClick={() => { markLessonComplete(currentLesson.id); currentIndex < lessons.length - 1 ? setActiveLessonId(lessons[currentIndex + 1].id) : setActiveView('overview') }} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2">{isComplete ? 'Continue' : 'Mark Complete'}<ArrowRight className="w-4 h-4" /></button>
                </div>
            </div >
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />
            <main ref={mainRef} className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    {activeView === 'overview' && <Overview />}
                    {activeView === 'lesson' && <LessonContent />}
                    {activeView === 'flashcards' && <div className="bg-white rounded-2xl border p-8"><div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold">Flashcards</h2><button onClick={() => setActiveView('overview')} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button></div><FlashcardDeck cards={flashcards} /></div>}
                    {activeView === 'calculator' && <div className="bg-white rounded-2xl border p-8"><div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold">Income Calculator</h2><button onClick={() => setActiveView('overview')} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button></div><IncomeCalculator /></div>}
                    {activeView === 'scenario' && <div className="bg-white rounded-2xl border p-8"><div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold">Interactive Scenarios</h2><button onClick={() => setActiveView('overview')} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button></div><InteractiveScenario scenarios={scenarios} /></div>}
                    {activeView === 'quiz' && <div className="bg-white rounded-2xl border p-8"><div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold">Module Assessment</h2><button onClick={() => setActiveView('overview')} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button></div><DynamicQuiz questions={quizQuestions} onComplete={handleQuizComplete} /></div>}
                </div>
            </main>
        </div>
    )
}