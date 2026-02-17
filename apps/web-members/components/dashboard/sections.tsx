'use client'

import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'

import { useDashboardLayout } from './dashboard-layout-context'
import type { MemberJob, MemberJobStatus } from '@/types/member-jobs'

interface DashboardSectionCardProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

function DashboardSectionCard({ title, subtitle, actions, children }: DashboardSectionCardProps) {
  const { theme } = useDashboardLayout()
  const cardClass = theme === 'dark' ? 'bg-brand-slate/70 border-brand-steel text-white' : 'bg-white border-brand-mist text-brand-slate'

  return (
    <section className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${cardClass}`} data-theme={theme}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-steel data-[theme=dark]:text-brand-mist">{title}</p>
          {subtitle && <p className="text-sm text-brand-steel data-[theme=dark]:text-brand-mist">{subtitle}</p>}
        </div>
        {actions}
      </header>
      <div className="space-y-4 text-sm text-brand-steel data-[theme=dark]:text-brand-mist">{children}</div>
    </section>
  )
}

export function HomeOverviewSection() {
  const metrics = [
    { label: 'New leads this week', value: '18', change: '+14%' },
    { label: 'Inspections scheduled', value: '9', change: '+3' },
    { label: 'Avg. payout', value: '$240', change: 'On track' },
    { label: 'SLA score', value: '98%', change: 'Excellent' },
  ]

  const quickActions = [
    { label: 'Create briefing', href: '/tools/checklists' },
    { label: 'Log mileage', href: '/tools' },
    { label: 'Share availability', href: '/profile' },
    { label: 'Open firm directory', href: '/hiring-firms' },
  ]

  return (
    <DashboardSectionCard
      title="Home analytics"
      subtitle="Your latest performance pulse"
      actions={
        <Link className="rounded-lg bg-brand-copper px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-copperDark" href="/inspector-dashboard">
          View reports
        </Link>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-brand-mist bg-brand-sand px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-brand-steel data-[theme=dark]:text-brand-mist">{metric.label}</p>
            <p className="text-2xl font-semibold text-brand-slate data-[theme=dark]:text-white">{metric.value}</p>
            <p className="text-xs font-semibold text-brand-copper">{metric.change}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="rounded-full border border-brand-mist bg-white px-3 py-2 text-xs font-semibold text-brand-slate data-[theme=dark]:text-white transition hover:border-brand-copper hover:text-brand-copper"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </DashboardSectionCard>
  )
}

export function GettingPaidSection() {
  const payouts = [
    { id: 'NO-2418', amount: '$620.00', status: 'Processing', eta: 'Arrives Friday' },
    { id: 'NO-2417', amount: '$430.00', status: 'Paid', eta: 'Settled Tuesday' },
    { id: 'NO-2416', amount: '$355.00', status: 'Paid', eta: 'Settled Monday' },
  ]

  return (
    <DashboardSectionCard
      title="Getting paid"
      subtitle="Track earnings and payout status"
      actions={
        <Link href="/membership-pricing" className="text-xs font-semibold text-brand-copper hover:text-brand-copperDark">
          Update banking
        </Link>
      }
    >
      <ul className="space-y-3 text-sm">
        {payouts.map((payout) => (
          <li key={payout.id} className="rounded-xl border border-brand-mist bg-brand-sand px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-slate data-[theme=dark]:text-white">{payout.id}</p>
                <p className="text-xs text-brand-steel data-[theme=dark]:text-brand-mist">{payout.eta}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-brand-slate data-[theme=dark]:text-white">{payout.amount}</p>
                <span className="text-xs font-semibold text-brand-copper">{payout.status}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </DashboardSectionCard>
  )
}

const startOfWeek = (date = new Date()) => {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = copy.getDate() - day
  copy.setDate(diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const endOfWeek = (date = new Date()) => {
  const start = startOfWeek(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

// Terminal statuses = job is no longer active in the pipeline
const TERMINAL_STATUSES: MemberJobStatus[] = ['accepted', 'rejected', 'withdrawn']

export function JobTrackerSection() {
  const [loading, setLoading] = useState(true)
  const [activeJobs, setActiveJobs] = useState(0)
  const [offers, setOffers] = useState(0)
  const [addedThisWeek, setAddedThisWeek] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const now = new Date()
        const weekStart = startOfWeek(now)
        const weekEnd = endOfWeek(now)

        const res = await fetch('/api/member-jobs')
        const payload = await res.json().catch(() => ({}))

        if (!res.ok) {
          throw new Error(payload?.error || 'Unable to load job tracker stats')
        }

        const jobs: MemberJob[] = payload.jobs ?? []
        
        // Active = not in a terminal state
        setActiveJobs(jobs.filter((job) => !TERMINAL_STATUSES.includes(job.status)).length)
        setOffers(jobs.filter((job) => job.status === 'offer').length)
        setAddedThisWeek(
          jobs.filter((job) => {
            const createdAt = new Date(job.created_at)
            return createdAt >= weekStart && createdAt <= weekEnd
          }).length
        )
        setError(null)
      } catch (err) {
        console.error(err)
        setError('Unable to load job tracker stats right now.')
      } finally {
        setLoading(false)
      }
    }

    void loadStats()
  }, [])

  return (
    <DashboardSectionCard
      title="Job tracker"
      subtitle="Application pipeline overview"
      actions={
        <Link
          href="/inspector-dashboard/job-tracker"
          className="rounded-lg border border-brand-mist bg-white px-3 py-2 text-xs font-semibold text-brand-copper hover:border-brand-copper hover:text-brand-copperDark"
        >
          Open job tracker →
        </Link>
      }
    >
      {loading ? (
        <p className="text-sm text-brand-steel">Loading job stats…</p>
      ) : error ? (
        <p className="text-sm text-brand-steel">{error}</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-brand-mist bg-brand-sand px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-brand-steel">Active searches</p>
              <p className="text-xl font-semibold text-brand-slate">{activeJobs}</p>
            </div>
            <span className="text-xs font-semibold text-brand-copper">Open or in progress</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-brand-mist bg-brand-sand px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-brand-steel">Offers received</p>
              <p className="text-xl font-semibold text-brand-slate">{offers}</p>
            </div>
            <span className="text-xs font-semibold text-brand-copper">Pending decision</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-brand-mist bg-brand-sand px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-brand-steel">Added this week</p>
              <p className="text-xl font-semibold text-brand-slate">{addedThisWeek}</p>
            </div>
            <span className="text-xs font-semibold text-brand-copper">New opportunities</span>
          </div>
        </div>
      )}
    </DashboardSectionCard>
  )
}

export function AIConciergeSection() {
  return (
    <DashboardSectionCard
      title="AI concierge"
      subtitle="Ask anything about your business"
      actions={
        <Link href="/tools/ai-concierge" className="text-xs font-semibold text-brand-copper hover:text-brand-copperDark">
          Open chat
        </Link>
      }
    >
      <div className="rounded-xl border border-brand-mist bg-brand-sand p-4">
        <p className="mb-3 text-sm text-brand-slate data-[theme=dark]:text-white">Try asking:</p>
        <ul className="space-y-2 text-sm">
          <li className="rounded-lg bg-white px-3 py-2 text-brand-steel">"What inspections pay the most in my area?"</li>
          <li className="rounded-lg bg-white px-3 py-2 text-brand-steel">"Help me write a follow-up email to a firm"</li>
          <li className="rounded-lg bg-white px-3 py-2 text-brand-steel">"What certifications should I get next?"</li>
        </ul>
      </div>
    </DashboardSectionCard>
  )
}

export function TrainingProgressSection() {
  const courses = [
    { name: 'Property Preservation 101', progress: 100, status: 'Completed' },
    { name: 'Interior Inspection Mastery', progress: 65, status: 'In progress' },
    { name: 'Loss Draft Fundamentals', progress: 0, status: 'Not started' },
  ]

  return (
    <DashboardSectionCard
      title="Training progress"
      subtitle="Your certification journey"
      actions={
        <Link href="/training" className="text-xs font-semibold text-brand-copper hover:text-brand-copperDark">
          Browse courses
        </Link>
      }
    >
      <ul className="space-y-3">
        {courses.map((course) => (
          <li key={course.name} className="rounded-xl border border-brand-mist bg-brand-sand px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-brand-slate data-[theme=dark]:text-white">{course.name}</p>
              <span className="text-xs font-semibold text-brand-copper">{course.status}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-brand-mist">
              <div
                className="h-full bg-gradient-to-r from-brand-copper to-brand-teal transition-all"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </DashboardSectionCard>
  )
}

export function FirmDirectorySection() {
  const firms = [
    { name: 'National Field Representatives', type: 'Property Preservation', status: 'Hiring' },
    { name: 'Safeguard Properties', type: 'REO Services', status: 'Hiring' },
    { name: 'Mortgage Contracting Services', type: 'Inspections', status: 'Waitlist' },
  ]

  return (
    <DashboardSectionCard
      title="Firm directory"
      subtitle="Companies actively seeking vendors"
      actions={
        <Link href="/hiring-firms" className="text-xs font-semibold text-brand-copper hover:text-brand-copperDark">
          View all firms
        </Link>
      }
    >
      <ul className="space-y-2">
        {firms.map((firm) => (
          <li key={firm.name} className="flex items-center justify-between rounded-xl border border-brand-mist bg-brand-sand px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-brand-slate data-[theme=dark]:text-white">{firm.name}</p>
              <p className="text-xs text-brand-steel data-[theme=dark]:text-brand-mist">{firm.type}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-copper">{firm.status}</span>
          </li>
        ))}
      </ul>
    </DashboardSectionCard>
  )
}

export function IndustryNewsSection() {
  const articles = [
    { title: 'New HUD inspection guidelines released', source: 'HUD.gov', time: '2h ago' },
    { title: 'Storm season prep: what vendors need to know', source: 'Industry Weekly', time: '5h ago' },
    { title: 'Tech tools reshaping field services', source: 'PropTech Today', time: '1d ago' },
  ]

  return (
    <DashboardSectionCard
      title="Industry news"
      subtitle="Stay current on field services"
      actions={
        <Link href="/inspector-resource-center" className="text-xs font-semibold text-brand-copper hover:text-brand-copperDark">
          Read more
        </Link>
      }
    >
      <ul className="space-y-2">
        {articles.map((article) => (
          <li key={article.title} className="flex items-start justify-between gap-3 rounded-xl border border-brand-mist bg-brand-sand px-4 py-3">
            <div>
              <p className="font-semibold text-brand-slate data-[theme=dark]:text-white">{article.title}</p>
              <p className="text-xs text-brand-steel data-[theme=dark]:text-brand-mist">{article.source}</p>
            </div>
            <span className="text-xs font-semibold text-brand-copper">{article.time}</span>
          </li>
        ))}
      </ul>
    </DashboardSectionCard>
  )
}

export function InspectorGadgetShopSection() {
  const gear = [
    { name: 'Laser measurer kit', price: '$89', status: 'In stock' },
    { name: 'Safety vest + PPE bundle', price: '$64', status: 'Ships today' },
    { name: 'Water sensor set', price: '$120', status: 'Backorder: 2 days' },
  ]

  return (
    <DashboardSectionCard
      title="Inspector gadget shop"
      subtitle="Order the equipment clients expect"
      actions={
        <Link href="/tools" className="text-xs font-semibold text-brand-copper hover:text-brand-copperDark">
          View all gear
        </Link>
      }
    >
      <div className="space-y-3 text-sm">
        {gear.map((item) => (
          <div key={item.name} className="flex items-center justify-between rounded-xl border border-brand-mist bg-brand-sand px-4 py-3">
            <div>
              <p className="font-semibold text-brand-slate data-[theme=dark]:text-white">{item.name}</p>
              <p className="text-xs text-brand-steel data-[theme=dark]:text-brand-mist">{item.status}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-copper">{item.price}</span>
          </div>
        ))}
      </div>
    </DashboardSectionCard>
  )
}

export function JobBoardSection() {
  const filters = ['Remote friendly', 'CAT', 'Roof', 'Same-day', 'Fire']
  const savedJobs = [
    { title: '4-point inspection | Tampa, FL', payout: '$210', due: 'Within 24h', tags: ['Roof', 'Same-day'] },
    { title: 'Commercial walkthrough | Phoenix, AZ', payout: '$480', due: 'Schedule for Fri', tags: ['Remote friendly'] },
    { title: 'Storm scope | Mobile, AL', payout: '$360', due: 'Within 48h', tags: ['CAT', 'Roof'] },
  ]

  return (
    <DashboardSectionCard
      title="Job board"
      subtitle="Filter, pin, and claim inspection work"
      actions={
        <Link href="/jobs" className="text-xs font-semibold text-brand-copper hover:text-brand-copperDark">
          Open board
        </Link>
      }
    >
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className="rounded-full border border-brand-mist bg-white px-3 py-2 text-xs font-semibold text-brand-slate data-[theme=dark]:text-white transition hover:border-brand-copper hover:text-brand-copper"
          >
            {filter}
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {savedJobs.map((job) => (
          <li key={job.title} className="rounded-xl border border-brand-mist bg-brand-sand px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-brand-slate data-[theme=dark]:text-white">{job.title}</p>
                <p className="text-xs text-brand-steel data-[theme=dark]:text-brand-mist">{job.due}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {job.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-copper">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-sm font-semibold text-brand-slate data-[theme=dark]:text-white">{job.payout}</span>
            </div>
          </li>
        ))}
      </ul>
    </DashboardSectionCard>
  )
}

export function MarketingMaterialsSection() {
  const downloads = [
    { name: 'Capabilities one-pager', size: '1.2 MB', type: 'PDF' },
    { name: 'Sample inspection set', size: '3.4 MB', type: 'ZIP' },
    { name: 'Pitch deck slides', size: '5.1 MB', type: 'PPTX' },
  ]

  return (
    <DashboardSectionCard
      title="Marketing materials"
      subtitle="Download leave-behinds to send firms"
      actions={
        <Link href="/inspector-resource-center" className="text-xs font-semibold text-brand-copper hover:text-brand-copperDark">
          Browse library
        </Link>
      }
    >
      <ul className="space-y-2 text-sm">
        {downloads.map((asset) => (
          <li key={asset.name} className="flex items-center justify-between rounded-xl border border-brand-mist bg-brand-sand px-4 py-3">
            <div>
              <p className="font-semibold text-brand-slate data-[theme=dark]:text-white">{asset.name}</p>
              <p className="text-xs text-brand-steel data-[theme=dark]:text-brand-mist">{asset.type} • {asset.size}</p>
            </div>
            <button
              type="button"
              className="rounded-full border border-brand-mist bg-white px-3 py-1 text-xs font-semibold text-brand-slate data-[theme=dark]:text-white transition hover:border-brand-copper hover:text-brand-copper"
            >
              Download
            </button>
          </li>
        ))}
      </ul>
    </DashboardSectionCard>
  )
}

export function ResumeBuilderSection() {
  const steps = [
    { label: 'Upload latest certifications', status: 'Done' },
    { label: 'Add last 3 inspections', status: 'In progress' },
    { label: 'Publish PDF + share link', status: 'Not started' },
  ]

  return (
    <DashboardSectionCard
      title="Resume builder"
      subtitle="Keep a sharable portfolio ready"
      actions={
        <Link href="/profile" className="text-xs font-semibold text-brand-copper hover:text-brand-copperDark">
          Edit resume
        </Link>
      }
    >
      <div className="h-2 overflow-hidden rounded-full bg-brand-mist">
        <div className="h-full w-2/3 bg-gradient-to-r from-brand-copper to-brand-teal" />
      </div>
      <ul className="space-y-2 text-sm">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center justify-between rounded-xl border border-brand-mist bg-brand-sand px-4 py-2">
            <span className="font-semibold text-brand-slate data-[theme=dark]:text-white">{step.label}</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-copper">{step.status}</span>
          </li>
        ))}
      </ul>
    </DashboardSectionCard>
  )
}

export function CustomerCommsSection() {
  const messages = [
    { sender: 'Elm Street Adjusting', subject: 'Confirming Friday walkthrough', time: '12m ago', status: 'Reply needed' },
    { sender: 'Brightline Claims', subject: 'Upload roof photos', time: '1h ago', status: 'Waiting on you' },
    { sender: 'Coastal Mutual', subject: 'Thanks for the quick turn', time: 'Yesterday', status: 'Closed' },
  ]

  return (
    <DashboardSectionCard
      title="Customer comms"
      subtitle="Inbox for firms and carriers"
      actions={
        <Link href="/contact-us" className="text-xs font-semibold text-brand-copper hover:text-brand-copperDark">
          Open inbox
        </Link>
      }
    >
      <ul className="space-y-2 text-sm">
        {messages.map((message) => (
          <li key={message.subject} className="rounded-xl border border-brand-mist bg-brand-sand px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-brand-slate data-[theme=dark]:text-white">{message.sender}</p>
                <p className="text-xs text-brand-steel data-[theme=dark]:text-brand-mist">{message.subject}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-brand-steel data-[theme=dark]:text-brand-mist">{message.time}</p>
                <span className="mt-1 inline-block rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-brand-copper">{message.status}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </DashboardSectionCard>
  )
}
