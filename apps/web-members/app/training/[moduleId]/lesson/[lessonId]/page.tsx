'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, CheckCircle, ChevronRight, Play } from 'lucide-react'

type Lesson = {
    id: string
    lesson_number: number
    title: string
    content_type: 'video' | 'text' | 'pdf'
    content: string // URL for video, Markdown for text
    estimated_minutes: number
}

export default function LessonPlayerPage() {
    const params = useParams()
    const router = useRouter()
    const moduleId = params.moduleId as string
    const lessonId = params.lessonId as string

    const [lesson, setLesson] = useState<Lesson | null>(null)
    const [nextLessonId, setNextLessonId] = useState<string | null>(null)
    const [completed, setCompleted] = useState(false)
    const [loading, setLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            if (!lessonId) return

            try {
                setLoading(true)
                // 1. Fetch This Lesson
                const { data: currentLesson, error } = await supabase
                    .from('training_lessons')
                    .select('*')
                    .eq('id', lessonId)
                    .single()

                if (error) throw error
                setLesson(currentLesson)

                // 2. Fetch Completion Status
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: progress } = await supabase
                        .from('training_progress')
                        .select('status')
                        .eq('user_id', user.id)
                        .eq('lesson_id', lessonId)
                        .single()

                    if (progress?.status === 'completed') {
                        setCompleted(true)
                    }
                }

                // 3. Find Next Lesson
                const { data: allLessons } = await supabase
                    .from('training_lessons')
                    .select('id, lesson_number')
                    .eq('module_id', moduleId)
                    .order('lesson_number')

                if (allLessons && currentLesson) {
                    const currentIndex = allLessons.findIndex((l: any) => l.id === lessonId)
                    if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
                        setNextLessonId(allLessons[currentIndex + 1].id)
                    }
                }

            } catch (error) {
                console.error('Error loading lesson:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [lessonId, moduleId])

    const handleMarkComplete = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('training_progress')
                .upsert({
                    user_id: user.id,
                    module_id: moduleId,
                    lesson_id: lessonId,
                    status: 'completed',
                    updated_at: new Date().toISOString()
                })

            if (!error) {
                setCompleted(true)
                // Optional: Auto-redirect or just show success
                if (nextLessonId) {
                    router.push(`/training/${moduleId}/lesson/${nextLessonId}`)
                } else {
                    router.push(`/training/${moduleId}`)
                }
            }
        } catch (err) {
            console.error('Failed to save progress', err)
        }
    }

    if (loading) return <div className="min-h-screen grid place-content-center text-slate-400">Loading Content...</div>
    if (!lesson) return <div className="min-h-screen grid place-content-center text-brand-copper">Lesson not found.</div>

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
            {/* Top Nav */}
            <div className="border-b border-slate-700 bg-slate-900 px-4 py-4 flex justify-between items-center">
                <Link
                    href={`/training/${moduleId}`}
                    className="text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Exit to Module
                </Link>
                <h1 className="text-sm font-bold text-slate-200 hidden sm:block">
                    Lesson {lesson.lesson_number}: {lesson.title}
                </h1>
                <div className="w-20" /> {/* Spacer */}
            </div>

            <div className="flex-grow flex flex-col mx-auto w-full max-w-5xl">
                {/* Main Content Viewer */}
                <div className="flex-grow bg-black relative aspect-video w-full max-h-[70vh]">
                    {/* If video */}
                    {lesson.content_type === 'video' && lesson.content.includes('youtu') ? (
                        <iframe
                            src={lesson.content.replace('watch?v=', 'embed/').split('&')[0]}
                            className="w-full h-full absolute inset-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                            <p className="mb-4">No video content available.</p>
                            {/* Fallback for text content */}
                            <div className="prose prose-invert max-w-none text-left w-full p-8">
                                {lesson.content}
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls / Metadata */}
                <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">{lesson.title}</h2>
                        <p className="text-slate-400 text-sm">Estimated time: {lesson.estimated_minutes} minutes</p>
                    </div>

                    <button
                        onClick={handleMarkComplete}
                        className={`
              flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-lg
              ${completed
                                ? 'bg-green-600/20 text-green-400 border border-green-600/50 cursor-default'
                                : 'bg-brand-copper hover:bg-brand-copperDark text-white'
                            }
            `}
                    >
                        {completed ? (
                            <>
                                <CheckCircle className="w-5 h-5" /> Completed
                            </>
                        ) : (
                            <>
                                Mark Complete <ChevronRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
