import { generatePageMetadata, getFAQPageSchema } from '@/lib/seo'

import type { Metadata } from 'next'

const faqItems = [
  {
    question: 'Do you offer refunds for digital goods or memberships?',
    answer:
      'No. Because access to digital downloads, templates, training, and firm intel is delivered instantly, all digital goods and memberships are non-refundable. Cancel before renewal to avoid future charges.',
  },
  {
    question: 'Can I share or resell Nested Objects resources?',
    answer:
      'No. Downloads, templates, and directory intel are licensed to your account or approved team seats only. Copying, resale, or reposting is prohibited.',
  },
  {
    question: 'How do you protect my data?',
    answer:
      'We use encrypted transport, role-based access, and vetted vendors. Data practices match the privacy standards described on member.nestedobjects.com and this site.',
  },
  {
    question: 'What happens when I cancel?',
    answer:
      'You retain access through the end of the current billing term. No prorated refunds are issued. After that, access to licensed resources stops.',
  },
  {
    question: 'Can I request a copy or deletion of my data?',
    answer:
      'Yes. Email support@nestedobjects.com to request access or deletion subject to legal, security, and fraud-prevention requirements.',
  },
  {
    question: 'Do you follow the same policies across platforms?',
    answer:
      'Yes. These FAQs align with the live policies enforced in the member experience at member.nestedobjects.com so guidance remains consistent.',
  },
]

const quickLinks = [
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/terms-conditions', label: 'Terms & conditions' },
  { href: '/refund-policy', label: 'Refund policy' },
  { href: '/contact-us', label: 'Contact support' },
]

export const metadata: Metadata = generatePageMetadata({
  title: 'FAQs | Policies, billing, and membership',
  description: 'Find answers about memberships, non-refundable digital goods, no resale rules, and privacy practices aligned with member.nestedobjects.com.',
  path: '/faqs'
});

export default function FAQsPage() {
  const faqSchema = getFAQPageSchema(faqItems);


  return (
    <main className="bg-brand-sand text-brand-dark">
      <section className="border-b border-brand-copper/20 bg-white/95">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-copper">FAQs</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Policy, billing, and membership answers.</h1>
          <p className="mt-4 max-w-3xl text-sm text-brand-slate">
            These answers mirror the guidance active members see at member.nestedobjects.com. They emphasize our no-resale rule
            for digital goods, the no-refund stance on delivered resources, and how to request help from the team.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {quickLinks.map((link) => (
              <a
                key={link.href}
                className="inline-flex items-center justify-center rounded-full border border-brand-copper/30 bg-brand-mist px-4 py-2 text-xs font-semibold text-brand-dark transition hover:border-brand-copper hover:bg-white"
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-brand-copper/15 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_minmax(0,0.95fr)]">
            <div className="space-y-5">
              <h2 className="text-2xl font-semibold text-brand-dark">Frequently asked questions</h2>
              <p className="text-sm text-brand-slate">
                We keep policies consistent across the hub so you can rely on the same standards wherever you sign in. If you do
                not see your question, contact support and we will add clarity.
              </p>
              <div className="space-y-4">
                {faqItems.map((item) => (
                  <div key={item.question} className="rounded-2xl border border-brand-copper/20 bg-brand-mist p-4">
                    <p className="text-sm font-semibold text-brand-dark">{item.question}</p>
                    <p className="mt-2 text-sm text-brand-slate">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-brand-copper/25 bg-brand-dark p-6 text-white shadow-lg shadow-brand-copper/20">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-copper">Need more help?</p>
              <h3 className="mt-2 text-xl font-semibold">Our team is ready</h3>
              <p className="mt-2 text-sm text-brand-mist">
                Send questions to support@nestedobjects.com for plan guidance, compliance documentation, or to report suspected
                copying or resale of digital goods. We will respond based on your plan tier.
              </p>
              <div className="mt-4 space-y-2 text-sm text-brand-mist">
                <p className="font-semibold text-brand-copper">Response expectations</p>
                <ul className="space-y-1">
                  <li>Free: 1-2 business days</li>
                  <li>Pro: Priority queue</li>
                  <li>Elite/Agency: Concierge handling with next best actions</li>
                </ul>
              </div>
              <p className="mt-4 text-xs text-brand-mist/80">
                Urgent security or privacy issues are routed immediately. Include relevant URLs or screenshots so we can resolve
                your request quickly.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-sand/80">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-brand-dark">Still looking for an answer?</h2>
          <p className="mt-2 max-w-3xl text-sm text-brand-slate">
            Browse the resource hub or talk with our team before upgrading. We will confirm how the no-refund and no-resale
            policies apply to your workflows so you can plan confidently.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              className="inline-flex items-center justify-center rounded-full bg-brand-copper px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
              href="/inspector-resource-center"
            >
              Explore resources
            </a>
            <a
              className="inline-flex items-center justify-center rounded-full border border-brand-copper/40 bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-mist"
              href="/contact-us"
            >
              Talk with support
            </a>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </main>
  )
}
