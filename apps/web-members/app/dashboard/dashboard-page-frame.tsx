'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/auth-provider'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { DashboardTopBar } from '@/components/dashboard/dashboard-top-bar'

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
      return 'Member'
  }
}

function getFirstName(
  profileDisplayName: string | null | undefined,
  user: ReturnType<typeof useAuth>['user'],
): string {
  return (
    profileDisplayName ??
    (user as any)?.first_name ??
    (user as any)?.FirstName ??
    (user?.name ? user.name.split(' ')[0] : undefined) ??
    (user?.email ? user.email.split('@')[0] : undefined) ??
    'Member'
  )
}

interface DashboardPageFrameProps {
  children: ReactNode
}

export function DashboardPageFrame({ children }: DashboardPageFrameProps) {
  const { user, planUid, profileDisplayName, isLoading, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-sand text-brand-slate">
        <p className="text-sm font-medium">Loading your dashboard…</p>
      </main>
    )
  }

  const planName = getPlanName(planUid ?? null)
  const firstName = getFirstName(profileDisplayName, user)

  return (
    <DashboardShell sidebar={<DashboardSidebar />} topBar={<DashboardTopBar firstName={firstName} planName={planName} onLogout={logout} />}>
      {children}
    </DashboardShell>
  )
}

