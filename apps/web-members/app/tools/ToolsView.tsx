'use client'

import Link from 'next/link'

import { useAuth } from '@/components/auth-provider'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { canAccessMemberTool, type MemberToolId } from '@/lib/member-tool-access'

type MemberTool = {
  id: MemberToolId
  name: string
  href: string
  access: string
  description: string
  outcome: string
}

const memberTools: readonly MemberTool[] = [
  {
    id: 'income_scenario',
    name: 'Income scenario planner',
    href: '/tools/income-calculator',
    access: 'All signed-in member plans',
    description: 'Enter your own assignment volume, fees, time, mileage, and operating-cost assumptions.',
    outcome: 'Compare gross income with estimated route costs without treating an estimate as a promise.',
  },
  {
    id: 'client_workspace',
    name: 'Client and vendor workspace',
    href: '/tools/clients',
    access: 'Paid plans',
    description: 'Organize firm contacts, pay dates, portal links, and follow-up notes in one place.',
    outcome: 'Spend less time rebuilding the same firm context before every route.',
  },
  {
    id: 'company_tracker',
    name: 'Company tracker',
    href: '/tools/companies',
    access: 'Paid plans',
    description: 'Build a focused firm list and keep application status, requirements, and next steps together.',
    outcome: 'Know which application deserves attention next.',
  },
  {
    id: 'ai_concierge',
    name: 'AI concierge',
    href: '/tools/ai-concierge',
    access: 'Paid plans',
    description: 'Ask structured questions about firm research, requirements, and field-work preparation.',
    outcome: 'Turn scattered questions into a reviewable action plan.',
  },
  {
    id: 'ai_resume',
    name: 'AI resume builder',
    href: '/tools/ai-resume',
    access: 'Paid plans',
    description: 'Turn your experience, routes, and equipment into a resume for field-service firms.',
    outcome: 'Create a focused resume without starting from a blank page.',
  },
  {
    id: 'job_tracker',
    name: 'Job tracker',
    href: '/tools/job-tracker',
    access: 'Paid plans',
    description: 'Save opportunities and track applications, interviews, offers, and follow-up notes.',
    outcome: 'Keep your opportunity pipeline organized in one place.',
  },
  {
    id: 'weather',
    name: 'Field weather',
    href: '/tools/weather',
    access: 'Pro, Elite and Agency',
    description: 'Check current conditions, forecasts, wind, and daylight before a field route.',
    outcome: 'Reduce weather surprises and plan safer site visits.',
  },
  {
    id: 'routing',
    name: 'Route planner',
    href: '/tools/routing',
    access: 'Pro, Elite and Agency',
    description: 'Build an ordered stop list and hand it off to your preferred maps app.',
    outcome: 'Reduce retyping and keep the next stop clear.',
  },
  {
    id: 'route_economics',
    name: 'Route economics calculator',
    href: '/tools/notary-route-calculator',
    access: 'Elite and Agency',
    description: 'Model mileage, printing, cancellations, scan-backs, admin time, and nearby add-on work.',
    outcome: 'See whether a proposed route still works after the costs and unpaid time you enter.',
  },
] as const

export function ToolsView() {
  const { isAuthenticated, isLoading, login, planUid } = useAuth()

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_45%)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="inline-flex items-center rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-sm font-semibold text-emerald-200">
            Member tools by plan
          </div>
          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Practical tools for running a stronger field inspection business.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Free includes the income scenario planner. Pro includes the core tracking, AI, weather, and routing
            toolkit. Elite includes every member tool, including route economics.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {!isLoading && !isAuthenticated ? (
              <button
                type="button"
                onClick={login}
                className={buttonVariants({ variant: 'primary', size: 'lg', shape: 'rounded' })}
              >
                Sign in to use member tools
              </button>
            ) : (
              <Link
                href="/tools/income-calculator"
                className={buttonVariants({ variant: 'primary', size: 'lg', shape: 'rounded' })}
              >
                Open income planner
              </Link>
            )}
            <Link
              href="/membership-pricing"
              className={buttonVariants({ variant: 'secondary', size: 'lg', shape: 'rounded' })}
            >
              Compare plan access
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {memberTools.map((tool) => {
            const hasToolAccess = isAuthenticated && canAccessMemberTool(planUid, tool.id)

            return (
              <Card
                key={tool.name}
                className="flex h-full flex-col border border-white/10 bg-white/[0.045] p-6 text-white shadow-2xl shadow-black/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
                    {tool.access}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    hasToolAccess ? 'bg-emerald-400/15 text-emerald-200' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {hasToolAccess ? 'Included' : 'Plan access'}
                  </span>
                </div>
                <h2 className="mt-6 text-2xl font-bold text-white">{tool.name}</h2>
                <p className="mt-3 leading-7 text-slate-300">{tool.description}</p>
                <p className="mt-5 border-t border-white/10 pt-5 text-sm font-semibold text-sky-200">
                  {tool.outcome}
                </p>

                {isLoading ? (
                  <button
                    type="button"
                    disabled
                    className="mt-auto w-full cursor-wait rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-400"
                  >
                    Checking member access…
                  </button>
                ) : hasToolAccess ? (
                  <Link
                    href={tool.href}
                    className="mt-auto inline-flex w-full items-center justify-center rounded-lg bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
                  >
                    Open tool
                  </Link>
                ) : !isAuthenticated ? (
                  <button
                    type="button"
                    onClick={login}
                    className="mt-auto w-full rounded-lg bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
                  >
                    Sign in to use
                  </button>
                ) : (
                  <Link
                    href="/membership-pricing"
                    className="mt-auto inline-flex w-full items-center justify-center rounded-lg border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100 transition hover:bg-amber-300/20"
                  >
                    Compare plans
                  </Link>
                )}
              </Card>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-300">Plan access</p>
          <h2 className="mt-3 text-3xl font-black text-white">One useful tool on Free. A working toolkit on Pro. Everything on Elite.</h2>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">
            Calculator values are not intentionally saved or submitted. Normal site analytics may record page visits.
            Tracking tools save the records you enter to your account, and AI tools send the content you submit to the
            configured processing service so they can return a result.
          </p>
        </div>
      </section>
    </main>
  )
}
