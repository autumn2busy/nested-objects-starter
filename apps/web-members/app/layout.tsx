import type { Metadata } from 'next'
import { AuthProvider } from '@/components/auth-provider'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Nested Objects Member Hub',
  description: 'AI-powered member hub for inspectors, notaries, and gig pros.',
}

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
  const outsetaDomain =
    process.env.NEXT_PUBLIC_OUTSETA_DOMAIN || 'nested-objects.outseta.com'

  const siteJson = JSON.stringify(structuredData)
  const orgJson = JSON.stringify(organizationStructuredData)

  return (
    <html lang="en">
      <head>
        {/* Outseta config must come BEFORE the script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.o_options = {
                domain: '${outsetaDomain}',
                load: 'auth,profile',
                monitorDom: true,
                tokenStorage: 'local'
              };
            `,
          }}
        />
        <script
          src="https://cdn.outseta.com/outseta.min.js"
          data-options="o_options"
        />

        {/* SEO structured data */}
        <script
          id="structured-data-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: siteJson }}
        />
        <script
          id="structured-data-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: orgJson }}
        />
      </head>
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
