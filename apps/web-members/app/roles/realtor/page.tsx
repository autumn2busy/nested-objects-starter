import type { Metadata } from 'next'
import { RolePageLayout } from '@/components/RolePageLayout'
import { getRolePageSchema } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Real Estate Agent BPOs & Inspections | Nested Objects',
  description:
    'Monetize your market expertise between closings. Find firms hiring realtors for Broker Price Opinions (BPOs) and property condition reports.',
}

const roleSchema = getRolePageSchema({
  title: 'Real Estate Agent BPOs & Inspections | Nested Objects',
  description:
    'Monetize your market expertise between closings. Find firms hiring realtors for Broker Price Opinions (BPOs) and property condition reports.',
  path: '/roles/realtor',
  about: 'Realtors',
})

export default function RealtorRolePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(roleSchema) }}
      />
      <RolePageLayout
        roleTitle="Realtors"
        heroHeadline={
          <>
            Sell. Evaluate.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Profit.</span>
          </>
        }
        heroSubhead="Market slow? Use your license to complete BPOs (Broker Price Opinions) and property inspections for national lenders. Steady income without the commission volatility."
        benefits={[
          {
            title: 'Monetize your license',
            desc: "Lenders pay $45-$150 for BPOs because they need a licensed agent's opinion. It's the easiest way to earn from your credentials without closing a deal.",
          },
          {
            title: 'Steady cash flow',
            desc: 'Real estate is feast or famine. Field services (BPOs, occupancy checks) pay fast and frequent, smoothing out your monthly income.',
          },
          {
            title: 'Expand your network',
            desc: 'Working with asset management firms puts you first in line for REO listings when those properties eventually go to market.',
          },
        ]}
      >
        {/* Optional specific content for Realtors */}
      </RolePageLayout>
    </>
  )
}
