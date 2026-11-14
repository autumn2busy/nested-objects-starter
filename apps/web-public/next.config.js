/** @type {import('next').NextConfig} */
const nextConfig = {
  // 301 redirects from old GoDaddy site
  async redirects() {
    return [
      // Public pricing aliases share the member site's existing plans and checkout.
      { source: '/pricing', destination: 'https://members.nestedobjects.com/membership-pricing', permanent: true },
      { source: '/membership-pricing', destination: 'https://members.nestedobjects.com/membership-pricing', permanent: true },
      // Use the existing About page until the separate public About draft is reviewed.
      { source: '/about', destination: 'https://members.nestedobjects.com/about-us', permanent: false },
      // Old GoDaddy routes → new equivalents
      { source: '/job-directory-1', destination: '/hiring-firms', permanent: true },
      { source: '/about-us', destination: '/about', permanent: true },
      { source: '/qualifications', destination: '/about', permanent: true },
      { source: '/services', destination: '/about', permanent: true },
      { source: '/news', destination: '/guides', permanent: true },
      { source: '/contact', destination: 'https://members.nestedobjects.com/contact-us', permanent: true },
    ]
  },

  // Rewrites: proxy /hiring-firms preview to members site for now
  // (will build a public preview later)
  async rewrites() {
    return []
  },
}

module.exports = nextConfig
