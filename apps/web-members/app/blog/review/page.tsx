import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, Clock, Eye, FileText, Lock, PencilLine } from 'lucide-react'
import { BlogApproveButton } from '@/components/blog/BlogApproveButton'
import { BLOG_CATEGORIES, type BlogPost, getAllBlogPosts } from '@/lib/blog'
import { getBlogReviewerSession } from '@/lib/blog-admin-auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Blog Review | Nested Objects',
    description: 'Private editorial review dashboard for Nested Objects member blog posts.',
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

const STATUS_STYLES: Record<BlogPost['status'], string> = {
    draft: 'border-slate-200 bg-slate-50 text-slate-700',
    review: 'border-amber-200 bg-amber-50 text-amber-800',
    approved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    archived: 'border-zinc-200 bg-zinc-50 text-zinc-500',
}

function statusLabel(status: BlogPost['status']) {
    return status.charAt(0).toUpperCase() + status.slice(1)
}

function sortWeight(status: BlogPost['status']) {
    switch (status) {
        case 'review':
            return 0
        case 'draft':
            return 1
        case 'approved':
            return 2
        case 'archived':
            return 3
        default:
            return 4
    }
}

export default async function BlogReviewPage() {
    const { user, isReviewer } = await getBlogReviewerSession()

    if (!user) {
        redirect('/')
    }

    if (!isReviewer) {
        redirect('/profile')
    }

    const posts = getAllBlogPosts().sort((a, b) => {
        const statusDiff = sortWeight(a.status) - sortWeight(b.status)
        if (statusDiff !== 0) return statusDiff
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    const reviewCount = posts.filter((post) => post.status === 'review').length
    const draftCount = posts.filter((post) => post.status === 'draft').length
    const approvedCount = posts.filter((post) => post.status === 'approved').length

    return (
        <main className="min-h-screen bg-brand-sand text-slate-950">
            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand">
                                <Lock className="h-4 w-4" />
                                Private Editorial Dashboard
                            </p>
                            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                                Blog Review
                            </h1>
                            <p className="mt-4 text-base leading-7 text-slate-600">
                                Review drafts visually, add human value in the content registry, then approve posts with
                                a GitHub-backed approval commit before they appear on the public blog and sitemap.
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                                <p className="text-2xl font-bold text-amber-800">{reviewCount}</p>
                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Review</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-2xl font-bold text-slate-800">{draftCount}</p>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Draft</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                <p className="text-2xl font-bold text-emerald-800">{approvedCount}</p>
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Live</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:py-10">
                <div className="space-y-4">
                    {posts.map((post) => {
                        const category = BLOG_CATEGORIES[post.category]
                        const canOpenLive = post.status === 'approved'

                        return (
                            <article key={post.slug} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[post.status]}`}>
                                                {statusLabel(post.status)}
                                            </span>
                                            <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
                                                {category.label}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                                <Clock className="h-3.5 w-3.5" />
                                                Updated {post.updatedAt}
                                            </span>
                                        </div>
                                        <h2 className="mt-3 text-xl font-bold leading-snug text-slate-950">
                                            {post.title}
                                        </h2>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">{post.excerpt}</p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {post.keywords.slice(0, 3).map((keyword) => (
                                                <span key={keyword} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                                        <Link
                                            href={`/blog/preview/${post.slug}`}
                                            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                                        >
                                            <Eye className="h-4 w-4" />
                                            Preview
                                        </Link>
                                        {canOpenLive && (
                                            <Link
                                                href={`/blog/${post.slug}`}
                                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Live
                                            </Link>
                                        )}
                                        {!canOpenLive && post.status !== 'archived' && (
                                            <BlogApproveButton slug={post.slug} />
                                        )}
                                    </div>
                                </div>
                            </article>
                        )
                    })}
                </div>

                <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
                    <div className="rounded-2xl border border-brand/20 bg-white p-5 shadow-sm">
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand">
                            <PencilLine className="h-4 w-4" />
                            Approval Steps
                        </p>
                        <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                            <li>1. Open the preview route for the post.</li>
                            <li>2. Edit the article text in <span className="font-mono text-xs">apps/web-members/lib/blog.ts</span> if it needs owner insight, field notes, examples, or corrections.</li>
                            <li>3. Click Approve when the post is ready.</li>
                            <li>4. The approval button commits <span className="font-mono text-xs">status</span>, <span className="font-mono text-xs">approvedBy</span>, and <span className="font-mono text-xs">approvedAt</span> to GitHub.</li>
                        </ol>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            Required Config
                        </p>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            Approval writes require a server-only <span className="font-mono text-xs">BLOG_GITHUB_TOKEN</span>.
                            Without it, previews still work but approvals return a setup message.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                        <p className="flex items-center gap-2 text-sm font-bold">
                            <CheckCircle2 className="h-4 w-4" />
                            Gating
                        </p>
                        <p className="mt-2 text-sm leading-6">
                            This page is available at <span className="font-mono text-xs">/blog/review</span> only for logged-in reviewers/admins.
                            Public visitors are redirected away.
                        </p>
                    </div>
                </aside>
            </section>
        </main>
    )
}
