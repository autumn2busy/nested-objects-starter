/**
 * Centralized SEO Configuration
 * 
 * This file contains all SEO-related constants, schema builders,
 * and utility functions for consistent SEO across the site.
 * 
 * Production domain: members.nestedobjects.com
 * (Set NEXT_PUBLIC_SITE_URL in Vercel before migration)
 */

// Base URL - enforce production canonical domain
const PROD_SITE_URL = 'https://members.nestedobjects.com'
export const SITE_URL =
  process.env.NODE_ENV === 'production'
    ? PROD_SITE_URL
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://nested-objects-starter.vercel.app'

// Site-wide constants
export const SITE_NAME = 'Nested Objects'
export const SITE_TAGLINE = 'Vendor Hub'
export const SITE_DESCRIPTION = 'The #1 Hub for Mortgage Field Inspection services, Mobile Notary for real estate closings, and Certified residential property appraisals.'

// Social/branding
export const LOGO_URL = `${SITE_URL}/logo.png`
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

// Contact info
export const CONTACT_EMAIL = 'support@nestedobjects.com'

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
            email: CONTACT_EMAIL,
            contactType: 'customer service',
        },
        sameAs: [
            `${SITE_URL}/about`,
            `${SITE_URL}/contact`,
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
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/directory?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
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

/**
 * Product/Service Schema Builder (for membership tiers)
 */
export function getProductSchema(product: {
    name: string
    description: string
    price: string
    priceCurrency?: string
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        brand: {
            '@type': 'Brand',
            name: SITE_NAME,
        },
        offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: product.priceCurrency || 'USD',
            availability: 'https://schema.org/InStock',
        },
    }
}

/**
 * Role Page Schema Builder
 */
export function getRolePageSchema(role: {
    name: string
    description: string
    url: string
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `${role.name} role`,
        description: role.description,
        url: role.url,
        about: {
            '@type': 'Occupation',
            name: role.name,
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
 * LocalBusiness Schema Builder (for firm pages)
 */
export function getLocalBusinessSchema(business: {
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
        '@type': 'LocalBusiness',
        name: business.name,
        description: business.description,
        url: business.url,
        logo: business.logo,
        telephone: business.telephone,
        email: business.email,
        address: typeof business.address === 'string' ? business.address : {
            '@type': 'PostalAddress',
            streetAddress: business.address?.streetAddress,
            addressLocality: business.address?.addressLocality,
            addressRegion: business.address?.addressRegion,
            postalCode: business.address?.postalCode,
            addressCountry: business.address?.addressCountry,
        },
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
 * Generate canonical URL for a given path
 */
export function getCanonicalUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${SITE_URL}${cleanPath}`
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

    return {
        title,
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            type,
            url: canonicalUrl,
            title,
            description,
            siteName: SITE_NAME,
            images: [
                {
                    url: socialImage,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image' as const,
            title,
            description,
            images: [socialImage],
        },
    }
}
