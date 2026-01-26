'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, CheckCircle, ChevronRight, Play, Mic, FileText, Video as VideoIcon } from 'lucide-react'
import { TrainingLesson } from '@/types/training'

export default function LessonPlayerPage() {
    const params = useParams()
    const router = useRouter()
    const moduleId = params.moduleId as string
    const lessonId = params.lessonId as string

    const [lesson, setLesson] = useState<TrainingLesson | null>(null)
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

                // 2. Fetch Completion Status via API
                try {
                    const res = await fetch(`/api/training/progress?moduleId=${moduleId}`)
                    if (res.ok) {
                        const { progress } = await res.json()
                        const lessonProgress = progress?.find((p: any) => p.lesson_id === lessonId)
                        if (lessonProgress?.status === 'completed') {
                            setCompleted(true)
                        }
                    }
                } catch (err) { console.error(err) }

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
            const response = await fetch('/api/training/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    module_id: moduleId,
                    lesson_id: lessonId,
                    status: 'completed'
                })
            })

            if (response.ok) {
                setCompleted(true)
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

    // Helper: Determine effective content type
    const hasVideo = !!lesson.video_url || (lesson.content_type === 'video' && lesson.content.includes('youtu'))
    const hasAudio = !!lesson.audio_url
    const videoSource = lesson.video_url || (lesson.content_type === 'video' ? lesson.content : '')

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
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
                    <div className="font-bold text-slate-200">Lesson {lesson.lesson_number}</div>
                    <span className="opacity-50">/</span>
                    <div className="max-w-[200px] truncate">{lesson.title}</div>
                </div>
                <div className="w-20" />
            </div>

            <div className="flex-grow flex flex-col mx-auto w-full max-w-5xl">
                {/* Scrollable Content Area */}
                <div className="flex-grow w-full bg-slate-50 overflow-y-auto">
                    <div className="mx-auto max-w-4xl bg-white min-h-[50vh] shadow-sm my-8 rounded-xl overflow-hidden">

                        {/* 1. MEDIA PLAYER (Video) */}
                        {hasVideo && videoSource.includes('youtu') && (
                            <div className="aspect-video w-full bg-black relative">
                                <iframe
                                    src={videoSource.replace('watch?v=', 'embed/').split('&')[0]}
                                    className="w-full h-full absolute inset-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        )}

                        <div className="p-8 sm:p-12">
                            {/* 2. AUDIO PLAYER (If Available) */}
                            {hasAudio && (
                                <div className="mb-8 bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-4">
                                    <div className="w-12 h-12 bg-brand-copper rounded-full flex items-center justify-center text-white flex-shrink-0">
                                        <Play className="w-5 h-5 ml-1" />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                                            <Mic className="w-3 h-3 text-slate-400" /> Audio Version
                                        </div>
                                        {/* Native Audio Element */}
                                        <audio controls className="w-full h-8 mt-1 block accent-brand-copper">
                                            <source src={lesson.audio_url} type="audio/mpeg" />
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                </div>
                            )}

                            {/* 3. PRIMARY CONTENT (Text/HTML) */}
                            <div className="max-w-none prose prose-slate lg:prose-lg">
                                {/* Badge for Content Type */}
                                <div className="not-prose flex gap-2 mb-6">
                                    {hasVideo && <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-600 rounded uppercase flex items-center gap-1"><VideoIcon className="w-3 h-3" /> Video</span>}
                                    {hasAudio && <span className="text-xs font-bold px-2 py-1 bg-purple-100 text-purple-600 rounded uppercase flex items-center gap-1"><Mic className="w-3 h-3" /> Audio</span>}
                                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded uppercase flex items-center gap-1"><FileText className="w-3 h-3" /> Text</span>
                                </div>

                                {/* Actual Content */}
                                {lesson.content.trim().startsWith('<') ? (
                                    <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                                ) : (
                                    <div className="whitespace-pre-wrap">
                                        {lesson.content}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-slate-800/50 backdrop-blur-sm border-t border-slate-700/50">
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
