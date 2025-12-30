'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Lock, PlayCircle, CheckCircle } from 'lucide-react'
import { basicFieldInspectionModules } from './basic/modules'
import { advancedFieldInspectionModules } from './advanced/modules'

// Generic Module Type
type Module = {
  id: string
  title: string // e.g. "Module 1: ..."
  description: string
  icon?: string // Removing icon as it's not in our TS/data? Or we map it?
  // Our modules.ts doesn't have 'icon' string, it has 'type'.
  // We'll map 'type' to an icon or just use a default.
  module_number?: number // We need to infer this from title or order?
  unlock_requirement?: string
  // ... other fields
}

export default function TrainingPortalPage() {
  const [loading, setLoading] = useState(true)
  const [quizPasses, setQuizPasses] = useState<number[]>([])

  // Combine modules for display? Or section them?
  // Let's section them: Basic Track (1-4) vs Advanced (5-8).
  const basicModules = basicFieldInspectionModules
  const advancedModules = advancedFieldInspectionModules

  useEffect(() => {
    async function fetchData() {
      // Fetch Progress
      try {
        const isDev = window.location.search.includes('dev=true') && process.env.NODE_ENV === 'development'
        const res = await fetch('/api/training/progress')
        if (res.ok) {
          const { quizPasses: passed } = await res.json()
          setQuizPasses(passed || [])
        } else if (isDev) {
          setQuizPasses([1, 2, 3, 4])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Helper to check lock
  const isLocked = (modIndex: number, track: 'basic' | 'advanced') => {
    // Basic 1 (Index 0) -> Unlocked
    // Basic 2 (Index 1) -> Requires Module 1 pass?
    // Our data structure in `modules.ts` doesn't explicitly have `module_number`.
    // We assume order.
    // Logic: Mod N requires Mod N-1 passed.
    // Mod 1: Unlocked.
    // Mod 2: Requires 1.

    let modNum = 0
    if (track === 'basic') modNum = modIndex + 1
    if (track === 'advanced') modNum = modIndex + 5

    if (modNum === 1) return false
    return !quizPasses.includes(modNum - 1)
  }

  const renderModuleCard = (mod: any, index: number, track: 'basic' | 'advanced') => {
    const locked = isLocked(index, track)
    const modNum = track === 'basic' ? index + 1 : index + 5
    const isPassed = quizPasses.includes(modNum)
    const href = `/training/${track}/${mod.id}`

    return (
      <div
        key={mod.id}
        className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200
            ${locked
            ? 'bg-slate-50 border-slate-200 opacity-75'
            : 'bg-white border-brand-copper/20 shadow-sm hover:shadow-md hover:border-brand-copper/40'
          }
          `}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 bg-brand-micra rounded-lg text-brand-dark font-bold text-xl">
            {modNum}
          </div>
          {locked ? (
            <Lock className="w-5 h-5 text-slate-400" />
          ) : (
            isPassed ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <PlayCircle className="w-5 h-5 text-brand-copper" />
            )
          )}
        </div>

        <h3 className={`text-lg font-bold mb-2 ${locked ? 'text-slate-500' : 'text-brand-dark'}`}>
          {mod.title}
        </h3>

        <p className="text-sm text-slate-600 line-clamp-3 mb-6 flex-grow">
          {mod.description}
        </p>

        <div className="mt-auto">
          {locked ? (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 py-2 px-3 rounded-lg">
              <Lock className="w-3 h-3" />
              <span>Complete Module {modNum - 1} Quiz to unlock</span>
            </div>
          ) : (
            <Link
              href={href}
              className="inline-flex items-center justify-center w-full rounded-xl bg-brand-auth px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-auth/90"
            >
              {isPassed ? 'Review Module' : 'Start Module'}
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-brand-sand text-brand-dark pb-20">
      <section className="border-b border-brand-copper/15 bg-gradient-to-b from-brand-sand via-white to-brand-mist">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-4xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Training Portal</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-brand-dark">
              Field Inspector Certification
            </h1>
            <p className="text-base text-slate-700 max-w-2xl">
              Complete the Basic Track to start earning, then master the Advanced Track to scale your business.
            </p>
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                <span>Certification Progress</span>
                <span>{Math.round((quizPasses.length / 8) * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-brand-copper/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-copper transition-all duration-500"
                  style={{ width: `${(quizPasses.length / 8) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="text-center py-24 text-slate-500">Loading curriculum...</div>
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
          {/* Basic Track */}
          <section>
            <h2 className="text-2xl font-bold text-brand-dark mb-6 flex items-center gap-3">
              Basic Track <span className="text-sm font-normal text-slate-500 bg-white px-2 py-1 rounded-md border">Modules 1-4</span>
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {basicModules.map((m, i) => renderModuleCard(m, i, 'basic'))}
            </div>
          </section>

          {/* Advanced Track */}
          <section>
            <h2 className="text-2xl font-bold text-brand-dark mb-6 flex items-center gap-3">
              Advanced Track <span className="text-sm font-normal text-slate-500 bg-white px-2 py-1 rounded-md border">Modules 5-8</span>
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {advancedModules.map((m, i) => renderModuleCard(m, i, 'advanced'))}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
