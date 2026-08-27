import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getConversionAdminSession } from '@/lib/conversion-admin-auth'
import {
  buildConversionFunnel,
  type ConversionEventRow,
} from '@/lib/conversion-funnel'
import { createServiceRoleClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>
}

const ALLOWED_WINDOWS = new Set([7, 30, 90])

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function filterUrl(days: number, plan: string, source: string) {
  const params = new URLSearchParams({ days: String(days), plan })
  if (source !== 'all') params.set('source', source)
  return `/admin/conversion-funnel?${params.toString()}`
}

export default async function ConversionFunnelPage({ searchParams = {} }: PageProps) {
  const { isAdmin } = await getConversionAdminSession()
  if (!isAdmin) redirect('/profile')

  const requestedDays = Number(paramValue(searchParams.days) || 30)
  const days = ALLOWED_WINDOWS.has(requestedDays) ? requestedDays : 30
  const selectedSource = paramValue(searchParams.source) || 'all'
  const selectedPlan = paramValue(searchParams.plan) || 'free'
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('conversion_events')
    .select('id, event_name, anonymous_id, member_uid, member_email, plan_uid, plan_name, source_page, source, reason, utm_source, utm_medium, utm_campaign, occurred_at, event_data')
    .gte('occurred_at', startDate)
    .order('occurred_at', { ascending: true })
    .limit(20_000)

  const rows = (data || []) as ConversionEventRow[]
  const allFunnel = buildConversionFunnel(rows)
  const funnel = buildConversionFunnel(rows, {
    source: selectedSource,
    plan: selectedPlan,
  })

  const biggestLeak = funnel.stages
    .slice(1)
    .reduce<(typeof funnel.stages)[number] | null>(
      (largest, stage) => (!largest || stage.dropOff > largest.dropOff ? stage : largest),
      null,
    )

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-copper">
            Admin command center
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Free to Paid Conversion Funnel
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Follow each signup from activation through paid confirmation. Counts are unique people,
            not raw clicks, and purchases are confirmed by Outseta.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/admin/intelligence-os"
            className="text-sm font-semibold text-brand-copper hover:text-brand-copperDark"
          >
            Intelligence OS
          </Link>
          <Link
            href="/admin/background-checks"
            className="text-sm font-semibold text-brand-copper hover:text-brand-copperDark"
          >
            Background verification
          </Link>
        </div>
      </div>

      <section aria-label="Funnel filters" className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <form method="get" className="grid gap-4 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <label className="text-sm font-medium text-slate-700">
            Signup plan
            <select
              name="plan"
              defaultValue={selectedPlan}
              className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900"
            >
              <option value="all">All signup plans</option>
              <option value="free">Free</option>
              {allFunnel.plans
                .filter((plan) => plan.toLowerCase() !== 'free')
                .map((plan) => <option key={plan} value={plan}>{plan}</option>)}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Signup source
            <select
              name="source"
              defaultValue={selectedSource}
              className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900"
            >
              <option value="all">All sources</option>
              {allFunnel.sources.map((source) => <option key={source} value={source}>{source}</option>)}
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            {[7, 30, 90].map((windowDays) => (
              <Link
                key={windowDays}
                href={filterUrl(windowDays, selectedPlan, selectedSource)}
                className={windowDays === days
                  ? 'inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white'
                  : 'inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50'}
              >
                {windowDays} days
              </Link>
            ))}
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-lg bg-brand-copper px-4 text-sm font-semibold text-white hover:bg-brand-copperDark"
            >
              Apply
            </button>
          </div>
        </form>
      </section>

      {error ? (
        <section className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
          <h2 className="font-semibold">Conversion event storage is not ready</h2>
          <p className="mt-1 text-sm">
            Apply the conversion_events Supabase migration, then reload this page. No member data is exposed.
          </p>
        </section>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Cohort size</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">{funnel.cohortSize}</p>
          <p className="mt-2 text-sm text-slate-600">Unique {selectedPlan === 'all' ? '' : selectedPlan} signups in {days} days</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Paid conversions</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-emerald-700">
            {funnel.stages.at(-1)?.count || 0}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {funnel.stages.at(-1)?.conversionRate || 0}% of this signup cohort
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Largest visible leak</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-rose-700">
            {biggestLeak?.dropOff || 0} people
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Before {biggestLeak?.label || 'the next measured action'}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Stage-by-stage drop-off</h2>
            <p className="mt-1 text-sm text-slate-600">
              Each stage counts members who fired that signal after signup. Skipped actions remain visible as gaps.
            </p>
          </div>
          <p className="text-xs text-slate-500">Window starts {formatDate(startDate)}</p>
        </div>

        <ol className="mt-6 space-y-5">
          {funnel.stages.map((stage, index) => (
            <li key={stage.key}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{index + 1}. {stage.label}</p>
                  <p className="text-xs text-slate-500">{stage.description}</p>
                </div>
                <div className="text-sm text-slate-700 sm:text-right">
                  <span className="font-bold text-slate-950">{stage.count}</span>
                  <span> · {stage.conversionRate}% of signups</span>
                  {index > 0 ? <span> · {stage.dropOff} fewer than prior signal</span> : null}
                </div>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                <div
                  className={stage.key === 'paid' ? 'h-full rounded-full bg-emerald-500' : 'h-full rounded-full bg-brand-copper'}
                  style={{ width: `${Math.max(stage.conversionRate, stage.count > 0 ? 2 : 0)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-xl font-bold text-slate-950">Members to recover</h2>
          <p className="mt-1 text-sm text-slate-600">
            Authenticated members who signed up but have not reached a confirmed paid conversion.
          </p>
        </div>

        {funnel.stuckMembers.length === 0 ? (
          <p className="p-6 text-sm text-slate-600">
            {funnel.cohortSize === 0
              ? 'No signups match these filters yet. Tracking begins when the migration and this release are live.'
              : 'No identifiable unpaid members are stuck in this cohort.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Member</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Last funnel stage</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Source</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Last signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {funnel.stuckMembers.slice(0, 250).map((member) => (
                  <tr key={member.actorKey} className="align-top">
                    <td className="px-5 py-4">
                      <a href={`mailto:${member.email}`} className="font-semibold text-brand-copper hover:underline">
                        {member.email}
                      </a>
                      <p className="mt-1 text-xs text-slate-500">Plan: {member.plan}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                        {member.latestStageLabel}
                      </span>
                      {member.reason ? <p className="mt-1 text-xs text-slate-500">Reason: {member.reason}</p> : null}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{member.source}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{formatDate(member.latestAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Privacy: this page is server-rendered, admin-only, and reads a Row Level Security protected table through the service role.
        Browser events do not store IP addresses.
      </p>
    </main>
  )
}
