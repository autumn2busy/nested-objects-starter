import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import Script from 'next/script'
import '../styles/globals.css'

import { AuthProvider } from '@/components/auth-provider'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
})

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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Outseta configuration */}
        <Script id="outseta-config" strategy="beforeInteractive">
          {`
            var o_options = {
              domain: 'nested-objects.outseta.com',
              load: 'auth,customForm,emailList,leadCapture,nocode,profile,support',
              tokenStorage: 'cookie',
              monitorDom: true,
              auth: {
                // Always send users back through the Next.js callback route
                authenticationCallbackUrl: window.location.origin + '/auth/callback'
              }
            };
          `}
        </Script>
        {/* Load Outseta embed script */}
        <Script
          id="outseta-script"
          src="https://cdn.outseta.com/outseta.min.js"
          strategy="beforeInteractive"
          data-options="o_options"
        />
      </head>
      <body className={`${plusJakarta.variable} font-sans`}>
        {/* Wrap the entire app in the AuthProvider */}
        <AuthProvider>
          <div className="flex min-h-screen flex-col bg-brand-background text-brand-text">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
