import { MembershipView, pricingFaqs } from './MembershipView'
import { generatePageMetadata, getFAQPageSchema, getProductSchema } from '@/lib/seo'
import type { Metadata } from 'next'
import { membershipPlans } from '@/lib/ai-datasets'
import { isPublicPlanUid } from '@/lib/plan-config'

export const metadata: Metadata = generatePageMetadata({
  title: 'Field Inspector Membership Plans | Nested Objects',
  description: 'Compare Nested Objects plans for field inspectors, with verified firm intel, training, and adjacent resources for mobile notaries and other field-service pros.',
  path: '/membership-pricing',
})

// Generate structured data from the same explicit allowlist as the visible cards.
const productSchemas = membershipPlans
  .filter((plan) => isPublicPlanUid(plan.planUid))
  .map((plan) =>
    getProductSchema({
      name: `Nested Objects ${plan.name} Plan`,
      description: plan.description,
      price: plan.price.replace('$', '').replace('/mo', ''),
      priceCurrency: 'USD',
    })
  )

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <MembershipView />
    </>
  )
}
