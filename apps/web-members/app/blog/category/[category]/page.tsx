import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { BlogCard } from '@/components/blog/BlogCard'
import {
    BLOG_CATEGORIES,
    type BlogCategorySlug,
    getApprovedBlogPostsByCategory,
    getBlogCategoryUrl,
    getBlogCategoryEntries,
    getBlogItemListSchema,
} from '@/lib/blog'
import { generatePageMetadata } from '@/lib/seo'

type Props = {
    params: { category: string }
}

function isBlogCategorySlug(category: string): category is BlogCategorySlug {
    return category in BLOG_CATEGORIES
}

export function generateStaticParams() {
    return getBlogCategoryEntries()
        .filter((category) => category.posts.length > 0)
        .map((category) => ({ category: category.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    if (!isBlogCategorySlug(params.category)) return {}

    const category = BLOG_CATEGORIES[params.category]

    return {
        ...generatePageMetadata({
            title: `${category.label} Articles | Nested Objects Blog`,
            description: category.description,
            path: `/blog/category/${params.category}`,
        }),
        keywords: [category.label, 'Nested Objects blog', 'field services strategy'],
    }
}

export default function BlogCategoryPage({ params }: Props) {
    if (!isBlogCategorySlug(params.category)) notFound()

    const category = BLOG_CATEGORIES[params.category]
    const posts = getApprovedBlogPostsByCategory(params.category)

    if (posts.length === 0) notFound()

    const itemListSchema = getBlogItemListSchema(
        posts,
        getBlogCategoryUrl(params.category),
        `${category.label} Articles`,
    )

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
            />
            <main className="min-h-screen bg-brand-sand text-slate-950">
                <section className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-tealDark"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Blog
                        </Link>
                        <div className="mt-7 max-w-3xl">
                            <p className="text-sm font-bold uppercase tracking-widest text-brand">Blog Category</p>
                            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{category.label}</h1>
                            <p className="mt-4 text-base leading-7 text-slate-600">{category.description}</p>
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
            </main>
        </>
    )
}
