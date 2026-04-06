import type { Metadata } from 'next'
import { BarChart3, Users, Clock, FileText, MapPin, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Firm Dashboard',
  description: 'Manage your inspection jobs, track inspector performance, and monitor coverage across your regions.',
}

const stats = [
  { label: 'Active Jobs', value: '12', icon: FileText, trend: '+3 this week', color: 'text-brand', bg: 'bg-brand-light' },
  { label: 'Inspectors Engaged', value: '28', icon: Users, trend: '4 new this month', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Avg. Turnaround', value: '18hr', icon: Clock, trend: '↓ 6hr from last month', color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Completion Rate', value: '99.2%', icon: TrendingUp, trend: '+0.4% from last month', color: 'text-rose-600', bg: 'bg-rose-50' },
]

const recentJobs = [
  { id: 'JOB-1042', type: 'Property Condition', location: 'Atlanta, GA', status: 'In Progress', inspector: 'Marcus D.', date: '2026-04-03' },
  { id: 'JOB-1041', type: 'Loss Draft Inspection', location: 'Houston, TX', status: 'Completed', inspector: 'Sarah K.', date: '2026-04-02' },
  { id: 'JOB-1040', type: 'Occupancy Verification', location: 'Phoenix, AZ', status: 'Completed', inspector: 'James L.', date: '2026-04-01' },
  { id: 'JOB-1039', type: 'Insurance Inspection', location: 'Denver, CO', status: 'Under Review', inspector: 'Priya M.', date: '2026-03-31' },
  { id: 'JOB-1038', type: 'Property Preservation', location: 'Miami, FL', status: 'Completed', inspector: 'Tony R.', date: '2026-03-30' },
]

function getStatusClasses(status: string) {
  switch (status) {
    case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Under Review': return 'bg-amber-50 text-amber-700 border-amber-200'
    default: return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

export default function DashboardPage() {
  return (
    <main className="bg-brand-sand min-h-screen">
      {/* ── Header bar ── */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Firm Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Welcome back. Here&apos;s your operation snapshot.</p>
          </div>
          <Link
            href="/post-a-job"
            className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Post a Job <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* ── Stat Cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="b2b-card px-5 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-900">{stat.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">{stat.trend}</p>
            </div>
          ))}
        </div>

        {/* ── Recent Jobs Table ── */}
        <div className="mt-8 b2b-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-bold text-slate-900">Recent Jobs</h2>
            <span className="text-xs font-medium text-brand hover:underline cursor-pointer">View all →</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3">Job ID</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Inspector</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id} className="border-b border-slate-50 transition hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 font-semibold text-brand">{job.id}</td>
                    <td className="px-6 py-3.5 text-slate-700">{job.type}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <MapPin className="h-3 w-3" /> {job.location}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">{job.inspector}</td>
                    <td className="px-6 py-3.5">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusClasses(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">{job.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { title: 'Post a New Job', desc: 'Create an inspection request in under 2 minutes.', href: '/post-a-job', icon: FileText },
            { title: 'Browse Inspectors', desc: 'Search our network of 2,400+ vetted inspectors.', href: '/inspectors', icon: Users },
            { title: 'View Reports', desc: 'Access completed inspection reports and analytics.', href: '/dashboard', icon: BarChart3 },
          ].map((action) => (
            <Link key={action.title} href={action.href} className="b2b-card group flex items-start gap-4 px-6 py-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light">
                <action.icon className="h-5 w-5 text-brand" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand transition">{action.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
