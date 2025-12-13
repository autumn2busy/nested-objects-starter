import { Metadata } from 'next'

import DashboardClientPage from './dashboard-client'

export const metadata: Metadata = {
  title: 'Member dashboard | Nested Objects',
  description:
    'Personalized dashboard with plan badges, billing controls, activity, and training—all powered by Outseta.',
  openGraph: {
    title: 'Nested Objects member dashboard',
    description: 'Track analytics, training progress, job opportunities, and client communications in one workspace.',
    url: 'https://nestedobjects.com/dashboard',
  },
}

export default function DashboardPage() {
  return <DashboardClientPage />
}
