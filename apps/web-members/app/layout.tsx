import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { AuthProvider } from '@/components/auth-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nested Objects Member Hub',
  description: 'AI-powered member hub for inspectors, notaries, and gig pros.',
}

// Structured data for SEO (optional - can be added later)
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Nested Objects',
  url: 'https://nestedobjects.com',
  description:
    'AI-powered membership platform for field service professionals including inspectors, notaries, and contractors.',
}

const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Nested Objects',
  url: 'https://nestedobjects.com',
  description:
    'AI-powered membership platform connecting field service professionals with top firms, training, and career resources.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Load the Outseta embed script */}
        <Script
          src={`${process.env.NEXT_PUBLIC_OUTSETA_URL}/widget.js`}
          strategy="beforeInteractive"
          data-options="o_options"
        />

        {/* Structured Data for SEO */}
        <Script
          id="structured-data-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Script
          id="structured-data-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
