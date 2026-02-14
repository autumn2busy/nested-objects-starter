import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

const serviceHighlights = [
  {
    title: 'AI field intelligence',
    description:
      'Context-aware guidance on pricing, SLAs, and client expectations drawn from verified field data so you can bid with clarity.',
  },
  {
    title: 'Inspector-first operations',
    description:
      'Route design, safety standards, and readiness checklists built for contractors who manage their own book of business.',
  },
  {
    title: 'Conversion-ready resources',
    description:
      'Proposals, capability briefs, and outreach cadences you can customize to win contracts faster and increase repeat work.',
  },
]

const credibilitySignals = [
  {
    label: 'Home & property inspectors',
    copy: 'Built for professionals who split time between the field and the office, with guidance that respects both.',
  },
  {
    label: 'Coordinators & dispatch',
    copy: 'Structured routes, messaging templates, and compliance guardrails for teams managing multiple markets.',
  },
  {
    label: 'Tech-forward contractors',
    copy: 'AI tooling that surfaces next best actions and keeps every job log audit-ready without extra clicks.',
  },
]

const milestoneStats = [
  { label: 'Markets covered', value: '48 states', helper: 'Regional demand briefs updated weekly.' },
  { label: 'Avg. time saved per inspection', value: '27 minutes', helper: 'From prep to submission with automation.' },
  { label: 'Pros leveling up', value: '3,200+', helper: 'Inspectors, notaries, and coordinators active monthly.' },
]

const teamHighlights = [
  {
    name: 'Autumn Williams',
    role: 'Founder & AI Architect',
    focus:
      'Former field inspector with 15 years of experience. Built AI-driven tech stacks for enterprise clients and large franchise member hubs to modernize the industry from the inside out.',
  },
  {
    name: 'Kye Gibson',
    role: 'Systems & Security',
    focus:
      'Oversees the secure, scalable infrastructure that safeguards member data. Ensures 24/7 reliability for field teams utilizing our AI and dispatch tools.',
  },
]


const faqItems = [
  {
    question: 'How does the AI concierge work for inspectors?',
    answer:
      'Our AI parses verified firm intel, training content, and your past activity to surface fast, actionable guidance on scope, required photos, and equipment—without replacing your judgment.',
  },
  {
    question: 'Do I need a specific plan to access routing support?',
    answer:
      'Routing insights and templated readiness checklists are included for all members. Advanced optimization and multi-market coordination unlock in Pro and Agency plans.',
  },
  {
    question: 'Is the intel vetted before it is published?',
    answer:
      'Yes. Each firm profile is checked against public records, member feedback, and current SLAs. Updates are timestamped and archived so you can verify the source.',
  },
]

export const metadata: Metadata = {
  title: 'About Nested Objects | AI support for property inspectors and coordinators',
  description:
    'Learn how Nested Objects equips home and property inspectors with AI-powered intel, routing support, and conversion-ready resources modeled after leading industry associations.',
  alternates: {
    canonical: 'https://nested-objects-starter.vercel.app/about-us',
  },
  openGraph: {
    type: 'article',
    url: 'https://nested-objects-starter.vercel.app/about-us',
    title: 'About Nested Objects | AI support for property inspectors and coordinators',
    description:
      'The Nested Objects story, mission, and team behind AI-driven intel for inspectors, coordinators, and property pros.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'Property inspector reviewing a checklist in front of a home',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Nested Objects | AI support for property inspectors and coordinators',
    description:
      'See how Nested Objects blends field-tested operations with AI to help inspectors and coordinators win more work.',
  },
}

export default function AboutPage() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Nested Objects',
    url: 'https://nested-objects-starter.vercel.app',
    logo: 'https://nested-objects-starter.vercel.app/logo-light.svg',
    description:
      'AI-powered member hub for home inspectors, notaries, realtors, and coordinators seeking verified intel and modern workflows.',
    sameAs: ['https://nested-objects-starter.vercel.app/about-us', 'https://nested-objects-starter.vercel.app/contact-us'],
  }

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'AI field intelligence and routing support',
    areaServed: 'United States',
    provider: {
      '@type': 'Organization',
      name: 'Nested Objects',
    },
    serviceType: 'Property inspection enablement',
    description:
      'Verified firm directory, AI concierge, routing guidance, and training for inspectors, notaries, and coordinators.',
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <main className="bg-brand-sand text-brand-dark">
      <article>
        <header className="border-b border-brand-mist bg-brand-dark text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:px-8 lg:py-20">
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-teal">About Nested Objects</p>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                Redefining how inspectors, coordinators, and property pros run their routes.
              </h1>
              <p className="max-w-2xl text-base text-brand-mist">
                Nested Objects blends field-tested operations with AI insight modeled on organizations like NAMFS. From intel to
                routing to conversion-ready resources, we help you protect margins and respond to clients faster.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/membership-pricing"
                  className="border border-brand-copper bg-brand-copper px-5 py-3 text-sm font-semibold text-black transition hover:border-brand-copperDark hover:bg-brand-copperDark hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-teal"
                  aria-label="Explore membership plans"
                >
                  Explore membership tiers
                </Link>
                <Link
                  href="/contact-us"
                  className="border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-slate hover:border-brand-slate focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-teal"
                  aria-label="Talk with our team"
                >
                  Talk with our team
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {credibilitySignals.map((signal) => (
                  <div key={signal.label} className="border border-brand-slate/40 bg-brand-slate/40 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-teal">{signal.label}</p>
                    <p className="mt-2 text-sm text-brand-mist">{signal.copy}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 border border-brand-mist bg-brand-sand/90 p-6">
              <div className="flex items-center justify-between border-b border-brand-mist pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 border border-brand-copper bg-brand-dark"></div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-brand-copper">Mission-led</p>
                    <p className="text-lg font-semibold">Clarity for every dispatch</p>
                  </div>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-steel">Operational core</span>
              </div>
              <p className="text-sm text-brand-slate">
                Born from years coordinating property inspections, Nested Objects delivers transparent rates, requirements, and
                AI-backed suggestions that keep field teams moving. We audit intel weekly, log every update, and translate complex
                SLAs into steps that fit your workflow.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {milestoneStats.map((stat) => (
                  <div key={stat.label} className="border border-brand-mist bg-white px-3 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-brand-steel">{stat.label}</p>
                    <p className="mt-2 text-xl font-bold text-brand-dark">{stat.value}</p>
                    <p className="mt-1 text-xs text-brand-slate">{stat.helper}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        <section className="border-b border-brand-mist bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-brand-copper">Story and vision</p>
                <h2 className="text-2xl font-bold leading-snug sm:text-3xl">
                  Built like a modern trade association with AI inside every workflow.
                </h2>
                <p className="text-base text-brand-slate">
                  We studied the rigor of organizations like NAMFS and paired it with automation that reduces admin time for
                  inspectors and coordinators. The result: a membership hub that publishes real intel, anticipates risks, and
                  connects you with the firms that value your craft.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {serviceHighlights.map((item) => (
                    <article key={item.title} className="border border-brand-mist bg-brand-sand px-4 py-5" aria-label={item.title}>
                      <h3 className="text-sm font-semibold text-brand-dark">{item.title}</h3>
                      <p className="mt-2 text-sm text-brand-slate">{item.description}</p>
                    </article>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/hiring-firms"
                    className="border border-brand-copper px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-dark transition hover:bg-brand-copper hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-teal"
                    aria-label="Preview the verified directory"
                  >
                    Preview the directory
                  </Link>
                  <Link
                    href="/challenges"
                    className="border border-brand-slate px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-dark transition hover:bg-brand-dark hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-teal"
                    aria-label="View training resources"
                  >
                    Training resources
                  </Link>
                </div>
              </div>
              <div className="grid gap-4 border border-brand-mist bg-brand-sand px-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="border border-brand-mist bg-white px-3 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-brand-steel">AI concierge</p>
                    <p className="mt-2 text-sm text-brand-dark">Guides next actions based on client SLAs and your past submissions.</p>
                  </div>
                  <div className="border border-brand-mist bg-white px-3 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-brand-steel">Compliance snapshots</p>
                    <p className="mt-2 text-sm text-brand-dark">Side-by-side comparisons of requirements by firm, service, and market.</p>
                  </div>
                  <div className="border border-brand-mist bg-white px-3 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-brand-steel">Routing intel</p>
                    <p className="mt-2 text-sm text-brand-dark">Suggested sequencing, gear reminders, and proof photo guidance.</p>
                  </div>
                  <div className="border border-brand-mist bg-white px-3 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-brand-steel">Conversion assets</p>
                    <p className="mt-2 text-sm text-brand-dark">Proposals, outreach cadences, and rate calculators ready to deploy.</p>
                  </div>
                </div>
                <div className="relative h-72 border border-brand-mist bg-brand-dark">
                  <Image
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80"
                    alt="Inspector reviewing a checklist outside a property"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-brand-dark/70 to-transparent" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </section>



        <section className="border-b border-brand-mist bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-brand-copper">Team and governance</p>
                <h2 className="text-2xl font-bold sm:text-3xl">Operators, technologists, and member advocates.</h2>
                <p className="text-base text-brand-slate">
                  The team combines dispatch experience, AI strategy, and member success to keep our roadmap grounded in the work
                  you do every day. Expect direct communication, transparent changelogs, and resources you can put to work in one
                  sitting.
                </p>
              </div>
              <Link
                href="/inspector-resource-center"
                className="border border-brand-dark px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-brand-dark transition hover:bg-brand-dark hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-teal"
              >
                Read the latest releases
              </Link>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {teamHighlights.map((member) => (
                <article key={member.name} className="border border-brand-mist bg-brand-sand px-4 py-5" aria-label={member.name}>
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-steel">{member.role}</p>
                  <h3 className="mt-2 text-lg font-semibold text-brand-dark">{member.name}</h3>
                  <p className="mt-2 text-sm text-brand-slate">{member.focus}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-brand-mist bg-brand-dark text-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-brand-teal">FAQs</p>
                <h2 className="text-2xl font-bold sm:text-3xl">Straight answers for field pros.</h2>
                <p className="text-base text-brand-mist">
                  From AI guardrails to routing support, here is what new members ask before they join. Need more detail? Reach out
                  and we will tailor a plan for your routes.
                </p>
              </div>
              <Link
                href="/contact-us"
                className="border border-brand-teal px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-brand-teal transition hover:bg-brand-teal hover:text-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                Ask a question
              </Link>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {faqItems.map((item) => (
                <article key={item.question} className="border border-brand-slate bg-brand-slate/50 px-4 py-5" aria-label={item.question}>
                  <h3 className="text-sm font-semibold text-white">{item.question}</h3>
                  <p className="mt-2 text-sm text-brand-mist">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-brand-sand">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-brand-copper">Next steps</p>
                <h2 className="text-2xl font-bold sm:text-3xl">Ready to modernize your inspection routes?</h2>
                <p className="text-base text-brand-slate">
                  Choose the plan that matches your workload today. We will layer in intel, routing support, and AI concierge access
                  as you scale into new markets.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/membership-pricing"
                    className="border border-brand-copper bg-brand-copper px-5 py-3 text-sm font-semibold text-black transition hover:border-brand-copperDark hover:bg-brand-copperDark hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-teal"
                    aria-label="Compare membership plans"
                  >
                    Compare plans
                  </Link>
                  <Link
                    href="/hiring-firms"
                    className="border border-brand-dark px-5 py-3 text-sm font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-teal"
                    aria-label="Preview the directory"
                  >
                    Preview the directory
                  </Link>
                </div>
              </div>
              <div className="grid gap-4 border border-brand-mist bg-white px-4 py-5">
                <div className="relative aspect-video w-full overflow-hidden bg-brand-dark">
                  <Image
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
                    alt="Platform dashboard preview"
                    fill
                    className="object-cover opacity-90"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm transition hover:scale-105 hover:bg-white/30 cursor-pointer">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-8 w-8 text-white"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-brand-dark">See the hub in action</p>
                    <span className="text-xs uppercase tracking-[0.22em] text-brand-steel">2:14</span>
                  </div>
                  <p className="mt-2 text-sm text-brand-slate">
                    Watch how experienced inspectors plan routes, find firms, and access intel in seconds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </main>
  )
}
