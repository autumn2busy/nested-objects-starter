import { ErrorView } from '@/components/ui/error-view'

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-white">
            <ErrorView
                title="Page not found"
                message="We couldn’t find the page you were looking for."
                showHome
            />
        </div>
    )
}
