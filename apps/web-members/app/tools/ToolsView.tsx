'use client'

import Link from 'next/link'

import { useAuth } from '@/components/auth-provider'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { canAccessMemberTool, type MemberToolId } from '@/lib/member-tool-access'

type LiveTool = {
  id: MemberToolId
  name: string
  href: string
  access: string
  description: string
  outcome: string
  status: 'live'
}

type PlannedTool = {
  name: string
  access: string
  description: string
  outcome: string
  status: 'planned'
}

const memberTools: readonly (LiveTool | PlannedTool)[] = [
  {
    id: 'income_scenario',
    name: 'Income scenario planner',
    href: '/tools/income-calculator',
    access: 'All signed-in member plans',
    description: 'Enter your own assignment volume, fees, time, mileage, and operating-cost assumptions.',
    outcome: 'Compare gross income with estimated route costs without treating an estimate as a promise.',
    status: 'live',
  },
  {
    id: 'route_economics',
    name: 'Route economics calculator',
    href: '/tools/notary-route-calculator',
    access: 'Elite and Agency',
    description: 'Model mileage, printing, cancellations, scan-backs, admin time, and nearby add-on work.',
    outcome: 'See whether a proposed route still works after the costs and unpaid time you enter.',
    status: 'live',
  },
  {
    name: 'Client and vendor workspace',
    access: 'Not enabled yet',
    description: 'Organize firm contacts, pay dates, portal links, and follow-up notes in one place.',
    outcome: 'Spend less time rebuilding the same firm context before every route.',
    status: 'planned',
  },
  {
    name: 'Company tracker',
    access: 'Not enabled yet',
    description: 'Build a focused firm list and keep application status, requirements, and next steps together.',
    outcome: 'Know which application deserves attention next.',
    status: 'planned',
  },
  {
    name: 'AI workbench',
    access: 'Not enabled yet',
    description: 'Get structured help with firm research, requirements, resumes, and field-work preparation.',
    outcome: 'Turn scattered questions into a reviewable action plan.',
    status: 'planned',
  },
  {
    name: 'Job, weather, and route planning',
    access: 'Not enabled yet',
    description: 'Coordinate applications, weather, daylight, assignments, and route order from one workspace.',
    outcome: 'Reduce avoidable mileage and last-minute route surprises.',
    status: 'planned',
  },
] as const

export function ToolsView() {
  const { isAuthenticated, isLoading, login, planUid } = useAuth()

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_45%)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="inline-flex items-center rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-sm font-semibold text-emerald-200">
            Two tools available now
          </div>
          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Practical tools for running a stronger field inspection business.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Signed-in members can use the income scenario planner now. Elite and Agency members can also use route
            economics. Connected AI, weather, and tracking tools remain clearly marked until their data, quotas, and
            permissions are verified.
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
            const isLive = tool.status === 'live'
            const hasToolAccess = isLive && isAuthenticated && canAccessMemberTool(planUid, tool.id)

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
                    isLive ? 'bg-emerald-400/15 text-emerald-200' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {isLive ? 'Available now' : 'Planned'}
                  </span>
                </div>
                <h2 className="mt-6 text-2xl font-bold text-white">{tool.name}</h2>
                <p className="mt-3 leading-7 text-slate-300">{tool.description}</p>
                <p className="mt-5 border-t border-white/10 pt-5 text-sm font-semibold text-sky-200">
                  {tool.outcome}
                </p>

                {isLive && isLoading ? (
                  <button
                    type="button"
                    disabled
                    className="mt-auto w-full cursor-wait rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-400"
                  >
                    Checking member access…
                  </button>
                ) : isLive && hasToolAccess ? (
                  <Link
                    href={tool.href}
                    className="mt-auto inline-flex w-full items-center justify-center rounded-lg bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
                  >
                    Open tool
                  </Link>
                ) : isLive && !isAuthenticated ? (
                  <button
                    type="button"
                    onClick={login}
                    className="mt-auto w-full rounded-lg bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
                  >
                    Sign in to use
                  </button>
                ) : isLive ? (
                  <Link
                    href="/membership-pricing"
                    className="mt-auto inline-flex w-full items-center justify-center rounded-lg border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100 transition hover:bg-amber-300/20"
                  >
                    Compare plans
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="mt-auto w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-500"
                  >
                    Not yet enabled
                  </button>
                )}
              </Card>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-300">Access boundary</p>
          <h2 className="mt-3 text-3xl font-black text-white">Useful now, explicit about what is still being hardened.</h2>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">
            The calculator code does not intentionally save or submit the numbers you enter. Normal site analytics may
            record that you visited the page. Connected tools stay off until their authentication, plan enforcement,
            data handling, and failure behavior pass review.
          </p>
        </div>
      </section>
    </main>
  )
}
