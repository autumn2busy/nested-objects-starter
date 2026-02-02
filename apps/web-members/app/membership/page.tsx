import { MembershipView } from './MembershipView'
import { generatePageMetadata, getProductSchema } from '@/lib/seo'
import type { Metadata } from 'next'
import { membershipPlans } from '@/lib/ai-datasets'

export const metadata: Metadata = generatePageMetadata({
  title: 'Membership Plans | Certified Inspection & Notary Hub',
  description: 'Join the #1 community for field inspectors and mobile notaries. Verified firm intel, training courses, and AI tools to grow your business.',
  path: '/membership',
})

// Generate structured data for plans
const productSchemas = membershipPlans.map((plan) =>
  getProductSchema({
    name: `Nested Objects ${plan.name} Plan`,
    description: plan.description,
    price: plan.price.replace('$', '').replace('/mo', ''),
    priceCurrency: 'USD',
  })
)

export default function MembershipPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchemas) }}
      />
      <MembershipView />
    </>
  )
}
