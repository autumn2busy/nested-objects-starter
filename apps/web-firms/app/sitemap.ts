import fs from 'fs'
import path from 'path'
import { MetadataRoute } from 'next'
import { getAllGuides } from '@/lib/guides'

const BASE_URL = 'https://nestedobjects.com'
const APP_DIR = path.join(process.cwd(), 'apps', 'web-public', 'app')

function getFileLastModified(relativePath: string): Date {
  const fullPath = path.join(APP_DIR, relativePath)

  try {
    return fs.statSync(fullPath).mtime
  } catch {
    return new Date()
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const guides = getAllGuides()

  const guidePages = guides.map((guide) => ({
    url: `${BASE_URL}/guides/${guide.slug}`,
    lastModified: new Date(guide.frontmatter.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: getFileLastModified('page.tsx'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/guides`,
      lastModified: getFileLastModified('guides/page.tsx'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...guidePages,
  ]
}
