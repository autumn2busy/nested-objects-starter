import type { Metadata } from 'next'

import { MembershipView, pricingFaqs } from './MembershipView'
import { publicMembershipPlans } from '@/lib/ai-datasets'
import { generatePageMetadata, getFAQPageSchema, getProductSchema } from '@/lib/seo'
import { TESTIMONIALS, getAverageRating } from '@/lib/testimonials'

export const metadata: Metadata = generatePageMetadata({
  title: 'Membership Plans | Field Inspector Vendor Hub',
  description: 'Compare current Nested Objects plans for field inspectors. Preview firms with Free, or unlock full firm intelligence, training, and working tools with Pro and above.',
  path: '/membership-pricing',
})

const productSchemas = publicMembershipPlans.map((plan) =>
  getProductSchema({
    name: `Nested Objects ${plan.name} Plan`,
    description: plan.description,
    price: plan.price.replace('$', '').replace('/mo', ''),
    priceCurrency: 'USD',
  })
)

const aggregateRatingSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Nested Objects',
  url: 'https://members.nestedobjects.com',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: getAverageRating(),
    bestRating: 5,
    worstRating: 1,
    reviewCount: TESTIMONIALS.length,
  },
}

const faqSchema = getFAQPageSchema(pricingFaqs)

export default function MembershipPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchemas) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <MembershipView />
    </>
  )
}
