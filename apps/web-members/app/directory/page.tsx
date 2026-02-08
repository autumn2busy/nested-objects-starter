import type { Metadata } from 'next'
import { DirectoryView, type Firm } from './DirectoryView'
import { generatePageMetadata } from '@/lib/seo'
import { getCurrentUser, PLAN_UIDS } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-admin'

export const metadata: Metadata = generatePageMetadata({
  title: 'Firm Directory | Field Inspection & Notary Vendors',
  description: 'Browse verified firms hiring field inspectors, notaries, and appraisal professionals across the US.',
  path: '/directory',
})

// Use Service Role to bypass RLS for preview, then sanitize manually
const getFirms = async (): Promise<Firm[]> => {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('firms')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching firms', error)
    return []
  }

  // Cast to Firm[] - we trust the DB shape matches roughly or we should validate
  return (data || []) as unknown as Firm[]
}

export default async function DirectoryPage() {
  const user = await getCurrentUser()
  const planUid = user?.['outseta:planUid']

  // Determine if full access. 
  // Allow all except Guest and Starter (L9nbKV9Z).
  const isStarter = planUid === PLAN_UIDS.STARTER
  const isGuest = !user
  const isRestricted = isGuest || isStarter

  let firms = await getFirms()

  if (isRestricted) {
    // 1. Limit to 5 items
    firms = firms.slice(0, 5)

    // 2. MASK SENSITIVE DATA
    firms = firms.map(firm => ({
      ...firm,
      email: null,
      phone: null,
      address: null,
      vendor_page_url: null,
      url: null,
    }))
  }

  return <DirectoryView initialFirms={firms} />
}
