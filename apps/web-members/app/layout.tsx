import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import Script from 'next/script'
import { AuthProvider } from '@/components/auth-provider'
import { ActiveCampaignTracker } from '@/components/ActiveCampaignTracker'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { PromoBanner } from '@/components/PromoBanner'
import { MobileActionBar } from '@/components/MobileActionBar'
import { cn } from '@/lib/utils'
import {
  DEFAULT_OG_IMAGE,
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  getBreadcrumbSchema,
  getOrganizationSchema,
  getSoftwareApplicationSchema,
  getWebSiteSchema
} from '@/lib/seo'
import { TESTIMONIALS, getAverageRating } from '@/lib/testimonials'
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
    default: `Field Inspector Directory & Independent Vendor Hub | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'Field Inspector Directory',
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
    'Field inspection jobs',
  ],
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: `Field Inspector Directory & Independent Vendor Hub | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} field inspector directory`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Field Inspector Directory & Independent Vendor Hub | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: {
    canonical: SITE_URL,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationSchema = getOrganizationSchema()
  const webSiteSchema = getWebSiteSchema()
  const softwareApplicationSchema = getSoftwareApplicationSchema({
    ratingValue: getAverageRating(),
    reviewCount: TESTIMONIALS.length,
    reviews: TESTIMONIALS.filter((testimonial) => testimonial.source === 'google' || testimonial.source === 'review')
      .slice(0, 5)
      .map((testimonial) => ({
        author: testimonial.name,
        rating: testimonial.rating,
        body: testimonial.quote,
        datePublished: testimonial.date,
      })),
  })
  const homeBreadcrumbSchema = getBreadcrumbSchema([{ name: 'Home', url: SITE_URL }])

  const shouldLoadOutseta =
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_ENABLE_OUTSETA === 'true'

  const acActId = process.env.NEXT_PUBLIC_AC_ACTID

  return (
    <html lang="en" className="w-full overflow-x-clip" suppressHydrationWarning>
      <head>
        <Script
          id="gtm-script"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-5HPX4VTQ');
            `,
          }}
        />
        {/* Global Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(homeBreadcrumbSchema) }}
        />

        {/* Preconnect to external CDNs */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://cdn.outseta.com" />
        <link rel="preconnect" href="https://nested-objects.outseta.com" />

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
                    load: 'auth,profile',
                    tokenStorage: 'local'
                  };
                `,
              }}
            />
            {/* Keep config early, but load the widget after first paint work. Auth fallbacks handle early clicks. */}
            <Script
              id="outseta-loader"
              src="https://cdn.outseta.com/outseta.min.js"
              strategy="afterInteractive"
              data-options="o_options"
            />
          </>
        )}

        {/* ActiveCampaign Site Tracking — only load if ACTID is configured */}
        {acActId && (
          <Script
            id="ac-site-tracking"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                (function(e,t,o,n,p,r,i){e.visitorGlobalObjectAlias=n;e[e.visitorGlobalObjectAlias]=e[e.visitorGlobalObjectAlias]||function(){(e[e.visitorGlobalObjectAlias].q=e[e.visitorGlobalObjectAlias].q||[]).push(arguments)};e[e.visitorGlobalObjectAlias].l=(new Date).getTime();r=t.createElement("script");r.src=o;r.async=true;i=t.getElementsByTagName("script")[0];i.parentNode.insertBefore(r,i)})(window,document,"https://diffuser-cdn.app-us1.com/diffuser/diffuser.js","vgo");
                vgo('setAccount', '${acActId}');
                vgo('setTrackByDefault', true);
                vgo('process');
              `,
            }}
          />
        )}
      </head>

      <body className={cn(plusJakarta.variable, 'w-full overflow-x-clip font-sans text-text-primary')}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5HPX4VTQ"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* Skip Link for Accessibility (WCAG 2.4.1) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-brand-copper focus:px-4 focus:py-2 focus:text-white focus:rounded-md focus:outline-none"
        >
          Skip to main content
        </a>

        <AuthProvider>
          <ActiveCampaignTracker />
          <PromoBanner />
          <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip pb-20 md:pb-0">
            <SiteHeader containerClassName={contentContainerClass} />
            <main id="main-content" className="min-w-0 flex-1 overflow-x-clip">{children}</main>
            <SiteFooter containerClassName={contentContainerClass} />
          </div>
          <MobileActionBar />
        </AuthProvider>
      </body>
    </html>
  )
}
