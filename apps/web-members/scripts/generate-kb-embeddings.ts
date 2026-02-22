/**
 * generate-kb-embeddings.ts
 * 
 * Reads all published kb_articles from Supabase, chunks them,
 * generates embeddings via Jina AI jina-embeddings-v3,
 * and upserts into kb_embeddings table.
 * 
 * Usage:
 *   JINA_API_KEY=jina_xxx NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/generate-kb-embeddings.ts
 * 
 * Or with .env.local loaded:
 *   npx tsx scripts/generate-kb-embeddings.ts
 * 
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   JINA_API_KEY
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'


// ── Config ──────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const JINA_API_KEY = process.env.JINA_API_KEY!
const JINA_MODEL = 'jina-embeddings-v3'
const JINA_DIMENSIONS = 1024    // Jina v3 default
const CHUNK_SIZE = 500          // approximate tokens per chunk
const CHUNK_OVERLAP = 50        // overlap between chunks

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}
if (!JINA_API_KEY) {
    console.error('❌ Missing JINA_API_KEY — get one free at https://jina.ai/')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
})

// ── Text chunking ───────────────────────────────────────────
function chunkText(text: string, maxChars: number = CHUNK_SIZE * 4, overlapChars: number = CHUNK_OVERLAP * 4): string[] {
    const paragraphs = text.split(/\n\n+/)
    const chunks: string[] = []
    let currentChunk = ''

    for (const para of paragraphs) {
        if (currentChunk.length + para.length > maxChars && currentChunk.length > 0) {
            chunks.push(currentChunk.trim())
            const overlap = currentChunk.slice(-overlapChars)
            currentChunk = overlap + '\n\n' + para
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + para
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim())
    }

    if (chunks.length === 0 && text.trim()) {
        chunks.push(text.trim())
    }

    return chunks
}

// ── Jina AI embeddings ──────────────────────────────────────
async function getEmbeddings(texts: string[], task: 'retrieval.passage' | 'retrieval.query' = 'retrieval.passage'): Promise<number[][]> {
    const response = await fetch('https://api.jina.ai/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${JINA_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: JINA_MODEL,
            input: texts,
            dimensions: JINA_DIMENSIONS,
            task,
        }),
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Jina API error: ${response.status} ${error}`)
    }

    const data = await response.json() as {
        data: { embedding: number[]; index: number }[]
        usage: { total_tokens: number }
    }

    console.log(`   📊 Tokens used: ${data.usage.total_tokens}`)

    return data.data
        .sort((a, b) => a.index - b.index)
        .map(d => d.embedding)
}

// ── Main ────────────────────────────────────────────────────
async function main() {
    console.log('🔍 Fetching published KB articles from Supabase...')

    const { data: articles, error } = await supabase
        .from('kb_articles')
        .select('id, slug, title, category, summary, body, tags')
        .eq('status', 'published')
        .order('category')
        .order('sort_order')

    if (error) {
        console.error('❌ Failed to fetch articles:', error)
        process.exit(1)
    }

    if (!articles || articles.length === 0) {
        console.log('⚠️  No published articles found.')
        return
    }

    console.log(`📚 Found ${articles.length} articles\n`)

    // Delete existing embeddings (clean rebuild)
    console.log('🗑️  Clearing existing embeddings...')
    const { error: deleteError } = await supabase
        .from('kb_embeddings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) {
        console.error('⚠️  Failed to clear embeddings (continuing):', deleteError.message)
    }

    let totalChunks = 0
    let totalArticles = 0

    for (const article of articles) {
        console.log(`\n📝 Processing: ${article.title} [${article.category}]`)

        const contextPrefix = `Title: ${article.title}\nCategory: ${article.category}\n${article.summary ? `Summary: ${article.summary}\n` : ''}\n`
        const fullText = contextPrefix + article.body

        const chunks = chunkText(fullText)
        console.log(`   → ${chunks.length} chunk(s)`)

        const batchSize = 20
        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize)

            try {
                const embeddings = await getEmbeddings(batch, 'retrieval.passage')

                const rows = batch.map((content, idx) => ({
                    article_id: article.id,
                    chunk_index: i + idx,
                    content,
                    embedding: JSON.stringify(embeddings[idx]),
                    metadata: {
                        title: article.title,
                        slug: article.slug,
                        category: article.category,
                        tags: article.tags,
                    },
                }))

                const { error: insertError } = await supabase
                    .from('kb_embeddings')
                    .insert(rows)

                if (insertError) {
                    console.error(`   ❌ Insert error for ${article.slug}:`, insertError.message)
                } else {
                    totalChunks += batch.length
                    console.log(`   ✅ Inserted ${batch.length} chunk(s)`)
                }
            } catch (err) {
                console.error(`   ❌ Embedding error for ${article.slug}:`, err)
            }
        }

        totalArticles++
        await new Promise(r => setTimeout(r, 300))
    }

    console.log(`\n${'═'.repeat(50)}`)
    console.log(`✅ Done! Embedded ${totalChunks} chunks from ${totalArticles} articles.`)

    const { count } = await supabase
        .from('kb_embeddings')
        .select('*', { count: 'exact', head: true })

    console.log(`📊 Total embeddings in DB: ${count}`)
    console.log(`${'═'.repeat(50)}`)
}

main().catch(console.error)