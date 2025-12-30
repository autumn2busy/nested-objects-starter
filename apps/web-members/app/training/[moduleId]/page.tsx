'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { PlayCircle, CheckCircle, Lock, ArrowLeft, FileText, Download } from 'lucide-react'

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

type Resource = {
    id: string
    title: string
    description: string
    file_path: string
    file_type: string
}

export default function ModuleOverviewPage() {
    const params = useParams()
    const moduleId = params.moduleId as string
    const [module, setModule] = useState<Module | null>(null)
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [resources, setResources] = useState<Resource[]>([])
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
                const { data: resourceData } = await supabase
                    .from('training_resources')
                    .select('*')
                    .eq('module_id', moduleId)

                if (resourceData) setResources(resourceData)

                // 4. Fetch Progress via API
                try {
                    const res = await fetch(`/api/training/progress?moduleId=${moduleId}`)
                    if (res.ok) {
                        const { progress } = await res.json()
                        // Ensure progress is array
                        const pList = Array.isArray(progress) ? progress : []
                        // Filter for completed lessons
                        setCompletedLessonIds(pList.filter((p: any) => p.status === 'completed' && p.resource_type === 'lesson' || p.lesson_id && !p.resource_type /* legacy fallback */).map((p: any) => p.lesson_id))
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

                    <div className="mt-8 flex items-center gap-4">
                        <div className="flex-grow max-w-md">
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

                        {progressPercent === 100 && (
                            <Link
                                href={`/training/${moduleId}/quiz`}
                                className="btn-primary bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-bold text-sm shadow-md"
                            >
                                Take Quiz
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 grid gap-8 lg:grid-cols-[2fr_1fr]">

                {/* Lessons List */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-brand-dark mb-4">Curriculum</h2>
                    {lessons.length === 0 ? (
                        <div className="p-6 bg-white rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                            No lessons published yet.
                        </div>
                    ) : (
                        lessons.map((lesson, index) => {
                            const isCompleted = completedLessonIds.includes(lesson.id)
                            // Logic: Lock specific lessons if sequential? For now, open all within module.

                            return (
                                <Link
                                    key={lesson.id}
                                    href={`/training/${moduleId}/lesson/${lesson.id}`}
                                    className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-brand-copper/50 hover:shadow-md transition-all"
                                >
                                    <div className="flex-shrink-0">
                                        {isCompleted ? (
                                            <CheckCircle className="w-6 h-6 text-green-500" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-brand-copper flex items-center justify-center text-xs font-bold text-slate-400 group-hover:text-brand-copper">
                                                {lesson.lesson_number}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-grow">
                                        <h3 className="font-semibold text-slate-800 group-hover:text-brand-copper">
                                            {lesson.title}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                {lesson.content_type === 'video' ? <PlayCircle className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
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

                {/* Sidebar: Downloads & Metadata */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
                            <Download className="w-4 h-4" /> Resources
                        </h3>
                        {resources.length === 0 ? (
                            <p className="text-sm text-slate-500">No downloads available.</p>
                        ) : (
                            <ul className="space-y-3">
                                {resources.map(res => (
                                    <li key={res.id}>
                                        <a
                                            href={res.file_path} // Need real download logic/signed URL later
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block text-sm text-brand-copper hover:underline truncate"
                                        >
                                            {res.title}
                                        </a>
                                        <p className="text-xs text-slate-400 mt-0.5">{res.description}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

            </div>
        </main>
    )
}
