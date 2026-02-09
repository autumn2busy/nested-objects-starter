import { test } from 'node:test'
import assert from 'node:assert'

import { generatePageMetadata, getCanonicalUrl, SITE_URL } from '../lib/seo'

test('canonical URLs are built from the site URL', () => {
  const canonical = getCanonicalUrl('/directory')
  assert.strictEqual(canonical, `${SITE_URL}/directory`)

  const metadata = generatePageMetadata({
    title: 'Membership',
    description: 'Plans',
    path: '/membership',
  })

  assert.strictEqual(metadata.alternates?.canonical, `${SITE_URL}/membership`)
})

test('legacy routes redirect to canonical paths', async () => {
  const { default: nextConfig } = await import('../next.config.mjs')
  const redirects = await nextConfig.redirects()

  const redirectMap = new Map(redirects.map((entry: { source: string; destination: string }) => [
    entry.source,
    entry.destination,
  ]))

  assert.strictEqual(redirectMap.get('/about-us'), '/about')
  assert.strictEqual(redirectMap.get('/contact-us'), '/contact')
  assert.strictEqual(redirectMap.get('/join'), '/membership')
})
