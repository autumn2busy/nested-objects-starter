import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://nested-objects-starter.vercel.app'
  const now = new Date()

  // 1. Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/directory`,
      lastModified: now,
      changeFrequency: 'daily', // Directory changes often
      priority: 0.9,
    },
    {
      url: `${baseUrl}/membership`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms-conditions`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faqs`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  // 2. Dynamic Routes (Firms)
  let firmRoutes: MetadataRoute.Sitemap = []

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data: firms } = await supabase
        .from('firms')
        .select('slug, updated_at')
        .eq('is_published', true)
        .limit(1000)

      if (firms) {
        firmRoutes = firms.map((firm) => ({
          url: `${baseUrl}/firms/${firm.slug}`,
          lastModified: firm.updated_at ? new Date(firm.updated_at) : now,
          changeFrequency: 'weekly',
          priority: 0.8,
        }))
      }
    }
  } catch (error) {
    console.error('Sitemap generation error:', error)
  }

  return [...staticRoutes, ...firmRoutes]
}
