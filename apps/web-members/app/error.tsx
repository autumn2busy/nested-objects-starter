'use client'

import { useEffect } from 'react'
import { ErrorView } from '@/components/ui/error-view'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Global error:', error)
    }, [error])

    return (
        <div className="flex min-h-screen items-center justify-center bg-white">
            <ErrorView
                title="Application Error"
                message="A critical error occurred. Please refresh the page or try again."
                reset={reset}
            />
        </div>
    )
}
