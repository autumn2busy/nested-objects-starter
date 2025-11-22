import { Metadata } from 'next'

import DashboardClientPage from './dashboard-client'

export const metadata: Metadata = {
  title: 'Member dashboard | Nested Objects',
  description: 'Manage inspections, payouts, training, marketing assets, and communications from a single dashboard.',
  openGraph: {
    title: 'Nested Objects member dashboard',
    description: 'Track analytics, training progress, job opportunities, and client communications in one workspace.',
    url: 'https://nestedobjects.com/dashboard',
  },
}

export default function DashboardPage() {
  return <DashboardClientPage />
}
