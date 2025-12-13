import type { Metadata } from 'next'

import HomeClientPage from './home-client'

export const metadata: Metadata = {
  title: 'Nested Objects | Membership built on Outseta',
  description:
    'Modern membership powered by Outseta with directory access, dashboard insights, partner offers, and AI tools for inspectors and operators.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Nested Objects membership',
    description:
      'Join a trusted membership with a transparent firm directory, actionable dashboard, and Outseta-powered billing.',
    url: 'https://nestedobjects.com/',
  },
}

export default function HomePage() {
  return <HomeClientPage />
}
