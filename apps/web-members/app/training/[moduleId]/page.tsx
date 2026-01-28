// @ts-nocheck
/* eslint-disable */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { PlayCircle, CheckCircle, Lock, ArrowRight, Brain, Camera, FileText, Target, Play } from 'lucide-react'
import VisualReferenceLibrary from '@/components/training/VisualReferenceLibrary'
import { TrainingModule, TrainingResource, TrainingFlashcard } from '@/types/training'
import FlashcardDeck from '@/components/training/FlashcardDeck'

export default function ModuleOverviewPage() {
    const params = useParams()
    const moduleId = params.moduleId as string
    const [module, setModule] = useState<TrainingModule | null>(null)
    const [stats, setStats] = useState({ total: 0, completed: 0 })
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            if (!moduleId) return

            try {
                // 1. Fetch Module Details
                const { data: mod } = await supabase
                    .from('training_modules')
                    .select('*')
                    .eq('id', moduleId)
                    .single()

                setModule(mod)

                // 2. Fetch Progress Stats
                const { data: lessonData } = await supabase
                    .from('training_lessons')
                    .select('id')
                    .eq('module_id', moduleId)

                const total = lessonData?.length || 0

                // Get completed count via API or DB
                const res = await fetch(`/api/training/progress?moduleId=${moduleId}`)
                let completed = 0
                if (res.ok) {
                    const { progress } = await res.json()
                    completed = progress?.filter((p: any) => p.status === 'completed').length || 0
                }

                setStats({ total, completed })

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

    const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

    return (
        <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
            {/* Hero Section */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-light text-brand-dark text-xs font-bold uppercase tracking-wider rounded-full">
                        <Target className="w-3 h-3" /> Module {module.module_number}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                        {module.title}
                    </h1>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        {module.description}
                    </p>

                    <div className="flex items-center gap-4 pt-2">
                        <Link
                            href={`/training/${moduleId}/lesson/lesson-1`} // Assuming Lesson 1 is always the start, dynamically could find first ID
                            className="px-6 py-3 bg-brand-copper hover:bg-brand-copperDark text-white font-bold rounded-xl transition shadow-lg shadow-brand-copper/20 flex items-center gap-2"
                        >
                            <PlayCircle className="w-5 h-5" /> Start Module
                        </Link>
                        <div className="text-sm text-slate-500 font-medium">
                            {stats.completed} of {stats.total} lessons completed
                        </div>
                    </div>
                </div>

                {/* Progress Circle (Visual Flair) */}
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

            {/* Quick Links Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-brand-copper/50 transition cursor-pointer group">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Brain className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">Flashcards</h3>
                    <p className="text-sm text-slate-500">Master key terminology with interactive cards.</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-brand-copper/50 transition cursor-pointer group">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">Visual Library</h3>
                    <p className="text-sm text-slate-500">Reference guide for photos and defects.</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-brand-copper/50 transition cursor-pointer group">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Target className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">Final Assessment</h3>
                    <p className="text-sm text-slate-500">Test your knowledge to earn your certificate.</p>
                </div>
            </div>

            {/* Welcome Video Placeholder */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-8 text-center text-white">
                    <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm cursor-pointer hover:bg-brand-copper hover:text-white transition">
                        <Play className="w-6 h-6 ml-1" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Watch the Introduction</h3>
                    <p className="text-slate-400 max-w-lg mx-auto">
                        Get an overview of what you will learn in this module and how to get the most out of the platform.
                    </p>
                </div>
            </div>
        </div>
    )
}

