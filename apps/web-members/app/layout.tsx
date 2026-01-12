import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import Script from 'next/script'
import { AuthProvider } from '@/components/auth-provider'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { cn } from '@/lib/utils'
import '../styles/globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

const contentContainerClass = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'

export const metadata: Metadata = {
  metadataBase: new URL('https://nested-objects-starter.vercel.app'),
  title: {
    default: 'Nested Objects Member Hub',
    template: '%s | Nested Objects',
  },
  description:
    'Nested Objects is the AI powered member hub for field inspectors, notaries, realtors, and gig pros, helping you find firms, get trained, and land more work.',
  openGraph: {
    type: 'website',
    url: 'https://nested-objects-starter.vercel.app',
    title: 'Nested Objects Member Hub',
    description:
      'AI powered member hub for field inspectors, notaries, realtors, and gig pros.',
    siteName: 'Nested Objects',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nested Objects Member Hub',
    description:
      'AI powered member hub for field inspectors, notaries, realtors, and gig pros.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Outseta configuration - loads in production or when explicitly enabled
  const shouldLoadOutseta = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_OUTSETA === 'true'

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {shouldLoadOutseta && (
          <>
            <Script id="outseta-config" strategy="beforeInteractive">
              {`
                var o_options = {
                  domain: 'nested-objects.outseta.com',
                  load: 'auth,customForm,emailList,leadCapture,profile,support'
                };
              `}
            </Script>
            <Script
              id="outseta-script"
              src="https://cdn.outseta.com/outseta.min.js"
              strategy="afterInteractive"
              data-options="o_options"
            />
          </>
        )}
      </head>

      <body className={cn(plusJakarta.variable, 'font-sans text-text-primary')}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader containerClassName={contentContainerClass} />
            <main className="flex-1">{children}</main>
            <SiteFooter containerClassName={contentContainerClass} />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
