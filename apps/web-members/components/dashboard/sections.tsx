import Link from 'next/link'
import { ReactNode } from 'react'

interface DashboardCardProps {
  title: string
  children: ReactNode
  tone?: 'default' | 'success'
}

export function DashboardCard({ title, children, tone = 'default' }: DashboardCardProps) {
  const toneClasses =
    tone === 'success'
      ? 'border-brand-teal/60 bg-brand-teal/5'
      : 'border-brand-mist bg-white'

  return (
    <section className={`rounded-2xl border ${toneClasses} p-6 shadow-sm`}> 
      <h3 className="text-base font-semibold text-brand-slate">{title}</h3>
      <div className="mt-3 text-sm text-brand-steel">{children}</div>
    </section>
  )
}

export function WelcomeSection({ firstName }: { firstName: string }) {
  return (
    <div className="space-y-3 rounded-2xl border border-brand-mist bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-steel">Home base</p>
          <h2 className="text-2xl font-bold text-brand-slate">Welcome back, {firstName}! 👋</h2>
        </div>
        <span className="rounded-full bg-brand-copper px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          Live
        </span>
      </div>
      <p className="text-sm text-brand-steel">This is your Nested Objects home base.</p>
    </div>
  )
}

export function ProfileCompletionCard() {
  return (
    <DashboardCard title="Profile completeness">
      <div className="flex items-center justify-between text-sm font-medium text-brand-slate">
        <span>Profile completeness</span>
        <span className="text-brand-steel">100%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-mist">
        <div className="h-full w-full bg-gradient-to-r from-brand-teal to-brand-copper" />
      </div>
      <p className="mt-3 text-sm text-brand-steel">
        Next step. add your service area and skills so hiring firms can match you faster.
      </p>
    </DashboardCard>
  )
}

export function AccountOverviewCard({ planName }: { planName: string }) {
  return (
    <DashboardCard title="Account overview" tone="success">
      <p className="text-sm text-brand-teal">
        Current plan. <strong className="font-semibold text-brand-teal">{planName}</strong>
      </p>
      <p className="mt-2 text-sm text-brand-teal">
        Upgrade when you are ready for more tools. not before.
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-brand-teal">
        <Link
          className="rounded-full border border-brand-teal bg-white px-4 py-2 transition hover:border-brand-copper hover:text-brand-copper"
          href="/membership"
        >
          View plans
        </Link>
        <Link
          className="rounded-full border border-brand-teal bg-white px-4 py-2 transition hover:border-brand-copper hover:text-brand-copper"
          href="/directory"
        >
          Open firm directory
        </Link>
      </div>
    </DashboardCard>
  )
}

export function ChecklistCard() {
  return (
    <DashboardCard title="First steps checklist">
      <ol className="list-decimal space-y-2 pl-5 text-brand-slate">
        <li>Finish your profile basics. name, email, service area.</li>
        <li>Bookmark three hiring firms you would love to work with.</li>
        <li>Skim the Field Inspection Starter Kit so you understand how the work and payouts actually flow.</li>
        <li>Block off time this week to complete your first three inspections.</li>
      </ol>
    </DashboardCard>
  )
}

export function RecentActivityCard() {
  return (
    <DashboardCard title="Recent activity">
      <p>
        No recent activity yet.{' '}
        <Link className="font-semibold text-brand-copper hover:text-brand-copperDark" href="/directory">
          Open the firm directory
        </Link>{' '}
        and start building your list.
      </p>
    </DashboardCard>
  )
}

export function ShortcutsCard() {
  return (
    <DashboardCard title="Shortcuts">
      <ul className="list-disc space-y-2 pl-5 text-brand-slate">
        <li>
          <Link className="font-semibold text-brand-copper hover:text-brand-copperDark" href="/directory">
            Browse hiring firms
          </Link>
        </li>
        <li>
          <Link className="font-semibold text-brand-copper hover:text-brand-copperDark" href="/resources/firm-intel">
            View firm intel and templates
          </Link>
        </li>
        <li>
          <Link className="font-semibold text-brand-copper hover:text-brand-copperDark" href="/tools/ai-chatbot">
            Ask a question or get help
          </Link>
        </li>
      </ul>
    </DashboardCard>
  )
}
