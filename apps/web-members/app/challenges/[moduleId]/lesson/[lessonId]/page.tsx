// @ts-nocheck
/* eslint-disable */
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { CheckCircle, ChevronRight, Play, Mic, FileText, Video as VideoIcon } from 'lucide-react'
import { TrainingLesson } from '@/types/training'
import LessonViewer from '@/components/training/LessonViewer'
import { lessonsData } from '@/components/training/lessons.data'

export default function LessonPlayerPage() {
    const params = useParams()
    const router = useRouter()
    const moduleId = params.moduleId as string
    const lessonId = params.lessonId as string

    const [lesson, setLesson] = useState<TrainingLesson | null>(null)
    const [completed, setCompleted] = useState(false)
    const [loading, setLoading] = useState(true)
    const [nextLessonId, setNextLessonId] = useState<string | null>(null)

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
                    const res = await fetch(`/api/challenges/progress?moduleId=${moduleId}`)
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
            const response = await fetch('/api/challenges/progress', {
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
                router.refresh() // Refresh to update sidebar
                if (nextLessonId) {
                    router.push(`/challenges/${moduleId}/lesson/${nextLessonId}`)
                } else {
                    router.push(`/challenges/${moduleId}`)
                }
            }
        } catch (err) {
            console.error('Failed to save progress', err)
        }
    }

    if (loading) return <div className="min-h-screen grid place-content-center text-slate-400">Loading Content...</div>
    if (!lesson) return <div className="min-h-screen grid place-content-center text-brand-copper">Lesson not found.</div>

    // CHECK FOR RICH CONTENT (Static Data Override)
    // If we have static rich data for this lesson number, use the LessonViewer
    const hasRichContent = lesson.lesson_number && lessonsData[lesson.lesson_number];

    if (hasRichContent) {
        return (
            <div className="p-4 sm:p-8 max-w-5xl mx-auto">
                <LessonViewer
                    lessonId={lesson.lesson_number}
                    onComplete={handleMarkComplete}
                    isCompleted={completed}
                />
            </div>
        )
    }

    // GENERIC FALLBACK CONTENT VIEWER (For future lessons without static data)
    const hasVideo = !!lesson.video_url || (lesson.content_type === 'video' && lesson.content.includes('youtu'))
    const hasAudio = !!lesson.audio_url
    const videoSource = lesson.video_url || (lesson.content_type === 'video' ? lesson.content : '')

    return (
        <div className="flex-grow flex flex-col mx-auto w-full max-w-5xl py-8 px-4 sm:px-8">
            <div className="bg-white min-h-[50vh] shadow-sm rounded-xl overflow-hidden border border-slate-200">

                {/* 1. MEDIA PLAYER (Video) */}
                {hasVideo && (
                    <div className="aspect-video w-full bg-black relative">
                        <iframe
                            src={(function () {
                                const url = videoSource || '';
                                let videoId = '';
                                if (url.includes('youtu.be/')) {
                                    videoId = url.split('youtu.be/')[1].split('?')[0];
                                } else if (url.includes('watch?v=')) {
                                    videoId = url.split('watch?v=')[1].split('&')[0];
                                } else if (url.includes('embed/')) {
                                    videoId = url.split('embed/')[1].split('?')[0];
                                }
                                // Default embed URL if we found an ID, otherwise return original (fallback)
                                return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : url;
                            })()}
                            className="w-full h-full absolute inset-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                )}

                <div className="p-8 sm:p-12">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{lesson.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-8">
                        <span className="flex items-center gap-1"><VideoIcon className="w-3 h-3" /> Video Lesson</span>
                        <span>{lesson.estimated_minutes} min duration</span>
                    </div>

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

            {/* Footer Controls */}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleMarkComplete}
                    className={`
                        flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-lg
                        ${completed
                            ? 'bg-green-600/20 text-green-700 border border-green-600/50 cursor-default'
                            : 'bg-brand-copper hover:bg-brand-copperDark text-white'
                        }
                    `}
                >
                    {completed ? (
                        <>
                            <CheckCircle className="w-5 h-5" /> Lesson Completed
                        </>
                    ) : (
                        <>
                            Mark Complete <ChevronRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
