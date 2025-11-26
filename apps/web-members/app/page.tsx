'use client'

import Script from 'next/script'
import Link from 'next/link'
import Image from 'next/image'
import { RoleCarousel } from '@/components/RoleCarousel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Container } from '@/components/ui/container'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Nested Objects Member Hub',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any',
  url: 'https://nested-objects-starter.vercel.app',
  description:
    'Member hub and firm directory for field inspectors, notaries, real estate pros, and gig workers. Compare firms, see requirements, and plan better routes before you leave the driveway.',
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

export default function HomePage() {
  const heroImage = '/hero.jpg'

  return (
    <>
      {/* Structured data for SEO */}
      <Script
        id="nested-objects-ld-json"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-brand-background text-brand-text">
        <section className="relative overflow-hidden bg-brand-background">
          <div className="absolute inset-0">
            <Image src={heroImage} alt="" fill priority className="object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-background/80 via-brand-background/60 to-brand-background/20" />
          </div>

          <Container className="relative py-24 text-center lg:py-32">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted">Vendor hub for field pros</p>
              <h1 className="text-3xl font-semibold tracking-tight text-brand-heading sm:text-4xl">
                The AI-powered vendor hub for field pros
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted sm:text-base">
                Tools, insights, and transparent data to help inspectors, notaries, and field vendors get paid faster and protect
                their time.
              </p>
              <div className="flex flex-col items-center gap-3 text-sm sm:flex-row sm:justify-center lg:text-left">
                <Button as={Link} href="/membership" className="w-full sm:w-auto">
                  Explore membership options
                </Button>
                <Button as={Link} href="/directory" variant="secondary" className="w-full sm:w-auto">
                  Preview the firm directory
                </Button>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-b border-brand-border bg-brand-surface">
          <Container className="py-10 lg:py-14">
            <RoleCarousel />
          </Container>
        </section>

        <section className="border-b border-brand-border bg-brand-surface/80">
          <Container className="py-8 sm:py-10 lg:py-12">
            <div className="rounded-2xl border border-brand-border bg-brand-surface/90 p-5 text-xs text-brand-muted shadow-sm sm:text-[13px]">
              <p className="font-semibold text-brand-heading">Who this hub serves</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <span>• Mortgage & insurance field inspectors</span>
                <span>• Mobile notaries & signing agents</span>
                <span>• Realtors & investor-friendly agents</span>
                <span>• Gig pros adding inspections as a new lane</span>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-b border-brand-border bg-brand-surface">
          <Container className="py-10 sm:py-12 lg:py-14">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-brand-heading sm:text-2xl">Inside the member hub</h2>
                <p className="mt-2 max-w-xl text-sm text-brand-muted">
                  One place to see who is hiring, what they pay, and what they expect from you before you sign up for another
                  portal.
                </p>
              </div>
              <Button as={Link} href="/membership" variant="secondary" className="text-xs">
                Compare Starter vs Pro →
              </Button>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <Card className="border-brand-border/80 bg-brand-soft/70">
                <h3 className="text-sm font-semibold text-brand-heading">Verified firm directory</h3>
                <p className="mt-2 text-sm text-brand-muted">
                  Search firms by region, service lane, tools required, and onboarding status. No resumes uploaded. You control
                  who sees your info.
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-primary">Included with Starter</p>
                <Link
                  href="/directory"
                  className="mt-3 inline-flex text-xs font-semibold text-brand-primary underline underline-offset-4 transition hover:text-brand-primaryDark"
                >
                  Browse active firms →
                </Link>
              </Card>

              <Card className="border-brand-border/80 bg-brand-soft/70">
                <h3 className="text-sm font-semibold text-brand-heading">Transparent firm intel</h3>
                <p className="mt-2 text-sm text-brand-muted">
                  See pay ranges, regions, typical volume, and expectations in plain language so you can match firms to your
                  schedule and gear.
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-accent">Unlocks with Pro</p>
                <Link
                  href="/resources/firm-intel"
                  className="mt-3 inline-flex text-xs font-semibold text-brand-primary underline underline-offset-4 transition hover:text-brand-primaryDark"
                >
                  View sample snapshots →
                </Link>
              </Card>

              <Card className="border-brand-border/80 bg-brand-soft/70">
                <h3 className="text-sm font-semibold text-brand-heading">AI concierge for routes</h3>
                <p className="mt-2 text-sm text-brand-muted">
                  Ask which firms fit your lane, how to price routes, or what gear to buy first. Get answers in seconds instead
                  of scrolling random threads.
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-accent">Pro · Elite · Agency</p>
                <Link
                  href="/tools"
                  className="mt-3 inline-flex text-xs font-semibold text-brand-primary underline underline-offset-4 transition hover:text-brand-primaryDark"
                >
                  Explore tools →
                </Link>
              </Card>
            </div>
          </Container>
        </section>

        <section className="border-b border-brand-primary/15 bg-brand-soft">
          <Container className="py-10 sm:py-12 lg:py-14">
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold tracking-tight text-brand-heading sm:text-2xl">
                How inspectors use Nested Objects in real life
              </h2>
              <p className="mt-2 text-sm text-brand-muted">
                Whether you are brand new or adding inspections to an existing route, the hub keeps your next steps simple.
              </p>
            </div>

            <ol className="mt-8 grid gap-6 text-sm text-brand-muted md:grid-cols-3">
              {[
                {
                  step: 'Step 1',
                  title: 'Dial in your lane.',
                  copy:
                    'Create your profile, pick your service lanes, and mark your home base. The hub filters firms and routes around where you actually drive.',
                },
                {
                  step: 'Step 2',
                  title: 'Shortlist firms that fit your life.',
                  copy:
                    'Use intel cards and AI concierge to compare pay ranges, volume, and gear so you avoid dead-end portals and low-ball routes.',
                },
                {
                  step: 'Step 3',
                  title: 'Plan better routes.',
                  copy:
                    'Forecast weather, stack appointments, and get reminder nudges so you spend less time driving and more time earning.',
                },
              ].map((item) => (
                <li key={item.step} className="rounded-2xl border border-brand-primary/20 bg-brand-surface p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">{item.step}</p>
                  <h3 className="mt-2 text-sm font-semibold text-brand-heading">{item.title}</h3>
                  <p className="mt-2 text-sm text-brand-muted">{item.copy}</p>
                </li>
              ))}
            </ol>
          </Container>
        </section>

        <section className="border-b border-brand-border bg-brand-surface">
          <Container className="py-10 sm:py-12 lg:py-14">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-primary">Why members join</p>
                <h2 className="text-xl font-bold tracking-tight text-brand-heading sm:text-2xl">
                  Ship more jobs without guessing which firms are a fit.
                </h2>
                <p className="text-sm text-brand-muted">
                  Nested Objects surfaces firm intel, requirements, and communication preferences so you can match the right work
                  to your schedule.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    'See current pay ranges and turnaround expectations.',
                    'Filter by service lanes, gear, and onboarding status.',
                    'Watch weather and daylight to keep routes safe.',
                    'Use AI concierge to prep for interviews and calls.',
                  ].map((item) => (
                    <div key={item} className="rounded-xl border border-brand-border bg-brand-soft px-4 py-3 text-sm text-brand-heading shadow-sm">
                      {item}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 text-sm font-semibold">
                  <Button as={Link} href="/directory">
                    Browse directory
                  </Button>
                  <Button as={Link} href="/membership" variant="secondary">
                    View plans
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-brand-border bg-brand-soft/60 p-6 shadow-brand-card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">Route snapshot</p>
                    <h3 className="text-lg font-semibold text-brand-heading">Example call with firm</h3>
                  </div>
                  <span className="rounded-full bg-brand-highlight px-3 py-1 text-xs font-semibold text-brand-primary">Pro</span>
                </div>
                <div className="mt-4 space-y-3 text-sm text-brand-muted">
                  <div className="flex items-start justify-between gap-4 rounded-xl border border-brand-border bg-brand-surface px-4 py-3 shadow-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Pay range</p>
                      <p className="text-base font-semibold text-brand-heading">$45–$65 per inspection</p>
                    </div>
                    <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">Midwest</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 rounded-xl border border-brand-border bg-brand-surface px-4 py-3 shadow-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Volume</p>
                      <p className="text-base font-semibold text-brand-heading">12–20 per week</p>
                    </div>
                    <span className="rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-semibold text-brand-accent">Suburbs</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 rounded-xl border border-brand-border bg-brand-surface px-4 py-3 shadow-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Gear</p>
                      <p className="text-base font-semibold text-brand-heading">Ladder, camera, apps installed</p>
                    </div>
                    <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">Ready</span>
                  </div>
                  <p className="pt-2 text-xs text-brand-muted">
                    See real examples of what firms expect so you can position yourself as the right fit before you take the
                    call.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="bg-brand-primary text-slate-50">
          <Container className="py-10 text-center sm:py-12 lg:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-sand/80">Stay in the loop</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Get the directory + intel in one hub</h2>
            <p className="mt-3 text-sm text-brand-sand/90 sm:text-base">
              Join free to browse firms or upgrade for deeper intel, route prep, and AI concierge.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button as={Link} href="/membership" className="bg-white text-brand-primary hover:bg-brand-sand">
                Get started
              </Button>
              <Button as={Link} href="/tools" variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                Explore tools
              </Button>
            </div>
          </Container>
        </section>
      </main>
    </>
  )
}
