'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronRight, Lock, CheckCircle2, Shield } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

type TrainingModule = {
  id: string
  module_number: number
  title: string
  description: string | null
  icon?: string | null
  is_new?: boolean | null
}

type TrainingModulesGateProps = {
  modules: TrainingModule[]
}

// Plan UIDs from auth-provider
// Starter = L9nbKV9Z, Directory = zWZD0rQp, Pro = rQVqlLm6, Elite = NmdnNO90, Agency = rmk5Xk9g
// basic_training requires 'zWZD0rQp' (Directory+)
// Free / no plan users get Module 1 only

export default function TrainingModulesGate({ modules }: TrainingModulesGateProps) {
  const { isAuthenticated, isLoading, hasAccess, planUid, login, signup } = useAuth()
  const [passedModuleIds, setPassedModuleIds] = useState<Set<string>>(new Set())
  const [progressLoading, setProgressLoading] = useState(true)

  const hasTrainingAccess = isAuthenticated && hasAccess('basic_training')

  // Fetch which modules the user has passed quizzes for
  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      setProgressLoading(false)
      return
    }

    async function fetchProgress() {
      try {
        const res = await fetch('/api/training/progress', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setPassedModuleIds(new Set(data.completedModuleIds || []))
        }
      } catch (err) {
        console.error('Failed to fetch training progress:', err)
      } finally {
        setProgressLoading(false)
      }
    }

    fetchProgress()
  }, [isAuthenticated, isLoading])

  // Not loading, not authenticated → show full gate overlay
  const showFullGate = !isLoading && !isAuthenticated

  // Authenticated but no training access (Free/Starter plan) → show partial (Module 1 open, rest locked by plan)
  const showPartialLock = !isLoading && isAuthenticated && !hasTrainingAccess

  // Sort modules by module_number for sequential logic
  const sortedModules = [...(modules || [])].sort((a, b) => a.module_number - b.module_number)

  // Determine if a module is unlocked based on sequential quiz completion
  const isModuleUnlocked = (module: TrainingModule, index: number): boolean => {
    // Module 1 is always unlocked (if plan allows)
    if (index === 0 || module.module_number === 1) return true

    // Plan-gated: if no training access, only module 1 is available
    if (showPartialLock) return false

    // Sequential lock: previous module must have a passed quiz
    // We look for any module with (current.module_number - 1) that is passed
    const previousModuleNum = module.module_number - 1
    const previousModule = sortedModules.find(m => m.module_number === previousModuleNum)

    if (!previousModule) {
      // If we can't find a module with (N-1), default to index-1 fallback
      const idxPrev = sortedModules[index - 1]
      return idxPrev ? passedModuleIds.has(idxPrev.id) : true
    }

    const hasPassedPrevious = passedModuleIds.has(previousModule.id)

    // Diagnostic log for Module 6 or others that stay locked
    if (module.module_number >= 5 && !hasPassedPrevious && !passedModuleIds.has(module.id)) {
      console.log(`[TRAINING] Module ${module.module_number} lock check: previous module ${previousModuleNum} (${previousModule.id}) passed? ${hasPassedPrevious}. Current module ${module.id} in passed list? ${passedModuleIds.has(module.id)}`)
    }

    return hasPassedPrevious
  }

  // Determine module status for display
  const getModuleStatus = (module: TrainingModule, index: number): 'completed' | 'available' | 'locked-plan' | 'locked-progress' => {
    const isPassed = passedModuleIds.has(module.id)
    if (isPassed) return 'completed'
    if (showPartialLock && index > 0) return 'locked-plan'
    if (!isModuleUnlocked(module, index)) return 'locked-progress'
    return 'available'
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      {(isLoading || progressLoading) ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-copper border-t-transparent" />
        </div>
      ) : (
        <div className="relative">
          {/* Module Grid */}
          <div
            className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 ${showFullGate ? 'pointer-events-none select-none blur-sm opacity-60' : ''
              }`}
          >
            {sortedModules?.map((module, index) => {
              const status = getModuleStatus(module, index)
              const isLocked = status === 'locked-plan' || status === 'locked-progress'
              const isCompleted = status === 'completed'

              return (
                <div key={module.id} className="relative group">
                  {isLocked ? (
                    // Locked module card — not clickable
                    <div className="block h-full">
                      <div className="bg-white border text-card-foreground shadow-sm rounded-2xl p-6 h-full relative overflow-hidden opacity-60">
                        {/* Lock overlay */}
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-2xl">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                            <Lock className="w-6 h-6 text-slate-400" />
                          </div>
                          {status === 'locked-plan' ? (
                            <>
                              <p className="text-sm font-semibold text-slate-700">Upgrade to unlock</p>
                              <p className="text-xs text-slate-500 mt-1">Module {module.module_number}</p>
                              <Link
                                href="/membership-pricing"
                                className="mt-3 inline-flex items-center justify-center rounded-full bg-brand-copper px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-copperDark"
                              >
                                View plans
                              </Link>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-slate-700">Complete Module {module.module_number - 1} first</p>
                              <p className="text-xs text-slate-500 mt-1">Pass the quiz with 80% or higher</p>
                            </>
                          )}
                        </div>

                        {/* Background card content (blurred behind overlay) */}
                        <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-6 text-3xl shadow-inner">
                          {module.icon || '\u{1F4D8}'}
                        </div>
                        <div className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                          Module {module.module_number}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">{module.title}</h2>
                        <p className="text-slate-500 mb-6 line-clamp-3 text-sm leading-relaxed">
                          {module.description}
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Unlocked module card — clickable
                    <Link href={`/challenges/${module.id}`} className="block h-full">
                      <div className={`bg-white border text-card-foreground shadow-sm rounded-2xl p-6 h-full transition-all hover:border-brand-copper hover:shadow-lg hover:-translate-y-1 relative overflow-hidden ${isCompleted ? 'border-emerald-200' : ''}`}>
                        {/* Status badge */}
                        {isCompleted ? (
                          <span className="absolute top-4 right-4 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> PASSED
                          </span>
                        ) : module.is_new ? (
                          <span className="absolute top-4 right-4 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                            NEW
                          </span>
                        ) : showPartialLock && module.module_number === 1 ? (
                          <span className="absolute top-4 right-4 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> FREE
                          </span>
                        ) : null}

                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-3xl shadow-inner group-hover:bg-brand-copper/10 transition-colors ${isCompleted ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                          {module.icon || '\u{1F4D8}'}
                        </div>

                        <div className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                          Module {module.module_number}
                        </div>

                        <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-brand-copper transition-colors">
                          {module.title}
                        </h2>
                        <p className="text-slate-500 mb-6 line-clamp-3 text-sm leading-relaxed">
                          {module.description}
                        </p>

                        <div className="flex items-center text-brand-copper font-bold text-sm mt-auto">
                          {isCompleted ? 'Review Module' : 'Start Module'} <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              )
            })}

            {(!modules || modules.length === 0) && (
              <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No training modules available yet.</h3>
                <p className="text-slate-500">Check back soon for new content.</p>
              </div>
            )}
          </div>

          {/* Full gate overlay for unauthenticated users */}
          {showFullGate && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-6 text-center shadow-xl">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-copper/10 text-brand-copper">
                  <Lock className="h-6 w-6" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-copper">
                  Training access
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Unlock the Training Center</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Log in or start your 7-day trial to access lessons, tools, and certification progress.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    onClick={login}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-copper"
                  >
                    Log in
                  </button>
                  <button
                    onClick={signup}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-brand-copper hover:text-brand-copper"
                  >
                    Start 7-day trial
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}