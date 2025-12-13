import { Metadata } from 'next'

import ProfileClient from './profile-client'

export const metadata: Metadata = {
  title: 'Member profile | Nested Objects',
  description:
    'Control center for your Nested Objects membership: edit your profile, manage billing, security, and directory presence.',
  openGraph: {
    title: 'Profile | Nested Objects member control center',
    description:
      'Update your inspector story, billing, and security preferences from a unified, SEO-friendly profile hub.',
    url: 'https://nestedobjects.com/profile',
  },
  alternates: {
    canonical: 'https://nestedobjects.com/profile',
  },
}

export default function ProfilePage() {
  return <ProfileClient />
}
