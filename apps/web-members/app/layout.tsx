import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { AuthProvider } from '@/components/auth-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nested Objects Member Hub',
  description: 'AI-powered member hub for inspectors, notaries, and gig pros.',
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
      <body className={inter.className}>
        {/* Wrap the entire app in the AuthProvider */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
