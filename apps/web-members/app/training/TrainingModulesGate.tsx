'use client'

import Link from 'next/link'
import { BookOpen, ChevronRight, Lock } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { OUTSETA_SIGNUP_URL } from '@/lib/outseta'

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

export default function TrainingModulesGate({ modules }: TrainingModulesGateProps) {
  const { isAuthenticated, isLoading, hasAccess, login } = useAuth()
  const trialSignupUrl = OUTSETA_SIGNUP_URL
  const hasTrainingAccess = isAuthenticated && hasAccess('basic_training')
  const showGate = !isLoading && !hasTrainingAccess

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-copper border-t-transparent" />
        </div>
      ) : (
        <div className="relative">
          <div
            className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 ${
              showGate ? 'pointer-events-none select-none blur-sm opacity-60' : ''
            }`}
          >
            {modules?.map((module) => (
              <Link
                key={module.id}
                href={`/training/${module.id}`}
                className="group block h-full"
              >
                <div className="bg-white border text-card-foreground shadow-sm rounded-2xl p-6 h-full transition-all hover:border-brand-copper hover:shadow-lg hover:-translate-y-1 relative overflow-hidden">
                  {module.is_new && (
                    <span className="absolute top-4 right-4 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                      NEW
                    </span>
                  )}

                  <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-6 text-3xl shadow-inner group-hover:bg-brand-copper/10 transition-colors">
                    {module.icon || '📘'}
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
                    Start Module <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}

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

          {showGate && (
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
                  {!isAuthenticated ? (
                    <>
                      <button
                        onClick={login}
                        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-copper"
                      >
                        Log in
                      </button>
                      <a
                        href={trialSignupUrl}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-brand-copper hover:text-brand-copper"
                      >
                        Start 7-day trial
                      </a>
                    </>
                  ) : (
                    <Link
                      href="/upgrade"
                      className="inline-flex items-center justify-center rounded-full bg-brand-copper px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-copperDark"
                    >
                      Start 7-day trial
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
