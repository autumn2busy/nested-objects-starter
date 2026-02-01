'use client'

import Link from 'next/link'

const resourceHighlights = [
  {
    title: 'Route readiness guides',
    description:
      'Step-by-step checklists for inspections, photo sets, and lender requests so you can roll out without surprises.',
    items: ['Load-out and safety checks', 'Pre-call scripts and templates', 'Turnaround and upload standards'],
    cta: { label: 'Open readiness guides', href: '/resources/readiness-guides' },
  },
  {
    title: 'Firm intel library',
    description:
      'Concise briefs on who is hiring, what they pay, and how to stand out. Pulled from the same data powering our directory.',
    items: ['Hiring signals by region', 'Equipment expectations', 'Scheduling and pay cadence notes'],
    cta: { label: 'View firm intel', href: '/resources/firm-intel' },
  },
  {
    title: 'Training & safety',
    description:
      'Practical refreshers for roof work, interior documentation, and respectful tenant interactions—built by people who do the work.',
    items: ['Route planning walkthroughs', 'Hazard spotting and PPE', 'Photo framing tips for adjusters'],
    cta: { label: 'Browse training', href: '/resources/training-safety' },
  },
  {
    title: 'Tools & templates',
    description:
      'Downloadable forms, AI prompts, and calculators that make your prep faster and more consistent from job to job.',
    items: ['Job packet builder', 'Route ROI worksheet', 'AI prompt library for firm questions'],
    cta: { label: 'See member tools', href: '/resources/tools-templates' },
  },
]

const featuredPieces = [
  {
    eyebrow: 'New',
    title: 'Spring 2025 firm outlook',
    summary: 'Where mortgage and insurance firms are adding coverage and how to prep your paperwork before applying.',
    tag: 'All members',
    href: '/resources/firm-intel',
  },
  {
    eyebrow: 'Deep dive',
    title: 'Photo standards that keep claims moving',
    summary: 'A visual checklist of angles, measurements, and file organization that reduces rework and callbacks.',
    tag: 'Pro and above',
    href: '/training',
  },
  {
    eyebrow: 'Template',
    title: '15-minute pre-route huddle',
    summary: 'Use this printable to align assistants or crew members before you leave the driveway.',
    tag: 'Elite & Agency',
    href: '/tools',
  },
]

export default function ResourcesIndexPage() {
  return (
    <main className="min-h-screen bg-brand-sand text-brand-dark">
      <section className="border-b border-brand-copper/15 bg-gradient-to-b from-brand-sand via-white to-brand-mist">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-4xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Resources</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Guidance, intel, and tools that mirror the Nested Objects mission.
            </h1>
            <p className="text-base text-slate-700">
              Everything here is built to match the parent site experience—modern, calm, and focused on clarity. Explore guides
              for brand-new inspectors and seasoned coordinators alike, all tuned to the same dark teal and graphite palette as
              the core Nested Objects platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/membership"
                className="inline-flex items-center justify-center rounded-full bg-brand-copper px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
              >
                See which resources your plan includes
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
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-copper">Built for real-world routes</p>
                <p className="mt-2 text-sm text-slate-700">
                  The same team that maintains the Nested Objects directory curates these resources. Expect concise language,
                  modern layouts, and a calm dark-teal palette that matches the parent site while keeping focus on the work.
                </p>
                <div className="mt-4 grid gap-3 text-xs text-brand-dark sm:grid-cols-3">
                  <span className="rounded-full bg-white px-3 py-1 font-semibold">Route prep & safety</span>
                  <span className="rounded-full bg-white px-3 py-1 font-semibold">Firm intel briefs</span>
                  <span className="rounded-full bg-white px-3 py-1 font-semibold">AI-assisted templates</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {resourceHighlights.map((resource) => (
                  <article key={resource.title} className="flex h-full flex-col rounded-2xl border border-brand-copper/20 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-semibold text-brand-dark">{resource.title}</h2>
                      <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-copper">
                        Updated weekly
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{resource.description}</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {resource.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-brand-copper" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4">
                      <Link
                        href={resource.cta.href}
                        className="inline-flex items-center justify-center rounded-full border border-brand-copper/30 px-4 py-2 text-xs font-semibold text-brand-dark transition hover:bg-brand-mist"
                      >
                        {resource.cta.label} →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-brand-copper/20 bg-brand-dark p-6 text-slate-100 shadow-lg shadow-brand-copper/10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-copper">Featured</p>
              <h2 className="text-xl font-semibold text-white">Latest drops from the team</h2>
              <p className="text-sm text-slate-200">
                Pull highlights from the same intel powering the parent site. Filtered by plan tier so you know what you can use today.
              </p>
              <div className="space-y-3">
                {featuredPieces.map((piece) => (
                  <div key={piece.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-brand-copper">
                      <span>{piece.eyebrow}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white">{piece.tag}</span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-white">{piece.title}</h3>
                    <p className="mt-1 text-sm text-slate-200">{piece.summary}</p>
                    <Link
                      href={piece.href}
                      className="mt-3 inline-flex text-sm font-semibold text-brand-mist underline-offset-4 transition hover:text-white"
                    >
                      Read now →
                    </Link>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white">
                <p className="font-semibold">Need something specific?</p>
                <p className="mt-1 text-slate-200">
                  Elite and Agency members can request custom guides or briefings that match their routes. Tell us the market and we will queue it up.
                </p>
                <Link
                  href="/contact"
                  className="mt-3 inline-flex text-xs font-semibold text-brand-mist underline-offset-4 transition hover:text-white"
                >
                  Request a custom brief →
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
            <h2 className="text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">Every resource mirrors the Nested Objects brand</h2>
            <p className="max-w-3xl text-sm text-slate-700">
              From the dark teal accents to the clean grid layouts, this library mirrors the parent site so your team feels at home. Bookmark the page and we will keep adding intel, templates, and training without changing the look and feel you already trust.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/membership"
                className="inline-flex items-center justify-center rounded-full bg-brand-copper px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
              >
                Upgrade for full access
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-brand-copper/30 bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-mist"
              >
                Tell us what to add next
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
