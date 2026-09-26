import assert from 'node:assert/strict'
import test from 'node:test'
import config from '../next.config.js'

const destination = 'https://members.nestedobjects.com/membership-pricing'

for (const source of ['/pricing', '/membership-pricing']) {
  test(`${source} redirects once to the existing member pricing page`, async () => {
    const matches = (await config.redirects()).filter(rule => rule.source === source)
    assert.deepEqual(matches, [{ source, destination, permanent: true }])
    assert.equal(new URL(matches[0].destination).search, '')
    assert.equal(new URL(matches[0].destination).hash, '')
  })
}

test('pricing fix preserves the unrelated legacy redirects', async () => {
  const redirects = await config.redirects()
  assert.deepEqual(redirects.filter(rule => !['/pricing', '/membership-pricing'].includes(rule.source)), [
    { source: '/job-directory-1', destination: '/hiring-firms', permanent: true },
    { source: '/about-us', destination: '/about', permanent: true },
    { source: '/qualifications', destination: '/about', permanent: true },
    { source: '/services', destination: '/about', permanent: true },
    { source: '/news', destination: '/guides', permanent: true },
    { source: '/contact', destination: '/contact', permanent: true },
  ])
})
