import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogPostArticle } from '@/components/blog/BlogPostArticle'
import {
    getPreviewableBlogPostBySlug,
    getPreviewableBlogPosts,
} from '@/lib/blog'
import { SITE_NAME } from '@/lib/seo'

type Props = {
    params: { slug: string }
}

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
    return getPreviewableBlogPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const post = getPreviewableBlogPostBySlug(params.slug)

    if (!post) {
        return {
            robots: {
                index: false,
                follow: false,
            },
        }
    }

    return {
        title: `Preview: ${post.title} | ${SITE_NAME} Blog`,
        description: post.description,
        robots: {
            index: false,
            follow: false,
            nocache: true,
            googleBot: {
                index: false,
                follow: false,
                noimageindex: true,
            },
        },
    }
}

export default function BlogPostPreviewPage({ params }: Props) {
    const post = getPreviewableBlogPostBySlug(params.slug)

    if (!post) notFound()

    return <BlogPostArticle post={post} mode="preview" />
}
