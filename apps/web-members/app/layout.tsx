import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { AuthProvider } from '@/components/auth-provider'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nested Objects Member Hub',
  description: 'AI-powered member hub for inspectors, notaries, and gig pros.',
}

// Structured data for SEO
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
  const outsetaDomain = process.env.NEXT_PUBLIC_OUTSETA_DOMAIN || 'nested-objects.outseta.com'

  return (
    <html lang="en">
      <head>
        {/* Define Outseta configuration BEFORE loading widget */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.o_options = {
                domain: '${outsetaDomain}',
                load: 'auth,profile',
                auth: {
                  authenticationCallbackUrl: '/dashboard'
                }
              };
            `,
          }}
        />

        {/* Load the Outseta embed script */}
        <Script
          src={`https://${outsetaDomain}/widget.js`}
          strategy="afterInteractive"
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
