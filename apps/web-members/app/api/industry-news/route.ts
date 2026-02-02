import { NextResponse } from 'next/server'

export const revalidate = 3600 // Cache for 1 hour (ISR)

interface GNewsArticle {
    title: string
    description: string
    url: string
    image: string | null
    publishedAt: string
    source: {
        name: string
        url: string
    }
}

export async function GET() {
    // Support both GNEWS_API_KEY and legacy NEWSAPI_KEY
    const apiKey = process.env.GNEWS_API_KEY || process.env.NEWSAPI_KEY

    if (!apiKey) {
        return NextResponse.json(
            { error: 'News API key not configured. Please add GNEWS_API_KEY to your environment variables.' },
            { status: 500 }
        )
    }

    try {
        // GNews API - works in production on free tier (100 requests/day)
        // Query for mortgage and real estate industry news
        const query = encodeURIComponent('mortgage OR real estate OR housing market')
        const url = `https://gnews.io/api/v4/search?q=${query}&lang=en&country=us&max=12&apikey=${apiKey}`

        const res = await fetch(url, {
            next: { revalidate: 3600 }
        })

        if (!res.ok) {
            const errorData = await res.json()
            console.error('GNews API Error:', errorData)
            return NextResponse.json(
                { error: 'Failed to fetch news from provider' },
                { status: res.status }
            )
        }

        const data = await res.json()

        // Transform GNews response to our standard format
        const articles = (data.articles || []).map((article: GNewsArticle) => ({
            source: article.source?.name || 'Unknown Source',
            title: article.title,
            description: article.description,
            url: article.url,
            image: article.image,
            publishedAt: article.publishedAt,
        }))

        return NextResponse.json({ articles }, { status: 200 })
    } catch (error) {
        console.error('Industry News API Error:', error)
        return NextResponse.json(
            { error: 'An unexpected error occurred while fetching news' },
            { status: 500 }
        )
    }
}
