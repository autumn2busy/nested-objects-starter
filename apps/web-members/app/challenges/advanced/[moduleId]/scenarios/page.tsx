'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, CheckCircle, AlertTriangle, Play, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { advancedFieldInspectionModules, Scenario } from '../../modules'
import { cn } from '@/lib/utils'

import { useParams } from 'next/navigation'
// ...

export default function ScenariosPage() {
    const params = useParams()
    const moduleId = params.moduleId as string
    const moduleData = advancedFieldInspectionModules.find(m => m.id === moduleId)
    const scenarios = moduleData?.scenarios || []

    // State to track expanded sections per scenario
    const [expandedMap, setExpandedMap] = useState<Record<string, { decision: boolean, outcome: boolean, debrief: boolean }>>({})
    const [completedScenarios, setCompletedScenarios] = useState<string[]>([])
    const [userId, setUserId] = useState<string | null>(null)

    // Removed Supabase client initialization

    useEffect(() => {
        async function loadProgress() {
            try {
                const res = await fetch(`/api/challenges/progress?moduleId=${moduleId}`)
                if (!res.ok) return

                const { progress: data } = await res.json()
                setCompletedScenarios(data?.filter((r: any) => r.resource_type === 'scenario' && r.status === 'completed').map((r: any) => r.lesson_id) || [])
            } catch (err) {
                console.error(err)
            }
        }
        loadProgress()
    }, [moduleId])

    // Safety check - AFTER hooks
    if (!moduleData) return <div>Module not found</div>

    const toggleSection = (scenarioId: string, section: 'decision' | 'outcome' | 'debrief') => {
        setExpandedMap(prev => ({
            ...prev,
            [scenarioId]: {
                ...prev[scenarioId],
                [section]: !prev[scenarioId]?.[section]
            }
        }))
    }

    const markScenarioComplete = async (scenarioId: string) => {
        // if (!userId) return
        if (completedScenarios.includes(scenarioId)) return

        setCompletedScenarios(prev => [...prev, scenarioId])

        await fetch('/api/challenges/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                module_id: moduleId,
                lesson_id: scenarioId,
                resource_type: 'scenario',
                status: 'completed'
            })
        })
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-4 lg:p-12">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link href={`/challenges/advanced/${moduleId}`} className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-2 mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Overview
                    </Link>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Scenario Lab</h1>
                    <p className="text-slate-600">Practice your decision-making skills in these real-world interactive scenarios.</p>
                </div>

                <div className="space-y-6">
                    {scenarios.map((scenario, idx) => {
                        const state = expandedMap[scenario.id] || { decision: false, outcome: false, debrief: false }
                        const isCompleted = completedScenarios.includes(scenario.id)

                        return (
                            <div key={scenario.id} className={cn(
                                "bg-white rounded-2xl border transition-all overflow-hidden",
                                isCompleted ? "border-emerald-200 shadow-sm" : "border-slate-200 shadow-sm"
                            )}>
                                {/* Header */}
                                <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Scenario {idx + 1}</span>
                                            {isCompleted && <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Complete</span>}
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900">{scenario.title}</h2>
                                    </div>
                                </div>

                                {/* Situation (Always Visible) */}
                                <div className="p-6 bg-slate-50 border-b border-slate-100">
                                    <h3 className="font-bold text-slate-700 text-sm uppercase mb-2">The Situation</h3>
                                    <p className="text-slate-800 text-lg leading-relaxed">{scenario.situation}</p>

                                    {!state.decision && (
                                        <Button
                                            onClick={() => toggleSection(scenario.id, 'decision')}
                                            className="mt-4 bg-sky-600 hover:bg-sky-500"
                                        >
                                            Analyze Decision Points <ChevronDown className="w-4 h-4 ml-2" />
                                        </Button>
                                    )}
                                </div>

                                {/* Decision Points */}
                                {state.decision && (
                                    <div className="p-6 border-b border-slate-100 animate-in fade-in slide-in-from-top-4">
                                        <h3 className="font-bold text-slate-700 text-sm uppercase mb-4">Key Decisions</h3>
                                        <div className="space-y-6">
                                            {scenario.decisionPoints.map((dp, i) => (
                                                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5">
                                                    <p className="font-bold text-slate-900 mb-4">{dp.question}</p>
                                                    <div className="space-y-3">
                                                        {dp.options.map((opt, optIdx) => (
                                                            <div key={optIdx} className="p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer group">
                                                                <div className="flex gap-3">
                                                                    <div className="mt-1">
                                                                        {opt.isOptimal ? <div className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 group-hover:border-blue-400" />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-slate-800">{opt.text}</p>
                                                                        <p className="text-sm text-slate-500 mt-1">{opt.feedback}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {!state.outcome && (
                                            <Button
                                                onClick={() => toggleSection(scenario.id, 'outcome')}
                                                variant="secondary"
                                                className="mt-6"
                                            >
                                                Reveal Outcomes <ChevronDown className="w-4 h-4 ml-2" />
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Outcome */}
                                {state.outcome && (
                                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 animate-in fade-in slide-in-from-top-4">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                                                <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Optimal Outcome</h4>
                                                <p className="text-emerald-900 text-sm">{scenario.outcome.optimal}</p>
                                            </div>
                                            <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                                                <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Risks of Poor Choice</h4>
                                                <p className="text-red-900 text-sm">{scenario.outcome.suboptimal}</p>
                                            </div>
                                        </div>

                                        {!state.debrief && (
                                            <Button
                                                onClick={() => {
                                                    toggleSection(scenario.id, 'debrief')
                                                    markScenarioComplete(scenario.id)
                                                }}
                                                className="mt-6 bg-slate-900 text-white hover:bg-slate-800"
                                            >
                                                Final Debrief <ChevronDown className="w-4 h-4 ml-2" />
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Debrief */}
                                {state.debrief && (
                                    <div className="p-6 bg-slate-900 text-white animate-in fade-in slide-in-from-top-4">
                                        <h3 className="font-bold text-slate-400 text-sm uppercase mb-2">Lesson Learned</h3>
                                        <p className="text-lg font-medium leading-relaxed">{scenario.debrief}</p>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
