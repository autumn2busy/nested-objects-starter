import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { ToolAccessMessage } from '../_components/ToolAccessMessage'
import { IncomeScenarioCalculator } from './IncomeScenarioCalculator'
import { getCurrentUser } from '@/lib/auth-server'
import { canAccessMemberTool, MEMBER_TOOL_IDS } from '@/lib/member-tool-access'

const OUTSETA_LOGIN_URL = 'https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Income Scenario Planner | Nested Objects',
  description: 'A private, member-only calculator for comparing user-entered field inspection income and cost assumptions.',
  robots: { index: false, follow: false },
}

export default async function IncomeCalculatorPage() {
  const user = await getCurrentUser()
  if (!user) redirect(OUTSETA_LOGIN_URL)

  if (!canAccessMemberTool(user['outseta:planUid'], MEMBER_TOOL_IDS.INCOME_SCENARIO)) {
    return (
      <div className="mx-auto min-h-[70vh] max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <ToolAccessMessage
          tone="warning"
          title="We could not confirm an eligible member plan"
          description="This planner is available to every recognized Nested Objects member plan. Review your membership or sign in again so your current Outseta plan can be verified."
          actions={(
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-full border border-brand-copper/40 px-4 py-2 text-sm font-semibold" href="/membership-pricing">
                Review membership
              </Link>
              <Link className="rounded-full bg-brand-copper px-4 py-2 text-sm font-semibold text-white" href="/tools">
                Back to tools
              </Link>
            </div>
          )}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/tools" className="text-sm font-semibold text-brand-copper hover:text-brand-copperDark">
            ← All tools
          </Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-brand-copper">Member tool</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Income scenario planner</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Compare one set of field-work assumptions without relying on preset earnings, third-party averages, or hidden costs.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <IncomeScenarioCalculator />
      </div>
    </div>
  )
}
