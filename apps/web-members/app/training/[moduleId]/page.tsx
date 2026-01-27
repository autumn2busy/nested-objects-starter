// @ts-nocheck
/* eslint-disable */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { PlayCircle, CheckCircle, Lock, ArrowLeft, FileText, Download, HelpCircle, AlertCircle, Video, Mic, Layers } from 'lucide-react'
import VisualReferenceLibrary from '@/components/training/VisualReferenceLibrary'
import { TrainingModule, TrainingLesson, TrainingResource, TrainingFlashcard } from '@/types/training'
import FlashcardDeck from '@/components/training/FlashcardDeck'

export default function ModuleOverviewPage() {
    const params = useParams()
    const moduleId = params.moduleId as string
    const [module, setModule] = useState<TrainingModule | null>(null)
    const [lessons, setLessons] = useState<TrainingLesson[]>([])
    const [resources, setResources] = useState<TrainingResource[]>([])
    const [flashcards, setFlashcards] = useState<TrainingFlashcard[]>([])
    const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            if (!moduleId) return

            try {
                // 1. Fetch Module Details
                const { data: mod, error: modError } = await supabase
                    .from('training_modules')
                    .select('*')
                    .eq('id', moduleId)
                    .single()

                if (modError) throw modError
                setModule(mod)

                // 2. Fetch Lessons
                const { data: lessonData } = await supabase
                    .from('training_lessons')
                    .select('*')
                    .eq('module_id', moduleId)
                    .order('lesson_number')

                if (lessonData) setLessons(lessonData as TrainingLesson[])

                // 3. Fetch Resources with joined lesson data if possible, or just raw
                const { data: resourceData } = await supabase
                    .from('training_resources')
                    .select('*')
                    .eq('module_id', moduleId)

                if (lessonData && resourceData) {
                    const enrichedResources = resourceData.map((res: TrainingResource) => {
                        const relatedLesson = lessonData.find((l: TrainingLesson) => l.id === res.lesson_id)
                        return {
                            ...res,
                            lesson_number: relatedLesson ? relatedLesson.lesson_number : undefined
                        }
                    })
                    setResources(enrichedResources)
                } else if (resourceData) {
                    setResources(resourceData as TrainingResource[])
                }
                // 4. Fetch Flashcards
                const { data: fcData } = await supabase
                    .from('training_flashcards')
                    .select('*')
                    .eq('module_id', moduleId)
                    .order('order_index')

                if (fcData) setFlashcards(fcData as TrainingFlashcard[])

                // 5. Fetch Progress via API
                try {
                    const res = await fetch(`/api/training/progress?moduleId=${moduleId}`)
                    if (res.ok) {
                        const { progress } = await res.json()
                        const pList = Array.isArray(progress) ? progress : []
                        setCompletedLessonIds(pList.filter((p: any) => p.status === 'completed').map((p: any) => p.lesson_id))
                    }
                } catch (err) {
                    console.error('Error fetching progress:', err)
                }

            } catch (error) {
                console.error('Error fetching module:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [moduleId])

    if (loading) return <div className="p-12 text-center text-slate-500">Loading module...</div>
    if (!module) return <div className="p-12 text-center text-brand-copper">Module not found.</div>

    const allLessonsCompleted = lessons.length > 0 && lessons.every(l => completedLessonIds.includes(l.id))

    // Progress Calculation
    const progressPercent = lessons.length > 0
        ? Math.round((completedLessonIds.length / lessons.length) * 100)
        : 0

    // Exclude flashcard PDFs from visual resources if we have interactive ones, 
    // or just leave them as downloads in visual library? 
    // Let's keep potential PDF flashcards in visual library if they exist, 
    // but the Flashcard Section is exclusively for interactive mode.
    const visualResources = resources

    return (
        <main className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-brand-copper/20">
                <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                    <Link href="/training" className="inline-flex items-center text-sm text-slate-500 hover:text-brand-copper mb-4">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Curriculum
                    </Link>

                    <div className="flex items-start gap-4">
                        <div className="text-4xl">{module.icon}</div>
                        <div>
                            <h1 className="text-2xl font-bold text-brand-dark sm:text-3xl">
                                Module {module.module_number}: {module.title}
                            </h1>
                            <p className="mt-2 text-slate-600 max-w-3xl">{module.description}</p>

                            {/* Unlock Callout */}
                            <div className="mt-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 w-fit">
                                <Lock className="w-4 h-4" />
                                <span>Complete all lessons to unlock the assessment.</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-8 max-w-md">
                        <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                            <span>{progressPercent}% Complete</span>
                            <span>{completedLessonIds.length}/{lessons.length} Lessons</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-copper transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">

                {/* SECTION 1: LESSONS */}
                <section>
                    <div className="mb-6 border-b border-slate-200 pb-4">
                        <h2 className="text-2xl font-bold text-brand-dark">Lessons: Learn the Concepts</h2>
                        <p className="text-slate-500 mt-1">Foundational knowledge required for certification.</p>
                    </div>

                    <div className="space-y-4">
                        {lessons.length === 0 ? (
                            <div className="p-6 bg-white rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                                No lessons published yet.
                            </div>
                        ) : (
                            lessons.map((lesson) => {
                                const isCompleted = completedLessonIds.includes(lesson.id)
                                // Icon logic
                                let Icon = FileText;
                                if (lesson.content_type === 'video' || lesson.video_url) Icon = Video;
                                else if (lesson.content_type === 'audio' || lesson.audio_url) Icon = Mic;

                                return (
                                    <Link
                                        key={lesson.id}
                                        href={`/training/${moduleId}/lesson/${lesson.id}`}
                                        className="group flex items-center gap-4 p-5 bg-white rounded-xl border border-slate-200 hover:border-brand-copper hover:shadow-lg transition-all"
                                    >
                                        <div className="flex-shrink-0">
                                            {isCompleted ? (
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                    <CheckCircle className="w-6 h-6" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-300 group-hover:border-brand-copper flex items-center justify-center text-sm font-bold text-slate-500 group-hover:text-brand-copper">
                                                    {lesson.lesson_number}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-grow">
                                            <h3 className="font-bold text-slate-800 text-lg group-hover:text-brand-copper">
                                                {lesson.title}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                <span className="flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded text-xs uppercase tracking-wide">
                                                    <Icon className="w-3 h-3" />
                                                    {lesson.video_url ? 'Video' : lesson.audio_url ? 'Audio' : 'Text'}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span>{lesson.estimated_minutes} min read</span>
                                            </div>
                                        </div>

                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-copper group-hover:text-white transition-colors">
                                            <ArrowLeft className="w-4 h-4 rotate-180" />
                                        </div>
                                    </Link>
                                )
                            })
                        )}
                    </div>
                </section>

                {/* SECTION 2: VISUAL REFERENCE LIBRARY (Secondary Support) */}
                <section>
                    <VisualReferenceLibrary resources={visualResources} />
                </section>

                {/* SECTION 3: FLASHCARDS (Reinforcement) */}
                <section className="scroll-mt-24">
                    <div className="mb-6 border-b border-slate-200 pb-4">
                        <h2 className="text-2xl font-bold text-brand-dark">Flashcards: Reinforce Key Concepts</h2>
                        <p className="text-slate-500 mt-1">Flip through these cards to test your memory (Optional).</p>
                    </div>

                    {flashcards.length > 0 ? (
                        <FlashcardDeck flashcards={flashcards} />
                    ) : (
                        <div className="bg-slate-100 rounded-xl p-8 text-center border border-dashed border-slate-300">
                            <p className="text-slate-500 italic">No interactive flashcards available for this module yet.</p>
                        </div>
                    )}
                </section>

                {/* SECTION 4: MODULE ASSESSMENT (Gate) */}
                <section className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm ring-1 ring-slate-100">
                    <div className="flex items-start gap-4">
                        <div className={`p-4 rounded-full flex-shrink-0 ${allLessonsCompleted ? 'bg-brand-copper text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {allLessonsCompleted ? <HelpCircle className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                        </div>
                        <div className="flex-grow">
                            <h2 className="text-2xl font-bold text-brand-dark mb-2">Module Assessment: Readiness Check</h2>
                            <p className="text-slate-600 mb-6 max-w-2xl text-lg">
                                Verify your understanding to earn your certificate for this module.
                            </p>

                            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg">
                                <p className="text-sm text-amber-800 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span>This quiz only covers concepts explicitly taught in the lessons above.</span>
                                </p>
                            </div>

                            {allLessonsCompleted ? (
                                <Link
                                    href={`/training/${moduleId}/quiz`}
                                    className="inline-flex items-center justify-center px-8 py-4 bg-brand-copper hover:bg-brand-copperDark text-white font-bold rounded-lg transition-colors shadow-lg shadow-brand-copper/20 w-full sm:w-auto"
                                >
                                    Start Module Quiz
                                </Link>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-6 py-4 bg-slate-100 text-slate-400 font-bold rounded-lg cursor-not-allowed w-full sm:w-auto justify-center sm:justify-start">
                                    <Lock className="w-4 h-4" /> Complete all lessons to unlock
                                </div>
                            )}
                        </div>
                    </div>
                </section>

            </div>
        </main>
    )
}
