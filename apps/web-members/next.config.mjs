import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname)
    return config
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'www.notarystars.com',
      },
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
      },
      {
        protocol: 'https',
        hostname: 'nested-objects.outseta.com',
      },
      {
        protocol: 'https',
        hostname: 'lzzghrjjsyzlvofpidis.supabase.co',
      },
    ],
  },
  async redirects() {
    return [
      // Recover old curriculum links without redirecting /training/ media files.
      { source: '/training', destination: '/challenges', permanent: true },
      {
        source: '/profile/:id',
        destination: '/members/:id',
        permanent: true,
      },
      {
        source: '/post/:slug',
        destination: '/hiring-firms', // fallback if they had a blog
        permanent: true,
      },
      {
  source: '/sneak-peek',
  destination: '/',
  permanent: true,
},
    ]
  },
}

export default nextConfig
