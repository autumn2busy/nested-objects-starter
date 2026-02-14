'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'
import { ToolAccessMessage, UpgradeActions } from '../_components/ToolAccessMessage'
import { ToolLayout } from '../_components/ToolLayout'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/inspector-dashboard', label: 'Dashboard' },
  { href: '/hiring-firms', label: 'Directory' },
  { href: '/membership-pricing', label: 'Membership' },
]

const benefits = [
  {
    title: 'Stay ahead of due dates',
    description: 'A quick view of upcoming deadlines with alerts for rush or late submissions.',
  },
  {
    title: 'Track money in one place',
    description: 'Log pay ranges, invoices, and payouts so you know which firms are most reliable.',
  },
  {
    title: 'Connect to routing',
    description: 'Plan stops directly from the job list once routing launches, reducing double entry.',
  },
  {
    title: 'Share progress confidently',
    description: 'Status updates you can copy into vendor portals or emails without rewriting.',
  },
]

export default function JobTrackingPage() {
  return (
    <ToolLayout
      title="Job tracking tool"
      description="Track inspections, due dates, pay, and status in one place so nothing slips through."
      navLinks={navLinks}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {benefits.map((item) => (
          <div key={item.title} className="rounded-2xl border border-brand-copper/25 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-brand-dark">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-700">{item.description}</p>
          </div>
        ))}
      </div>

      <Gate
        feature="job_tracking"
        loadingFallback={<ToolAccessMessage title="Loading access" description="Checking your account..." loading />}
        fallback={
          <ToolAccessMessage
            title="Authentication required"
            description="Log in or upgrade to add inspections and track payouts."
            tone="warning"
            actions={<UpgradeActions />}
          />
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          <section className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Placeholder workspace</p>
                <h3 className="text-xl font-semibold text-brand-dark">What the tracker will manage</h3>
              </div>
              <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-xs font-semibold text-brand-copper">Phase 1</span>
            </div>
            <p className="text-sm text-slate-700">
              This page is routed and SEO-ready. The working tool will let you log inspections by firm, work type, pay, and due
              date, then track each job from assigned to paid.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-brand-mist/50 p-4">
                <h4 className="text-sm font-semibold text-brand-dark">Launch checklist</h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  <li>• Create jobs with vendor, work type, and rate.</li>
                  <li>• Status steps: assigned, in progress, submitted, and paid.</li>
                  <li>• Reminders before due dates and after submission.</li>
                </ul>
              </div>
              <div className="rounded-xl bg-brand-mist/50 p-4">
                <h4 className="text-sm font-semibold text-brand-dark">Next iterations</h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  <li>• Visualize revenue by week and vendor.</li>
                  <li>• Export jobs to routing and weather tools.</li>
                  <li>• Invite teammates and assign tasks.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-brand-dark">Data to gather now</h3>
            <div className="space-y-3 text-sm text-slate-700">
              <p className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
                Recent inspections with due dates, pay, and whether they were re-inspections or rushes.
              </p>
              <p className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
                The vendors you want on the calendar view and which ones need reminders first.
              </p>
              <p className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
                Any invoicing timelines or late fee rules you follow with your top firms.
              </p>
            </div>
            <Link
              href="/tools"
              className="inline-flex items-center justify-center rounded-full bg-brand-copper px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
            >
              Explore other tools
            </Link>
          </section>
        </div>
      </Gate>
    </ToolLayout>
  )
}
