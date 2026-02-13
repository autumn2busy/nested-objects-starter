'use client'

import { useState } from 'react'

import Link from 'next/link'

import { useDashboardLayout } from './inspector-dashboard-layout-context'
import { AvatarUpload } from '@/components/profile/AvatarUpload'

interface DashboardTopBarProps {
  firstName: string
  planName: string
  onLogout: () => void
}

export function DashboardTopBar({ firstName, planName, onLogout }: DashboardTopBarProps) {
  const { isSidebarCollapsed, toggleSidebar, theme, toggleTheme } = useDashboardLayout()
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3 border-b border-brand-mist/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6" data-theme={theme}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-mist bg-white/60 text-brand-slate shadow-sm transition hover:border-brand-copper hover:text-brand-copper"
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <SidebarIcon collapsed={isSidebarCollapsed} />
        </button>
        <Link href="/" className="flex items-center gap-2 rounded-xl bg-brand-sand px-3 py-2 text-sm font-semibold text-brand-slate transition hover:bg-brand-mist/40">
          <LogoIcon />
          <span>Nested Objects</span>
        </Link>
        <span className="hidden rounded-full bg-brand-copper/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-copper sm:inline">
          {planName} plan
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setIsNotificationOpen((prev) => !prev)}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-brand-mist bg-white/70 text-brand-slate shadow-sm transition hover:border-brand-copper hover:text-brand-copper"
          aria-haspopup="true"
          aria-expanded={isNotificationOpen}
          aria-label="Notifications"
        >
          <BellIcon />
          <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-copper text-[10px] font-bold text-white">
            3
          </span>
          {isNotificationOpen && <NotificationDropdown onClose={() => setIsNotificationOpen(false)} />}
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 rounded-xl border border-brand-mist bg-white/70 px-3 py-2 text-sm font-semibold text-brand-slate shadow-sm transition hover:border-brand-copper hover:text-brand-copper"
        >
          {theme === 'light' ? <SunIcon /> : <MoonIcon />}
          <span className="hidden sm:inline">{theme === 'light' ? 'Light' : 'Dark'} theme</span>
        </button>

        <div className="flex items-center gap-3 rounded-xl border border-brand-mist bg-white/70 px-3 py-2 shadow-sm">
          <AvatarUpload />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-brand-slate">{firstName}</p>
            <p className="text-xs text-brand-steel">{planName} member</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg bg-brand-copper px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const notifications = [
    { id: 1, title: 'Inspection briefing ready', time: '2m ago' },
    { id: 2, title: 'New firm saved your profile', time: '12m ago' },
    { id: 3, title: 'Billing reminder: upload W-9', time: '1h ago' },
  ]

  return (
    <div className="absolute right-0 top-12 w-64 rounded-xl border border-brand-mist bg-white p-3 text-left text-brand-slate shadow-lg">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-brand-steel">
        <span>Notifications</span>
        <button onClick={onClose} className="text-brand-copper transition hover:text-brand-copperDark" type="button">
          Close
        </button>
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {notifications.map((notification) => (
          <li key={notification.id} className="rounded-lg bg-brand-sand px-3 py-2">
            <p className="font-semibold text-brand-slate">{notification.title}</p>
            <p className="text-xs text-brand-steel">{notification.time}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SidebarIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M4 5h16M4 12h10M4 19h8" strokeLinecap="round" />
      {collapsed ? <path d="M15 12l4-4v8z" fill="currentColor" /> : <path d="M16 8l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

function BellIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M15 17H9a3 3 0 0 1-3-3v-2a6 6 0 1 1 12 0v2a3 3 0 0 1-3 3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.66-7.66-1.42 1.42M7.76 16.24l-1.42 1.42m0-12.08 1.42 1.42m9.9 9.9 1.42 1.42" strokeLinecap="round" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LogoIcon() {
  return (
    <svg aria-hidden className="h-5 w-5 text-brand-copper" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3 4 8.5V18l8 4 8-4V8.5L12 3Zm0 2.18 6 3.6v7.12l-6 3-6-3V8.78l6-3.6Z" />
      <path d="M12 7 8 9.4v5.2L12 17l4-2.4V9.4L12 7Z" />
    </svg>
  )
}
