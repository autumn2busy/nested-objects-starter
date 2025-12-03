'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'
import { basicFieldInspectionModules } from './modules'

const completionPercent = 28

export default function BasicTrainingPage() {
  return (
    <main className="min-h-screen bg-brand-sand text-brand-dark">
      <Gate feature="basic_training">
        <section className="border-b border-brand-copper/15 bg-gradient-to-b from-brand-sand via-white to-brand-mist">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">
              <Link href="/dashboard" className="text-brand-copper underline-offset-4 hover:underline">
                Dashboard
              </Link>
              <span className="text-brand-dark">/</span>
              <span className="text-brand-dark">Training</span>
              <span className="text-brand-dark">/</span>
              <span className="text-brand-dark">Basic track</span>
            </div>

            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.55fr)] lg:items-start">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Basic track</p>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Basic field inspection training</h1>
                <p className="text-base text-slate-700 sm:text-lg">
                  A calm, modern set of modules that takes you from zero to confidently delivering your first inspections. Each
                  lesson mirrors the training portal styling so you can move through it without losing your place.
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-brand-dark">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-brand-copper" /> Completion time: ~60 minutes
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-brand-dark" /> 4 modules with syllabus previews
                  </span>
                </div>
              </div>

              <div className="rounded-3xl border border-brand-copper/25 bg-white/70 p-6 shadow-lg shadow-brand-copper/10 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-copper">Progress</p>
                    <p className="mt-1 text-lg font-semibold text-brand-dark">Track your momentum</p>
                  </div>
                  <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-xs font-semibold text-brand-copper">Basic</span>
                </div>
                <p className="mt-3 text-sm text-slate-700">
                  Your checklist mirrors the core portal: clear labels, dark-teal tones, and concise guidance. Use this tracker to
                  see how close you are to unlocking advanced modules.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm font-semibold text-brand-dark">
                    <span>{completionPercent}% complete</span>
                    <span className="text-brand-copper">Next up: Field kit and photo standards</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-brand-copper/15">
                    <div
                      className="h-2.5 rounded-full bg-brand-copper shadow-sm shadow-brand-copper/30"
                      style={{ width: `${completionPercent}%` }}
                      aria-label="Training progress"
                      role="progressbar"
                      aria-valuenow={completionPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-brand-dark sm:text-sm">
                    <div className="rounded-2xl border border-brand-copper/20 bg-brand-mist px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-brand-copper">Pace</p>
                      <p className="mt-1">15 minutes per day</p>
                    </div>
                    <div className="rounded-2xl border border-brand-copper/20 bg-brand-mist px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-brand-copper">Streak</p>
                      <p className="mt-1">2 days active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-3xl space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Module lineup</p>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Start with the fundamentals</h2>
                <p className="text-sm text-slate-700 sm:text-base">
                  Each card mirrors the clean grids from the main training portal: lesson type tags, duration chips, syllabus
                  previews, and a clear call to start. They stack into a single column on small screens so you can study on the go.
                </p>
              </div>
              <Link
                href="/training"
                className="inline-flex items-center justify-center rounded-full border border-brand-copper/30 bg-brand-mist px-5 py-2.5 text-sm font-semibold text-brand-dark transition hover:border-brand-copper hover:bg-white"
              >
                Browse all training →
              </Link>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {basicFieldInspectionModules.map((module) => (
                <article
                  key={module.id}
                  className="flex h-full flex-col rounded-3xl border border-brand-copper/20 bg-brand-mist/80 p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-copper">{module.type}</p>
                      <h3 className="mt-1 text-xl font-semibold text-brand-dark">{module.title}</h3>
                      <p className="mt-2 text-sm text-slate-700">{module.description}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-dark shadow-sm">
                      {module.duration}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-2 text-sm text-brand-dark">
                    {module.syllabus.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-brand-copper" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Syllabus preview</span>
                    <Link
                      href={`/training/basic/${module.id}`}
                      className="inline-flex items-center justify-center rounded-full bg-brand-copper px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
                    >
                      Start module →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </Gate>
    </main>
  )
}
