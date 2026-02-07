'use client'

import React from 'react'
import { useAuth } from '@/components/auth-provider'
import { LockedOverlay } from '@/components/LockedOverlay'
import { cn } from '@/lib/utils'

interface PreviewGateProps {
    children: React.ReactNode
    feature?: string
    /**
     * Optional: override title/description for the overlay
     */
    title?: string
    description?: string
    /**
     * If true, completely hide the children instead of blurring them.
     */
    hideChildren?: boolean
}

export function PreviewGate({
    children,
    feature,
    title,
    description,
    hideChildren = false
}: PreviewGateProps) {
    const { hasAccess, isLoading, isAuthenticated } = useAuth()

    // While loading, we might want to show a skeleton or just render children normally 
    // until we know for sure. For better UX, usually better to wait or show nothing?
    // Let's show children but maybe with a spinner if it's critical?
    // Actually, 'auth-provider' starts with isLoading=true.
    // We'll just render children to avoid layout shift, but maybe pointer-events-none?
    if (isLoading) {
        return <div className="animate-pulse">{children}</div>
    }

    const hasPermission = feature ? hasAccess(feature) : isAuthenticated

    if (hasPermission) {
        return <>{children}</>
    }

    // Access Denied
    if (hideChildren) {
        return <LockedOverlay title={title} description={description} className="relative h-96 w-full bg-slate-50" />
    }

    return (
        <div className="relative w-full overflow-hidden min-h-[400px]">
            {/* Blurred Content */}
            <div className="filter blur-sm select-none pointer-events-none opacity-50 absolute inset-0 -z-10">
                {children}
            </div>

            {/* Ensure the blurred content takes up space, we might need a clone or just render it twice?
          Actually, standard way:
          <div className="relative">
             <div className="blur-sm pointer-events-none select-none">
                {children}
             </div>
             <LockedOverlay ... />
          </div>
      */}
            <div className={cn("transition-all duration-500 ease-in-out", "blur-md opacity-40 select-none pointer-events-none grayscale-[0.5]")} aria-hidden="true">
                {children}
            </div>

            <LockedOverlay
                title={title}
                description={description}
            />
        </div>
    )
}
