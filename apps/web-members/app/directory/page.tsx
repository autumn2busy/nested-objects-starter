import { DirectoryView, type Firm } from './DirectoryView'
import { generatePageMetadata, SITE_URL } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generatePageMetadata({
  title: 'Firm Directory | Hiring Inspectors & Notaries',
  description: 'Verified directory of companies hiring field inspectors, mobile notaries, and property preservation contractors. Filter by state and service type.',
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
        'rating',
        'rating_count',
        'verified_at',
        'phone',
        'email',
        'is_published',
        'address',
        'latitude',
        'longitude',
      ].join(',') +
      '&is_published=eq.true' +
      '&order=name.asc'

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 3600 }, // Revalidate every hour
    })

    if (!res.ok) throw new Error('Failed to fetch firms')

    return res.json()
  } catch (err) {
    console.error('Error fetching firms', err)
    return []
  }
}

export default async function DirectoryPage() {
  const firms = await getFirms()

  // Generate ItemList schema for SEO
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Directory of Field Inspection Firms',
    description: 'Live, AI-verified database of firms hiring field inspectors, notaries, and realtors.',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: firms.map((firm, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Organization',
          name: firm.name,
          url: `${SITE_URL}/firms/${firm.slug ?? firm.id}`,
          image: firm.logo_url,
          areaServed: firm.geographic_coverage
        }
      }))
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <DirectoryView initialFirms={firms} />
    </>
  )
}
