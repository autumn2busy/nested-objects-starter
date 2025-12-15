import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
    title: 'Nested Objects',
    description: 'The living ecosystem for field inspection and property service professionals.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <Script
                    id="outseta-init"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
              var o_options = {
                domain: 'nested-objects.outseta.com',
                load: 'auth,customForm,emailList,leadCapture,nocode,profile,support'
              };
            `,
                    }}
                />
                <Script
                    src="https://cdn.outseta.com/outseta.min.js"
                    data-options="o_options"
                    strategy="beforeInteractive"
                />
            </head>
            <body className={cn(inter.variable, outfit.variable, "min-h-screen bg-background font-sans antialiased text-foreground")}>
                {children}
            </body>
        </html>
    )
}
