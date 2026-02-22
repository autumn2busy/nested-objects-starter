import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

/**
 * GET /api/kb/articles/[slug]
 * 
 * Returns a single published KB article by slug.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const { slug } = params

        if (!slug) {
            return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
        }

        const supabase = createServiceRoleClient()

        const { data, error } = await supabase
            .from('kb_articles')
            .select('*')
            .eq('slug', slug)
            .eq('status', 'published')
            .single()

        if (error || !data) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 })
        }

        return NextResponse.json({ article: data })
    } catch (err) {
        console.error('KB article fetch error:', err)
        return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
    }
}

/**
 * POST /api/kb/articles/[slug]
 * 
 * Submit helpful/not-helpful feedback for an article.
 * Body: { helpful: boolean }
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const { slug } = params
        const { helpful } = await req.json()

        if (typeof helpful !== 'boolean') {
            return NextResponse.json({ error: 'helpful must be a boolean' }, { status: 400 })
        }

        const supabase = createServiceRoleClient()

        // Get current article
        const { data: article } = await supabase
            .from('kb_articles')
            .select('id, helpful_yes, helpful_no')
            .eq('slug', slug)
            .single()

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 })
        }

        // Increment the appropriate counter
        const field = helpful ? 'helpful_yes' : 'helpful_no'
        const { error: updateError } = await supabase
            .from('kb_articles')
            .update({ [field]: (article[field] || 0) + 1 })
            .eq('id', article.id)

        if (updateError) {
            return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('KB feedback error:', err)
        return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
    }
}