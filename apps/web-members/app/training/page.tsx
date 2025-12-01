'use client'

import Link from 'next/link'

const tracks = [
  {
    title: 'Basic field inspection track',
    summary:
      'Zero-to-one curriculum for getting through your first occupancy checks, loss drafts, and photo sets without rework.',
    href: '/training/basic',
    tier: 'Starter & Pro',
    duration: '45–60 minutes',
    highlights: [
      'Concise primers on inspection types, lender expectations, and sample reports.',
      'Equipment and photo standards to keep coordinators from sending you back.',
      'Upload-ready checklists you can print or load on your phone.',
    ],
  },
  {
    title: 'Advanced, AI-driven mastery',
    summary:
      'Scenario-based drills for Elite members who want to simulate complex inspections with AI guardrails.',
    href: '/training/advanced',
    tier: 'Elite & Agency',
    duration: '75–90 minutes',
    highlights: [
      'Interactive decision trees for disputes, escalation paths, and claim documentation.',
      'AI prompt packs aligned to firm expectations so you never guess in the field.',
      'Role-play walk-throughs for tenant interactions, adjuster calls, and vendor coordination.',
    ],
  },
]

const quickWins = [
  {
    title: 'Route-ready',
    detail: 'Every lesson ends with a printable or mobile-friendly checklist so you can use it immediately.',
  },
  {
    title: 'Built by field pros',
    detail: 'Curriculum is curated by inspectors and coordinators who still run routes—not generic coursework.',
  },
  {
    title: 'Aligned to firms',
    detail: 'Modules mirror the same data powering the firm directory, so guidance stays current.',
  },
]

export default function TrainingPortalPage() {
  return (
    <main className="min-h-screen bg-brand-sand text-brand-dark">
      <section className="border-b border-brand-copper/15 bg-gradient-to-b from-brand-sand via-white to-brand-mist">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-4xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Training</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Training built for the Nested Objects vendor hub.
            </h1>
            <p className="text-base text-slate-700">
              Follow the same calm, modern layout as the main site while you level up. Choose the basic path to launch your
              first routes or the advanced path to rehearse AI-assisted scenarios before you step on site.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/membership"
                className="inline-flex items-center justify-center rounded-full bg-brand-copper px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
              >
                See which plans include each track
              </Link>
              <Link
                href="/directory"
                className="inline-flex items-center justify-center rounded-full border border-brand-copper/30 bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-mist"
              >
                Preview firms hiring now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-brand-copper/15 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-brand-copper/20 bg-brand-mist p-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-copper">Choose your lane</p>
                <p className="mt-2 text-sm text-slate-700">
                  Whether you are onboarding or polishing Elite credentials, each track pairs tight copy with action-ready
                  templates. Everything mirrors the parent brand—dark teal accents, restrained typography, and clean grids that
                  keep focus on the work.
                </p>
                <div className="mt-4 grid gap-3 text-xs text-brand-dark sm:grid-cols-3">
                  <span className="rounded-full bg-white px-3 py-1 font-semibold">Photo standards & checklists</span>
                  <span className="rounded-full bg-white px-3 py-1 font-semibold">AI-assisted drills</span>
                  <span className="rounded-full bg-white px-3 py-1 font-semibold">Vendor-ready downloads</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {tracks.map((track) => (
                  <article key={track.title} className="flex h-full flex-col rounded-2xl border border-brand-copper/20 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-copper">{track.tier}</p>
                        <h2 className="text-lg font-semibold text-brand-dark">{track.title}</h2>
                      </div>
                      <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-copper">
                        {track.duration}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{track.summary}</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {track.highlights.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-brand-copper" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-4">
                      <Link
                        href={track.href}
                        className="inline-flex items-center justify-center rounded-full border border-brand-copper/30 px-4 py-2 text-xs font-semibold text-brand-dark transition hover:bg-brand-mist"
                      >
                        Open track →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-brand-copper/20 bg-brand-dark p-6 text-slate-100 shadow-lg shadow-brand-copper/10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-copper">How it works</p>
              <h2 className="text-xl font-semibold text-white">Designed for active vendors</h2>
              <p className="text-sm text-slate-200">
                You stay in control. Start with the track that matches your access level, complete checklists in any order, and
                use the downloads on real routes. We keep the layout consistent with the rest of the hub, so nothing feels bolted
                on.
              </p>
              <div className="space-y-3">
                {quickWins.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <h3 className="text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-200">{item.detail}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white">
                <p className="font-semibold">Need a custom drill?</p>
                <p className="mt-1 text-slate-200">
                  Elite and Agency members can request simulations for specific firms or service lines. Tell us the market and we
                  will queue it up.
                </p>
                <Link
                  href="/contact"
                  className="mt-3 inline-flex text-xs font-semibold text-brand-mist underline-offset-4 transition hover:text-white"
                >
                  Request a scenario →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-sand">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Stay aligned</p>
            <h2 className="text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">Every module fits the Nested Objects aesthetic</h2>
            <p className="max-w-3xl text-sm text-slate-700">
              From the dark teal accents to the tidy grids, the training portal mirrors the parent site so your team feels at
              home. Bookmark this page and we will keep adding drills, templates, and briefings without changing the look and
              feel you already trust.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/upgrade"
                className="inline-flex items-center justify-center rounded-full bg-brand-copper px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
              >
                Upgrade for full access
              </Link>
              <Link
                href="/resources"
                className="inline-flex items-center justify-center rounded-full border border-brand-copper/30 bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-mist"
              >
                See related resources
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
