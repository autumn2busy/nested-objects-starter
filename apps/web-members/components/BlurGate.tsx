'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

interface BlurGateProps {
    /** The feature key from FEATURE_MIN_PLAN in auth-provider */
    feature: string
    /** The content to gate */
    children: React.ReactNode
    /** Optional: custom title for the upgrade overlay */
    title?: string
    /** Optional: custom description for the upgrade overlay */
    description?: string
    /** Optional: custom CTA label */
    ctaLabel?: string
    /** Optional: custom CTA href (defaults to /membership-pricing) */
    ctaHref?: string
}

/**
 * BlurGate — wraps page content with a blur + pointer-events-none overlay
 * when the current user's plan doesn't include the specified feature.
 *
 * Usage:
 *   <BlurGate feature="ai_concierge" title="AI Concierge is a Pro feature">
 *     <YourToolContent />
 *   </BlurGate>
 *
 * If the user has access, children render normally with zero overhead.
 * If the user lacks access, children are blurred behind an upgrade card.
 */
export function BlurGate({
    feature,
    children,
    title = 'Upgrade to unlock this tool',
    description = 'This feature requires a higher plan. Upgrade to access everything in the Vendor Hub.',
    ctaLabel = 'View plans',
    ctaHref = '/membership-pricing',
}: BlurGateProps) {
    const { hasAccess, isLoading, isAuthenticated, login, signup } = useAuth()

    // While loading, show children normally (avoids flash of blur)
    if (isLoading) {
        return <>{children}</>
    }

    // User has access — render children with no wrapper
    if (isAuthenticated && hasAccess(feature)) {
        return <>{children}</>
    }

    // User lacks access — blur children and overlay upgrade card
    return (
        <div className="relative">
            {/* Blurred content */}
            <div
                className="pointer-events-none select-none blur-sm opacity-50"
                aria-hidden="true"
                inert
            >
                {children}
            </div>

            {/* Upgrade overlay */}
            <div className="absolute inset-0 flex items-start justify-center pt-16 sm:pt-24 p-6 z-10">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-sm p-6 text-center shadow-xl">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-copper/10 text-brand-copper">
                        <Lock className="h-6 w-6" />
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-copper">
                        Premium feature
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">
                        {title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">{description}</p>
                    <div className="mt-5 flex flex-col gap-3">
                        {!isAuthenticated ? (
                            <>
                                <button
                                    onClick={login}
                                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-copper"
                                >
                                    Log in
                                </button>
                                <button
                                    onClick={signup}
                                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-brand-copper hover:text-brand-copper"
                                >
                                    Create vendor account
                                </button>
                            </>
                        ) : (
                            <Link
                                href={ctaHref}
                                className="inline-flex items-center justify-center rounded-full bg-brand-copper px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-copperDark"
                            >
                                {ctaLabel}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
