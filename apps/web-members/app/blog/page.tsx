import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react'
import { BlogCard } from '@/components/blog/BlogCard'
import {
    BLOG_CATEGORIES,
    getApprovedBlogPosts,
    getBlogCategoryEntries,
    getBlogItemListSchema,
} from '@/lib/blog'
import { generatePageMetadata, SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
    ...generatePageMetadata({
        title: 'Nested Objects Blog | Field Inspection Strategy',
        description:
            'First-party Nested Objects articles for field inspectors, property preservation contractors, mobile notaries, and field service operators.',
        path: '/blog',
    }),
    keywords: [
        'field inspection blog',
        'property preservation blog',
        'field inspector strategy',
        'mortgage field services',
        'Nested Objects blog',
    ],
}

export default function BlogIndexPage() {
    const posts = getApprovedBlogPosts()
    const categories = getBlogCategoryEntries().filter((category) => category.posts.length > 0)
    const itemListSchema = getBlogItemListSchema(posts, `${SITE_URL}/blog`, 'Nested Objects Blog')

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
            />
            <main className="min-h-screen bg-brand-sand text-slate-950">
                <section className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
                        <div className="max-w-4xl">
                            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand">
                                <BookOpen className="h-5 w-5" />
                                Owned Field Services Blog
                            </p>
                            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                                First-party strategy for inspectors building better routes.
                            </h1>
                            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                                These are Nested Objects articles, not syndicated RSS headlines. Each published post passes a
                                human review checklist, includes internal links, and is eligible for Article schema and sitemap
                                inclusion.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-slate-700">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
                                    Approved posts only
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
                                    Article schema
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
                                    AEO answer blocks
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-b border-slate-200 bg-brand-sand">
                    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                        <div className="flex flex-wrap gap-3">
                            {categories.map((category) => (
                                <Link
                                    key={category.slug}
                                    href={`/blog/category/${category.slug}`}
                                    className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-brand/40 hover:text-brand"
                                >
                                    {BLOG_CATEGORIES[category.slug].label}
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                                        {category.posts.length}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-white">
                    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8 lg:grid-cols-3 lg:py-14">
                        {posts.map((post) => (
                            <BlogCard key={post.slug} post={post} />
                        ))}
                    </div>
                </section>

                <section className="border-t border-slate-200 bg-brand-mist">
                    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                        <div>
                            <p className="text-sm font-bold text-slate-950">Need fast-moving headlines?</p>
                            <p className="mt-1 text-sm text-slate-600">
                                Industry News remains the RSS-based market pulse. The blog is for reviewed first-party guidance.
                            </p>
                        </div>
                        <Link
                            href="/inspector-resource-center/industry-news"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-tealDark"
                        >
                            Open Industry News
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </section>
            </main>
        </>
    )
}
