import type { Metadata } from 'next'
import { DemoNotice } from '../../components/DemoNotice'
import { InspectorExplorer } from './InspectorExplorer'

export const metadata: Metadata = {
  title: 'Sample inspector experience',
  description: 'Explore a clearly labeled demonstration with six fictional inspector profiles. No real member data or contractor availability.',
  robots: { index: false, follow: true },
}

export default function InspectorsPage() {
  return <main id="main-content" className="page-shell py-12 sm:py-16">
    <p className="eyebrow text-brand">Experience preview · Step 1</p>
    <h1 className="section-title">Start with the person behind the profile.</h1>
    <p className="section-copy mb-8 max-w-3xl">Explore how location, experience, and inspection interests could make a firm introduction more useful. Try a city or specialty, then open a sample profile.</p>
    <DemoNotice />
    <InspectorExplorer />
  </main>
}
