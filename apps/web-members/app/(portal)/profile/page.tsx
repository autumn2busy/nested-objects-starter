'use client'

import { useAuth } from '@/components/auth-provider'
import { ExternalLink } from 'lucide-react'

export default function ProfilePage() {
    const { isAuthenticated, user } = useAuth()

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-brand-sand">
                <div className="mx-auto max-w-4xl px-4 py-16 text-center">
                    <h1 className="text-3xl font-bold text-brand-dark">Member Profile</h1>
                    <p className="mt-4 text-slate-700">
                        Please log in to manage your profile and membership.
                    </p>
                    <a
                        href="https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous"
                        className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-copper px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-copperDark"
                    >
                        Log In
                    </a>
                </div>
            </div>
        )
    }

    // For authenticated users, redirect to Outseta's hosted profile page
    // This is more reliable than the embed which requires nocode config
    if (typeof window !== 'undefined') {
        window.location.href = 'https://nested-objects.outseta.com/profile#o-authenticated'
    }

    return (
        <div className="min-h-screen bg-brand-sand">
            <div className="mx-auto max-w-4xl px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-copper border-t-transparent"></div>
                    <p className="text-slate-700">Redirecting to your profile...</p>
                    <a
                        href="https://nested-objects.outseta.com/profile#o-authenticated"
                        className="mt-4 inline-flex items-center gap-2 text-sm text-brand-copper underline-offset-4 hover:underline"
                    >
                        Click here if not redirected automatically
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </div>
            </div>
        </div>
    )
}
