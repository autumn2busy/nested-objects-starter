import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const toolPreviews = [
  {
    name: 'Client and vendor workspace',
    availability: 'Paid access planned',
    description: 'Organize firm contacts, pay dates, portal links, and follow-up notes in one place.',
    outcome: 'Spend less time rebuilding the same firm context before every route.',
  },
  {
    name: 'Company tracker',
    availability: 'Paid access planned',
    description: 'Build a focused firm list and keep application status, requirements, and next steps together.',
    outcome: 'Know which application deserves attention next.',
  },
  {
    name: 'Income scenario planner',
    availability: 'Paid access planned',
    description: 'Compare inspection volume, service mix, route costs, and workdays before committing to a target.',
    outcome: 'Pressure-test an income goal without treating an estimate as a promise.',
  },
  {
    name: 'Route economics',
    availability: 'Paid access planned',
    description: 'Estimate mileage, printing, scan-backs, and nearby field-service add-ons for a proposed route.',
    outcome: 'See the route costs that can turn gross pay into a bad assignment.',
  },
  {
    name: 'AI workbench',
    availability: 'Paid access planned',
    description: 'Get structured help with firm research, requirements, resumes, and field-work preparation.',
    outcome: 'Turn scattered questions into a reviewable action plan.',
  },
  {
    name: 'Job and route planning',
    availability: 'Paid access planned',
    description: 'Coordinate applications, weather, daylight, assignments, and route order from one workspace.',
    outcome: 'Reduce avoidable mileage and last-minute route surprises.',
  },
] as const

const accessRows = [
  {
    audience: 'Visitors and Free members',
    access: 'Preview only',
    detail: 'You can review the planned outcomes, but no tool runs and no data is submitted from this page.',
  },
  {
    audience: 'Paid members',
    access: 'Coming later',
    detail: 'Functional access will appear only after each tool and its plan entitlement have been reviewed and enabled.',
  },
] as const

export function ToolsView() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_45%)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-sm font-semibold text-amber-200">
            Preview mode
          </div>
          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Practical tools for running a stronger field inspection business.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            This page is intentionally non-functional while tool behavior, plan entitlements, and data safeguards are finalized.
            Visitors and Free members can preview the value, but cannot run a tool or submit data.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/membership-pricing"
              className={buttonVariants({ variant: 'primary', size: 'lg', shape: 'rounded' })}
            >
              Compare live plans
            </Link>
            <Link
              href="/hiring-firms"
              className={buttonVariants({ variant: 'secondary', size: 'lg', shape: 'rounded' })}
            >
              Browse hiring firms
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {toolPreviews.map((tool) => (
            <Card
              key={tool.name}
              className="flex h-full flex-col border border-white/10 bg-white/[0.045] p-6 text-white shadow-2xl shadow-black/10"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
                  {tool.availability}
                </span>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                  Locked preview
                </span>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-white">{tool.name}</h2>
              <p className="mt-3 leading-7 text-slate-300">{tool.description}</p>
              <p className="mt-5 border-t border-white/10 pt-5 text-sm font-semibold text-sky-200">
                {tool.outcome}
              </p>
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="mt-auto w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-500"
              >
                Preview only. No function enabled
              </button>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-300">Access boundary</p>
          <h2 className="mt-3 text-3xl font-black text-white">Every tool remains locked until its access decision is implemented.</h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {accessRows.map((row) => (
              <div key={row.audience} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-white">{row.audience}</h3>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">{row.access}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{row.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
