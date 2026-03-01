'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, ArrowRight, CheckCircle, Circle, Menu, BookOpen, AlertTriangle, Home, Car, PenTool } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { advancedFieldInspectionModules } from '../../../modules'
import { cn } from '@/lib/utils'

// Icons for audience callouts
const AudienceIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'notary': return <PenTool className="w-5 h-5" />
        case 'realtor': return <Home className="w-5 h-5" />
        case 'gig-worker': return <Car className="w-5 h-5" />
        case 'inspector': return <CheckCircle className="w-5 h-5" />
        default: return <BookOpen className="w-5 h-5" />
    }
}

export default function LessonPage() {
    const params = useParams()
    const router = useRouter()
    const moduleId = params.moduleId as string
    const lessonId = params.lessonId as string
    const moduleData = advancedFieldInspectionModules.find(m => m.id === moduleId)

    const [completedLessons, setCompletedLessons] = useState<string[]>([])
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        async function loadData() {
            try {
                const res = await fetch(`/api/challenges/progress?moduleId=${moduleId}`)
                if (!res.ok) return

                const { progress: data } = await res.json()
                setCompletedLessons(data?.filter((r: any) => r.status === 'completed').map((r: any) => r.lesson_id) || [])
            } catch (err) {
                console.error(err)
            }
        }
        loadData()
    }, [moduleId])

    // Early return if not found - AFTER hooks
    if (!moduleData) return <div>Module not found</div>

    const currentIndex = moduleData.lessons?.findIndex(l => l.id === lessonId) ?? -1
    const currentLesson = moduleData.lessons?.[currentIndex]

    if (!currentLesson) return <div>Lesson not found</div>

    const handleComplete = async () => {
        // Optimistic update
        setCompletedLessons(prev => [...prev, lessonId])

        await fetch('/api/challenges/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                module_id: moduleId,
                lesson_id: lessonId,
                resource_type: 'lesson',
                status: 'completed'
            })
        })

        const nextLesson = moduleData.lessons?.[currentIndex + 1]
        if (nextLesson) {
            router.push(`/challenges/advanced/${moduleId}/lesson/${nextLesson.id}`)
        } else {
            router.push(`/challenges/advanced/${moduleId}/quiz`)
        }
    }

    const nextLesson = moduleData.lessons?.[currentIndex + 1]
    const prevLesson = moduleData.lessons?.[currentIndex - 1]

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            {/* Mobile Sidebar Toggle */}
            <div className="lg:hidden fixed top-20 right-4 z-50">
                <Button variant="secondary" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="bg-white shadow p-2">
                    <Menu className="w-5 h-5" />
                </Button>
            </div>

            {/* Sidebar Navigation */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-40 w-80 bg-white border-r border-slate-200 transform transition-transform duration-200 lg:translate-x-0 lg:static flex flex-col pt-20 lg:pt-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-slate-100">
                    <Link href={`/challenges/advanced/${moduleId}`} className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-2 mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Overview
                    </Link>
                    <h2 className="font-bold text-slate-900 leading-tight">{moduleData.title}</h2>
                    <div className="mt-2 text-xs text-slate-400 font-medium">
                        {completedLessons.length} of {moduleData.lessons?.length} lessons complete
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {moduleData.lessons?.map((lesson, idx) => {
                        const isCompleted = completedLessons.includes(lesson.id)
                        const isActive = lesson.id === lessonId
                        return (
                            <Link
                                key={lesson.id}
                                href={`/challenges/advanced/${moduleId}/lesson/${lesson.id}`}
                                className={cn(
                                    "flex items-start gap-3 p-3 rounded-lg text-sm transition-colors",
                                    isActive ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50",
                                )}
                            >
                                <div className={cn("mt-0.5 shrink-0", isCompleted ? "text-emerald-500" : "text-slate-300")}>
                                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                </div>
                                <span className="line-clamp-2">{idx + 1}. {lesson.title}</span>
                            </Link>
                        )
                    })}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 max-w-4xl mx-auto w-full p-4 lg:p-12 pb-32">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 lg:p-12 mb-8">
                    <span className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2 block">Lesson {currentIndex + 1}</span>
                    <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-6">{currentLesson.title}</h1>

                    {/* Audience Callouts */}
                    {currentLesson.callouts && (
                        <div className="grid md:grid-cols-2 gap-4 mb-8">
                            {currentLesson.callouts.map((c, i) => (
                                <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3">
                                    <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm h-fit text-slate-600">
                                        <AudienceIcon type={c.type} />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1 block">For {c.type}s</span>
                                        <p className="text-sm text-slate-700 leading-snug">{c.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Markdown Content */}
                    <div className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600">
                        <ReactMarkdown>
                            {currentLesson.content}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* Bottom Navigation */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 lg:pl-80 z-30">
                    <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                        {prevLesson ? (
                            <Link
                                href={`/challenges/advanced/${moduleId}/lesson/${prevLesson.id}`}
                                className="text-slate-500 hover:text-slate-900 font-medium flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Previous</span>
                            </Link>
                        ) : (
                            <div />
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={handleComplete}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8"
                            >
                                {completedLessons.includes(lessonId) ? 'Continue' : 'Mark Complete'}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
