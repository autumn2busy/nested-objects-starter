'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import Script from 'next/script'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FieldHelperText, Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Nested Objects',
  url: 'https://nestedobjects.com',
  description:
    'Membership community for inspectors and operators with an Outseta-powered directory, dashboard, and partner stack.',
  logo: 'https://nestedobjects.com/logo.png',
  sameAs: [
    'https://www.linkedin.com/company/nestedobjects',
    'https://twitter.com/nestedobjects',
  ],
}

const featurePillars = [
  {
    title: 'Directory',
    description: 'Search verified firms with plan-aware detail gating, saved searches, and map previews.',
    badge: 'Starter+',
    link: '/directory',
  },
  {
    title: 'Dashboard',
    description: 'Plan usage, billing, and activity summaries with Outseta widgets and secure shortcuts.',
    badge: 'All plans',
    link: '/dashboard',
  },
  {
    title: 'Partners',
    description: 'Member-only discounts on equipment, E&O, and marketing tools with managed onboarding.',
    badge: 'Pro+',
    link: '/partners',
  },
  {
    title: 'AI tools',
    description: 'Concierge prompts, job routing, and template builders tuned for inspectors and notaries.',
    badge: 'Pro+',
    link: '/tools',
  },
  {
    title: 'Training',
    description: 'Micro-courses and live labs with progress tracking, notes, and CE-ready exports.',
    badge: 'Starter+',
    link: '/training',
  },
]

const resourceHighlights = [
  {
    title: 'Route smarter: 7-step prep checklist',
    tag: 'Training',
    link: '/training',
  },
  {
    title: 'Partner offer: $100 off camera kits',
    tag: 'Partner offer',
    link: '/partners',
  },
  {
    title: 'Live lab: AI scripting for client updates',
    tag: 'Live session',
    link: '/resources',
  },
]

const testimonialQuotes = [
  {
    name: 'Danielle, Elite member',
    quote:
      'Nested Objects keeps my firms organized and the Outseta billing just works. The dashboard tells me where to focus.',
  },
  {
    name: 'Marcus, Starter member',
    quote: 'The directory filters plus saved searches make it easy to pick up extra routes on my schedule.',
  },
]

export default function HomeClientPage() {
  const { isAuthenticated, profileDisplayName, user, planUid } = useAuth()
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'error' | 'success'>('idle')
  const [isSavingPreference, startTransition] = useTransition()

  const planLabel = useMemo(() => planUid || 'Starter', [planUid])

  const handleNewsletterSubmit = () => {
    if (!newsletterEmail.includes('@')) {
      setNewsletterStatus('error')
      return
    }

    startTransition(() => {
      setTimeout(() => {
        setNewsletterStatus('success')
      }, 400)
    })
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5 bg-gradient-to-br from-brand-copper/20 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.08),_transparent_35%)]" />
        <div className="absolute right-[-12%] top-[-10%] h-64 w-64 rounded-full bg-brand-copper/20 blur-[120px]" />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
                <span>Outseta-powered membership</span>
                <span className="h-1 w-1 rounded-full bg-emerald-300" aria-hidden />
                <span>{isAuthenticated ? 'Welcome back' : 'Open enrollment'}</span>
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Home for operators who want clarity, faster payouts, and a trusted directory.
              </h1>
              <p className="text-lg text-slate-200">
                Join a curated membership with transparent firm intel, AI tools, and Outseta billing you can trust.
                {isAuthenticated && (
                  <>
                    {' '}Hi {profileDisplayName || user?.email}, your plan badge is set to {planLabel}—everything here adapts to
                    your tier.
                  </>
                )}
              </p>
              <div className="flex flex-wrap gap-3" aria-label="Primary actions">
                <Button asChild>
                  <Link href="/membership" aria-label="Join Nested Objects">
                    {isAuthenticated ? 'View plan options' : 'Join Nested Objects'}
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/directory" aria-label="Browse the directory">
                    Browse directory
                  </Link>
                </Button>
                {isAuthenticated && (
                  <Button variant="ghost" asChild>
                    <Link href="/dashboard" aria-label="Open your dashboard">
                      Open dashboard
                    </Link>
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-200">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                  <span>Plan badge: {planLabel}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
                  <span className="inline-flex h-2 w-2 rounded-full bg-cyan-400" aria-hidden />
                  <span>Tenure: {user?.tenure || 'New member preview'}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
                  <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" aria-hidden />
                  <span>Last login: {user?.last_login || 'Today'}</span>
                </div>
              </div>
            </div>

            <Card className="w-full max-w-md border-white/10 bg-white/5/50 p-6 backdrop-blur">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase text-emerald-200">Secure access</p>
                    <p className="text-base font-semibold text-white">Outseta auth</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                    Live
                  </span>
                </div>
                <div className="space-y-2 text-sm text-slate-200">
                  <p>Sign in or create your membership without leaving this page.</p>
                  <p className="text-slate-300">Inline validation keeps you moving—no dead ends.</p>
                </div>
                <div className="space-y-2" aria-live="polite">
                  <Skeleton className="h-10 w-full rounded-lg bg-white/10" />
                  <Skeleton className="h-10 w-full rounded-lg bg-white/10" />
                  <Button fullWidth aria-label="Launch Outseta login">
                    Launch login / signup
                  </Button>
                  <FieldHelperText className="text-amber-200">
                    If the embedded widget is unavailable, use the hosted portal link inside your email.
                  </FieldHelperText>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Membership proof points">
            <Card className="border-white/10 bg-white/5 p-5">
              <p className="text-sm text-emerald-200">98% uptime</p>
              <p className="mt-2 text-lg font-semibold text-white">Outseta-managed billing</p>
              <p className="text-sm text-slate-200">PCI-ready payments, MFA support, and hosted-portal fallbacks.</p>
            </Card>
            <Card className="border-white/10 bg-white/5 p-5">
              <p className="text-sm text-amber-200">3,000+ searches</p>
              <p className="mt-2 text-lg font-semibold text-white">Directory activity this quarter</p>
              <p className="text-sm text-slate-200">Saved searches sync to your dashboard with optimistic saves.</p>
            </Card>
            <Card className="border-white/10 bg-white/5 p-5">
              <p className="text-sm text-cyan-200">MFA-ready</p>
              <p className="mt-2 text-lg font-semibold text-white">Secure access</p>
              <p className="text-sm text-slate-200">We surface MFA and session status directly in your dashboard.</p>
            </Card>
            <Card className="border-white/10 bg-white/5 p-5">
              <p className="text-sm text-pink-200">New</p>
              <p className="mt-2 text-lg font-semibold text-white">AI concierge</p>
              <p className="text-sm text-slate-200">Plan-aware prompts for routing, outreach, and pricing.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-b border-white/5 bg-slate-900/60">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Trusted by operators</p>
              <h2 className="text-2xl font-semibold">From boutique firms to national networks</h2>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/directory">See the directory preview</Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {testimonialQuotes.map((item) => (
              <Card key={item.name} className="border-white/10 bg-white/5 p-5">
                <p className="text-slate-100">“{item.quote}”</p>
                <p className="mt-3 text-sm font-semibold text-emerald-200">{item.name}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature pillars */}
      <section className="border-b border-white/5 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Everything lines up with your profile</h2>
              <p className="text-slate-300">Directory, dashboard, partners, tools, and training share the same data.</p>
            </div>
            <Tabs defaultValue="pillars" className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="pillars">Pillars</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>
              <TabsContent value="pillars" className="md:absolute md:-translate-y-[9999px]" aria-hidden />
              <TabsContent value="resources" className="md:absolute md:-translate-y-[9999px]" aria-hidden />
            </Tabs>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featurePillars.map((pillar) => (
              <Card key={pillar.title} className="relative overflow-hidden border-white/10 bg-white/5 p-5">
                <div className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-xs text-emerald-100">
                  {pillar.badge}
                </div>
                <h3 className="text-lg font-semibold text-white">{pillar.title}</h3>
                <p className="mt-2 text-sm text-slate-200">{pillar.description}</p>
                <Button variant="link" className="mt-3 px-0" asChild>
                  <Link href={pillar.link}>Learn more →</Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Resources + newsletter */}
      <section className="border-b border-white/5 bg-slate-900/80">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div>
              <h2 className="text-2xl font-semibold">Latest training and offers</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {resourceHighlights.map((resource) => (
                  <Card key={resource.title} className="border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase text-emerald-200">{resource.tag}</p>
                    <p className="mt-2 text-base font-semibold text-white">{resource.title}</p>
                    <Button variant="link" className="mt-3 px-0" asChild>
                      <Link href={resource.link}>Open resource →</Link>
                    </Button>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="border-white/10 bg-white/5 p-6">
              <p className="text-sm font-semibold text-white">Stay in the loop</p>
              <p className="text-sm text-slate-200">
                Get Outseta updates, new partners, and training drops. No spam—unsubscribe anytime.
              </p>
              <div className="mt-4 space-y-3">
                <label className="text-xs font-semibold uppercase text-slate-200" htmlFor="newsletter-email">
                  Work email
                </label>
                <Input
                  id="newsletter-email"
                  aria-label="Newsletter email"
                  placeholder="you@company.com"
                  value={newsletterEmail}
                  onChange={(e) => {
                    setNewsletterEmail(e.target.value)
                    setNewsletterStatus('idle')
                  }}
                  className={newsletterStatus === 'error' ? 'border-amber-400 bg-white text-slate-900' : undefined}
                />
                {newsletterStatus === 'error' && (
                  <FieldHelperText className="text-amber-200">Add a valid email to keep onboarding smooth.</FieldHelperText>
                )}
                {newsletterStatus === 'success' && (
                  <FieldHelperText className="text-emerald-200">Saved. Check your inbox for confirmation.</FieldHelperText>
                )}
                <Button
                  disabled={isSavingPreference}
                  onClick={handleNewsletterSubmit}
                  aria-label="Submit newsletter email"
                >
                  {isSavingPreference ? 'Saving preference...' : 'Subscribe with safeguards'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
