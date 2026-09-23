import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  CheckCircle,
  Clock,
  FileSearch,
  MapPin,
  Shield,
  Users,
} from 'lucide-react'

const qualificationChecks = [
  'One Georgia county or tightly defined metro territory',
  'One inspection or field-service order type',
  'Expected monthly order volume and required turnaround',
  'Pay range, vendor requirements, and a firm decision-maker',
]

const pilotSteps = [
  {
    step: '01',
    title: 'Confirm the coverage gap',
    body: 'We review the territory, order type, volume, timing, pay range, and vendor requirements before accepting a pilot.',
    icon: FileSearch,
  },
  {
    step: '02',
    title: 'Validate supply privately',
    body: 'We check whether a realistic opt-in sourcing path exists. No member directory or contact details are exposed.',
    icon: Shield,
  },
  {
    step: '03',
    title: 'Deliver a coverage decision',
    body: 'The pilot outcome is a coverage-feasibility memo. Introductions happen only when supply is verified and each inspector consents.',
    icon: CheckCircle,
  },
]

export default function FirmsHomePage() {
  return (
    <main>
      <section className="hero-gradient relative px-4 pb-20 pt-20 sm:px-6 lg:pb-28 lg:pt-28">
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-100">
            <Building2 className="h-3.5 w-3.5" aria-hidden />
            Proposed owner-assisted pilot
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Test a Georgia coverage gap
            <span className="block text-brand-accent">before building a marketplace.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-indigo-100/85 sm:text-lg">
            Nested Objects is validating one narrow service for regional mortgage and property field-service firms:
            a decision-grade coverage review for one Georgia territory and one order type. This is not a live
            nationwide inspector network, staffing guarantee, or public member directory.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/post-a-job"
              data-funnel-stage="qualified-demand"
              className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-brand-accent px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
            >
              Request a coverage review <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href="#pilot"
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/40 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Review the pilot scope
            </a>
          </div>
          <p className="mt-4 text-xs leading-5 text-indigo-200/75">
            Candidate pilot price: $1,500 after written scope confirmation. No payment is collected on this site.
          </p>
        </div>
      </section>

      <section id="pilot" className="border-b border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Initial buyer</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                A regional firm with a recurring Georgia coverage problem
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                The first pilot is for an established firm that already has real orders, a defined vendor standard,
                and a decision-maker who can evaluate a paid coverage review. It is not for speculative nationwide
                recruiting, bulk contact access, or guaranteed job placement.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="b2b-card p-5">
                  <MapPin className="h-5 w-5 text-brand" aria-hidden />
                  <h3 className="mt-3 text-sm font-bold text-slate-900">One territory</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Start with a county or tightly defined metro area instead of claiming statewide or national supply.
                  </p>
                </div>
                <div className="b2b-card p-5">
                  <Clock className="h-5 w-5 text-brand" aria-hidden />
                  <h3 className="mt-3 text-sm font-bold text-slate-900">One operating decision</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Decide whether the territory is supportable, needs different economics, or should be declined.
                  </p>
                </div>
              </div>
            </div>

            <aside className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-6 shadow-sm sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">A complete brief includes</p>
              <ul className="mt-5 space-y-4">
                {qualificationChecks.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 rounded-xl border border-indigo-100 bg-white p-4 text-xs leading-5 text-slate-600">
                The proposed target is a five-business-day review after a complete brief. Timing, deliverables, and
                price must be confirmed in writing before payment. A request does not guarantee coverage.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-brand-sand py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Pilot workflow</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
              Validate demand and supply before automation
            </h2>
          </div>
          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {pilotSteps.map((item) => (
              <article key={item.step} className="b2b-card relative px-7 py-8 text-center">
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">
                  {item.step}
                </span>
                <div className="mt-4 flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light">
                    <item.icon className="h-6 w-6 text-brand" aria-hidden />
                  </div>
                </div>
                <h3 className="mt-5 text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="privacy" className="border-y border-slate-200 bg-white py-20">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
          <div className="b2b-card p-7">
            <Users className="h-6 w-6 text-brand" aria-hidden />
            <h2 className="mt-4 text-xl font-bold text-slate-900">No public inspector directory</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Inspector profiles, contact details, availability, background checks, and service areas are not exposed
              here. A future introduction would require a verified business need and affirmative inspector consent.
            </p>
          </div>
          <div className="b2b-card p-7">
            <Shield className="h-6 w-6 text-brand" aria-hidden />
            <h2 className="mt-4 text-xl font-bold text-slate-900">No placement or performance guarantee</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Nested Objects does not currently guarantee inspector availability, acceptance, completion, turnaround,
              licensing, earnings, or job outcomes. Firms remain responsible for due diligence and contracting.
            </p>
          </div>
        </div>
      </section>

      <section className="hero-gradient relative py-20">
        <div className="relative z-10 mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Have a specific Georgia coverage gap?</h2>
          <p className="mt-4 text-base leading-7 text-indigo-100/85">
            Send a bounded brief for review. We will confirm whether the request fits the proposed pilot before discussing
            payment or inspector outreach.
          </p>
          <Link
            href="/post-a-job"
            data-funnel-stage="qualified-demand"
            className="btn-shimmer mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-accent px-7 py-3.5 text-sm font-bold text-white transition hover:bg-cyan-400"
          >
            Prepare the brief <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </main>
  )
}
