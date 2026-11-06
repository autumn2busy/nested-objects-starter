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
    <p className="section-copy mb-8 max-w-3xl">Compare sample locations, inspector-selected inspection types, and preparation signals. Search by city or specialty, filter by selected type, then open a profile for the full context.</p>
    <DemoNotice />
    <InspectorExplorer />
  </main>
}
