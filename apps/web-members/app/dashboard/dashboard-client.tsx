'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/auth-provider'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { DashboardTopBar } from '@/components/dashboard/dashboard-top-bar'
import {
  BlogManagementSection,
  CustomerCommsSection,
  GettingPaidSection,
  HomeOverviewSection,
  InspectorGadgetShopSection,
  InspectorNewsSection,
  JobBoardSection,
  JobTrackerSection,
  MarketingMaterialsSection,
  OnlineTrainingSection,
  ResumeBuilderSection,
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
      return 'Member'
  }
}

export default function DashboardClientPage() {
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
  const firstName =
    profileDisplayName ??
    (user as any)?.first_name ??
    (user as any)?.FirstName ??
    (user?.name ? user.name.split(' ')[0] : undefined) ??
    (user?.email ? user.email.split('@')[0] : undefined) ??
    'Member'

  return (
    <DashboardShell sidebar={<DashboardSidebar />} topBar={<DashboardTopBar firstName={firstName} planName={planName} onLogout={logout} />}>
      <div className="space-y-6">
        <HomeOverviewSection />
        <div className="grid gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            <OnlineTrainingSection />
            <JobBoardSection />
            <CustomerCommsSection />
          </div>
          <div className="space-y-6 xl:col-span-4">
            <GettingPaidSection />
            <JobTrackerSection />
            <BlogManagementSection />
            <InspectorNewsSection />
            <InspectorGadgetShopSection />
            <MarketingMaterialsSection />
            <ResumeBuilderSection />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
