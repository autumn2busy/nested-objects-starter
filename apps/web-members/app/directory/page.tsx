import { Metadata } from 'next'

import { DirectoryClientPage } from './directory-client'

export const metadata: Metadata = {
  title: 'Directory | Nested Objects Membership',
  description: 'Discover vetted firms, notaries, and partners with plan-aware filters and Outseta personalization.',
  alternates: { canonical: 'https://nestedobjects.com/directory' },
  openGraph: {
    title: 'Nested Objects Directory',
    description: 'Search firms by interest, territory, and plan with optimistic loading states.',
    url: 'https://nestedobjects.com/directory',
  },
}

export default function DirectoryPage() {
  return <DirectoryClientPage />
}
