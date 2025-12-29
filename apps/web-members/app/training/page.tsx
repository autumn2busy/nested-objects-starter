'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Lock, PlayCircle, CheckCircle } from 'lucide-react'

// Types based on our new schema
type Module = {
  id: string
  module_number: number
  title: string
  description: string
  icon: string
  estimated_hours: number
  unlock_requirement: string
  video_url: string
}

type Progress = {
  module_id: string
  status: 'not_started' | 'in_progress' | 'completed'
}

export default function TrainingPortalPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [progressMap, setProgressMap] = useState<Record<string, string>>({})
  const [quizPasses, setQuizPasses] = useState<number[]>([]) // module_numbers that are passed

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Fetch Modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('training_modules')
          .select('*')
          .order('module_number')

        if (modulesError) throw modulesError

        // 2. Fetch User Progress (Check quiz attempts or module completion)
        const { data: { user } } = await supabase.auth.getUser()

        // DEV BYPASS: ?dev=true in URL (only in development)
        const isDev = window.location.search.includes('dev=true') && process.env.NODE_ENV === 'development'

        if (user) {
          // Check completed quizzes to determine locks
          const { data: attempts } = await supabase
            .from('quiz_attempts')
            .select('module_id, passed, training_modules(module_number)')
            .eq('user_id', user.id)
            .eq('passed', true)

          const passedModuleNumbers = attempts?.map((a: any) => a.training_modules.module_number) || []
          setQuizPasses(passedModuleNumbers)
        } else if (isDev) {
          // Mock progress for verification
          console.log('DEV MODE: Mocking progress')
          setQuizPasses([1, 2]) // Pretend Module 1 & 2 are passed to show unlocked 3
        }

        if (modulesData) setModules(modulesData)

      } catch (error) {
        console.error('Error fetching training data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Helper to check if locked
  const isLocked = (mod: Module) => {
    if (mod.unlock_requirement === 'immediate') return false
    // Format: 'module_X_quiz_pass'
    const requiredModule = parseInt(mod.unlock_requirement.split('_')[1])
    return !quizPasses.includes(requiredModule)
  }

  return (
    <main className="min-h-screen bg-brand-sand text-brand-dark">
      {/* Hero Section */}
      <section className="border-b border-brand-copper/15 bg-gradient-to-b from-brand-sand via-white to-brand-mist">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-4xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Training Portal</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-brand-dark">
              Field Inspector Certification Program
            </h1>
            <p className="text-base text-slate-700 max-w-2xl">
              Master the 8 core modules to transform from a gig worker into an elite professional earning $1,500+ weekly.
            </p>

            {/* Overall Progress Bar (Placeholder logic) */}
            <div className="mt-6">
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                <span>Program Progress</span>
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

      {/* Modules Grid */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading curriculum...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((mod) => {
              const locked = isLocked(mod)
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
                    <span className="text-2xl">{mod.icon}</span>
                    {locked ? (
                      <Lock className="w-5 h-5 text-slate-400" />
                    ) : (
                      quizPasses.includes(mod.module_number) ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <PlayCircle className="w-5 h-5 text-brand-copper" />
                      )
                    )}
                  </div>

                  <h3 className={`text-lg font-bold mb-2 ${locked ? 'text-slate-500' : 'text-brand-dark'}`}>
                    Module {mod.module_number}: {mod.title}
                  </h3>

                  <p className="text-sm text-slate-600 line-clamp-3 mb-6 flex-grow">
                    {mod.description}
                  </p>

                  <div className="mt-auto">
                    {locked ? (
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 py-2 px-3 rounded-lg">
                        <Lock className="w-3 h-3" />
                        <span>Complete Module {mod.module_number - 1} Quiz to unlock</span>
                      </div>
                    ) : (
                      <Link
                        href={`/training/${mod.id}`}
                        className="inline-flex items-center justify-center w-full rounded-xl bg-brand-auth px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-auth/90"
                      >
                        {quizPasses.includes(mod.module_number) ? 'Review Module' : 'Start Module'}
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
