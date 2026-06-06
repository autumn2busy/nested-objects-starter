import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from 'lucide-react'
import { BlogMarkdown } from '@/components/blog/BlogMarkdown'
import {
    BLOG_CATEGORIES,
    getApprovedBlogPostBySlug,
    getApprovedBlogPosts,
    getBlogArticleSchema,
    getBlogFaqSchema,
    getBlogPostUrl,
} from '@/lib/blog'
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, generatePageMetadata, getBreadcrumbSchema } from '@/lib/seo'

type Props = {
    params: { slug: string }
}

export function generateStaticParams() {
    return getApprovedBlogPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const post = getApprovedBlogPostBySlug(params.slug)
    if (!post) return {}

    return {
        ...generatePageMetadata({
            title: `${post.title} | ${SITE_NAME} Blog`,
            description: post.description,
            path: `/blog/${post.slug}`,
            type: 'article',
            image: DEFAULT_OG_IMAGE,
        }),
        keywords: post.keywords,
        openGraph: {
            type: 'article',
            url: getBlogPostUrl(post),
            title: post.title,
            description: post.description,
            siteName: SITE_NAME,
            images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: post.title }],
            publishedTime: post.publishedAt,
            modifiedTime: post.updatedAt,
            authors: [post.author.name],
            tags: post.tags,
        },
    }
}

export default function BlogPostPage({ params }: Props) {
    const post = getApprovedBlogPostBySlug(params.slug)

    if (!post) notFound()

    const category = BLOG_CATEGORIES[post.category]
    const articleSchema = getBlogArticleSchema(post)
    const faqSchema = getBlogFaqSchema(post)
    const breadcrumbSchema = getBreadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Blog', url: `${SITE_URL}/blog` },
        { name: category.label, url: `${SITE_URL}/blog/category/${post.category}` },
        { name: post.title, url: getBlogPostUrl(post) },
    ])

    return (
        <>
            {[articleSchema, breadcrumbSchema, faqSchema].filter(Boolean).map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
            <main className="min-h-screen bg-brand-sand text-slate-950">
                <article>
                    <header className="border-b border-slate-200 bg-white">
                        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
                            <Link
                                href="/blog"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-tealDark"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Blog
                            </Link>

                            <div className="mt-8">
                                <Link
                                    href={`/blog/category/${post.category}`}
                                    className="inline-flex rounded-full bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand"
                                >
                                    {category.label}
                                </Link>
                                <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{post.title}</h1>
                                <p className="mt-5 text-lg leading-8 text-slate-600">{post.description}</p>
                            </div>

                            <div className="mt-7 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                <span>{post.author.name}</span>
                                <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    {post.readTime}
                                </span>
                                <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
                                <span>
                                    Updated{' '}
                                    {new Date(post.updatedAt).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </span>
                            </div>
                        </div>
                    </header>

                    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8 lg:py-14">
                        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                            <BlogMarkdown content={post.content} />

                            {post.faq.length > 0 && (
                                <section className="mt-12 border-t border-slate-200 pt-8">
                                    <h2 className="text-2xl font-bold text-slate-950">Frequently Asked Questions</h2>
                                    <div className="mt-5 space-y-4">
                                        {post.faq.map((item) => (
                                            <details key={item.question} className="rounded-xl border border-slate-200 bg-slate-50">
                                                <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-slate-950 [&::-webkit-details-marker]:hidden">
                                                    {item.question}
                                                </summary>
                                                <p className="border-t border-slate-200 px-5 py-4 text-sm leading-6 text-slate-600">
                                                    {item.answer}
                                                </p>
                                            </details>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
                            <div className="rounded-2xl border border-brand/20 bg-white p-5 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-widest text-brand">Human Review</p>
                                <p className="mt-2 text-sm font-semibold text-slate-950">
                                    Approved {post.review.approvedAt}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    This owned article passed the Nested Objects editorial checklist before publication.
                                </p>
                                <ul className="mt-4 space-y-2">
                                    {post.review.checklist.slice(0, 3).map((item) => (
                                        <li key={item} className="flex gap-2 text-xs leading-5 text-slate-600">
                                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                    Related Nested Objects resources
                                </p>
                                <div className="mt-4 space-y-3">
                                    {post.internalLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="group block rounded-xl border border-slate-200 p-4 transition hover:border-brand/30 hover:bg-brand/5"
                                        >
                                            <span className="flex items-center justify-between gap-3 text-sm font-bold text-slate-950 group-hover:text-brand">
                                                {link.label}
                                                <ArrowRight className="h-4 w-4 shrink-0" />
                                            </span>
                                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                                                {link.description}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </aside>
                    </div>
                </article>
            </main>
        </>
    )
}
