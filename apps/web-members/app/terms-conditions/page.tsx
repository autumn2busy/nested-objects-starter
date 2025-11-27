import type { Metadata } from 'next'

const commitments = [
  {
    title: 'Use tied to your membership',
    description:
      'Access to digital goods, AI tools, and firm intel is granted for active members only and may not be transferred or resold.',
  },
  {
    title: 'No copying or redistribution',
    description:
      'You may not replicate, scrape, or export resources for commercial resale. Content is licensed for your individual or approved team use.',
  },
  {
    title: 'Compliance-ready operations',
    description:
      'Guidelines align with the standards we uphold at member.nestedobjects.com to protect inspectors, coordinators, and firms.',
  },
]

const obligations = [
  {
    heading: 'Account & eligibility',
    copy:
      'You must provide accurate information, maintain the confidentiality of your credentials, and be authorized to accept these terms on behalf of yourself or your organization.',
  },
  {
    heading: 'Membership & billing',
    copy:
      'Plans auto-renew unless canceled before the next cycle. Taxes may apply. Billing disputes should be raised within 10 days for review.',
  },
  {
    heading: 'Digital goods and licenses',
    copy:
      'Digital downloads, templates, and AI outputs are licensed, not sold. They may not be copied, resold, or posted publicly without written consent.',
  },
  {
    heading: 'Acceptable use',
    copy:
      'Do not misuse the platform, attempt unauthorized access, scrape the directory, or interfere with other members. Security testing requires prior approval.',
  },
  {
    heading: 'Intellectual property',
    copy:
      'Nested Objects retains ownership of the platform, branding, and content. Limited license is granted for your internal business purposes only.',
  },
  {
    heading: 'Termination',
    copy:
      'We may suspend or terminate access for policy violations or risk. You may cancel at any time, and access will end at the close of your current term.',
  },
]

const legalNotes = [
  'Services are provided \'as is\' without warranties beyond those required by law.',
  'Liability is limited to the greater of fees paid in the prior three months or $500, except where prohibited.',
  'These terms are governed by the laws of the state where Nested Objects LLC is registered, without regard to conflicts of law.',
  'Updates to this policy will be timestamped. Continued use after changes constitutes acceptance.',
]

export const metadata: Metadata = {
  title: 'Terms & Conditions | Nested Objects member obligations',
  description:
    'Terms and conditions for using Nested Objects, including membership rules, strict no resale or copy obligations, and compliance-aligned usage.',
  alternates: {
    canonical: 'https://nested-objects-starter.vercel.app/terms-conditions',
  },
  openGraph: {
    type: 'article',
    url: 'https://nested-objects-starter.vercel.app/terms-conditions',
    title: 'Terms & Conditions | Nested Objects member obligations',
    description:
      'Membership, billing, and digital goods terms for Nested Objects with no resale, no copying, and compliance-first guidelines.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms & Conditions | Nested Objects member obligations',
    description:
      'Usage rules for Nested Objects members covering billing, acceptable use, and protections against resale or copying of content.',
  },
}

export default function TermsPage() {
  const termsSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Nested Objects Terms and Conditions',
    url: 'https://nested-objects-starter.vercel.app/terms-conditions',
    description:
      'Terms and conditions describing membership, billing, acceptable use, and strict prohibitions on resale or copying of Nested Objects digital goods.',
    inLanguage: 'en',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Nested Objects',
      url: 'https://nested-objects-starter.vercel.app',
    },
  }

  return (
    <main className="bg-brand-sand text-brand-dark">
      <section className="border-b border-brand-copper/20 bg-white/95">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-copper">Terms & Conditions</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
            Terms that protect members, firms, and our shared intel.
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-brand-slate">
            These terms mirror the policies enforced at member.nestedobjects.com. By accessing the Nested Objects platform you
            agree to the rules below, including a strict no resale or copy policy for digital resources and firm intelligence.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {commitments.map((item) => (
              <div key={item.title} className="rounded-2xl border border-brand-copper/25 bg-brand-mist p-4 shadow-sm">
                <p className="text-sm font-semibold text-brand-dark">{item.title}</p>
                <p className="mt-2 text-sm text-brand-slate">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-brand-copper/15 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_minmax(0,0.95fr)]">
            <div className="space-y-5">
              <h2 className="text-2xl font-semibold text-brand-dark">Your responsibilities</h2>
              <p className="text-sm text-brand-slate">
                Each member is accountable for compliant use of the platform. Keep credentials private, represent your
                membership honestly, and adhere to the operational policies referenced in our member experience.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {obligations.map((item) => (
                  <div key={item.heading} className="rounded-2xl border border-brand-copper/20 bg-brand-mist p-4">
                    <p className="text-sm font-semibold text-brand-dark">{item.heading}</p>
                    <p className="mt-2 text-sm text-brand-slate">{item.copy}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-brand-copper/25 bg-brand-dark p-6 text-white shadow-lg shadow-brand-copper/20">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-copper">No resale or copy</p>
              <h3 className="mt-2 text-xl font-semibold">Digital goods remain licensed</h3>
              <p className="mt-2 text-sm text-brand-mist">
                Templates, checklists, AI prompts, and marketplace intel are licensed for member use only. Forwarding, scraping,
                or reselling any portion of the platform violates these terms and may result in termination and legal remedies.
              </p>
              <p className="mt-4 text-xs text-brand-mist/80">
                If you manage a team, ensure everyone follows these restrictions. Contact support@nestedobjects.com to request
                extended licensing before sharing content beyond your account.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-sand/80">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-brand-dark">Legal notes & limitations</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {legalNotes.map((note) => (
              <div key={note} className="rounded-2xl border border-brand-copper/20 bg-white p-4 shadow-sm">
                <p className="text-sm text-brand-slate">{note}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-4xl text-sm text-brand-slate">
            For regulatory requirements or custom agreements, contact support@nestedobjects.com before onboarding. We timestamp
            updates to these terms and recommend reviewing them periodically.
          </p>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(termsSchema) }} />
    </main>
  )
}
