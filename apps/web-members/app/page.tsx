import { Metadata } from 'next'
import { HomeContent } from '@/components/HomeContent'
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo'

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} | Field Inspection Jobs & Mobile Notary Work`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'Mortgage Field Inspection jobs',
    'Independent Field Inspector opportunities',
    'Mobile Notary Signing Agent work',
    'Insurance Loss Control Inspection',
    'Field Services Directory',
    'Gig economy jobs for retirees',
    'Property Inspection training',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nested-objects-starter.vercel.app',
    title: `${SITE_NAME} | Vendor Hub`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
  },
}

export default function HomePage() {
  return <HomeContent />
}
