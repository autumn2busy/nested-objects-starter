import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header Skeleton */}
            <div className="mb-8 flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Grid Skeleton */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Card 1 */}
                <div className="col-span-1 space-y-3 rounded-xl border border-slate-200 p-6">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="pt-4">
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>

                {/* Card 2 */}
                <div className="col-span-1 space-y-3 rounded-xl border border-slate-200 p-6">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-32 w-full" />
                </div>

                {/* Card 3 */}
                <div className="col-span-1 space-y-3 rounded-xl border border-slate-200 p-6">
                    <Skeleton className="h-6 w-1/2" />
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            </div>
        </div>
    )
}
