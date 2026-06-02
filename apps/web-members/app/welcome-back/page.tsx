import { Suspense } from 'react'
import { generatePageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { WelcomeBackView } from './WelcomeBackView'

export const metadata: Metadata = generatePageMetadata({
  title: 'Welcome Back - Claim Your New Account',
  description:
    'Your Nested Objects membership just got a massive upgrade. Claim your Founding Member account on the new platform — same price, way more tools.',
  path: '/welcome-back',
})

export default function WelcomeBackPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-2xl px-4 py-20 text-center"><p className="text-sm text-slate-500">Loading…</p></main>}>
      <WelcomeBackView />
    </Suspense>
  )
}
