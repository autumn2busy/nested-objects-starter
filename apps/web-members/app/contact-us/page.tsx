import Link from 'next/link'
import { CONTACT_PHONE_DISPLAY, generatePageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import ConciergeSection from './ConciergeSection'
import ContactForm from './ContactForm'

export const metadata: Metadata = generatePageMetadata({
  title: 'Contact Us | Member Support & Partnerships',
  description: 'Get support for your account, discuss partnerships, or reach out to our media team. We respond within one business day.',
  path: '/contact-us',
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

const supportPrepItems = [
  'Account email and current plan',
  'Firm, state, or tool page URL if the issue is content-related',
  'Receipt date or billing profile detail for payment questions',
  'Screenshots or device details for login and mobile issues',
]

const trustResourceLinks = [
  { href: '/privacy', label: 'Privacy and data handling' },
  { href: '/refund-policy', label: 'Refund and billing policy' },
  { href: '/terms-conditions', label: 'Terms of use' },
]

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-brand-sand text-brand-dark">
      <section className="border-b border-brand-copper/15 bg-gradient-to-b from-brand-sand via-white to-brand-mist">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Contact</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Let&apos;s talk about your routes, team, or partnership.</h1>
            <p className="mt-3 text-sm text-slate-700">
              Whether you are comparing plan tiers, have a billing question, or want to collaborate on training, we are here to help. Choose the lane that fits or send us a quick note below.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/membership-pricing"
                className="inline-flex items-center justify-center rounded-full bg-brand-copper px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
              >
                Compare plans
              </Link>
              <Link
                href="/about-us"
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
                Free members can use the form below for general questions. Pro receives faster routing in the queue, while Elite and Agency unlock concierge handling with tailored next steps based on your region.
              </p>
              <p className="mt-3 text-sm text-slate-700">
                Prefer email? Reach us at{' '}
                <a
                  href="mailto:info@nestedobjects.com"
                  className="font-semibold text-brand-copper transition hover:text-brand-copperDark hover:underline hover:underline-offset-4"
                >
                  info@nestedobjects.com
                </a>
                .
              </p>
              <div className="mt-4 grid gap-2 text-xs text-brand-dark sm:grid-cols-3">
                <span className="rounded-full bg-white px-3 py-1 font-semibold">Free &middot; 1-2 business days</span>
                <span className="rounded-full bg-white px-3 py-1 font-semibold">Pro &middot; priority queue</span>
                <span className="rounded-full bg-white px-3 py-1 font-semibold">Elite/Agency &middot; concierge routing</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {contactChannels.map((channel) => (
                <div key={channel.title} className="rounded-2xl border border-brand-copper/20 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-brand-dark">{channel.title}</p>
                  <p className="mt-1 text-sm text-slate-700">{channel.description}</p>
                  <a
                    href={`mailto:${channel.email}`}
                    className="mt-2 inline-flex text-sm font-semibold text-brand-copper transition hover:text-brand-copperDark hover:underline hover:underline-offset-4"
                  >
                    {channel.email}
                  </a>
                  <p className="mt-1 text-xs text-brand-steel">{channel.response}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-brand-copper/20 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-copper">Faster support</p>
              <h2 className="mt-2 text-xl font-semibold text-brand-dark">Include the details that help us route your request.</h2>
              <ul className="mt-4 grid gap-2 text-sm text-brand-slate sm:grid-cols-2">
                {supportPrepItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-copper" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                {trustResourceLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-brand-copper/25 bg-brand-mist px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:border-brand-copper/50 hover:bg-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Plan-aware concierge section (client component) */}
            <ConciergeSection />
          </div>

          <ContactForm />

        </div>
      </section>

      <section className="bg-brand-dark">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-6 text-sm text-slate-100 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">Office hours</p>
              <p className="mt-2">Mon&ndash;Fri &middot; 9am to 6pm CT</p>
              <p className="text-brand-steel">After-hours responses prioritized for Elite and Agency.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">Community</p>
              <p className="mt-2">Member announcements and intel drops ship weekly.</p>
              <p className="text-brand-steel">Stay tuned for new tools rolling out each month.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-copper">Call us</p>
              <p className="mt-2 font-semibold">{CONTACT_PHONE_DISPLAY}</p>
              <p className="text-brand-steel">Available for press and partner calls with scheduling.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
