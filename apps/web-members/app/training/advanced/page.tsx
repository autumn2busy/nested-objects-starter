'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Gate } from '@/components/Gate'

const advancedTrainingModules = [
  {
    title: 'High-stakes scenario lab',
    type: 'Scenario lab',
    duration: '~25 minutes',
    minutes: 25,
    tags: ['Scenario', 'Dispute handling', 'Field documentation'],
    description:
      'Role-play an insurance dispute and capture the evidence set an adjuster expects. Use structured prompts to keep your notes defensible.',
    syllabus: [
      'Map escalation paths and who owns the next call.',
      'Capture before/after photo sets with clear context.',
      'Document chain-of-custody language that firms prefer.',
    ],
    action: '/training/advanced/scenario-lab',
    media: '/training/scenario-lab.svg',
  },
  {
    title: 'AI drill: prompt guardrails',
    type: 'AI drill',
    duration: '~18 minutes',
    minutes: 18,
    tags: ['AI assist', 'Prompting', 'Quality'],
    description:
      'Practice sending structured requests to the assistant without leaking client PHI. Compare outputs to coordinator-approved examples.',
    syllabus: [
      'Select the right template for loss drafts vs. occupancy.',
      'Rewrite vague directions into precise, checklisted asks.',
      'Score AI outputs against brand-safe responses.',
    ],
    action: '/training/advanced/ai-guardrails',
    media: '/training/ai-drill.svg',
  },
  {
    title: 'Route readiness quiz',
    type: 'Quiz',
    duration: '~12 minutes',
    minutes: 12,
    tags: ['Quiz', 'Compliance', 'Photo standards'],
    description:
      'Short checks that mirror real coordinator feedback. Earn a shareable badge for the Elite dashboard when you pass.',
    syllabus: [
      'Identify risky photo gaps before you submit.',
      'Spot the right escalation note for each scenario.',
      'Confirm file naming and metadata expectations.',
    ],
    action: '/training/advanced/quiz',
    media: '/training/quiz.svg',
  },
  {
    title: 'Elite checklist pack',
    type: 'Checklist',
    duration: '~20 minutes',
    minutes: 20,
    tags: ['Checklist', 'Download', 'Vendor ready'],
    description:
      'Downloadable checklists aligned to Elite firms. Print, save to mobile, or load into your AI assistant for quick recall.',
    syllabus: [
      'Occupancy, loss draft, and loss control variants.',
      'Line-by-line reminders for measurements and context.',
      'Submission-ready file structure and naming.',
    ],
    action: '/training/advanced/checklists',
    media: '/training/checklist.svg',
  },
]

export default function AdvancedTrainingPage() {
  const completedModules = 1
  const completionRate = Math.round((completedModules / advancedTrainingModules.length) * 100)
  const totalMinutes = advancedTrainingModules.reduce((sum, module) => sum + module.minutes, 0)
  const progressClass =
    completionRate >= 100
      ? 'w-full'
      : completionRate >= 75
        ? 'w-3/4'
        : completionRate >= 50
          ? 'w-1/2'
          : completionRate >= 25
            ? 'w-1/3'
            : 'w-[14%]'

  return (
    <main className="min-h-screen bg-brand-sand text-brand-dark">
      <Gate feature="advanced_training">
        <section className="border-b border-brand-copper/15 bg-gradient-to-b from-brand-sand via-white to-brand-mist">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-brand-copper">
                  <Link
                    href="/training"
                    className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-copper shadow-sm transition hover:bg-brand-mist"
                  >
                    ← Back to training
                  </Link>
                  <span className="hidden text-xs uppercase tracking-[0.2em] sm:inline">Advanced track</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Advanced, AI-driven inspection mastery</h1>
                <p className="max-w-3xl text-base text-slate-700">
                  Deep drills for Elite inspectors who want to rehearse complex scenarios, practice AI guardrails, and leave a
                  trail of pristine documentation. Everything keeps the calm, dark-on-light palette used throughout the hub.
                </p>
                <div className="flex flex-wrap gap-3 text-xs font-semibold text-brand-dark">
                  <span className="rounded-full bg-white px-3 py-1">Scenario labs</span>
                  <span className="rounded-full bg-white px-3 py-1">AI-assisted drills</span>
                  <span className="rounded-full bg-white px-3 py-1">Quizzes & checklists</span>
                </div>
              </div>

              <div className="w-full max-w-md rounded-3xl border border-brand-copper/20 bg-white p-6 shadow-lg shadow-brand-copper/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-copper">Snapshot</p>
                    <h2 className="text-xl font-semibold text-brand-dark">Your advanced path</h2>
                    <p className="text-sm text-slate-700">Keep a quick read on pacing and where you left off.</p>
                  </div>
                  <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-copper">
                    Estimated {totalMinutes} min
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-brand-dark">
                    <span>{completedModules} of {advancedTrainingModules.length} modules</span>
                    <span>{completionRate}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-brand-mist">
                    <div
                      aria-valuemax={100}
                      aria-valuemin={0}
                      aria-valuenow={completionRate}
                      role="progressbar"
                      className={`h-full rounded-full bg-brand-copper transition-all ${progressClass}`}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-brand-dark/80">
                    <span className="rounded-full bg-brand-mist px-3 py-1">Updated weekly</span>
                    <span className="rounded-full bg-brand-mist px-3 py-1">Elite & Agency</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="flex flex-col gap-3 pb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Modules</p>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">Advanced training modules</h2>
                  <p className="text-sm text-slate-700">Scenario, AI drill, quiz, and checklist lessons arranged for quick pickup.</p>
                </div>
                <div className="flex gap-2 text-xs text-brand-dark">
                  <span className="rounded-full bg-brand-mist px-3 py-1 font-semibold">Download-friendly</span>
                  <span className="rounded-full bg-brand-mist px-3 py-1 font-semibold">Dark-on-light layouts</span>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
              {advancedTrainingModules.map((module) => (
                <article
                  key={module.title}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-brand-copper/20 bg-brand-mist/60 shadow-sm transition hover:-translate-y-1 hover:border-brand-copper/40 hover:shadow-brand-copper/10"
                >
                  <div className="flex flex-col gap-4 p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-copper">
                          {module.type}
                        </span>
                        <span className="text-xs font-semibold text-brand-dark">{module.duration}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {module.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-dark">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-brand-dark">{module.title}</h3>
                      <p className="text-sm text-slate-700">{module.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 bg-white p-6">
                    <ul className="space-y-2 text-sm text-slate-700">
                      {module.syllabus.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-brand-copper" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={module.action}
                        className="inline-flex items-center justify-center rounded-full bg-brand-copper px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
                      >
                        Start module →
                      </Link>
                      {module.media ? (
                        <div className="relative h-20 w-32 overflow-hidden rounded-xl border border-brand-copper/15 bg-brand-mist">
                          <Image
                            src={module.media}
                            alt={`${module.title} media placeholder`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : null}
                    </div>
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
