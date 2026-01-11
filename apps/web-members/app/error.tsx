'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
            <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600">
                <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Something went wrong!</h2>
            <p className="mb-6 max-w-md text-slate-600">
                We encountered an unexpected error. Our team has been notified.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => reset()} variant="secondary">
                    Try again
                </Button>
                <Button onClick={() => window.location.href = '/'} variant="ghost">
                    Go Home
                </Button>
            </div>
        </div>
    )
}
