import type { Metadata } from 'next'
import { RolePageLayout } from '@/components/RolePageLayout'
import { getRolePageSchema } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Notary Field Inspections | Nested Objects',
  description:
    'Turn your notary routes into field inspection runs. Find firms hiring mobile notaries for occupancy verification, door knocks, and BPOs.',
}

const roleSchema = getRolePageSchema({
  title: 'Notary Field Inspections | Nested Objects',
  description:
    'Turn your notary routes into field inspection runs. Find firms hiring mobile notaries for occupancy verification, door knocks, and BPOs.',
  path: '/roles/notary',
  about: 'Notaries',
})

export default function NotaryRolePage() {
  const schema = getRolePageSchema({
    name: 'Notary',
    description:
      'Turn your notary routes into field inspection runs. Find firms hiring mobile notaries for occupancy verification, door knocks, and BPOs.',
    url: getCanonicalUrl('/roles/notary'),
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(roleSchema) }}
      />
      <RolePageLayout
        roleTitle="Notaries"
        heroHeadline={
          <>
            Notarize. Inspect.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Earn.</span>
          </>
        }
        heroSubhead="Stop driving home with empty gaps in your schedule. Use your notary credentials to pick up $50-$150 field inspection gigs on your existing route."
        benefits={[
          {
            title: "You're already credentialed",
            desc: 'Inspection firms love hiring notaries because you are background-checked, detail-oriented, and reliable. No extra license needed for most gigs.',
          },
          {
            title: 'Fill the gaps',
            desc: "Have a 2-hour gap between signings? Pick up a 'Door Knock' or 'Drive-by' inspection nearby. Turn dead time into billable hours.",
          },
          {
            title: 'Diversify your income',
            desc: 'When loan volume dips, field services remain steady (foreclosures, insurance claims). Protect your monthly revenue.',
          },
        ]}
      >
        {/* Optional specific content for Notaries can go here if needed, keeping it clean for now */}
      </RolePageLayout>
    </>
  )
}
