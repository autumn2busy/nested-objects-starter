import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/seo'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { ALL_STATE_SLUGS } from './hiring-firms/state-data'

type SlugRow = {
  slug: string | null
}

type MemberRow = {
  id: string | null
}

// Static role slugs — these pages exist as static routes, no DB table needed
const STATIC_ROLE_SLUGS = [
  'asset-preservation',
  'gig-pro-inspector',
  'gig-worker',
  'inspector',
  'insurance-loss-control',
  'mobile-notary',
  'mortgage-field-inspector',
  'notary',
  'realtor',
]

async function fetchDynamicSlugs() {
  try {
    const supabase = createServiceRoleClient()
    const [firmsResult, membersResult] = await Promise.all([
      supabase.from('firms').select('slug').eq('is_published', true),
      supabase.from('profiles').select('id').eq('is_published', true),
    ])

    if (firmsResult.error) {
      console.error('Error fetching firm slugs for sitemap', firmsResult.error)
    }
    if (membersResult.error) {
      console.error('Error fetching member IDs for sitemap', membersResult.error)
    }

    return {
      firms: (firmsResult.data as SlugRow[] | null)?.map((firm) => firm.slug).filter(Boolean) ?? [],
      members: (membersResult.data as MemberRow[] | null)?.map((member) => member.id).filter(Boolean) ?? [],
      roles: STATIC_ROLE_SLUGS,
    }
  } catch (error) {
    console.error('Error loading dynamic sitemap slugs', error)
    return { firms: [], members: [], roles: [] }
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const { firms, members, roles } = await fetchDynamicSlugs()

  const firmEntries = firms.map((slug) => ({
    url: `${SITE_URL}/firms/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const memberEntries = members.map((memberId) => ({
    url: `${SITE_URL}/members/${memberId}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  const roleEntries = roles.map((slug) => ({
    url: `${SITE_URL}/roles/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Static tool slugs — public tool pages
  const STATIC_TOOL_SLUGS = [
    'income-calculator',
    'ai-resume',
    'ai-concierge',
    'weather',
    'routing',
    'job-tracker',
    'job-tracking',
    'clients',
    'companies',
  ]

  const toolEntries = STATIC_TOOL_SLUGS.map((slug) => ({
    url: `${SITE_URL}/tools/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const stateEntries = ALL_STATE_SLUGS.map((slug) => ({
    url: `${SITE_URL}/hiring-firms/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    // --- Core pages ---
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/hiring-firms`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/membership-pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/tools`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/jobs`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/guides`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/guides/how-to-become-a-field-inspector`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/guides/field-inspection-vs-home-inspection`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/challenges`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },

    // --- Informational / trust pages ---
    {
      url: `${SITE_URL}/about-us`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact-us`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/faqs`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/inspector-resource-center`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },

    // --- Legal pages ---
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/terms-conditions`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/refund-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },

    // --- Dynamic entries ---
    ...firmEntries,
    ...memberEntries,
    ...roleEntries,
    ...toolEntries,
    ...stateEntries,
  ]
}
