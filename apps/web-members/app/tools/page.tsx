import { ToolsView } from './ToolsView'
import { generatePageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generatePageMetadata({
  title: 'Field Tools | Income, Notary Route, Weather & Routing',
  description: 'AI-powered tools for field inspectors and notaries: income calculators, route planning, weather alerts, and client management.',
  path: '/tools',
})

export default function ToolsPage() {
  return <ToolsView />
}
