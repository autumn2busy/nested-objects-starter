import { NextResponse } from 'next/server'
import { getPreviewableBlogPostBySlug } from '@/lib/blog'
import { getBlogReviewerSession } from '@/lib/blog-admin-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type GitHubContentResponse = {
    sha: string
    content: string
}

type GitHubUpdateResponse = {
    commit?: {
        html_url?: string
    }
}

type BlogApprovalsFile = {
    approvals: Record<
        string,
        {
            status?: string
            approvedBy?: string
            approvedAt?: string
            updatedAt?: string
            notes?: string
        }
    >
}

const APPROVALS_PATH = 'apps/web-members/content/blog-approvals.json'

function getApprovalDate() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date())
}

function getGitHubConfig() {
    const token = process.env.BLOG_GITHUB_TOKEN || process.env.GITHUB_TOKEN
    const owner = process.env.BLOG_GITHUB_OWNER || 'autumn2busy'
    const repo = process.env.BLOG_GITHUB_REPO || 'nested-objects-starter'
    const branch = process.env.BLOG_GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || 'main'

    return { token, owner, repo, branch }
}

function githubHeaders(token: string) {
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
    }
}

function decodeGitHubContent(content: string) {
    return Buffer.from(content.replace(/\n/g, ''), 'base64').toString('utf8')
}

function encodeGitHubContent(content: string) {
    return Buffer.from(content).toString('base64')
}

function parseApprovalFile(content: string): BlogApprovalsFile | null {
    try {
        const parsed = JSON.parse(content) as Partial<BlogApprovalsFile>
        return {
            approvals: parsed.approvals && typeof parsed.approvals === 'object' ? parsed.approvals : {},
        }
    } catch {
        return null
    }
}

export async function POST(request: Request) {
    const { user, isReviewer } = await getBlogReviewerSession()

    if (!user || !isReviewer) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const slug = typeof body?.slug === 'string' ? body.slug.trim() : ''

    if (!slug) {
        return NextResponse.json({ error: 'Missing blog post slug' }, { status: 400 })
    }

    const post = getPreviewableBlogPostBySlug(slug)
    if (!post) {
        return NextResponse.json({ error: 'Post not found or archived' }, { status: 404 })
    }

    const { token, owner, repo, branch } = getGitHubConfig()
    if (!token) {
        return NextResponse.json(
            {
                error:
                    'GitHub approval is not configured. Set BLOG_GITHUB_TOKEN in Vercel or your local environment.',
            },
            { status: 503 },
        )
    }

    const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${APPROVALS_PATH}?ref=${encodeURIComponent(branch)}`

    const currentFileResponse = await fetch(fileUrl, {
        method: 'GET',
        headers: githubHeaders(token),
        cache: 'no-store',
    })

    if (!currentFileResponse.ok) {
        const errorText = await currentFileResponse.text()
        return NextResponse.json(
            {
                error: 'Could not read blog approvals file from GitHub',
                detail: errorText,
                branch,
            },
            { status: currentFileResponse.status },
        )
    }

    const currentFile = (await currentFileResponse.json()) as GitHubContentResponse
    const approvalFile = parseApprovalFile(decodeGitHubContent(currentFile.content))

    if (!approvalFile) {
        return NextResponse.json(
            {
                error: 'Blog approvals file contains invalid JSON',
                branch,
            },
            { status: 500 },
        )
    }

    const approvedAt = getApprovalDate()
    const approvedBy =
        typeof user.email === 'string' && user.email
            ? user.email
            : typeof user.name === 'string' && user.name
              ? user.name
              : 'Nested Objects reviewer'

    approvalFile.approvals[slug] = {
        ...approvalFile.approvals[slug],
        status: 'approved',
        approvedBy,
        approvedAt,
        updatedAt: approvedAt,
        notes: `Approved from /blog/review by ${approvedBy}`,
    }

    const nextContent = `${JSON.stringify(approvalFile, null, 2)}\n`
    const updateResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${APPROVALS_PATH}`, {
        method: 'PUT',
        headers: githubHeaders(token),
        body: JSON.stringify({
            message: `Approve member blog post: ${slug}`,
            content: encodeGitHubContent(nextContent),
            sha: currentFile.sha,
            branch,
        }),
    })

    if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        return NextResponse.json(
            {
                error: 'Could not commit blog approval to GitHub',
                detail: errorText,
                branch,
            },
            { status: updateResponse.status },
        )
    }

    const updateResult = (await updateResponse.json()) as GitHubUpdateResponse

    return NextResponse.json({
        ok: true,
        slug,
        approvedBy,
        approvedAt,
        branch,
        commitUrl: updateResult?.commit?.html_url || null,
    })
}
