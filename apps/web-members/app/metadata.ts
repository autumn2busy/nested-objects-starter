import { Metadata } from 'next'

// SEO-optimized metadata for the homepage
export const metadata: Metadata = {
  title: 'Nested Objects | AI-Powered Hub for Field Service Professionals',
  description:
    'Join 1,000+ inspectors, notaries, and contractors finding better opportunities. Access exclusive firm directory, professional training, AI career assistant, and job board. Start free today.',
  keywords: [
    'field service professionals',
    'property inspector jobs',
    'mortgage field services',
    'notary work',
    'inspection companies',
    'field inspector directory',
    'occupancy inspection',
    'REO inspection',
    'property preservation',
    'field service training',
    'inspector resources',
    'contractor jobs',
    'mobile notary jobs',
    'field service directory',
    'inspector career',
  ],
  authors: [{ name: 'Nested Objects' }],
  creator: 'Nested Objects',
  publisher: 'Nested Objects',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nestedobjects.com',
    siteName: 'Nested Objects',
    title: 'Nested Objects | AI-Powered Hub for Field Service Professionals',
    description:
      'Connect with top firms, access exclusive training, and grow your career as an inspector, notary, or field service contractor. Start free today.',
    images: [
      {
        url: '/og-image.png', // You'll need to create this
        width: 1200,
        height: 630,
        alt: 'Nested Objects - Field Service Professional Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nested Objects | AI-Powered Hub for Field Service Professionals',
    description:
      'Connect with top firms, access exclusive training, and grow your career as an inspector, notary, or field service contractor.',
    images: ['/twitter-image.png'], // You'll need to create this
    creator: '@nestedobjects',
  },
  alternates: {
    canonical: 'https://nestedobjects.com',
  },
  verification: {
    google: 'your-google-verification-code', // Add your verification code
  },
  category: 'Business Services',
}

// Structured data for SEO (JSON-LD)
export const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Nested Objects',
  url: 'https://nestedobjects.com',
  description:
    'AI-powered membership platform for field service professionals including inspectors, notaries, and contractors.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://nestedobjects.com/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Nested Objects',
    logo: {
      '@type': 'ImageObject',
      url: 'https://nestedobjects.com/logo.png',
    },
  },
}

export const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Nested Objects',
  url: 'https://nestedobjects.com',
  logo: 'https://nestedobjects.com/logo.png',
  description:
    'AI-powered membership platform connecting field service professionals with top firms, training, and career resources.',
  sameAs: [
    'https://twitter.com/nestedobjects',
    'https://linkedin.com/company/nested-objects',
    'https://facebook.com/nestedobjects',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    email: 'support@nestedobjects.com',
    availableLanguage: ['English'],
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Atlanta',
    addressRegion: 'GA',
    addressCountry: 'US',
  },
}

export const offerCatalogStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'OfferCatalog',
  name: 'Nested Objects Membership Plans',
  itemListElement: [
    {
      '@type': 'Offer',
      name: 'Starter Plan',
      description:
        'Free forever plan with basic access to firm directory and job board',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    {
      '@type': 'Offer',
      name: 'Pro Plan',
      description:
        'Full access to firm details, AI assistant, training library, and job matching',
      price: '37',
      priceCurrency: 'USD',
      billingDuration: 'P1M',
      availability: 'https://schema.org/InStock',
    },
    {
      '@type': 'Offer',
      name: 'Elite Plan',
      description:
        'Priority firm introductions, advanced AI job intel, and 1-on-1 coaching',
      price: '97',
      priceCurrency: 'USD',
      billingDuration: 'P1M',
      availability: 'https://schema.org/InStock',
    },
  ],
}
