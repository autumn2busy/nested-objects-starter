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
    title: 'Route-aware forecasts',
    description: 'Check weather by city, zip, or coordinates to plan drive time and on-site work.',
  },
  {
    title: 'Safety signals',
    description: 'Flag days that are risky for roof shots, ladders, or long rural drives.',
  },
  {
    title: 'Daylight planning',
    description: 'Track sunrise, sunset, and golden hour so photos and drone shots stay sharp.',
  },
  {
    title: 'Routing handoff',
    description: 'Reorder stops around storms once the routing tool is live.',
  },
]

export default function WeatherToolPage() {
  return (
    <ToolLayout
      title="Field inspection weather tool"
      description="Check weather along your routes so you can plan drive time, ladder work, and photo quality."
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
        feature="weather_tool"
        loadingFallback={<ToolAccessMessage title="Loading access" description="Checking your account..." loading />}
        fallback={
          <ToolAccessMessage
            title="Authentication required"
            description="Log in or upgrade to preview route-aware weather and safety guidance."
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
                <h3 className="text-xl font-semibold text-brand-dark">Weather view roadmap</h3>
              </div>
              <span className="rounded-full bg-brand-copper/10 px-3 py-1 text-xs font-semibold text-brand-copper">Phase 1</span>
            </div>
            <p className="text-sm text-slate-700">
              This page is in place for SEO and navigation. The first launch will show forecasts for each stop, highlight
              ladder and drone risks, and keep sunrise and sunset visible while you plan routes.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-brand-mist/50 p-4">
                <h4 className="text-sm font-semibold text-brand-dark">Launch checklist</h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  <li>• Search weather by city, zip, or coordinates.</li>
                  <li>• Flags for wind, lightning, and heavy rain.</li>
                  <li>• Sunrise and sunset times per stop.</li>
                </ul>
              </div>
              <div className="rounded-xl bg-brand-mist/50 p-4">
                <h4 className="text-sm font-semibold text-brand-dark">Next iterations</h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  <li>• Auto-adjust routing based on weather windows.</li>
                  <li>• Save favorite locations and notification rules.</li>
                  <li>• Show photo quality windows for drone and ladder work.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-brand-copper/25 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-brand-dark">Data to gather now</h3>
            <div className="space-y-3 text-sm text-slate-700">
              <p className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
                Typical ladder heights and when you pivot to drone photos based on wind speed.
              </p>
              <p className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
                Cities or counties where you need daylight-only photos versus interior shots that can flex.
              </p>
              <p className="rounded-xl border border-brand-copper/15 bg-brand-mist/60 px-4 py-3">
                Safety thresholds from your vendors so alerts can match their rules.
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
