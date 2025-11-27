'use client'

import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'

import { useDashboardLayout } from './dashboard-layout-context'
import type { MemberJob } from '@/types/member-jobs'

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
    { label: 'Open firm directory', href: '/directory' },
  ]

  return (
    <DashboardSectionCard
      title="Home analytics"
      subtitle="Your latest performance pulse"
      actions={
        <Link className="rounded-lg bg-brand-copper px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-copperDark" href="/dashboard">
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
        <Link href="/membership" className="text-xs font-semibold text-brand-copper hover:text-brand-copperDark">
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

export function JobTrackerSection() {
  const [loading, setLoading] = useState(true)
  const [activeJobs, setActiveJobs] = useState(0)
  const [offers, setOffers] = useState(0)
  const [addedThisWeek, setAddedThisWeek] = useState(0)
  const [error, setError] = useState<string | null>(null)

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
        setActiveJobs(jobs.filter((job) => job.status !== 'closed').length)
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
          href="/dashboard/job-tracker"
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
          <div className="flex items-center justify-between rounded-xl border border-brand-mist bg-white px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-brand-steel">Offers</p>
              <p className="text-xl font-semibold text-brand-slate">{offers}</p>
            </div>
            <span className="text-xs text-brand-steel">Refreshed on load</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-brand-mist bg-white px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-brand-steel">Added this week</p>
              <p className="text-xl font-semibold text-brand-slate">{addedThisWeek}</p>
            </div>
            <span className="text-xs text-brand-steel">Newly saved roles</span>
          </div>
        </div>
      )}
    </DashboardSectionCard>
  )
}

export function OnlineTrainingSection() {
  const tabs = ['Essentials', 'Safety', 'Tech'] as const
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Essentials')

  const lessons: Record<(typeof tabs)[number], { title: string; duration: string; status: 'In progress' | 'Not started' | 'Complete' }[]> = {
    Essentials: [
      { title: 'Scoping a residential inspection', duration: '18 min', status: 'In progress' },
      { title: 'Writing a crisp summary', duration: '11 min', status: 'Complete' },
      { title: 'Client-ready photos', duration: '9 min', status: 'Not started' },
    ],
    Safety: [
      { title: 'PPE checklist for every visit', duration: '8 min', status: 'In progress' },
      { title: 'Weather playbooks', duration: '12 min', status: 'Not started' },
      { title: 'Equipment care', duration: '7 min', status: 'Not started' },
    ],
    Tech: [
      { title: 'Field app tour', duration: '15 min', status: 'In progress' },
      { title: 'Photo automation', duration: '10 min', status: 'Complete' },
      { title: 'Upload speeds playbook', duration: '6 min', status: 'Not started' },
    ],
  }

  return (
    <DashboardSectionCard
      title="Online training"
      subtitle="Pick a lane and finish your next certification"
      actions={
        <Link href="/training" className="text-xs font-semibold text-brand-copper hover:text-brand-copperDark">
          Open training library
        </Link>
      }
    >
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${activeTab === tab ? 'bg-brand-copper text-white' : 'border border-brand-mist bg-white text-brand-slate data-[theme=dark]:text-white hover:border-brand-copper hover:text-brand-copper'}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {lessons[activeTab].map((lesson) => (
          <li key={lesson.title} className="flex items-center justify-between rounded-xl border border-brand-mist bg-brand-sand px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-brand-slate data-[theme=dark]:text-white">{lesson.title}</p>
              <p className="text-xs text-brand-steel data-[theme=dark]:text-brand-mist">{lesson.duration}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-copper">{lesson.status}</span>
          </li>
        ))}
      </ul>
    </DashboardSectionCard>
  )
}

export function BlogManagementSection() {
  const posts = [
    { title: 'How to prep for same-day inspections', status: 'Draft', updated: 'Today' },
    { title: 'Weekly recap: client wins', status: 'Scheduled', updated: 'Tomorrow 8:00am' },
    { title: 'Photo kit we use on site', status: 'Published', updated: 'Oct 18' },
  ]

  return (
    <DashboardSectionCard
      title="Blog management"
      subtitle="Ship updates and resources to prospects"
      actions={
        <Link href="/blog" className="text-xs font-semibold text-brand-copper hover:text-brand-copperDark">
          New post
        </Link>
      }
    >
      <ul className="space-y-2 text-sm">
        {posts.map((post) => (
          <li key={post.title} className="rounded-xl border border-brand-mist bg-brand-sand px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-slate data-[theme=dark]:text-white">{post.title}</p>
                <p className="text-xs text-brand-steel data-[theme=dark]:text-brand-mist">Updated {post.updated}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-copper">{post.status}</span>
            </div>
          </li>
        ))}
      </ul>
    </DashboardSectionCard>
  )
}

export function InspectorNewsSection() {
  const articles = [
    { title: 'Carriers raise CAT response rates', source: 'FieldWire', time: '1h ago' },
    { title: 'Thermal imaging now preferred in 3 states', source: 'Claims Journal', time: '3h ago' },
    { title: 'Storm track: Gulf watchlist', source: 'NO Desk', time: '6h ago' },
  ]

  return (
    <DashboardSectionCard
      title="Inspector news feed"
      subtitle="Stay briefed without leaving your queue"
      actions={
        <Link href="/resources" className="text-xs font-semibold text-brand-copper hover:text-brand-copperDark">
          All intel
        </Link>
      }
    >
      <ul className="space-y-3 text-sm">
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
        <Link href="/resources" className="text-xs font-semibold text-brand-copper hover:text-brand-copperDark">
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
        <Link href="/contact" className="text-xs font-semibold text-brand-copper hover:text-brand-copperDark">
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
