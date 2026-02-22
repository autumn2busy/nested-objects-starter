import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

/**
 * GET /api/kb/articles?category=getting-started&limit=20
 * 
 * Returns published KB articles, optionally filtered by category.
 */
export async function GET(req: NextRequest) {
    try {
        const category = req.nextUrl.searchParams.get('category')
        const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')

        const supabase = createServiceRoleClient()

        let query = supabase
            .from('kb_articles')
            .select('id, slug, title, category, summary, tags, sort_order, helpful_yes, helpful_no, updated_at')
            .eq('status', 'published')
            .order('sort_order', { ascending: true })
            .limit(limit)

        if (category) {
            query = query.eq('category', category)
        }

        const { data, error } = await query

        if (error) {
            console.error('KB articles fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
        }

        return NextResponse.json({
            articles: data || [],
            count: data?.length || 0,
        })
    } catch (err) {
        console.error('KB articles error:', err)
        return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
    }
}