import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, Clock, Eye, FileText, Lightbulb, Lock, PencilLine } from 'lucide-react'
import { BlogApproveButton } from '@/components/blog/BlogApproveButton'
import { BLOG_CATEGORIES, type BlogPost, getAllBlogPosts } from '@/lib/blog'
import { getBlogReviewerSession } from '@/lib/blog-admin-auth'
import seoOpportunitiesJson from '@/content/seo-content-opportunities.json'
import aiAeoOpportunitiesJson from '@/content/ai-aeo-opportunities.json'

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

type SeoOpportunity = {
    id: string
    title: string
    angle: string
    category: keyof typeof BLOG_CATEGORIES
    priority: 'high' | 'medium' | 'low'
    score: number
    recommendedSurface: string
    workflowStatus: 'candidate'
    targetKeywords: string[]
    internalLinks: { label: string; href: string }[]
    rationale: string
    sourceSignals: string[]
}

type SeoOpportunityReport = {
    generatedAt?: string | null
    cadence?: string
    workflowBoundary?: string
    opportunities?: SeoOpportunity[]
}

const seoOpportunityReport = seoOpportunitiesJson as SeoOpportunityReport

type AiAeoOpportunity = {
    id: string
    prompt: string
    intent: string
    priority: 'high' | 'medium' | 'low'
    score: number
    recommendedAction: string
    targetPage: string
    answerGap: string
    recommendedAnswerElements: string[]
    internalLinks: { label: string; href: string }[]
    observedBrands: string[]
    workflowStatus: 'candidate'
}

type AiAeoOpportunityReport = {
    generatedAt?: string | null
    cadence?: string
    opportunities?: AiAeoOpportunity[]
}

const aiAeoOpportunityReport = aiAeoOpportunitiesJson as AiAeoOpportunityReport

const PRIORITY_STYLES: Record<SeoOpportunity['priority'], string> = {
    high: 'border-red-200 bg-red-50 text-red-800',
    medium: 'border-amber-200 bg-amber-50 text-amber-800',
    low: 'border-slate-200 bg-slate-50 text-slate-700',
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

function formatGeneratedAt(value?: string | null) {
    if (!value) return 'Waiting for first weekly run'

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
    }).format(new Date(value))
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
    const seoOpportunities = (seoOpportunityReport.opportunities || []).slice(0, 6)
    const aiAeoOpportunities = (aiAeoOpportunityReport.opportunities || []).slice(0, 4)

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
                    <section className="rounded-2xl border border-brand/20 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand">
                                    <Lightbulb className="h-4 w-4" />
                                    SEO Opportunity Queue
                                </p>
                                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                                    Weekly content candidates
                                </h2>
                                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                                    These are recommendations only. Drafts still need to be written into the existing blog
                                    registry, previewed, reviewed, and approved before anything reaches the public blog or sitemap.
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                <p className="font-semibold text-slate-900">Last run</p>
                                <p>{formatGeneratedAt(seoOpportunityReport.generatedAt)}</p>
                                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                                    Cadence: {seoOpportunityReport.cadence || 'weekly'}
                                </p>
                            </div>
                        </div>

                        {seoOpportunities.length === 0 ? (
                            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                                No SEO opportunities have been generated yet. The weekly monitor will populate this queue after
                                its first run, or it can be tested with the dry-run cron route.
                            </div>
                        ) : (
                            <div className="mt-5 grid gap-4">
                                {seoOpportunities.map((opportunity) => {
                                    const category = BLOG_CATEGORIES[opportunity.category]

                                    return (
                                        <article key={opportunity.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${PRIORITY_STYLES[opportunity.priority]}`}>
                                                            {opportunity.priority} priority
                                                        </span>
                                                        {category && (
                                                            <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
                                                                {category.label}
                                                            </span>
                                                        )}
                                                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                                            Score {opportunity.score}
                                                        </span>
                                                    </div>
                                                    <h3 className="mt-3 text-lg font-bold leading-snug text-slate-950">
                                                        {opportunity.title}
                                                    </h3>
                                                    <p className="mt-2 text-sm leading-6 text-slate-600">{opportunity.angle}</p>
                                                    <p className="mt-2 text-xs leading-5 text-slate-500">{opportunity.rationale}</p>
                                                </div>
                                                <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                    {opportunity.recommendedSurface.replace(/_/g, ' ')}
                                                </span>
                                            </div>

                                            {opportunity.targetKeywords.length > 0 && (
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {opportunity.targetKeywords.slice(0, 4).map((keyword) => (
                                                        <span key={keyword} className="rounded-full bg-white px-3 py-1 text-xs text-slate-600">
                                                            {keyword}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {opportunity.internalLinks.slice(0, 3).map((link) => (
                                                    <Link
                                                        key={`${opportunity.id}-${link.href}`}
                                                        href={link.href}
                                                        className="text-xs font-semibold text-brand underline underline-offset-2"
                                                    >
                                                        {link.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                        )}
                    </section>

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

                    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 text-violet-950 shadow-sm">
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-800">
                            <Lightbulb className="h-4 w-4" />
                            AI / AEO Queue
                        </p>
                        <p className="mt-3 text-sm leading-6">
                            Last run: {formatGeneratedAt(aiAeoOpportunityReport.generatedAt)}
                        </p>
                        {aiAeoOpportunities.length === 0 ? (
                            <p className="mt-3 text-sm leading-6">
                                The weekly AEO monitor will populate prompt gaps after its first run.
                            </p>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {aiAeoOpportunities.map((opportunity) => (
                                    <div key={opportunity.id} className="rounded-xl border border-violet-200 bg-white/80 p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${PRIORITY_STYLES[opportunity.priority]}`}>
                                                {opportunity.priority}
                                            </span>
                                            <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                                                Score {opportunity.score}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm font-semibold leading-5">{opportunity.prompt}</p>
                                        <Link href={opportunity.targetPage} className="mt-2 inline-flex text-xs font-semibold underline">
                                            Target answer page
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
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
