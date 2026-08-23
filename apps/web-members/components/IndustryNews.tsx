'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Newspaper, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'

interface NewsArticle {
    source: string
    title: string
    description: string | null
    url: string
    image: string | null
    publishedAt: string
}

interface IndustryNewsProps {
    /** Maximum number of articles to display */
    limit?: number
    /** Display as a compact sidebar widget vs full list */
    variant?: 'full' | 'compact'
}

export function IndustryNews({ limit = 12, variant = 'full' }: IndustryNewsProps) {
    const [articles, setArticles] = useState<NewsArticle[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchNews() {
            try {
                const res = await fetch('/api/industry-news')
                const data = await res.json()

                if (!res.ok) {
                    setError(data.error || 'Failed to load news')
                    return
                }

                setArticles(data.articles?.slice(0, limit) || [])
            } catch {
                setError('Unable to connect to news service')
            } finally {
                setLoading(false)
            }
        }

        fetchNews()
    }, [limit])

    // Format date to readable string
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    const isLocalImage = (src: string) => src.startsWith('/')

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand-copper" />
                <span className="ml-3 text-slate-600">Loading industry news...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-amber-600" />
                <p className="mt-2 text-sm font-medium text-amber-800">{error}</p>
                <p className="mt-1 text-xs text-amber-600">
                    Please check that the RSS news feed service is available.
                </p>
            </div>
        )
    }

    if (articles.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                <Newspaper className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm text-slate-600">No news articles available at this time.</p>
            </div>
        )
    }

    // Compact variant for sidebar use
    if (variant === 'compact') {
        return (
            <div className="space-y-3">
                {articles.slice(0, 5).map((article, index) => (
                    <a
                        key={index}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border border-slate-200 bg-white p-3 transition hover:border-brand-copper/30 hover:shadow-sm"
                    >
                        <p className="text-xs font-medium text-brand-copper">{article.source}</p>
                        <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-900">{article.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(article.publishedAt)}</p>
                    </a>
                ))}
            </div>
        )
    }

    // Full variant for dedicated page
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, index) => (
                <article
                    key={index}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-copper/30 hover:shadow-md"
                >
                    {/* Image */}
                    <div className="relative h-40 w-full bg-slate-100">
                        {article.image ? (
                            isLocalImage(article.image) ? (
                                <Image
                                    src={article.image}
                                    alt={article.title}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                // RSS feeds can point to many third-party CDNs, so use a plain image for remote article art.
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={article.image}
                                    alt={article.title}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                />
                            )
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <Newspaper className="h-10 w-10 text-slate-300" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-4">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-brand-copper">{article.source}</span>
                            <span className="text-slate-500">{formatDate(article.publishedAt)}</span>
                        </div>

                        <h3 className="mt-2 line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-brand-copper">
                            {article.title}
                        </h3>

                        {article.description && (
                            <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">
                                {article.description}
                            </p>
                        )}

                        <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-copper transition hover:text-brand-copperDark"
                        >
                            Read full article
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </div>
                </article>
            ))}
        </div>
    )
}
