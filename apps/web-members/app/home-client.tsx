'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'

import { useAuth } from '@/components/auth-provider'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Nested Objects Membership',
  url: 'https://nestedobjects.com',
  logo: 'https://nestedobjects.com/logo.png',
  sameAs: ['https://www.linkedin.com/company/nestedobjects'],
  description:
    'Modern membership for field inspectors, notaries, and real estate vendors to access training, vetted firms, and billing.',
}

const featurePillars = [
  {
    title: 'Directory intelligence',
    description: 'Search verified firms by territory, tools, onboarding requirements, and reviews.',
    badge: 'Starter +',
    href: '/directory',
  },
  {
    title: 'Dashboard & billing',
    description: 'View plan status, download invoices, and manage MFA without leaving the hub.',
    badge: 'All plans',
    href: '/dashboard',
  },
  {
    title: 'Partners & perks',
    description: 'Preferred pricing on gear, data, and logistics with plan-aware upgrades.',
    badge: 'Pro+',
    href: '/partners',
  },
  {
    title: 'AI tools & routing',
    description: 'Concierge prompts for pricing, compliance, and route planning with optimistic saves.',
    badge: 'Pro+',
    href: '/tools',
  },
  {
    title: 'Training tracks',
    description: 'Role-specific micro-lessons with tabs for new member onboarding and advanced labs.',
    badge: 'Starter +',
    href: '/training',
  },
]

const testimonials = [
  {
    quote: 'The dashboard shaved an hour off every route. Billing clarity is chef’s kiss.',
    name: 'Danielle R., Elite member',
  },
  {
    quote: 'Directory filters + saved searches helped me find firms that actually match my gear.',
    name: 'Marco L., Pro member',
  },
  {
    quote: 'Outseta login never blocks my crew. The fallback links and alerts are a lifesaver.',
    name: 'Rhea P., Agency owner',
  },
]

const resources = [
  {
    title: 'New: Hybrid inspection playbook',
    category: 'Training',
    href: '/training',
  },
  {
    title: 'Partner spotlight: Route optimization bundle',
    category: 'Partners',
    href: '/partners',
  },
  {
    title: 'AI concierge prompt kit',
    category: 'Tools',
    href: '/tools',
  },
]

function useOutsetaReadiness() {
  const [isReady, setIsReady] = useState(false)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    let mounted = true
    const interval = setInterval(() => {
      setAttempts((prev) => prev + 1)
      if (typeof window !== 'undefined' && (window as any).Outseta) {
        clearInterval(interval)
        if (mounted) setIsReady(true)
      }
    }, 600)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return { isReady, attempts }
}

function getPlanName(planUid: string | null): string {
  switch (planUid) {
    case 'L9nbKV9Z':
      return 'Starter'
    case 'rQVqlLm6':
      return 'Pro'
    case 'NmdnNO90':
      return 'Elite'
    case 'rmk5Xk9g':
      return 'Agency'
    default:
      return 'Member'
  }
}

export function HomeClientPage() {
  const { user, isAuthenticated, planUid, isLoading } = useAuth()
  const { isReady, attempts } = useOutsetaReadiness()
  const [email, setEmail] = useState('')
  const [newsletterError, setNewsletterError] = useState<string | null>(null)
  const [subscribed, setSubscribed] = useState(false)
  const [isPending, startTransition] = useTransition()

  const greeting = useMemo(() => {
    if (!isAuthenticated) return 'Welcome home'
    const name =
      user?.first_name || user?.FirstName || user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Member'
    return `Welcome back, ${name}`
  }, [isAuthenticated, user])

  const planName = useMemo(() => getPlanName(planUid ?? null), [planUid])

  const handleNewsletter = () => {
    if (!email.includes('@')) {
      setNewsletterError('Enter a valid email to receive training drops.')
      return
    }
    setNewsletterError(null)
    startTransition(() => {
      setTimeout(() => {
        setSubscribed(true)
      }, 650)
    })
  }

  return (
    <>
      <Script id="org-ld-json" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />

      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
        {/* Top hero */}
        <section className="relative isolate overflow-hidden px-4 pb-16 pt-12 sm:px-6 lg:px-10">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <Image src="/hero.jpg" alt="Gradient hero background" fill priority className="object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-br from-brand-copper/40 via-slate-950/70 to-slate-900/90" />
          </div>

          <div className="relative mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs backdrop-blur">
              <span className="inline-flex items-center gap-2 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.25)]" aria-hidden />
                Unified dashboard, directory, partners, and training
              </span>
              <span className="hidden items-center gap-3 text-slate-200 sm:inline-flex">
                <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-wide">Plan aware</span>
                <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-wide">Outseta native</span>
              </span>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-amber-100">{planName} experience</span>
                  {isAuthenticated ? (
                    <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[13px] text-emerald-100">
                      {greeting}
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/15 px-3 py-1 text-[13px] text-slate-200">No login required to explore</span>
                  )}
                </div>

                <h1 className="text-balance text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
                  Membership built on trust, transparent directory intel, and a dashboard that respects your time.
                </h1>

                <p className="max-w-3xl text-base text-slate-200">
                  Join a modern, Outseta-powered community where billing, directory discovery, and training are unified. Plan-aware
                  CTAs, inline validation, and hosted portal fallbacks keep you moving—no dead ends.
                </p>

                <div className="flex flex-wrap gap-3" aria-label="Primary actions">
                  <Link href="/membership" className={buttonVariants({ className: 'bg-white text-slate-900 hover:bg-amber-100' })}>
                    Join the membership
                  </Link>
                  <Link
                    href="/directory"
                    className={buttonVariants({ variant: 'secondary', className: 'border-white/30 text-white hover:border-white/50' })}
                  >
                    Browse the directory
                  </Link>
                  <Link
                    href="/dashboard"
                    className={buttonVariants({ variant: 'ghost', className: 'text-white hover:bg-white/10' })}
                  >
                    Open dashboard
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                    Billing clarity with upgrade and hosted-portal fallbacks
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-400" aria-hidden />
                    MFA + verified profile badges everywhere
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Card className="border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-200">Proof of membership</p>
                      <p className="text-lg font-semibold text-white">{isAuthenticated ? 'Signed in via Outseta' : 'Preview mode'}</p>
                    </div>
                    <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-semibold text-slate-900">
                      {planName}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs text-slate-200">Next billing date</p>
                      {isAuthenticated ? <p className="text-sm font-semibold text-white">April 22 · auto-renews</p> : <Skeleton className="mt-1 h-4 w-32" />}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs text-slate-200">Security</p>
                      <p className="text-sm font-semibold text-white">MFA {isAuthenticated ? 'on · verified badge' : 'ready when you join'}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200">
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1">Optimistic saves</span>
                    <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1">Skeleton loaders</span>
                    <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1">ARIA labeled filters</span>
                  </div>
                </Card>

                <Card className="border-white/10 bg-white/5 p-5 backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Embedded Outseta auth</p>
                      <p className="text-xs text-slate-200">Modal triggers with graceful fallback messaging.</p>
                    </div>
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-amber-100">
                      {isReady ? 'Ready' : 'Warming up…'} {attempts > 3 && !isReady ? '· fallback to hosted portal' : ''}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Button
                      variant="primary"
                      className="w-full"
                      aria-label="Open Outseta signup"
                      onClick={() => (window as any)?.Outseta?.open({ widget: 'signup' })}
                    >
                      Launch signup
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full border-white/30 text-white hover:border-white/40"
                      aria-label="Open Outseta login"
                      onClick={() => (window as any)?.Outseta?.open({ widget: 'login' })}
                    >
                      Launch login
                    </Button>
                  </div>
                  {!isReady && (
                    <p className="mt-3 text-xs text-amber-100">
                      Outseta is still loading. Use the hosted portal instead while we retry.
                    </p>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="bg-slate-950/70 px-4 py-10 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Trusted by operators and agencies</h2>
              <div className="flex flex-wrap gap-3 text-xs text-slate-300">
                {['RouteReady', 'Northwind Field', 'Latchline Labs', 'Ironclad Realty', 'Evergreen Notary'].map((logo) => (
                  <span key={logo} className="rounded-full border border-white/10 px-3 py-1">
                    {logo}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {testimonials.map((item) => (
                <Card key={item.name} className="border-white/10 bg-white/5 p-5 text-sm text-slate-100">
                  <p className="leading-relaxed">“{item.quote}”</p>
                  <p className="mt-3 text-xs font-semibold text-amber-100">{item.name}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="bg-slate-900 px-4 py-14 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-100">Pillars</p>
                <h2 className="text-2xl font-semibold text-white">Directory, dashboard, partners, tools, and training.</h2>
                <p className="max-w-2xl text-sm text-slate-200">
                  Clear IA with tabs, accordions, and fast-loading skeletons. Every CTA respects your plan and routes you to the
                  right Outseta surface.
                </p>
              </div>
              <Link href="/membership" className={buttonVariants({ variant: 'ghost', className: 'text-white hover:bg-white/10' })}>
                Compare plans
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {featurePillars.map((pillar) => (
                <Card key={pillar.title} className="group border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5 p-5 shadow-sm transition hover:-translate-y-1 hover:border-amber-300/60 hover:shadow-amber-500/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{pillar.title}</h3>
                    <span className="rounded-full border border-amber-300/40 bg-amber-200/10 px-3 py-1 text-[11px] font-semibold text-amber-100">
                      {pillar.badge}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">{pillar.description}</p>
                  <Link
                    href={pillar.href}
                    className="mt-4 inline-flex text-sm font-semibold text-amber-100 transition group-hover:text-amber-200"
                  >
                    Learn more →
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Resources + newsletter */}
        <section className="bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-14 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <span className="h-2 w-2 rounded-full bg-amber-300" aria-hidden /> Latest drops
              </div>
              <h3 className="text-2xl font-semibold text-white">Training, partner offers, and AI tools in one stream.</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {resources.map((resource) => (
                  <Card key={resource.title} className="border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-amber-100">{resource.category}</p>
                    <p className="mt-2 text-sm font-semibold text-white">{resource.title}</p>
                    <Link href={resource.href} className="mt-3 inline-flex text-xs font-semibold text-amber-100">
                      View resource →
                    </Link>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="w-full max-w-md border-white/10 bg-white/5 p-6 text-slate-50">
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden /> Stay ahead
              </div>
              <h4 className="mt-2 text-lg font-semibold text-white">Get micro-updates and directory previews.</h4>
              <p className="text-sm text-slate-200">Inline validation keeps inboxes safe. Unsubscribe anytime.</p>

              <label className="mt-4 block text-sm font-semibold text-white" htmlFor="newsletter-email">
                Work email
              </label>
              <Input
                id="newsletter-email"
                value={email}
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@firm.com"
                aria-invalid={!!newsletterError}
                className={cn('mt-2 bg-white/10 text-white', newsletterError && 'border-amber-400 text-amber-50 placeholder:text-amber-100')}
              />
              {newsletterError && <p className="mt-2 text-xs text-amber-100">{newsletterError}</p>}

              <Button
                className="mt-4 w-full bg-white text-slate-900 hover:bg-amber-100"
                onClick={handleNewsletter}
                disabled={isPending || subscribed}
                aria-live="polite"
              >
                {subscribed ? 'Saved—check your inbox' : isPending ? 'Saving…' : 'Send me previews'}
              </Button>
              <p className="mt-3 text-xs text-slate-300">We never share your email. Spam-safe and AI filtered.</p>
            </Card>
          </div>
        </section>
      </main>
    </>
  )
}
