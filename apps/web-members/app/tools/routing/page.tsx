'use client'

import Link from 'next/link'
import { Gate } from '@/components/Gate'
import { ToolAccessMessage, UpgradeActions } from '../_components/ToolAccessMessage'
import { ToolLayout } from '../_components/ToolLayout'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/directory', label: 'Directory' },
  { href: '/membership', label: 'Membership' },
]

const highlights = [
  {
    title: 'Organize stops fast',
    description: 'Start with simple stop lists by date, city, and vendor so you can keep moving.',
  },
  {
    title: 'Map-aware insights',
    description: 'See travel time and distance alongside pay so you can prioritize profitable routes.',
  },
  {
    title: 'Weather signals',
    description: 'Plan around storms and daylight with weather flags built into your stops.',
  },
  {
    title: 'Export-ready',
    description: 'Send routes to your preferred maps app or navigation tool without retyping addresses.',
  },
]

export default function RoutingToolPage() {
  return (
    <ToolLayout
      title="Route planning and optimization"
      description="Stack your inspections into efficient routes so you burn less gas and make more per mile."
      navLinks={navLinks}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {highlights.map((item) => (
          <div key={item.title} className="rounded-2xl border border-brand-copper/25 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-brand-dark">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-700">{item.description}</p>
          </div>
        ))}
      </div>

      <Gate
        feature="job_routing"
        loadingFallback={<ToolAccessMessage title="Loading access" description="Checking your account..." loading />}
        fallback={
          <ToolAccessMessage
            title="Authentication required"
            description="Log in or upgrade to start planning routes inside Nested Objects."
            tone="warning"
            actions={<UpgradeActions />}
          />
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <section className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-copper">Placeholder workspace</p>
                <h3 className="text-xl font-semibold text-brand-dark">Routing roadmap</h3>
              </div>
              <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-xs font-semibold text-brand-copper">Phase 1</span>
            </div>
            <p className="text-sm text-slate-700">
              This page is ready for SEO and navigation. The first release will let you build stop lists with vendor, address,
              and promised times, plus quick exports to your map of choice.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-brand-mist/50 p-4">
                <h4 className="text-sm font-semibold text-brand-dark">Launch checklist</h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  <li>• Add stops with address, due date, and vendor.</li>
                  <li>• See travel estimates and total drive time.</li>
                  <li>• Export to Apple, Google, or Waze navigation.</li>
                </ul>
              </div>
              <div className="rounded-xl bg-brand-mist/50 p-4">
                <h4 className="text-sm font-semibold text-brand-dark">Next iterations</h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  <li>• Merge with job tracking to prevent missed visits.</li>
                  <li>• Auto-assign route order based on pay and distance.</li>
                  <li>• Weather-aware reordering with daylight indicators.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-brand-dark">Data to collect now</h3>
            <div className="space-y-3 text-sm text-slate-700">
              <p className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
                Addresses you visit often plus notes about gate codes, parking, or safety rules.
              </p>
              <p className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
                Typical time-on-site for each work type and which stops you prefer to cluster.
              </p>
              <p className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
                Vendors that allow flexible timing versus strict appointment windows.
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
