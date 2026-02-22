import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const JINA_API_KEY = process.env.JINA_API_KEY
const JINA_MODEL = 'jina-embeddings-v3'
const JINA_DIMENSIONS = 1024

/**
 * POST /api/kb/search
 * 
 * Body: { query: string, limit?: number }
 * 
 * Returns top matching KB articles via semantic search (Jina AI).
 * Falls back to text search if embeddings aren't available.
 * 
 * Used by:
 * - Frontend /help search
 * - n8n support agent workflow
 * - AI Concierge (future)
 */
export async function POST(req: NextRequest) {
    try {
        const { query, limit = 5 } = await req.json()

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 })
        }

        const supabase = createServiceRoleClient()

        // Try semantic search first (requires Jina API key + embeddings in DB)
        if (JINA_API_KEY) {
            try {
                const embResponse = await fetch('https://api.jina.ai/v1/embeddings', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${JINA_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: JINA_MODEL,
                        input: [query.trim()],
                        dimensions: JINA_DIMENSIONS,
                        task: 'retrieval.query',
                    }),
                })

                if (embResponse.ok) {
                    const embData = await embResponse.json() as {
                        data: { embedding: number[] }[]
                    }
                    const queryEmbedding = embData.data[0].embedding

                    const { data: semanticResults, error: rpcError } = await supabase
                        .rpc('search_kb', {
                            query_embedding: JSON.stringify(queryEmbedding),
                            match_count: limit,
                            match_threshold: 0.5,
                        })

                    if (!rpcError && semanticResults && semanticResults.length > 0) {
                        const seen = new Set<string>()
                        const deduped = semanticResults.filter((r: { article_id: string }) => {
                            if (seen.has(r.article_id)) return false
                            seen.add(r.article_id)
                            return true
                        })

                        return NextResponse.json({
                            results: deduped,
                            method: 'semantic',
                            count: deduped.length,
                        })
                    }
                }
            } catch (embError) {
                console.warn('Semantic search failed, falling back to text search:', embError)
            }
        }

        // Fallback: Postgres full-text search
        const { data: textResults, error: textError } = await supabase
            .rpc('search_kb_text', {
                search_query: query.trim(),
                match_count: limit,
            })

        if (textError) {
            console.error('Text search error:', textError)

            const { data: likeResults } = await supabase
                .from('kb_articles')
                .select('id, slug, title, category, summary')
                .eq('status', 'published')
                .or(`title.ilike.%${query}%,body.ilike.%${query}%,summary.ilike.%${query}%`)
                .limit(limit)

            return NextResponse.json({
                results: likeResults || [],
                method: 'fallback',
                count: likeResults?.length || 0,
            })
        }

        return NextResponse.json({
            results: textResults || [],
            method: 'text',
            count: textResults?.length || 0,
        })
    } catch (err) {
        console.error('KB search error:', err)
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
}

/**
 * GET /api/kb/search?q=...&limit=5
 */
export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get('q')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '5')

    if (!q) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
    }

    const fakeReq = new NextRequest(req.url, {
        method: 'POST',
        body: JSON.stringify({ query: q, limit }),
        headers: { 'Content-Type': 'application/json' },
    })

    return POST(fakeReq)
}