import { NextResponse } from 'next/server'

export const revalidate = 3600 // Cache for 1 hour (ISR)

interface NewsArticle {
    source: { name: string }
    author: string | null
    title: string
    description: string | null
    url: string
    urlToImage: string | null
    publishedAt: string
}

export async function GET() {
    const apiKey = process.env.NEWSAPI_KEY

    if (!apiKey) {
        return NextResponse.json(
            { error: 'News API key not configured. Please add NEWSAPI_KEY to your environment variables.' },
            { status: 500 }
        )
    }

    try {
        // Query for mortgage and real estate industry news
        const query = encodeURIComponent('mortgage OR "field inspection" OR "real estate market" OR "housing industry"')
        const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=12&apiKey=${apiKey}`

        const res = await fetch(url, {
            next: { revalidate: 3600 }
        })

        if (!res.ok) {
            const errorData = await res.json()
            console.error('NewsAPI Error:', errorData)
            return NextResponse.json(
                { error: 'Failed to fetch news from provider' },
                { status: res.status }
            )
        }

        const data = await res.json()

        // Transform and sanitize the response
        const articles = (data.articles || []).map((article: NewsArticle) => ({
            source: article.source?.name || 'Unknown Source',
            title: article.title,
            description: article.description,
            url: article.url,
            image: article.urlToImage,
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
