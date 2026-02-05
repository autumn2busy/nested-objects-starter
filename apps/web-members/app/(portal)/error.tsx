'use client'

import { useEffect } from 'react'
import { ErrorView } from '@/components/ui/error-view'

export default function PortalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Portal error:', error)
    }, [error])

    return (
        <div className="flex h-full min-h-[600px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
            <ErrorView
                title="Hub Unavailable"
                message="We couldn't load your dashboard content. This may be a temporary connection issue."
                reset={reset}
            />
        </div>
    )
}
