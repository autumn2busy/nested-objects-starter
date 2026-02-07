import type { Metadata } from 'next'
import { DirectoryView, type Firm } from './DirectoryView'
import { generatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = generatePageMetadata({
  title: 'Firm Directory | Field Inspection & Notary Vendors',
  description: 'Browse verified firms hiring field inspectors, notaries, and appraisal professionals across the US.',
  path: '/directory',
})

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function getFirms(): Promise<Firm[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []

  try {
    const url =
      `${SUPABASE_URL}/rest/v1/firms` +
      '?select=' +
      [
        'id',
        'slug',
        'name',
        'url',
        'vendor_page_url',
        'logo_url',
        'geographic_coverage',
        'categories',
        'pay_min',
        'pay_max',
        'pay_type',
        'company_size',
        'industry_focus',
        'is_published',
        'rating',
        'rating_count',
        'verified_at',
        'phone',
        'email',
        'address',
        'latitude',
        'longitude',
      ].join(',') +
      '&is_published=eq.true' +
      '&order=created_at.desc'

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 300 },
    })

    if (!res.ok) throw new Error('Failed to fetch firms')

    return (await res.json()) as Firm[]
  } catch (error) {
    console.error('Error fetching firms', error)
    return []
  }
}

import { getCurrentUser, PLAN_UIDS } from '@/lib/auth-server'

export default async function DirectoryPage() {
  const user = await getCurrentUser()
  const planUid = user?.['outseta:planUid']

  // Determine if full access. 
  // Allow all except Guest and Starter (L9nbKV9Z).
  // Starter ID L9nbKV9Z comes from auth-server.ts or plan-config.
  const isStarter = planUid === PLAN_UIDS.STARTER
  const isGuest = !user
  const isRestricted = isGuest || isStarter

  let firms = await getFirms()

  if (isRestricted) {
    firms = firms.slice(0, 5)
  }

  return <DirectoryView initialFirms={firms} />
}
