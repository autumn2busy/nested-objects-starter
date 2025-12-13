import { Metadata } from 'next'

import { HomeClientPage } from './home-client'

export const metadata: Metadata = {
  title: 'Nested Objects Membership | Directory, Dashboard, Partners',
  description:
    'Modern membership hub for inspectors, notaries, and real estate vendors. Explore the directory, manage billing, and access training.',
  alternates: { canonical: 'https://nestedobjects.com/' },
  openGraph: {
    title: 'Nested Objects Membership',
    description: 'Enterprise-grade membership hub with directory, dashboard, partners, tools, and training.',
    url: 'https://nestedobjects.com/',
  },
}

export default function HomePage() {
  return <HomeClientPage />
}
