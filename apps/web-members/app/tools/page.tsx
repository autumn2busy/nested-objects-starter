import { ToolsView } from './ToolsView'
import { generatePageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generatePageMetadata({
  title: 'Field Tools | Income Calculator, Weather & Routing',
  description: 'AI-powered tools for field inspectors: income calculator, route planner, weather alerts, and client management system.',
  path: '/tools',
})

export default function ToolsPage() {
  return <ToolsView />
}
