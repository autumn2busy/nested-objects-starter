'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/auth-provider'
import { DashboardBreadcrumbs } from '@/components/dashboard/dashboard-breadcrumbs'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import {
  AccountOverviewCard,
  ChecklistCard,
  ProfileCompletionCard,
  RecentActivityCard,
  ShortcutsCard,
  WelcomeSection,
} from '@/components/dashboard/sections'

function getPlanName(uid: string | null): string {
  switch (uid) {
    case 'L9nbKV9Z':
      return 'Starter'
    case 'rQVqlLm6':
      return 'Pro'
    case 'NmdnNO90':
      return 'Elite'
    case 'rmk5Xk9g':
      return 'Agency'
    default:
      return 'Unknown'
  }
}

export default function DashboardPage() {
  const { user, planUid, profileDisplayName, isLoading, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, router])

  const planName = getPlanName(planUid ?? null)

  const firstName =
    profileDisplayName ??
    (user as any)?.first_name ??
    (user as any)?.FirstName ??
    (user?.name ? user.name.split(' ')[0] : undefined) ??
    (user?.email ? user.email.split('@')[0] : undefined) ??
    'Member'

  const initials = firstName.charAt(0).toUpperCase()

  if (isLoading || !isAuthenticated || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-sand text-brand-slate">
        <p className="text-sm font-medium">Loading your dashboard…</p>
      </main>
    )
  }

  return (
    <DashboardShell
      sidebar={<DashboardSidebar />}
      header={<DashboardHeader firstName={firstName} initials={initials} onLogout={logout} planName={planName} />}
    >
      <div className="space-y-6">
        <DashboardBreadcrumbs />
        <WelcomeSection firstName={firstName} />
        <ProfileCompletionCard />
        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <AccountOverviewCard planName={planName} />
          <ChecklistCard />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <RecentActivityCard />
          <ShortcutsCard />
        </div>
        <div className="rounded-2xl border border-brand-mist bg-brand-sand px-4 py-3 text-sm text-brand-steel shadow-inner">
          Need something else?{' '}
          <Link className="font-semibold text-brand-copper hover:text-brand-copperDark" href="/tools/ai-chatbot">
            Ask the Nested Objects assistant
          </Link>{' '}
          for help.
        </div>
      </div>
    </DashboardShell>
  )
}
