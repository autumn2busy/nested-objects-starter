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
    <html lang="en">
      <head>
        {/* Outseta configuration */}
        <Script id="outseta-config" strategy="beforeInteractive">
          {`
            var o_options = {
              domain: 'nested-objects.outseta.com',
              load: 'auth,customForm,emailList,leadCapture,nocode,profile,support',
              auth: {
                authenticationCallbackUrl: window.location.href
              }
            };
          `}
        </Script>
        {/* Load Outseta embed script */}
        <Script
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
