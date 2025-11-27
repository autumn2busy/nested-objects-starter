'use client'

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
import { DashboardPageFrame } from './dashboard-page-frame'

export default function DashboardClientPage() {
  return (
    <DashboardPageFrame>
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
    </DashboardPageFrame>
  )
}
