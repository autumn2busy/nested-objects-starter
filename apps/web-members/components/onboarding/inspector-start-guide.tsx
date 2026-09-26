import Link from 'next/link'
import { ArrowRight, BookOpen, Calculator, Search, ShieldCheck } from 'lucide-react'

const supportingSteps = [
  {
    title: 'Estimate income after costs',
    description: 'Included on Free. Compare your own fees, mileage, and costs before planning a route.',
    href: '/tools/income-calculator',
    label: 'Open income calculator',
    icon: Calculator,
  },
  {
    title: 'Explore hiring firms',
    description: 'On Free, preview up to three firms without search or filters. Paid directory access depends on your plan.',
    href: '/hiring-firms',
    label: 'Explore hiring firms',
    icon: Search,
  },
  {
    title: 'Know what to prepare',
    description: 'Review the work, equipment, and expectations before you apply.',
    href: '/roles/inspector',
    label: 'Read the inspector guide',
    icon: BookOpen,
  },
] as const

/** A starting path, not a progress tracker: links never imply completed work. */
export function InspectorStartGuide() {
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-sm">
      <div className="grid lg:grid-cols-[1.15fr_1fr]">
        <div className="bg-[#173f39] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Start here · Complete your setup</p>
          <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-emerald-100">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mt-5 max-w-md text-3xl font-bold tracking-tight text-white">Tell us what inspection work fits you.</h2>
          <p className="mt-4 max-w-md text-base leading-7 text-emerald-50/90">
            Complete your private profile with a short headline and bio, your city and state, and your experience level. Add your Primary Services and select at least one Service Type You Offer.
          </p>
          <p className="mt-3 max-w-md text-sm leading-6 text-emerald-100">
            These details help Nested Objects make onboarding and future opportunity guidance more relevant. Your profile stays private to you.
          </p>
          <Link
            href="/profile"
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-3 rounded-lg bg-white px-5 py-3 text-sm font-bold text-[#173f39] transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Complete my private profile
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mt-4 text-xs leading-5 text-emerald-100">Choose the answers that fit you today. You can update them later.</p>
        </div>

        <div className="p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Then complete your first value step</p>
          <ul className="mt-2 divide-y divide-slate-100">
            {supportingSteps.map((step) => {
              const Icon = step.icon
              return (
                <li key={step.href} className="py-5">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-1 h-5 w-5 shrink-0 text-brand-copper" aria-hidden="true" />
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                      <Link
                        href={step.href}
                        className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-brand-copper underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-copper"
                      >
                        {step.label}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">Your setup steps are to save the profile details above and complete one Income Scenarios calculation. Free includes the calculator and a limited three-firm preview.</p>
        </div>
      </div>
    </div>
  )
}
