import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getGuideBySlug, getGuideSlugs } from '@/lib/guides'
import { GuideLayout } from '@/components/GuideLayout'
import { guideMDXComponents } from '@/components/guide-mdx-components'

type Props = {
  params: { slug: string }
}

export async function generateStaticParams() {
  return getGuideSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getGuideBySlug(params.slug)
  if (!guide) return {}

  const { frontmatter: fm } = guide
  return {
    title: `${fm.title} | Nested Objects`,
    description: fm.description,
    keywords: fm.keywords,
    openGraph: {
      title: fm.title,
      description: fm.description,
      url: `https://nestedobjects.com/guides/${params.slug}`,
      type: 'article',
      publishedTime: fm.publishedAt,
      modifiedTime: fm.updatedAt,
      ...(fm.ogImage ? { images: [fm.ogImage] } : {}),
    },
    alternates: {
      canonical: `https://nestedobjects.com/guides/${params.slug}`,
    },
  }
}

export default function GuidePage({ params }: Props) {
  const guide = getGuideBySlug(params.slug)
  if (!guide) notFound()

  return (
    <GuideLayout frontmatter={guide.frontmatter}>
      <MDXRemote source={guide.content} components={guideMDXComponents} />
    </GuideLayout>
  )
}
