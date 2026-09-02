import Link from 'next/link'
import { ArrowRight, BookOpen, Search, ShieldCheck } from 'lucide-react'

const supportingSteps = [
  {
    title: 'Know what to prepare',
    description: 'Review the work, equipment, and expectations before you apply.',
    href: '/roles/inspector',
    label: 'Read the inspector guide',
    icon: BookOpen,
  },
  {
    title: 'Make your profile your own',
    description: 'Keep your experience and contact details current. Your profile is private to you.',
    href: '/profile',
    label: 'Edit your private profile',
    icon: ShieldCheck,
  },
] as const

/** A starting path, not a progress tracker: links never imply completed work. */
export function InspectorStartGuide() {
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-sm">
      <div className="grid lg:grid-cols-[1.15fr_1fr]">
        <div className="bg-[#173f39] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Start here · Inspector workspace</p>
          <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-emerald-100">
            <Search className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mt-5 max-w-md text-3xl font-bold tracking-tight text-white">Find a firm that fits your work.</h2>
          <p className="mt-4 max-w-md text-base leading-7 text-emerald-50/90">
            Start with the hiring directory. Compare the firm details available with your plan, then check a firm&apos;s requirements before deciding where to apply.
          </p>
          <Link
            href="/hiring-firms"
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-3 rounded-lg bg-white px-5 py-3 text-sm font-bold text-[#173f39] transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Explore hiring firms
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mt-4 text-xs leading-5 text-emerald-100">You can explore before filling out your profile. Listings are a research starting point, not a job guarantee.</p>
        </div>

        <div className="p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Then, at your pace</p>
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
          <p className="border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">Use what is available today. Planned tools are not required to get started.</p>
        </div>
      </div>
    </div>
  )
}
