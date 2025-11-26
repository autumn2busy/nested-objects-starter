import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://nested-objects-starter.vercel.app'
  const now = new Date()

  const routes = [
    '/',
    '/dashboard',
    '/directory',
    '/membership',
    '/resources',
    '/resources/firm-intel',
    '/resources/checklists',
    '/tools',
    '/about',
    '/contact',
    '/privacy',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route === '/' ? 1 : 0.8,
  }))
}
