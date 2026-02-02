import { NextResponse } from 'next/server'
import Parser from 'rss-parser'

export const revalidate = 1800 // Cache for 30 minutes (RSS feeds update less frequently)

// Industry-specific RSS feeds for mortgage and real estate news
const RSS_FEEDS = [
    {
        url: 'https://www.housingwire.com/feed/',
        name: 'HousingWire',
    },
    {
        url: 'https://www.inman.com/feed/',
        name: 'Inman',
    },
    {
        url: 'https://www.mpamag.com/us/rss',
        name: 'Mortgage Professional America',
    },
    {
        url: 'https://themortgagereports.com/feed',
        name: 'The Mortgage Reports',
    },
]

interface FeedItem {
    title?: string
    link?: string
    contentSnippet?: string
    content?: string
    pubDate?: string
    isoDate?: string
    enclosure?: { url?: string }
    'media:content'?: { $?: { url?: string } }
}

interface ParsedArticle {
    source: string
    title: string
    description: string | null
    url: string
    image: string | null
    publishedAt: string
}

export async function GET() {
    const parser = new Parser({
        customFields: {
            item: [
                ['media:content', 'media:content'],
                ['enclosure', 'enclosure'],
            ],
        },
    })

    try {
        // Fetch all RSS feeds in parallel
        const feedPromises = RSS_FEEDS.map(async (feed) => {
            try {
                const parsed = await parser.parseURL(feed.url)
                return parsed.items.map((item: FeedItem) => ({
                    source: feed.name,
                    title: item.title || 'Untitled',
                    description: item.contentSnippet?.slice(0, 200) || item.content?.slice(0, 200) || null,
                    url: item.link || '',
                    image: item.enclosure?.url || item['media:content']?.$?.url || null,
                    publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
                }))
            } catch (error) {
                console.warn(`Failed to fetch RSS feed from ${feed.name}:`, error)
                return [] // Return empty array if a feed fails, don't break the whole thing
            }
        })

        const feedResults = await Promise.all(feedPromises)

        // Combine all articles and sort by date (newest first)
        const allArticles: ParsedArticle[] = feedResults
            .flat()
            .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
            .slice(0, 15) // Limit to 15 most recent articles

        if (allArticles.length === 0) {
            return NextResponse.json(
                { error: 'Unable to fetch news from any source. Please try again later.' },
                { status: 503 }
            )
        }

        return NextResponse.json({ articles: allArticles }, { status: 200 })
    } catch (error) {
        console.error('Industry News RSS Error:', error)
        return NextResponse.json(
            { error: 'An unexpected error occurred while fetching news' },
            { status: 500 }
        )
    }
}
