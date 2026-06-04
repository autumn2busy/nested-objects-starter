/**
 * Centralized SEO Configuration
 * 
 * This file contains all SEO-related constants, schema builders,
 * and utility functions for consistent SEO across the site.
 * 
 * Production domain: members.nestedobjects.com
 * (Set NEXT_PUBLIC_SITE_URL in Vercel before migration)
 */

import { getSiteUrl } from '@/lib/seo-env'
import { PLAN_UIDS } from '@/lib/plan-config'

// Base URL - validated environment variable with local dev fallback
export const SITE_URL = getSiteUrl()

// Site-wide constants
export const SITE_NAME = 'Nested Objects'
export const SITE_TAGLINE = 'Vendor Hub'
export const SITE_DESCRIPTION = 'The #1 Hub for Mortgage Field Inspection services, Mobile Notary for real estate closings, and Certified residential property appraisals.'

// Social/branding
export const LOGO_URL = `${SITE_URL}/logo.png`
export const DEFAULT_OG_IMAGE = `${SITE_URL}/hero-og.jpg`

// Contact info
export const CONTACT_EMAIL = 'info@nestedobjects.com'
export const CONTACT_PHONE = '+1-615-739-7029'
export const CONTACT_PHONE_DISPLAY = '+1-615-739-7029'

const SOFTWARE_APPLICATION_OFFERS = [
    { name: 'Free', planUid: PLAN_UIDS.FREE, price: '0' },
    { name: 'Pro', planUid: PLAN_UIDS.PRO, price: '49' },
    { name: 'Elite', planUid: PLAN_UIDS.ELITE, price: '97' },
    { name: 'Agency', planUid: PLAN_UIDS.AGENCY, price: '297' },
] as const

/**
 * Organization Schema (JSON-LD)
 * Include this in layout.tsx for site-wide presence
 */
export function getOrganizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: LOGO_URL,
        description: SITE_DESCRIPTION,
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: CONTACT_PHONE,
            contactType: 'customer service',
            email: CONTACT_EMAIL,
            areaServed: 'US',
            availableLanguage: 'English',
        },
        sameAs: [
            'https://www.linkedin.com/company/nested-objects/',
            'https://www.facebook.com/groups/nestedobjects',
            'https://www.instagram.com/nestedobjects/',
            'https://www.youtube.com/@nestedobjects',
        ],
    }
}

/**
 * WebSite Schema with SearchAction (for sitelinks search box)
 */
export function getWebSiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Nested Objects Member Hub',
        url: SITE_URL,
        potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
    }
}

/**
 * SoftwareApplication Schema for the national member platform
 */
export function getSoftwareApplicationSchema(reviewData?: {
    ratingValue: number
    reviewCount: number
    reviews?: {
        author: string
        rating: number
        body: string
        datePublished: string
    }[]
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Nested Objects Member Hub',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
        },
        ...(reviewData && {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: reviewData.ratingValue,
                bestRating: 5,
                worstRating: 1,
                reviewCount: reviewData.reviewCount,
            },
            review: reviewData.reviews?.map((review) => ({
                '@type': 'Review',
                author: {
                    '@type': 'Person',
                    name: review.author,
                },
                datePublished: review.datePublished,
                reviewRating: {
                    '@type': 'Rating',
                    ratingValue: review.rating,
                    bestRating: 5,
                    worstRating: 1,
                },
                reviewBody: review.body,
            })),
        }),
        offers: SOFTWARE_APPLICATION_OFFERS.map((plan) => ({
            '@type': 'Offer',
            name: plan.name,
            price: plan.price,
            priceCurrency: 'USD',
            url: `${SITE_URL}/membership-pricing`,
        })),
    }
}

/**
 * Breadcrumb Schema Builder
 */
export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    }
}

/**
 * FAQ Schema Builder
 */
export function getFAQPageSchema(faqs: { question: string; answer: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    }
}

export function getProductSchema(product: {
    name: string
    description: string
    price: string
    priceCurrency?: string
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: product.name,
        description: product.description,
        provider: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
        },
        offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: product.priceCurrency || 'USD',
            availability: 'https://schema.org/InStock',
            url: `${SITE_URL}/membership-pricing`,
        },
    }
}

/**
 * Course Schema Builder (for training pages)
 */
export function getCourseSchema(course: {
    name: string
    description: string
    provider?: string
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: course.name,
        description: course.description,
        provider: {
            '@type': 'Organization',
            name: course.provider || SITE_NAME,
            sameAs: SITE_URL,
        },
    }
}

/**
 * Organization Schema Builder for firm profile pages
 */
export function getHiringFirmSchema(business: {
    name: string
    description: string
    url: string
    logo?: string
    telephone?: string
    email?: string
    address?: {
        streetAddress?: string
        addressLocality?: string
        addressRegion?: string
        postalCode?: string
        addressCountry?: string
    } | string
    geo?: { latitude: number; longitude: number }
    areaServed?: string
    priceRange?: string
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: business.name,
        description: business.description,
        url: business.url,
        logo: business.logo,
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: business.telephone,
            email: business.email,
            contactType: 'vendor relations',
            areaServed: business.areaServed || 'US',
            availableLanguage: 'English',
        },
        ...(business.address ? {
            address: typeof business.address === 'string' ? business.address : {
                '@type': 'PostalAddress',
                streetAddress: business.address?.streetAddress,
                addressLocality: business.address?.addressLocality,
                addressRegion: business.address?.addressRegion,
                postalCode: business.address?.postalCode,
                addressCountry: business.address?.addressCountry,
            },
        } : {}),
        ...(business.geo && {
            geo: {
                '@type': 'GeoCoordinates',
                latitude: business.geo.latitude,
                longitude: business.geo.longitude,
            }
        }),
        areaServed: business.areaServed,
        priceRange: business.priceRange
    }
}

/**
 * Occupation Schema Builder (for role/career pages)
 * Helps Google understand individual job roles and display rich results
 */
export function getOccupationSchema(occupation: {
    name: string
    description: string
    medianSalary?: string
    occupationLocation?: string
    estimatedSalaryUnit?: string
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Occupation',
        name: occupation.name,
        description: occupation.description,
        occupationLocation: {
            '@type': 'Country',
            name: occupation.occupationLocation || 'US',
        },
        ...(occupation.medianSalary && {
            estimatedSalary: {
                '@type': 'MonetaryAmountDistribution',
                name: 'base',
                currency: 'USD',
                median: occupation.medianSalary,
                unitText: occupation.estimatedSalaryUnit || 'YEAR',
            },
        }),
    }
}
/**
 * AggregateRating Schema Builder
 * Generates rich snippet star ratings in Google search results.
 */
export function getAggregateRatingSchema(reviewData: {
    ratingValue: number
    reviewCount: number
    bestRating?: number
    worstRating?: number
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: reviewData.ratingValue,
            bestRating: reviewData.bestRating || 5,
            worstRating: reviewData.worstRating || 1,
            reviewCount: reviewData.reviewCount,
        },
    }
}

/**
 * Individual Review Schema Builder
 */
export function getReviewSchema(reviews: {
    author: string
    rating: number
    body: string
    datePublished: string
}[]) {
    return reviews.map((review) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: review.author },
        reviewRating: { '@type': 'Rating', ratingValue: review.rating, bestRating: 5 },
        reviewBody: review.body,
        datePublished: review.datePublished,
    }))
}
/**
 * Generate canonical URL for a given path
 */
export function getCanonicalUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${SITE_URL}${cleanPath}`
}

export function normalizeMetadataTitle(title: string): string {
    return title
        .replace(/\s+(?:-|–|—|â€”)\s+Hiring Profile & Pay/gi, ' Hiring Profile')
        .replace(/\s*\|\s*Nested Objects(?:\s+roles)?/gi, '')
        .replace(/\s+at\s+Nested Objects/gi, '')
        .replace(/\s+for\s+Nested Objects/gi, '')
        .replace(/\s+Nested Objects\s+membership/gi, ' membership')
        .replace(/\s{2,}/g, ' ')
        .trim()
}

/**
 * Default metadata generator for pages
 */
export function generatePageMetadata({
    title,
    description,
    path,
    ogImage,
    image,
    type = 'website',
}: {
    title: string
    description: string
    path: string
    ogImage?: string
    image?: string
    type?: 'website' | 'article' | 'profile' | 'book' | 'music.song' | 'music.album' | 'music.playlist' | 'music.radio_station' | 'video.movie' | 'video.episode' | 'video.tv_show' | 'video.other'
}) {
    const canonicalUrl = getCanonicalUrl(path)
    const socialImage = image || ogImage || DEFAULT_OG_IMAGE
    const cleanTitle = normalizeMetadataTitle(title)

    return {
        title: cleanTitle,
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            type,
            url: canonicalUrl,
            title: cleanTitle,
            description,
            siteName: SITE_NAME,
            images: [
                {
                    url: socialImage,
                    width: 1200,
                    height: 630,
                    alt: cleanTitle,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image' as const,
            title: cleanTitle,
            description,
            images: [socialImage],
        },
    }
}
