'use client'

import React from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth-provider'

interface LockedOverlayProps {
    title?: string
    description?: string
    ctaLabel?: string
    onCtaClick?: () => void
    className?: string
    planUid?: string | null
}

export function LockedOverlay({
    title = 'Access Restricted',
    description = 'Join to unlock the full potential of this resource.',
    ctaLabel,
    onCtaClick,
    className,
    planUid, // pass planUid explicitly if needed, otherwise useAuth
}: LockedOverlayProps) {
    const { isAuthenticated, login, signup } = useAuth()

    // Default Copy Logic
    const isLoggedOut = !isAuthenticated
    // If no planUid passed, we assume we might need to check context, 
    // but this component is usually rendered WHEN access is denied.
    // So we just tailor copy based on auth state.

    const finalTitle = title || (isLoggedOut ? 'Member-Only Content' : 'Upgrade Required')
    const finalDescription = description || (
        isLoggedOut
            ? 'Log in or sign up to access this premium content.'
            : 'This feature requires a higher tier plan.'
    )

    const handleMainAction = () => {
        if (onCtaClick) {
            onCtaClick()
            return
        }
        if (isLoggedOut) {
            signup()
        } else {
            // Default to upgrade page
            window.location.href = '/membership'
        }
    }

    const handleLogin = () => {
        login()
    }

    return (
        <div className={cn(
            "absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center",
            "bg-white/60 backdrop-blur-md", // The blur effect
            className
        )}>
            <div className="relative max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 ring-8 ring-slate-50">
                    <Lock className="h-7 w-7 text-slate-400" />
                </div>

                <h3 className="mb-2 text-xl font-bold text-slate-900 tracking-tight">
                    {finalTitle}
                </h3>

                <p className="mb-8 text-sm text-slate-500 leading-relaxed">
                    {finalDescription}
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button

                        onClick={handleMainAction}
                        className="w-full sm:w-auto bg-brand-dark hover:bg-brand-dark/90 text-white font-semibold"
                    >
                        {ctaLabel || (isLoggedOut ? 'Join for Free' : 'Upgrade Plan')}
                    </Button>

                    {isLoggedOut && (
                        <Button
                            variant="secondary"

                            onClick={handleLogin}
                            className="w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        >
                            Log in
                        </Button>
                    )}

                    {!isLoggedOut && (
                        <Link
                            href="/dashboard"
                            className={cn(
                                "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                                "border border-slate-200 bg-transparent shadow-sm hover:bg-slate-100 hover:text-slate-900",
                                "h-10 px-8 py-2" // match size="lg" approx
                            )}
                        >
                            Back
                        </Link>
                    )}
                </div>

                {isLoggedOut && (
                    <p className="mt-4 text-xs text-slate-400">
                        Already a member? <button onClick={handleLogin} className="underline hover:text-slate-600">Log in here</button>
                    </p>
                )}
            </div>
        </div>
    )
}
