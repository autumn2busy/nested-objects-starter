'use client'

import { useAuth } from '@/components/auth-provider'

interface AuthCTAProps {
    /** The real element to show when authenticated */
    children: React.ReactNode
}

/**
 * Wraps CTA buttons/links in the firm hero card.
 * - Authenticated users see the real link (children).
 * - Guests see the same visual button, but clicking opens login instead of navigating.
 */
export function AuthCTA({ children }: AuthCTAProps) {
    const { isAuthenticated, isLoading, login } = useAuth()

    // While loading, render nothing to avoid flash
    if (isLoading) return null

    // Logged in — show the real link
    if (isAuthenticated) return <>{children}</>

    // Guest — intercept the click
    return (
        <div
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                login()
            }}
            className="cursor-pointer"
        >
            {/* Render children but strip pointer events on the actual <a> so our onClick wins */}
            <div className="pointer-events-none">
                {children}
            </div>
        </div>
    )
}