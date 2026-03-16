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
