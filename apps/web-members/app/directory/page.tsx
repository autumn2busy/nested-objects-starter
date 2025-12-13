import type { Metadata } from 'next'

import DirectoryClient from './directory-client'

export const metadata: Metadata = {
  title: 'Member directory | Nested Objects',
  description:
    'Discover verified members, firms, and partners. Filter by plan, location, tools, and interest areas with Outseta-aware gating.',
  alternates: {
    canonical: '/directory',
  },
  openGraph: {
    title: 'Nested Objects directory',
    description: 'Search the membership directory with structured data for people and organizations.',
    url: 'https://nestedobjects.com/directory',
  },
}

export default function DirectoryPage() {
  return <DirectoryClient />
}
