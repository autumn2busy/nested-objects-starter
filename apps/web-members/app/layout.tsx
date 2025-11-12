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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        [cite_start]{/* Load the Outseta embed script [cite: 318, 320] */}
        <Script
          src={`${process.env.NEXT_PUBLIC_OUTSETA_URL}/widget.js`}
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