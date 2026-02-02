import Link from 'next/link'
import { generatePageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generatePageMetadata({
  title: 'Contact Us | Member Support & Partnerships',
  description: 'Get support for your account, discuss partnerships, or reach out to our media team. We respond within one business day.',
  path: '/contact',
})


const contactChannels = [
  {
    title: 'Member support',
    description: 'Questions about your account, plan, or billing? We respond fastest inside the hub.',
    email: 'support@nestedobjects.com',
    response: 'Elite and Agency members get concierge routing and faster replies.',
  },
  {
    title: 'Partnerships & firms',
    description: 'Looking to onboard inspectors, post roles, or collaborate on training?',
    email: 'partners@nestedobjects.com',
    response: 'We will connect you with the right team member within one business day.',
  },
  {
    title: 'Media & speaking',
    description: 'Press inquiries and events focused on inspections, real estate, or field services.',
    email: 'press@nestedobjects.com',
    response: 'We can share data-backed trends and practical stories from members.',
  },
]

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-brand-sand text-brand-dark">
      <section className="border-b border-brand-copper/15 bg-gradient-to-b from-brand-sand via-white to-brand-mist">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Contact</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Let’s talk about your routes, team, or partnership.</h1>
            <p className="mt-3 text-sm text-slate-700">
              Whether you are comparing plan tiers, have a billing question, or want to collaborate on training, we are here to help. Choose the lane that fits or send us a quick note below.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/membership"
                className="inline-flex items-center justify-center rounded-full bg-brand-copper px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
              >
                Compare plans
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-full border border-brand-copper/30 bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-mist"
              >
                Learn about the hub
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-brand-copper/15 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:px-8 lg:py-14">
          <div className="space-y-5">
            <div className="rounded-3xl border border-brand-copper/20 bg-brand-mist p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-copper">Plan-aware support</p>
              <p className="mt-2 text-sm text-slate-700">
                Starter members can use the form below for general questions. Pro receives faster routing in the queue, while Elite and Agency unlock concierge handling with tailored next steps based on your region.
              </p>
              <div className="mt-4 grid gap-2 text-xs text-brand-dark sm:grid-cols-3">
                <span className="rounded-full bg-white px-3 py-1 font-semibold">Starter · 1-2 business days</span>
                <span className="rounded-full bg-white px-3 py-1 font-semibold">Pro · priority queue</span>
                <span className="rounded-full bg-white px-3 py-1 font-semibold">Elite/Agency · concierge routing</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {contactChannels.map((channel) => (
                <div key={channel.title} className="rounded-2xl border border-brand-copper/20 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-brand-dark">{channel.title}</p>
                  <p className="mt-1 text-sm text-slate-700">{channel.description}</p>
                  <p className="mt-2 text-sm font-semibold text-brand-copper">{channel.email}</p>
                  <p className="mt-1 text-xs text-brand-steel">{channel.response}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-brand-copper/20 bg-brand-dark p-5 text-slate-100">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-copper">Call the concierge</p>
              <p className="mt-2 text-sm text-slate-100">
                Active Elite and Agency members can request a 15-minute call to review routes, onboarding steps, or crew rollouts.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <a
                  href="https://nested-objects.outseta.com/support/tickets"
                  className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-brand-dark transition hover:bg-brand-mist"
                >
                  Request a call
                </a>
                <Link
                  href="/membership"
                  className="inline-flex items-center justify-center rounded-full border border-white/40 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  Upgrade for concierge
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-brand-copper/20 bg-white p-6 shadow-lg shadow-brand-copper/10">
            <h2 className="text-lg font-semibold text-brand-dark">Send us a quick note</h2>
            <p className="mt-1 text-sm text-slate-700">Share a few details and we will route it to the right teammate.</p>
            <form className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-semibold text-brand-dark" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  className="mt-1 w-full rounded-lg border border-brand-copper/30 bg-brand-mist px-3 py-2 text-sm text-brand-dark placeholder:text-brand-steel focus:border-brand-copper focus:outline-none focus:ring-2 focus:ring-brand-copper/40"
                  placeholder="Your name"
                  type="text"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-dark" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  className="mt-1 w-full rounded-lg border border-brand-copper/30 bg-brand-mist px-3 py-2 text-sm text-brand-dark placeholder:text-brand-steel focus:border-brand-copper focus:outline-none focus:ring-2 focus:ring-brand-copper/40"
                  placeholder="name@email.com"
                  type="email"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-dark" htmlFor="topic">
                  Topic
                </label>
                <select
                  id="topic"
                  name="topic"
                  className="mt-1 w-full rounded-lg border border-brand-copper/30 bg-brand-mist px-3 py-2 text-sm text-brand-dark focus:border-brand-copper focus:outline-none focus:ring-2 focus:ring-brand-copper/40"
                >
                  <option>Plan comparison</option>
                  <option>Billing question</option>
                  <option>Partnership opportunity</option>
                  <option>Training or resources</option>
                  <option>Something else</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-dark" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-brand-copper/30 bg-brand-mist px-3 py-2 text-sm text-brand-dark placeholder:text-brand-steel focus:border-brand-copper focus:outline-none focus:ring-2 focus:ring-brand-copper/40"
                  placeholder="Share how we can help or which plan you are on."
                />
              </div>
              <button
                type="button"
                className="w-full rounded-full bg-brand-copper px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
              >
                Send message
              </button>
              <p className="text-xs text-brand-steel">We reply within one business day. Priority routing for Pro, Elite, and Agency members.</p>
            </form>
          </div>
        </div>
      </section>

      <section className="bg-brand-dark">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-6 text-sm text-slate-100 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">Office hours</p>
              <p className="mt-2">Mon–Fri · 9am to 6pm CT</p>
              <p className="text-brand-steel">After-hours responses prioritized for Elite and Agency.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">Community</p>
              <p className="mt-2">Member announcements and intel drops ship weekly.</p>
              <p className="text-brand-steel">Stay tuned for new tools rolling out each month.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">Call us</p>
              <p className="mt-2 font-semibold">+1 (312) 555-0142</p>
              <p className="text-brand-steel">Available for press and partner calls with scheduling.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
