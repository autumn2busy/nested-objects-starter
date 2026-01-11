import { Skeleton } from "@/components/ui/skeleton"

export default function DirectoryLoading() {
    return (
        <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6 space-y-2 border-b border-slate-200 pb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-64" />
            </div>

            {/* Filter Bar */}
            <div className="mb-6 h-24 rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex gap-4">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-10 w-2/3" />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                {/* Grid of Cards */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-64 rounded-md border border-slate-200 p-6">
                            <div className="flex gap-4">
                                <Skeleton className="h-14 w-14 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                            <div className="mt-8 space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sidebar */}
                <div className="hidden lg:block">
                    <Skeleton className="h-64 w-full rounded-md" />
                </div>
            </div>
        </div>
    )
}
