'use client'

import Image from 'next/image'
import { ReactNode } from 'react'
import { useAuth } from './auth-provider'
import { logoDataUrl } from '../lib/logoData'

interface GateProps {
  feature: string
  children: ReactNode
  fallback?: ReactNode
  loadingFallback?: ReactNode
}

export function Gate({ feature, children, fallback, loadingFallback }: GateProps) {
  const { hasAccess, isLoading, isAuthenticated, login, signup } = useAuth()

  // Show loading state
  if (isLoading) {
    return loadingFallback || (
      <div className="mx-auto max-w-2xl rounded-2xl border border-brand-steel/40 bg-white/90 p-8 text-center shadow-brand-card">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-copper/10">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-copper border-t-transparent" aria-hidden />
        </div>
        <p className="mt-4 text-sm font-semibold text-brand-dark">Checking your vendor access…</p>
        <p className="text-sm text-brand-slate">Hang tight while we secure your workspace.</p>
      </div>
    )
  }

  // User is not authenticated
  if (!isAuthenticated) {
    return fallback || (
      <section className="mx-auto mt-8 max-w-3xl rounded-2xl border border-brand-steel/35 bg-white/95 p-8 shadow-brand-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-copper/10">
              <Image src={logoDataUrl} alt="Nested Objects logo" width={36} height={36} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-copper">Vendor hub</p>
              <h2 className="text-xl font-semibold text-brand-dark">You are not a “worker”; you are a Vendor.</h2>
              <p className="text-sm text-brand-slate">
                Sign in to access premium intel, secure tools, and payments built for vetted vendors.
              </p>
            </div>
          </div>
          <div className="hidden h-16 w-px bg-gradient-to-b from-brand-steel/50 via-brand-steel/20 to-transparent sm:block" />
          <div className="flex flex-col items-stretch gap-3 text-sm sm:w-56">
            <button
              onClick={login}
              className="inline-flex items-center justify-center rounded-full bg-brand-dark px-4 py-2 font-semibold text-white shadow-brand-soft transition hover:bg-brand-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-copper"
            >
              Log in securely
            </button>
            <button
              onClick={signup}
              className="inline-flex items-center justify-center rounded-full border border-brand-steel/60 bg-white px-4 py-2 font-semibold text-brand-dark transition hover:border-brand-copper hover:text-brand-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-copper"
            >
              Create vendor account
            </button>
          </div>
        </div>
      </section>
    )
  }

  // User is authenticated but lacks access
  if (!hasAccess(feature)) {
    return fallback || (
      <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-brand-steel/35 bg-brand-sand/90 p-8 text-center shadow-brand-card">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-copper">Premium lane</p>
        <h2 className="mt-2 text-xl font-semibold text-brand-dark">Upgrade required for this feature.</h2>
        <p className="mt-2 text-sm text-brand-slate">
          This workspace unlocks advanced intel, concierge routing, and vendor-only perks.
        </p>
        <a
          href="/upgrade"
          className="mt-5 inline-flex items-center justify-center rounded-full bg-brand-copper px-5 py-2 text-sm font-semibold text-white shadow-brand-soft transition hover:bg-brand-copperDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-copper"
        >
          View plans
        </a>
      </div>
    )
  }

  // User has access - render children
  return <>{children}</>
}
