import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Mail, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Request a Georgia Coverage Review',
  description: 'Prepare a bounded brief for the proposed owner-assisted Georgia coverage pilot.',
  robots: { index: false, follow: false },
}

const briefItems = [
  'Firm name, business website, and decision-maker role',
  'Georgia county, metro area, or ZIP-code cluster',
  'Order type, expected monthly volume, and due window',
  'Pay range, trip-fee policy, revision policy, and required deliverables',
  'Licensing, insurance, background-check, platform, and equipment requirements',
]

const pilotEmail =
  'mailto:support@nestedobjects.com?subject=Georgia%20coverage%20pilot%20request&body=Firm%20name%3A%0ADecision-maker%20role%3A%0AGeorgia%20territory%3A%0AOrder%20type%3A%0AMonthly%20volume%3A%0ADue%20window%3A%0APay%20range%3A%0AVendor%20requirements%3A'

export default function CoverageRequestPage() {
  return (
    <main className="min-h-screen bg-brand-sand px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to pilot details
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
          <section className="b2b-card p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Qualified-demand brief</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
              Request a Georgia coverage review
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              This page does not post a job, charge a card, publish a request, notify inspectors, or collect information
              in a Nested Objects database. Use the email template below only if you have a real coverage need.
            </p>

            <h2 className="mt-8 text-sm font-bold text-slate-900">Include these decision inputs</h2>
            <ul className="mt-4 space-y-3">
              {briefItems.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <a
              href={pilotEmail}
              data-funnel-stage="qualified-demand"
              className="btn-shimmer mt-8 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              <Mail className="h-4 w-4" aria-hidden /> Email the pilot brief
            </a>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Prefer to start without the template? Email support@nestedobjects.com with “Georgia coverage pilot” in the subject.
            </p>
          </section>

          <aside className="space-y-5">
            <div className="b2b-card p-6">
              <h2 className="text-sm font-bold text-slate-900">Proposed commercial terms</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-slate-900">Candidate price</dt>
                  <dd className="mt-1 leading-6 text-slate-600">$1,500 for one accepted pilot scope.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-900">Paid outcome</dt>
                  <dd className="mt-1 leading-6 text-slate-600">
                    A decision-grade coverage-feasibility memo for one territory and order type.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-900">Conditional addition</dt>
                  <dd className="mt-1 leading-6 text-slate-600">
                    Up to three introductions only if suitable supply is validated and each inspector opts in.
                  </dd>
                </div>
              </dl>
              <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
                These are proposed validation terms, not a currently purchasable plan. Written scope, timing, and payment
                terms must be approved before any paid pilot begins.
              </p>
            </div>

            <div className="b2b-card p-6">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Shield className="h-4 w-4 text-brand" aria-hidden /> Privacy and consent boundary
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-600">
                Do not send borrower, occupant, access-code, property-entry, or other sensitive job data in the initial
                brief. No inspector identity or contact information will be shared without that person&apos;s affirmative consent.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
