import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export default function MembersDirectoryPage() {
    return (
        <div className="container mx-auto py-12 px-4">
            <div className="max-w-4xl mx-auto text-center space-y-6">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                    Members Directory
                </h1>
                <p className="text-lg text-slate-600">
                    Browse our network of verified independent field inspectors and notaries.
                </p>

                <div className="p-12 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 mt-8">
                    <p className="text-slate-500 italic">
                        Directory listing components coming soon...
                    </p>
                    <p className="text-sm text-slate-400 mt-2">
                        (This page replaces the automatic redirect)
                    </p>
                </div>
            </div>
        </div>
    )
}
