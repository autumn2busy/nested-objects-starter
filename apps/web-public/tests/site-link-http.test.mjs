import assert from 'node:assert/strict'
import test from 'node:test'

// Explicit development/Preview URLs are required; never run against Production by default.
const publicBase = process.env.LINK_CHECK_PUBLIC_URL
const memberBase = process.env.LINK_CHECK_MEMBER_URL
const httpTest = publicBase && memberBase ? test : test.skip
const suffix = '?utm_source=verification&utm_campaign=site_link_repair&category=tools'

for (const [base, path, status, destination] of [
  [publicBase, '/contact', 308, 'https://members.nestedobjects.com/contact-us'],
  [publicBase, '/about', 307, 'https://members.nestedobjects.com/about-us'],
  [memberBase, '/training', 308, new URL('/challenges', memberBase || 'https://fixture.invalid').href],
]) {
  httpTest(`${path} responds once with the intended destination and preserves query context`, async () => {
    const result = await fetch(new URL(path + suffix, base), { redirect: 'manual' })
    assert.equal(result.status, status)
    const location = new URL(result.headers.get('location'), base)
    assert.equal(location.origin + location.pathname, destination)
    assert.deepEqual([...location.searchParams], [...new URLSearchParams(suffix)])
    assert.notEqual(location.href, new URL(path + suffix, base).href)
  })
}

httpTest('legacy training redirect does not capture media or adjacent training paths', async () => {
  for (const path of ['/training/module-1/link-check-missing.pdf', '/training-assets/link-check-missing.mp4', '/training-center']) {
    const response = await fetch(new URL(path, memberBase), { redirect: 'manual' })
    assert.equal(response.status, 404)
    assert.equal(response.headers.get('location'), null)
  }
})

httpTest('rendered member comparison page uses the working cross-host guide destination', async () => {
  const response = await fetch(new URL('/blog/mortgage-field-inspection-vs-property-preservation', memberBase))
  assert.equal(response.status, 200)
  const html = await response.text()
  assert.match(html, /href="https:\/\/www\.nestedobjects\.com\/guides\/how-to-start-a-property-preservation-business"/)
  assert(!html.includes('href="/guides/how-to-start-a-property-preservation-business"'))
})
