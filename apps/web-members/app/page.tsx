'use client'

import Script from 'next/script'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Nested Objects Member Hub',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any',
  url: 'https://nested-objects-starter.vercel.app',
  description:
    'Field inspector member hub for environmental and infrastructure compliance. Central workspace for inspectors to connect with firms, access tools, and stay compliant.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  creator: {
    '@type': 'Organization',
    name: 'Nested Objects',
  },
}

function getPlanName(uid: string | null) {
  switch (uid) {
    case 'L9nbKV9Z':
      return 'Starter'
    case 'rQVqlLm6':
      return 'Pro'
    case 'NmdnNO90':
      return 'Elite'
    case 'rmk5Xk9g':
      return 'Agency'
    default:
      return null
  }
}

export default function HomePage() {
  const { user, planUid, isLoading, isAuthenticated, logout } = useAuth()

  const planName = getPlanName(planUid)

  const firstName =
    (user as any)?.first_name ??
    (user as any)?.FirstName ??
    (user?.name ? user.name.split(' ')[0] : undefined) ??
    (user?.email ? user.email.split('@')[0] : undefined) ??
    'Member'

  const initials = firstName.charAt(0).toUpperCase()

  const isMember = isAuthenticated && !!user

  const mainCtaHref = isMember
    ? '/dashboard'
    : 'https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous'

  const mainCtaLabel = isMember ? 'Open your hub' : 'Get directory access'

  const secondaryCtaHref = isMember ? '/directory' : '/directory'
  const secondaryCtaLabel = isMember ? 'Browse active firms' : 'Preview hiring firms'

  return (
    <>
      <Script
        id="nested-objects-ld-json"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-50">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-8">
          <SiteHeader
            isLoading={isLoading}
            isMember={isMember}
            firstName={firstName}
            initials={initials}
            planName={planName}
            onLogout={logout}
          />

          <main className="mt-8 flex-1 space-y-14 lg:mt-12 lg:space-y-16">
            <HeroSection
              isMember={isMember}
              firstName={firstName}
              mainCtaHref={mainCtaHref}
              mainCtaLabel={mainCtaLabel}
              secondaryCtaHref={secondaryCtaHref}
              secondaryCtaLabel={secondaryCtaLabel}
            />

            <KeyStatsStrip />

            <FeaturesSection />

            <WorkflowStrip isMember={isMember} />

            <ForFirmsSection />
          </main>

          <CtaBanner isMember={isMember} />

          <SiteFooter />
        </div>
      </div>
    </>
  )
}

type HeaderProps = {
  isLoading: boolean
  isMember: boolean
  firstName: string
  initials: string
  planName: string | null
  onLogout: () => void
}

function SiteHeader({ isLoading, isMember, firstName, initials, planName, onLogout }: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-sm font-semibold text-white shadow-sm dark:bg-emerald-400">
            NO
          </span>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight sm:text-lg">
              Nested Objects
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Field Inspector Hub
            </span>
          </div>
        </Link>

        <nav
          className="hidden items-center gap-4 text-sm font-medium text-slate-600 sm:flex dark:text-slate-300"
          aria-label="Primary navigation"
        >
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 text-slate-900 outline-none ring-emerald-400 ring-offset-2 ring-offset-slate-50 hover:bg-slate-100 focus-visible:ring-2 dark:text-slate-50 dark:ring-offset-slate-950 dark:hover:bg-slate-900"
          >
            Home
          </Link>
          {isMember && (
            <Link
              href="/dashboard"
              className="rounded-full px-3 py-1.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:hover:bg-slate-900 dark:focus-visible:ring-offset-slate-950"
            >
              Dashboard
            </Link>
          )}
          <Link
            href="/directory"
            className="rounded-full px-3 py-1.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:hover:bg-slate-900 dark:focus-visible:ring-offset-slate-950"
          >
            Directory
          </Link>
          <Link
            href="/membership"
            className="rounded-full px-3 py-1.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:hover:bg-slate-900 dark:focus-visible:ring-offset-slate-950"
          >
            Membership
          </Link>
          <Link
            href="/tools"
            className="rounded-full px-3 py-1.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:hover:bg-slate-900 dark:focus-visible:ring-offset-slate-950"
          >
            Tools
          </Link>
          <Link
            href="/resources"
            className="rounded-full px-3 py-1.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:hover:bg-slate-900 dark:focus-visible:ring-offset-slate-950"
          >
            Resources
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {isLoading ? (
          <span className="text-xs text-slate-500 dark:text-slate-400">Checking session...</span>
        ) : isMember ? (
          <>
            <div className="flex items-center gap-3">
              <div className="hidden flex-col text-right text-xs sm:flex">
                <span className="font-semibold text-slate-800 dark:text-slate-50">
                  Welcome back, {firstName}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {planName ? `${planName} member` : 'Active member'}
                </span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-slate-50 shadow-sm dark:bg-slate-100 dark:text-slate-900">
                {initials}
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="hidden rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 sm:inline-flex dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900 dark:focus-visible:ring-offset-slate-950"
            >
              Logout
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <a
              href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
              className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:text-slate-200 dark:hover:bg-slate-900 dark:focus-visible:ring-offset-slate-950"
            >
              Login
            </a>
            <a
              href="https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous"
              className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/40 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300 dark:focus-visible:ring-offset-slate-950"
            >
              Join the hub
            </a>
          </div>
        )}
      </div>
    </header>
  )
}

type HeroProps = {
  isMember: boolean
  firstName: string
  mainCtaHref: string
  mainCtaLabel: string
  secondaryCtaHref: string
  secondaryCtaLabel: string
}

function HeroSection({
  isMember,
  firstName,
  mainCtaHref,
  mainCtaLabel,
  secondaryCtaHref,
  secondaryCtaLabel,
}: HeroProps) {
  return (
    <section className="grid gap-10 lg:grid-cols-[1.1fr,minmax(0,0.9fr)] lg:items-center">
      <div className="space-y-5">
        <p className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Built for inspectors in the field
        </p>

        <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-slate-50">
          Keep routes moving. Keep assets compliant. Keep your time protected.
        </h1>

        <p className="max-w-xl text-pretty text-sm text-slate-600 sm:text-base dark:text-slate-300">
          The Nested Objects Member Hub is your command center for inspections. See which firms are
          onboarding, understand requirements in plain language, and use AI powered tools to plan your
          next route before you leave the driveway.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={mainCtaHref}
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/40 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300 dark:focus-visible:ring-offset-slate-950"
          >
            {mainCtaLabel}
          </a>

          <Link
            href={secondaryCtaHref}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900 dark:focus-visible:ring-offset-slate-950"
          >
            {secondaryCtaLabel}
          </Link>

          <span className="text-xs text-slate-500 dark:text-slate-400">
            No resumes uploaded. You control who gets your info.
          </span>
        </div>

        <div className="mt-4 grid max-w-xl gap-3 text-xs text-slate-500 sm:grid-cols-2 sm:text-[13px] dark:text-slate-400">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-lg" aria-hidden="true">
              ✅
            </span>
            <p>
              Transparent firm intel so you know pay ranges, regions, and expectations before you apply.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-lg" aria-hidden="true">
              🧭
            </span>
            <p>
              Built for real life. School runs, second jobs, and everything else you juggle on the road.
            </p>
          </div>
        </div>
      </div>

      <aside className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-emerald-400/15 via-sky-400/5 to-slate-900/10 blur-3xl dark:from-emerald-400/15 dark:via-sky-500/10 dark:to-slate-900/40" />
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-xl shadow-slate-900/5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-slate-50 dark:bg-slate-100 dark:text-slate-900">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {isMember ? `Welcome back, ${firstName}` : 'Inspector workspace preview'}
                </span>
                <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Daily route overview
                </span>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              Live beta
            </span>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700 dark:text-slate-100">
                Today&apos;s opportunities
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Filtered by your state
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm dark:bg-slate-950">
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-50">
                    Exterior occupancy checks
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    12 stops · local bank portfolio
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  Priority
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm dark:bg-slate-950">
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-50">
                    Insurance loss photos
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    6 stops · ladder required
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  90 min est
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-[11px]">
            <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Active firms
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">34</p>
              <p className="mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-300">
                +6 added this week
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                New routes
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">11</p>
              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                In your selected radius
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Compliance score
              </p>
              <p className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-300">
                97%
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                Based on sample criteria
              </p>
            </div>
          </div>
        </div>
      </aside>
    </section>
  )
}

function KeyStatsStrip() {
  return (
    <section
      aria-label="Platform reach and coverage"
      className="grid gap-4 rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 sm:grid-cols-3 sm:text-sm"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Coverage
        </p>
        <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-50">
          Multi state visibility
        </p>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          See opportunities across markets without getting lost in generic job boards.
        </p>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Clarity
        </p>
        <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-50">
          Plain language requirements
        </p>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          No legal fog. Get the must haves for gear, photos, and turn times in one view.
        </p>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Control
        </p>
        <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-50">
          You decide the workload
        </p>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Filter by radius, asset type, or firm profile so your route matches your life.
        </p>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section aria-labelledby="features-heading" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="features-heading"
            className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl dark:text-slate-50"
          >
            Everything inspectors need in one hub.
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-300">
            Designed for environmental, mortgage, and insurance inspections. Use the hub before, during,
            and after each route.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FeatureCard
          label="Directory"
          title="Verified firms and clear expectations."
          badge="Included on all plans"
          description="See who is hiring, what they pay, and what they need from you on day one. No mystery vendors."
          items={[
            'Filter by state, service type, and experience level',
            'Understand pay structure before you apply',
            'Save firms to your short list for later',
          ]}
          href="/directory"
          linkText="Open directory"
        />
        <FeatureCard
          label="AI concierge"
          title="Ask questions in plain language."
          badge="Best with Pro and Elite"
          description="Chat with an AI trained on inspection workflows, requirements, and common firm expectations."
          items={[
            'Translate legal language into simple steps',
            'Get checklists for different inspection types',
            'Draft emails and responses to vendors',
          ]}
          href="/tools"
          linkText="View tools"
        />
        <FeatureCard
          label="Playbooks"
          title="Operational shortcuts from the field."
          badge="Playbooks library"
          description="Templates, checklists, and examples created to keep you compliant and efficient on each stop."
          items={[
            'Photo sets and narrative examples',
            'Gear and safety recommendations',
            'Time saving route planning tips',
          ]}
          href="/resources"
          linkText="Browse resources"
        />
      </div>
    </section>
  )
}

type FeatureCardProps = {
  label: string
  title: string
  badge: string
  description: string
  items: string[]
  href: string
  linkText: string
}

function FeatureCard({
  label,
  title,
  badge,
  description,
  items,
  href,
  linkText,
}: FeatureCardProps) {
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm shadow-sm backdrop-blur hover:border-emerald-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-emerald-500/40">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{description}</p>
      <ul className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
        {items.map((item) => (
          <li key={item} className="flex gap-1.5">
            <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500/70 dark:bg-emerald-400/80" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {badge}
        </span>
        <Link
          href={href}
          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
        >
          {linkText} →
        </Link>
      </div>
    </article>
  )
}

type WorkflowStripProps = {
  isMember: boolean
}

function WorkflowStrip({ isMember }: WorkflowStripProps) {
  const href = isMember
    ? '/dashboard'
    : 'https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous'

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-900 px-4 py-4 text-slate-50 shadow-lg dark:border-slate-700 dark:bg-black/80 sm:px-6 sm:py-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Workflow entry
          </p>
          <h2 className="mt-1 text-sm font-semibold sm:text-base">
            Start with your next inspection, not another blank form.
          </h2>
          <p className="mt-1 text-xs text-slate-300 sm:text-[13px]">
            Use curated firms, AI assisted planning, and ready checklists to plan your next route. One hub
            that meets you where you are instead of adding more admin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={href}
            className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/40 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            Open workflow hub
          </a>
          <Link
            href="/directory"
            className="inline-flex items-center justify-center rounded-full border border-slate-500 px-3 py-2 text-[11px] font-medium text-slate-100 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            View available firms
          </Link>
        </div>
      </div>
    </section>
  )
}

function ForFirmsSection() {
  return (
    <section
      aria-labelledby="firms-heading"
      className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 sm:p-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="firms-heading"
            className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base dark:text-slate-50"
          >
            For hiring firms and vendors.
          </h2>
          <p className="mt-1 max-w-xl text-xs text-slate-600 dark:text-slate-300">
            Connect with inspectors who treat this as a business. Share expectations clearly, reduce
            turnover, and support better field outcomes.
          </p>
        </div>
      </div>

      <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-3 dark:text-slate-300">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Transparent roles
          </p>
          <p className="mt-1">
            Share pay bands, regions, and expectations up front so you attract the right inspectors the
            first time.
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Prepared inspectors
          </p>
          <p className="mt-1">
            Members arrive with starter training and clear checklists, which cuts down on onboarding time.
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Long term relationships
          </p>
          <p className="mt-1">
            Build reliable regional coverage instead of constantly searching for new inspectors to fill
            gaps.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Link
          href="/membership"
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-[11px] font-semibold text-slate-50 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200 dark:focus-visible:ring-offset-slate-900"
        >
          Explore firm options
        </Link>
        <Link
          href="/directory"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 px-3 py-2 text-[11px] font-medium text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900 dark:focus-visible:ring-offset-slate-900"
        >
          Preview inspector hub
        </Link>
      </div>
    </section>
  )
}

type CtaBannerProps = {
  isMember: boolean
}

function CtaBanner({ isMember }: CtaBannerProps) {
  const href = isMember
    ? '/dashboard'
    : 'https://nested-objects.outseta.com/auth?widgetMode=register#o-anonymous'

  return (
    <section className="mt-10 rounded-3xl bg-gradient-to-r from-emerald-500 via-sky-500 to-slate-900 px-5 py-6 text-sm text-white shadow-xl sm:px-7 sm:py-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
            Next step
          </p>
          <h2 className="mt-1 text-base font-semibold sm:text-lg">
            Turn the hub into your daily launchpad.
          </h2>
          <p className="mt-1 max-w-xl text-xs text-emerald-50/90 sm:text-[13px]">
            Use Nested Objects before each route to plan work, confirm requirements, and protect your time.
            The hub is built for inspectors who are serious about sustainable income.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={href}
            className="inline-flex items-center justify-center rounded-full bg-slate-950/90 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-black/40 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-500"
          >
            {isMember ? 'Open my dashboard' : 'Claim my spot in the hub'}
          </a>
          <Link
            href="/membership"
            className="inline-flex items-center justify-center rounded-full border border-emerald-100/60 px-4 py-2 text-[11px] font-medium text-emerald-50 hover:bg-emerald-50/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-500"
          >
            View membership details
          </Link>
        </div>
      </div>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-slate-200 pt-4 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p>© {new Date().getFullYear()} Nested Objects LLC. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/resources"
            className="hover:text-slate-800 dark:hover:text-slate-200"
          >
            Help center
          </Link>
          <Link
            href="/membership"
            className="hover:text-slate-800 dark:hover:text-slate-200"
          >
            Membership
          </Link>
          <Link
            href="/contact"
            className="hover:text-slate-800 dark:hover:text-slate-200"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
}
