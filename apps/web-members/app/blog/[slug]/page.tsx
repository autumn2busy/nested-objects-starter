import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogPostArticle } from '@/components/blog/BlogPostArticle'
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
            <BlogPostArticle post={post} mode="public" />
        </>
    )
}
