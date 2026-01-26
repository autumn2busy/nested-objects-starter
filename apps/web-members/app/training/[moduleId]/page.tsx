'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { PlayCircle, CheckCircle, Lock, ArrowLeft, FileText, Download, HelpCircle, AlertCircle } from 'lucide-react'
import VisualReferenceLibrary, { TrainingResource } from '@/components/training/VisualReferenceLibrary'

type Module = {
    id: string
    module_number: number
    title: string
    description: string
    icon: string
    estimated_hours: number
    video_url: string
}

type Lesson = {
    id: string
    lesson_number: number
    title: string
    estimated_minutes: number
    content_type: 'video' | 'text' | 'pdf'
}

export default function ModuleOverviewPage() {
    const params = useParams()
    const moduleId = params.moduleId as string
    const [module, setModule] = useState<Module | null>(null)
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [resources, setResources] = useState<TrainingResource[]>([])
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

                if (lessonData) setLessons(lessonData)

                // 3. Fetch Resources
                // Note: In a real app, we might join with lessons to get lesson_number. 
                // For now, we'll try to infer or just pass them through. 
                // If the DB doesn't have lesson_id on resources, we'll just show them as General.
                const { data: resourceData } = await supabase
                    .from('training_resources')
                    .select('*')
                    .eq('module_id', moduleId)

                if (resourceData) setResources(resourceData as TrainingResource[])

                // 4. Fetch Progress via API
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

            <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">

                {/* SECTION 1: LESSONS */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-brand-dark">Lessons: Learn the Concepts</h2>
                        <p className="text-slate-500">Complete all lessons to unlock the module assessment.</p>
                    </div>

                    <div className="space-y-4">
                        {lessons.length === 0 ? (
                            <div className="p-6 bg-white rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                                No lessons published yet.
                            </div>
                        ) : (
                            lessons.map((lesson, index) => {
                                const isCompleted = completedLessonIds.includes(lesson.id)
                                return (
                                    <Link
                                        key={lesson.id}
                                        href={`/training/${moduleId}/lesson/${lesson.id}`}
                                        className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-brand-copper/50 hover:shadow-md transition-all"
                                    >
                                        <div className="flex-shrink-0">
                                            {isCompleted ? (
                                                <CheckCircle className="w-8 h-8 text-green-500" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full border-2 border-slate-300 group-hover:border-brand-copper flex items-center justify-center text-sm font-bold text-slate-400 group-hover:text-brand-copper">
                                                    {lesson.lesson_number}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-grow">
                                            <h3 className="font-semibold text-slate-800 text-lg group-hover:text-brand-copper">
                                                {lesson.title}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    {lesson.content_type === 'video' ? <PlayCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                                    {lesson.content_type === 'video' ? 'Video Lesson' : 'Reading'}
                                                </span>
                                                <span>•</span>
                                                <span>{lesson.estimated_minutes} min</span>
                                            </div>
                                        </div>

                                        <div className="text-slate-400 group-hover:translate-x-1 transition-transform">
                                            →
                                        </div>
                                    </Link>
                                )
                            })
                        )}
                    </div>
                </section>

                {/* SECTION 2: VISUAL REFERENCE LIBRARY */}
                <section>
                    <VisualReferenceLibrary resources={resources} />
                </section>

                {/* SECTION 3: MODULE ASSESSMENT */}
                <section className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${allLessonsCompleted ? 'bg-brand-copper/10 text-brand-copper' : 'bg-slate-100 text-slate-400'}`}>
                            {allLessonsCompleted ? <HelpCircle className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
                        </div>
                        <div className="flex-grow">
                            <h2 className="text-2xl font-bold text-brand-dark mb-2">Module Assessment: Readiness Check</h2>
                            <p className="text-slate-600 mb-4 max-w-2xl">
                                Verify your understanding of the concepts taught in this module.
                                <span className="block mt-2 font-medium text-slate-700 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    This quiz only covers concepts explicitly taught in the lessons above.
                                </span>
                            </p>

                            {allLessonsCompleted ? (
                                <Link
                                    href={`/training/${moduleId}/quiz`}
                                    className="inline-flex items-center justify-center px-8 py-3 bg-brand-copper hover:bg-brand-copperDark text-white font-bold rounded-full transition-colors shadow-lg shadow-brand-copper/20"
                                >
                                    Start Module Quiz
                                </Link>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-400 font-bold rounded-full cursor-not-allowed">
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
