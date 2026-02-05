'use client'

import { useEffect } from 'react'
import { ErrorView } from '@/components/ui/error-view'

export default function ToolsError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Tools error:', error)
    }, [error])

    return (
        <div className="container py-12">
            <div className="rounded-2xl border border-red-100 bg-red-50/50">
                <ErrorView
                    title="Tool Unavailable"
                    message="We ran into an issue loading this tool. Please try refreshing."
                    reset={reset}
                />
            </div>
        </div>
    )
}
