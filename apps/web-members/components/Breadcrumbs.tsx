import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getBreadcrumbSchema } from '@/lib/seo'

type BreadcrumbItem = {
    name: string
    url: string
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
    const schema = getBreadcrumbSchema(items)

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center text-sm">
                <ol className="flex items-center space-x-2">
                    {items.map((item, index) => {
                        const isLast = index === items.length - 1

                        return (
                            <li key={item.url} className="flex items-center">
                                {isLast ? (
                                    <span className="text-slate-900 font-semibold" aria-current="page">
                                        {item.name}
                                    </span>
                                ) : (
                                    <>
                                        <Link
                                            href={item.url}
                                            className="text-slate-500 hover:text-brand-copper transition-colors"
                                        >
                                            {item.name}
                                        </Link>
                                        <ChevronRight className="h-4 w-4 mx-1 text-slate-300" aria-hidden="true" />
                                    </>
                                )}
                            </li>
                        )
                    })}
                </ol>
            </nav>
        </>
    )
}
