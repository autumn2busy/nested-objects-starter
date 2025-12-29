'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Play, CheckCircle, Clock, BookOpen, Brain, Download, HelpCircle, ArrowRight, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { basicFieldInspectionModules } from '../modules'
import { cn } from '@/lib/utils'

export default function Module1OverviewPage() {
    const moduleData = basicFieldInspectionModules.find(m => m.id === 'orientation')!
    const [progress, setProgress] = useState<{
        completedLessons: string[]
        scenariosCompleted: boolean
        quizPassed: boolean
    }>({
        completedLessons: [],
        scenariosCompleted: false,
        quizPassed: false
    })
    const [loading, setLoading] = useState(true)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        async function loadProgress() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch granular progress
            const { data } = await supabase
                .from('training_progress')
                .select('lesson_id, resource_type, status')
                .eq('user_id', user.id)
                .eq('module_id', 'orientation')

            const completedLessons = data
                ?.filter(r => r.resource_type === 'lesson' && r.status === 'completed')
                .map(r => r.lesson_id) || []

            const scenariosCompleted = data?.some(r => r.resource_type === 'scenario' && r.status === 'completed') || false
            const quizPassed = data?.some(r => r.resource_type === 'quiz' && r.status === 'completed') || false

            setProgress({ completedLessons, scenariosCompleted, quizPassed })
            setLoading(false)
        }
        loadProgress()
    }, [supabase])

    const totalLessons = moduleData.lessons?.length || 0
    const completedCount = progress.completedLessons.length
    const percentComplete = Math.round((completedCount / totalLessons) * 100)

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-slate-900/0" />
                <div className="max-w-6xl mx-auto px-4 py-16 relative z-10">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 px-3 py-1 rounded-full text-blue-300 text-xs font-bold uppercase tracking-wider mb-6">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                Module 1: Orientation
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                                Evaluate the Industry &<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Launch Your Career</span>
                            </h1>
                            <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-lg">
                                Master the fundamentals of mortgage field services. Learn who the players are, what the work actually looks like, and how to get paid safely.
                            </p>

                            <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-400 mb-8">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-400" />
                                    {moduleData.duration}
                                </div>
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-emerald-400" />
                                    {totalLessons} Lessons
                                </div>
                                <div className="flex items-center gap-2">
                                    <Brain className="w-4 h-4 text-amber-400" />
                                    2 Scenarios
                                </div>
                            </div>

                            <Link
                                href="/training/basic/module-1/lesson/1"
                                className={cn(
                                    "inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105",
                                    completedCount > 0
                                        ? "bg-white text-slate-900 hover:bg-slate-100"
                                        : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/50"
                                )}
                            >
                                {completedCount > 0 ? 'Resume Module' : 'Start Module 1'}
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Video Player */}
                        <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative group">
                            <iframe
                                src={`${moduleData.videoUrl}?modestbranding=1&rel=0`}
                                className="w-full h-full absolute inset-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress & Content */}
            <div className="max-w-6xl mx-auto px-4 py-12 -mt-8 relative z-20">
                {/* Stats Card */}
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 mb-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                        <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Your Progress</span>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-slate-900">{percentComplete}%</span>
                            <span className="text-sm text-slate-400 mb-1.5">completed</span>
                        </div>
                        <Progress value={percentComplete} className="h-1.5 mt-3 bg-slate-100" indicatorClassName="bg-blue-600" />
                    </div>
                    <div className="border-l border-slate-100 pl-8">
                        <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Est. Time Remaining</span>
                        <span className="text-3xl font-bold text-slate-900">~2h</span>
                    </div>
                    <div className="border-l border-slate-100 pl-8 hidden md:block">
                        <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Documents</span>
                        <span className="text-3xl font-bold text-slate-900">5</span>
                    </div>
                    <div className="border-l border-slate-100 pl-8 hidden md:block">
                        <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Certificate</span>
                        <span className={cn("text-sm font-bold px-3 py-1 rounded-full inline-block mt-2",
                            progress.quizPassed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        )}>
                            {progress.quizPassed ? 'Earned' : 'Locked'}
                        </span>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-10">
                    {/* Main Lesson Path */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-slate-900">Core Lessons</h2>
                            <span className="text-sm text-slate-500">{completedCount} of {totalLessons} completed</span>
                        </div>

                        <div className="grid gap-4">
                            {moduleData.lessons?.map((lesson, idx) => {
                                const isCompleted = progress.completedLessons.includes(lesson.id)
                                return (
                                    <Link
                                        key={lesson.id}
                                        href={`/training/basic/module-1/lesson/${lesson.id}`}
                                        className="group bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex items-start gap-4"
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold transition-colors",
                                            isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                                        )}>
                                            {isCompleted ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors mb-1 truncate">
                                                {lesson.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 line-clamp-1">
                                                {lesson.description}
                                            </p>
                                        </div>
                                        <div className="text-xs font-semibold text-slate-400 mt-1 whitespace-nowrap">
                                            {lesson.duration}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    {/* Sidebar / Tools */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-amber-500" />
                                Interactive Training
                            </h3>
                            <div className="space-y-3">
                                <Link
                                    href="/training/basic/module-1/scenarios"
                                    className="block p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-slate-800">Scenario Lab</span>
                                        {progress.scenariosCompleted ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <ArrowRight className="w-4 h-4 text-slate-400" />}
                                    </div>
                                    <p className="text-xs text-slate-500">Practice real-world decision making in a safe environment.</p>
                                </Link>

                                <Link
                                    href="/training/basic/module-1/resources"
                                    className="block p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-slate-800">Downloads & Flashcards</span>
                                        <ArrowRight className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <p className="text-xs text-slate-500">Get the PDF toolkit and study the terminology.</p>
                                </Link>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg">
                            <h3 className="font-bold mb-2 flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-emerald-400" />
                                Final Examination
                            </h3>
                            <p className="text-slate-300 text-sm mb-6">
                                Prove your knowledge to earn the Module 1 Certificate.
                            </p>

                            {completedCount < totalLessons ? (
                                <div className="flex items-center gap-2 text-sm text-slate-400 bg-white/10 p-3 rounded-lg">
                                    <Lock className="w-4 h-4" />
                                    Complete lessons to unlock
                                </div>
                            ) : (
                                <Link
                                    href="/training/basic/module-1/quiz"
                                    className="block w-full text-center bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-900/20"
                                >
                                    Start Quiz
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
