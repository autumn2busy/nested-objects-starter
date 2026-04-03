/** @type {import('next').NextConfig} */
const nextConfig = {
  // 301 redirects from old GoDaddy site
  async redirects() {
    return [
      // Old GoDaddy routes → new equivalents
      { source: '/job-directory-1', destination: '/hiring-firms', permanent: true },
      { source: '/about-us', destination: '/about', permanent: true },
      { source: '/qualifications', destination: '/about', permanent: true },
      { source: '/services', destination: '/about', permanent: true },
      { source: '/news', destination: '/guides', permanent: true },
      // Catch any old GoDaddy builder paths
      { source: '/contact', destination: '/contact', permanent: true },
    ]
  },

  // Rewrites: proxy /hiring-firms preview to members site for now
  // (will build a public preview later)
  async rewrites() {
    return []
  },
}

module.exports = nextConfig
