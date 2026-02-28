import { NextResponse } from 'next/server'
import Parser from 'rss-parser'

export const revalidate = 1800 // Cache for 30 minutes

// ─── Feed categories ────────────────────────────────────────────────
// Each feed is tagged with one or more categories so the frontend
// can filter or badge articles by niche.

type FeedSource = {
    url: string
    name: string
    categories: string[]
}

const RSS_FEEDS: FeedSource[] = [
    // ── Mortgage & Real Estate ───────────────────────────────────
    {
        url: 'https://www.housingwire.com/feed/',
        name: 'HousingWire',
        categories: ['mortgage', 'real-estate'],
    },
    {
        url: 'https://www.inman.com/feed/',
        name: 'Inman',
        categories: ['real-estate'],
    },
    {
        url: 'https://www.mpamag.com/us/rss',
        name: 'Mortgage Professional America',
        categories: ['mortgage'],
    },
    {
        url: 'https://themortgagereports.com/feed',
        name: 'The Mortgage Reports',
        categories: ['mortgage'],
    },
    {
        url: 'https://www.scotsmanguide.com/feed/',
        name: 'Scotsman Guide',
        categories: ['mortgage', 'real-estate'],
    },

    // ── Notary / Signing Agent ─────────────────────────────────────
    {
        url: 'https://www.notarystars.com/rss',
        name: 'Notary Stars',
        categories: ['notary'],
    },
    {
        url: 'https://loansigningsystem.com/blog/feed/',
        name: 'Loan Signing System',
        categories: ['notary', 'mortgage'],
    },
    // notary2pro.com — removed: returns malformed XML that breaks parser

    // ── Drone / UAV Inspections ────────────────────────────────────
    {
        url: 'https://dronelife.com/feed/',
        name: 'DroneLife',
        categories: ['drone'],
    },
    {
        url: 'https://suasnews.com/feed/',
        name: 'sUAS News',
        categories: ['drone'],
    },

    // ── HUD / Government Housing ───────────────────────────────────
    // Note: HUD and FEMA feeds require a User-Agent header (see parser config)
    {
        url: 'https://www.huduser.gov/rss/pub.xml',
        name: 'HUD Research',
        categories: ['hud', 'government'],
    },

    // ── FEMA / Disaster & Field Response ───────────────────────────
    {
        url: 'https://www.fema.gov/news/disasters_rss.fema',
        name: 'FEMA Disasters',
        categories: ['fema', 'government'],
    },

    // ── Gig Economy / Field Services ───────────────────────────────
    // thegigeconomist.com — removed: domain is dead (DNS ENOTFOUND)
    // yourbestdelivery.com — removed: returns 503 consistently
    {
        url: 'https://www.sidehustlenation.com/feed/',
        name: 'Side Hustle Nation',
        categories: ['gig-economy'],
    },
    {
        url: 'https://www.propertywire.com/feed/',
        name: 'PropertyWire',
        categories: ['real-estate', 'inspections'],
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
    categories: string[]
}

export async function GET(request: Request) {
    // Optional: allow filtering by category via query param
    // e.g. /api/industry-news?category=notary
    const { searchParams } = new URL(request.url)
    const categoryFilter = searchParams.get('category')?.toLowerCase() || null

    // If a category filter is provided, only fetch matching feeds
    const feedsToFetch = categoryFilter
        ? RSS_FEEDS.filter((f) => f.categories.includes(categoryFilter))
        : RSS_FEEDS

    const parser = new Parser({
        customFields: {
            item: [
                ['media:content', 'media:content'],
                ['enclosure', 'enclosure'],
            ],
        },
        timeout: 12000, // 12 seconds for slow gov feeds
        headers: {
            'User-Agent': 'NestedObjects/1.0 (https://members.nestedobjects.com; RSS aggregator)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
    })

    try {
        const feedPromises = feedsToFetch.map(async (feed) => {
            try {
                const parsed = await parser.parseURL(feed.url)
                return parsed.items.map((item: FeedItem) => ({
                    source: feed.name,
                    title: item.title || 'Untitled',
                    description:
                        item.contentSnippet?.slice(0, 200) ||
                        item.content?.replace(/<[^>]+>/g, '').slice(0, 200) ||
                        null,
                    url: item.link || '',
                    image:
                        item.enclosure?.url ||
                        item['media:content']?.$?.url ||
                        null,
                    publishedAt:
                        item.isoDate || item.pubDate || new Date().toISOString(),
                    categories: feed.categories,
                }))
            } catch (error) {
                console.warn(`Failed to fetch RSS feed from ${feed.name}:`, error)
                return [] // Don't break the whole response if one feed fails
            }
        })

        const feedResults = await Promise.all(feedPromises)

        // Combine, sort newest first, limit to 25
        const allArticles: ParsedArticle[] = feedResults
            .flat()
            .sort(
                (a, b) =>
                    new Date(b.publishedAt).getTime() -
                    new Date(a.publishedAt).getTime()
            )
            .slice(0, 25)

        if (allArticles.length === 0) {
            return NextResponse.json(
                {
                    error:
                        'Unable to fetch news from any source. Please try again later.',
                },
                { status: 503 }
            )
        }

        // Return available categories for frontend filtering
        const availableCategories = [
            ...new Set(allArticles.flatMap((a) => a.categories)),
        ].sort()

        return NextResponse.json(
            {
                articles: allArticles,
                categories: availableCategories,
                totalFeeds: feedsToFetch.length,
                fetchedAt: new Date().toISOString(),
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Industry News RSS Error:', error)
        return NextResponse.json(
            { error: 'An unexpected error occurred while fetching news' },
            { status: 500 }
        )
    }
}