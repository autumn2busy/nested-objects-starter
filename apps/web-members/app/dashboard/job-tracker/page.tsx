import { Metadata } from 'next'

import { DashboardPageFrame } from '../dashboard-page-frame'
import { JobTrackerClient } from '@/app/tools/job-tracker/job-tracker-client'

export const metadata: Metadata = {
  title: 'Job tracker | Nested Objects dashboard',
  description: 'Manage inspection workflows, payouts, and SLA performance from your dashboard job tracker.',
}

export default function DashboardJobTrackerPage() {
  return (
    <DashboardPageFrame>
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-steel">Operations</p>
          <h1 className="text-2xl font-semibold text-brand-slate">Job tracker</h1>
          <p className="text-sm text-brand-steel">
            Log inspections, payouts, and deadlines without leaving your workspace.
          </p>
        </div>
        <JobTrackerClient />
      </div>
    </DashboardPageFrame>
  )
}
