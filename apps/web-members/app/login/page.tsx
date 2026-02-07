'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Script from 'next/script'

export default function LoginPage() {
    const searchParams = useSearchParams()
    const returnUrl = searchParams.get('returnUrl') || '/dashboard'

    useEffect(() => {
        // Give Outseta a moment to load
        const timer = setTimeout(() => {
            if (window.Outseta?.auth?.open) {
                // Try to open the modal with the return URL
                // Note: callbackUrl support depends on Outseta version/config
                window.Outseta.auth.open({
                    widgetMode: 'login',
                    callbackUrl: window.location.origin + returnUrl
                })
            } else {
                // Fallback to hosted page
                window.location.href = 'https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous'
            }
        }, 1000)

        return () => clearTimeout(timer)
    }, [returnUrl])

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Redirecting to secure login...</p>
            </div>
            {/* Ensure Outseta is loaded if it wasn't already */}
            <Script
                src="https://cdn.outseta.com/outseta.min.js"
                strategy="afterInteractive"
                data-options="o_options"
            />
        </div>
    )
}
