import type { Metadata } from 'next'
import { redirectToOwnProfile } from '@/lib/member-profile-access'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'My Profile | Nested Objects',
  description: 'Your private professional profile.',
  robots: { index: false, follow: false, noarchive: true },
}

export default async function MembersDirectoryPage() {
  // No member-list fetch or serialization in the inspector-first release.
  return redirectToOwnProfile()
}
