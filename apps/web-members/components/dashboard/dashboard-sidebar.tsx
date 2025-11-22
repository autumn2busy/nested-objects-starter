'use client'

import Link from 'next/link'

import { useDashboardLayout } from './dashboard-layout-context'

const navigation = [
  { href: '/dashboard', label: 'Home', icon: HomeIcon },
  { href: '/dashboard/getting-paid', label: 'Getting paid', icon: WalletIcon },
  { href: '/training', label: 'Training', icon: GraduationIcon },
  { href: '/blog', label: 'Blog', icon: PencilIcon },
  { href: '/resources', label: 'Resources', icon: LibraryIcon },
  { href: '/jobs', label: 'Job board', icon: BriefcaseIcon },
  { href: '/tools', label: 'Tools', icon: SparkIcon },
  { href: '/profile', label: 'Profile', icon: UserIcon },
]

export function DashboardSidebar() {
  const { isSidebarCollapsed, theme } = useDashboardLayout()

  return (
    <div className="flex h-full flex-col" data-theme={theme}>
      <div className="flex items-center gap-3 border-b border-brand-mist px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-copper text-base font-semibold text-white">
          NO
        </div>
        {!isSidebarCollapsed && (
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-brand-steel data-[theme=dark]:text-brand-mist">Workspace</p>
            <p className="text-base font-semibold text-brand-slate data-[theme=dark]:text-white">Inspector HQ</p>
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 text-sm font-semibold text-brand-steel data-[theme=dark]:text-brand-mist">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-brand-sand hover:text-brand-slate"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-sand text-brand-slate data-[theme=dark]:text-white">
                <Icon />
              </span>
              {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-brand-mist px-4 py-3 text-xs text-brand-steel data-[theme=dark]:text-brand-mist">
        {!isSidebarCollapsed ? 'Stay ready with curated tools and intel.' : 'Ready'}
      </div>
    </div>
  )
}

function HomeIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M20 8H5a2 2 0 0 0-2 2v5a3 3 0 0 0 3 3h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 12h-1" strokeLinecap="round" />
    </svg>
  )
}

function GraduationIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="m3 8 9-5 9 5-9 5-9-5Zm0 4 9 5 9-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12v4.5" strokeLinecap="round" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M4 20h4l10-10a2.828 2.828 0 0 0-4-4L4 16v4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m14 6 4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LibraryIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M4 19V6a1 1 0 0 1 1-1h2m3 14V6a1 1 0 0 0-1-1H7m7 14V6a1 1 0 0 1 1-1h2m3 14V7a1 1 0 0 0-1-1h-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BriefcaseIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" strokeLinecap="round" />
      <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Zm9 3h9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M12 2v4m0 12v4M4 12h4m8 0h4M7 7l2 2m6 6 2 2m0-10-2 2m-6 6-2 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 7a7 7 0 0 1 14 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
