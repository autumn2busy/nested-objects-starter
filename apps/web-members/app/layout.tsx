import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import Script from 'next/script'
import { AuthProvider } from '@/components/auth-provider'
import { Analytics } from '@/components/analytics'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { cn } from '@/lib/utils'
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  getOrganizationSchema,
  getWebSiteSchema
} from '@/lib/seo'
import '../styles/globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

const contentContainerClass = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Field Inspection, Notary & Appraisal Hub`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'Mortgage Field Inspection services',
    'Independent Field Inspector near me',
    'Insurance Loss Control Inspection',
    'Remote Online Notarization (RON)',
    'Mobile Notary for real estate closings',
    'Loan Signing Agent',
    'Certified residential property appraisal',
    'Drive-by appraisal services',
    'Home valuation for mortgage lenders',
    'Gig work for realtors',
  ],
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: `${SITE_NAME} | Field Inspection, Notary & Appraisal Hub`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | Field Inspection, Notary & Appraisal Hub`,
    description: SITE_DESCRIPTION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationSchema = getOrganizationSchema()
  const webSiteSchema = getWebSiteSchema()

  const shouldLoadOutseta =
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_ENABLE_OUTSETA === 'true'

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Global Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />

        {/* Preconnect to external CDNs */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />

        {/* Outseta install snippet. Only load in production or if explicitly enabled */}
        {shouldLoadOutseta && (
          <>
            {/* Configuration must be set before the Outseta script executes */}
            <Script
              id="outseta-options"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  var o_options = {
                    domain: 'nested-objects.outseta.com',
                    load: 'auth,customForm,emailList,leadCapture,nocode,profile,support',
                    tokenStorage: 'local'
                  };
                `,
              }}
            />
            {/* Load Outseta library synchronously to strictly follow config */}
            <Script
              id="outseta-loader"
              src="https://cdn.outseta.com/outseta.min.js"
              strategy="beforeInteractive"
              data-options="o_options"
            />
          </>
        )}
      </head>

      <body className={cn(plusJakarta.variable, 'font-sans text-text-primary')}>
        {/* Skip Link for Accessibility (WCAG 2.4.1) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-brand-copper focus:px-4 focus:py-2 focus:text-white focus:rounded-md focus:outline-none"
        >
          Skip to main content
        </a>

        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader containerClassName={contentContainerClass} />
            <main id="main-content" className="flex-1">{children}</main>
            <SiteFooter containerClassName={contentContainerClass} />
          </div>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
