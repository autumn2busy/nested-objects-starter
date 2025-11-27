import type { Metadata } from 'next'

const refundPrinciples = [
  {
    title: 'Digital goods are non-refundable',
    detail:
      'Access to digital downloads, AI tools, templates, and directory intel is delivered instantly and cannot be returned. All sales for these items are final.',
  },
  {
    title: 'Transparent before you buy',
    detail:
      'Plan benefits, pricing, and what is included are available before purchase. Ask support@nestedobjects.com if you need clarity prior to upgrading.',
  },
  {
    title: 'Compliance with member.nestedobjects.com',
    detail:
      'This policy mirrors the live refund terms in our primary member experience so expectations stay aligned across every entry point.',
  },
]

const processSteps = [
  {
    label: 'Billing errors',
    description:
      'If you believe a charge is incorrect, contact us within 10 days of the transaction. We will investigate and correct legitimate errors.',
  },
  {
    label: 'Cancellation timing',
    description:
      'Cancel before your renewal date to avoid the next charge. Your access continues through the end of the paid term with no prorated refunds.',
  },
  {
    label: 'Chargebacks',
    description:
      'We encourage resolving disputes directly with us. Unauthorized chargebacks may result in account suspension until resolved.',
  },
  {
    label: 'Team seats',
    description:
      'Team or Agency seats are billed per agreement and non-refundable once provisioned. Adjust seat counts before the next billing cycle.',
  },
]

export const metadata: Metadata = {
  title: 'Refund Policy | Non-refundable digital goods at Nested Objects',
  description:
    'Review the refund policy for Nested Objects. Digital goods and memberships are non-refundable once delivered, with clear guidance for billing questions.',
  alternates: {
    canonical: 'https://nested-objects-starter.vercel.app/refund-policy',
  },
  openGraph: {
    type: 'article',
    url: 'https://nested-objects-starter.vercel.app/refund-policy',
    title: 'Refund Policy | Non-refundable digital goods at Nested Objects',
    description:
      'No refunds on digital goods or memberships once delivered. Learn how to handle billing errors, cancellations, and chargebacks.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Refund Policy | Non-refundable digital goods at Nested Objects',
    description:
      'Understand the non-refundable policy for Nested Objects digital goods and the steps to resolve billing issues.',
  },
}

export default function RefundPolicyPage() {
  const refundSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Nested Objects Refund Policy',
    url: 'https://nested-objects-starter.vercel.app/refund-policy',
    description:
      'Refund policy stating that digital goods and memberships are non-refundable, with guidance for cancellations and billing questions.',
    inLanguage: 'en',
  }

  return (
    <main className="bg-brand-sand text-brand-dark">
      <section className="border-b border-brand-copper/20 bg-gradient-to-b from-brand-sand via-white to-brand-mist">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-copper">Refund policy</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">No-refund terms for digital goods and memberships.</h1>
          <p className="mt-4 max-w-3xl text-sm text-brand-slate">
            Nested Objects delivers digital resources instantly. In alignment with member.nestedobjects.com, purchases of digital
            goods, AI tools, and memberships are final and non-refundable. Review the guidelines below to avoid unexpected
            charges and keep your account in good standing.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {refundPrinciples.map((item) => (
              <div key={item.title} className="rounded-2xl border border-brand-copper/25 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-brand-dark">{item.title}</p>
                <p className="mt-2 text-sm text-brand-slate">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-brand-copper/15 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_minmax(0,0.95fr)]">
            <div className="space-y-5">
              <h2 className="text-2xl font-semibold text-brand-dark">How we handle payments</h2>
              <p className="text-sm text-brand-slate">
                Clarity on billing helps keep your membership uninterrupted. The steps below outline how we address questions,
                cancellations, and disputes while honoring the no-refund policy for digital goods.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {processSteps.map((step) => (
                  <div key={step.label} className="rounded-2xl border border-brand-copper/20 bg-brand-mist p-4">
                    <p className="text-sm font-semibold text-brand-dark">{step.label}</p>
                    <p className="mt-2 text-sm text-brand-slate">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-brand-copper/25 bg-brand-dark p-6 text-white shadow-lg shadow-brand-copper/20">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-copper">Non-transferable access</p>
              <h3 className="mt-2 text-xl font-semibold">No resale or copying</h3>
              <p className="mt-2 text-sm text-brand-mist">
                Membership credentials, downloads, and AI outputs are licensed solely to the purchasing account or approved team
                seats. Copying, reselling, or redistributing materials violates our terms and may lead to suspension.
              </p>
              <p className="mt-4 text-xs text-brand-mist/80">
                Need help before you buy? Email support@nestedobjects.com for plan guidance. For enterprise or regulated
                environments, we can provide written confirmations of the no-refund and no-resale standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-sand/80">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-brand-dark">Key reminders</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-brand-copper/20 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-brand-dark">No trial reversals</p>
              <p className="mt-2 text-sm text-brand-slate">
                If a trial converts to paid, the charge is non-refundable. Disable auto-renew before the trial ends to avoid
                billing.
              </p>
            </div>
            <div className="rounded-2xl border border-brand-copper/20 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-brand-dark">Export responsibly</p>
              <p className="mt-2 text-sm text-brand-slate">
                Downloaded resources are for your operations only. Do not upload or share them to third-party marketplaces,
                forums, or training libraries.
              </p>
            </div>
            <div className="rounded-2xl border border-brand-copper/20 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-brand-dark">Receipts and records</p>
              <p className="mt-2 text-sm text-brand-slate">
                Receipts are available in your billing profile. Keep them for compliance, and contact us if you need a purchase
                confirmation letter.
              </p>
            </div>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(refundSchema) }} />
    </main>
  )
}
