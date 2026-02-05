import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Button } from './button'

interface ErrorViewProps {
    title?: string
    message?: string
    reset?: () => void
    showHome?: boolean
}

export function ErrorView({
    title = 'Something went wrong',
    message = 'We encountered an error while loading this page.',
    reset,
    showHome = true,
}: ErrorViewProps) {
    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>

            <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
            <p className="mb-8 max-w-md text-slate-600">{message}</p>

            <div className="flex flex-col gap-3 sm:flex-row">
                {reset && (
                    <Button onClick={reset} variant="secondary" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Try again
                    </Button>
                )}

                {showHome && (
                    <Link href="/">
                        <Button variant="ghost" className="gap-2">
                            <Home className="h-4 w-4" />
                            Go home
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    )
}
