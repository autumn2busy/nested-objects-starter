import fs from 'fs'
import path from 'path'
import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/seo'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { ALL_STATE_SLUGS } from './hiring-firms/state-data'

type FirmRow = {
  slug: string | null
  updated_at: string | null
}

type MemberRow = {
  id: string | null
  updated_at: string | null
}

const APP_DIR = path.join(process.cwd(), 'apps', 'web-members', 'app')

function getFileLastModified(relativePath: string): Date {
  const fullPath = path.join(APP_DIR, relativePath)

  try {
    return fs.statSync(fullPath).mtime
  } catch {
    return new Date()
  }
}

function getDbLastModified(updatedAt: string | null): Date {
  return updatedAt ? new Date(updatedAt) : new Date()
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
      supabase.from('firms').select('slug, updated_at').eq('is_published', true),
      supabase.from('profiles').select('id, updated_at').eq('is_published', true),
    ])

    if (firmsResult.error) {
      console.error('Error fetching firm slugs for sitemap', firmsResult.error)
    }
    if (membersResult.error) {
      console.error('Error fetching member IDs for sitemap', membersResult.error)
    }

    return {
      firms:
        (firmsResult.data as FirmRow[] | null)?.filter(
          (firm): firm is { slug: string; updated_at: string | null } => Boolean(firm.slug),
        ) ?? [],
      members:
        (membersResult.data as MemberRow[] | null)?.filter(
          (member): member is { id: string; updated_at: string | null } => Boolean(member.id),
        ) ?? [],
      roles: STATIC_ROLE_SLUGS,
    }
  } catch (error) {
    console.error('Error loading dynamic sitemap slugs', error)
    return { firms: [], members: [], roles: [] }
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { firms, members, roles } = await fetchDynamicSlugs()

  const firmEntries = firms.map((firm) => ({
    url: `${SITE_URL}/firms/${firm.slug}`,
    lastModified: getDbLastModified(firm.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const memberEntries = members.map((member) => ({
    url: `${SITE_URL}/members/${member.id}`,
    lastModified: getDbLastModified(member.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  const roleEntries = roles.map((slug) => ({
    url: `${SITE_URL}/roles/${slug}`,
    lastModified: getFileLastModified(`roles/${slug}/page.tsx`),
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
    lastModified: getFileLastModified(`tools/${slug}/page.tsx`),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const stateEntries = ALL_STATE_SLUGS.map((slug) => ({
    url: `${SITE_URL}/hiring-firms/${slug}`,
    lastModified: getFileLastModified('hiring-firms/state-data.ts'),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    // --- Core pages ---
    {
      url: `${SITE_URL}/`,
      lastModified: getFileLastModified('page.tsx'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/hiring-firms`,
      lastModified: getFileLastModified('hiring-firms/page.tsx'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/membership-pricing`,
      lastModified: getFileLastModified('membership-pricing/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/tools`,
      lastModified: getFileLastModified('tools/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/jobs`,
      lastModified: getFileLastModified('jobs/page.tsx'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/guides`,
      lastModified: getFileLastModified('guides/page.tsx'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/guides/how-to-become-a-field-inspector`,
      lastModified: getFileLastModified('guides/how-to-become-a-field-inspector/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/guides/field-inspection-vs-home-inspection`,
      lastModified: getFileLastModified('guides/field-inspection-vs-home-inspection/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/challenges`,
      lastModified: getFileLastModified('challenges/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },

    // --- Informational / trust pages ---
    {
      url: `${SITE_URL}/about-us`,
      lastModified: getFileLastModified('about-us/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact-us`,
      lastModified: getFileLastModified('contact-us/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/faqs`,
      lastModified: getFileLastModified('faqs/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/inspector-resource-center`,
      lastModified: getFileLastModified('inspector-resource-center/page.tsx'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },

    // --- Legal pages ---
    {
      url: `${SITE_URL}/privacy`,
      lastModified: getFileLastModified('privacy/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/terms-conditions`,
      lastModified: getFileLastModified('terms-conditions/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/refund-policy`,
      lastModified: getFileLastModified('refund-policy/page.tsx'),
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
