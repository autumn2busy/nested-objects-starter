import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-mono' }) // Using Outfit as display/accent font

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
        <html lang="en" className="dark">
            <body className={cn(inter.variable, outfit.variable, "min-h-screen bg-background font-sans antialiased text-foreground")}>
                {children}
            </body>
        </html>
    )
}
