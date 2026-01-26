'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Lock, PlayCircle, CheckCircle } from 'lucide-react'
import { TrainingModule } from '@/types/training'

export default function TrainingPortalPage() {
  const [loading, setLoading] = useState(true)
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [completedModuleIds, setCompletedModuleIds] = useState<string[]>([])

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // 1. Fetch Modules
        const { data: moduleData, error } = await supabase
          .from('training_modules')
          .select('*')
          .order('module_number')

        if (error) throw error
        if (moduleData) setModules(moduleData as TrainingModule[])

        // 2. Fetch Progress
        const isDev = window.location.search.includes('dev=true') && process.env.NODE_ENV === 'development'
        const res = await fetch('/api/training/progress')
        if (res.ok) {
          const { completedModuleIds } = await res.json()
          setCompletedModuleIds(completedModuleIds || [])
        }
      } catch (err) {
        console.error("Error loading training portal:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Split into tracks
  // Basic: 1-4, Advanced: 5-8 (or anything > 4)
  const basicModules = modules.filter(m => m.module_number <= 4)
  const advancedModules = modules.filter(m => m.module_number > 4)
  const totalModules = modules.length

  // Helper to check lock
  const isLocked = (mod: TrainingModule) => {
    // Logic: A module is locked if the previous module is not completed.
    // Module 1 is always unlocked.
    if (mod.module_number === 1) return false

    // Find previous module
    const prevMod = modules.find(m => m.module_number === mod.module_number - 1)
    if (!prevMod) return false // Should not happen if sequential

    return !completedModuleIds.includes(prevMod.id)
  }

  const renderModuleCard = (mod: TrainingModule) => {
    const locked = isLocked(mod)
    const isPassed = completedModuleIds.includes(mod.id)
    const href = `/training/${mod.id}` // Direct dynamic route

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
            {mod.module_number}
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
              <span>Complete previous module to unlock</span>
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
                <span>{totalModules > 0 ? Math.round((completedModuleIds.length / totalModules) * 100) : 0}%</span>
              </div>
              <div className="h-2 w-full bg-brand-copper/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-copper transition-all duration-500"
                  style={{ width: `${totalModules > 0 ? (completedModuleIds.length / totalModules) * 100 : 0}%` }}
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
              {basicModules.map((m) => renderModuleCard(m))}
            </div>
            {basicModules.length === 0 && <div className="text-slate-400 italic">No basic modules found. Check database seeding.</div>}
          </section>

          {/* Advanced Track */}
          <section>
            <h2 className="text-2xl font-bold text-brand-dark mb-6 flex items-center gap-3">
              Advanced Track <span className="text-sm font-normal text-slate-500 bg-white px-2 py-1 rounded-md border">Modules 5-8</span>
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {advancedModules.map((m) => renderModuleCard(m))}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
