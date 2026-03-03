import { MembershipView } from './MembershipView'
import { generatePageMetadata, getProductSchema } from '@/lib/seo'
import type { Metadata } from 'next'
import { membershipPlans } from '@/lib/ai-datasets'

export const metadata: Metadata = generatePageMetadata({
  title: 'Membership Plans | Certified Inspection & Notary Hub',
  description: 'Join the #1 community for field inspectors and mobile notaries. Verified firm intel, training courses, and AI tools to grow your business.',
  path: '/membership-pricing',
})

// Generate structured data for visible plans only (exclude hidden/legacy)
const visiblePlans = membershipPlans.filter((plan) => !plan.hidden)
const productSchemas = visiblePlans.map((plan) =>
  getProductSchema({
    name: `Nested Objects ${plan.name} Plan`,
    description: plan.description,
    price: plan.price.replace('$', '').replace('/mo', '').replace('/yr', ''),
    priceCurrency: 'USD',
  })
)

export default function MembershipPage() {
  return (
    <>
      {/* One JSON-LD block per product for maximum Google Rich Results compatibility */}
      {productSchemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <MembershipView />
    </>
  )
}
