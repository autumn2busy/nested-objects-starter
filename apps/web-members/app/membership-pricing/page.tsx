import { MembershipView } from './MembershipView'
import { generatePageMetadata, getProductSchema } from '@/lib/seo'
import type { Metadata } from 'next'
import { membershipPlans } from '@/lib/ai-datasets'
import { PLAN_UIDS } from '@/lib/plan-config'
import { TESTIMONIALS, getAverageRating } from '@/lib/testimonials'

export const metadata: Metadata = generatePageMetadata({
  title: 'Membership Plans | Certified Inspection & Notary Hub',
  description: 'Join the #1 community for field inspectors and mobile notaries. Verified firm intel, training courses, and AI tools to grow your business.',
  path: '/membership-pricing',
})

// Generate structured data for plans
const publicSchemaPlanUids = new Set<string>([
  PLAN_UIDS.FREE,
  PLAN_UIDS.PRO,
  PLAN_UIDS.ELITE,
  PLAN_UIDS.AGENCY,
])

const productSchemas = membershipPlans
  .filter((plan) => publicSchemaPlanUids.has(plan.planUid))
  .map((plan) =>
    getProductSchema({
      name: `Nested Objects ${plan.name} Plan`,
      description: plan.description,
      price: plan.price.replace('$', '').replace('/mo', ''),
      priceCurrency: 'USD',
    })
  )

// AggregateRating for rich snippets in search results
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
      <MembershipView />
    </>
  )
}
