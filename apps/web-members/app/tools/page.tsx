import type { Metadata } from 'next'

import { generatePageMetadata } from '@/lib/seo'
import { ToolsView } from './ToolsView'

export const metadata: Metadata = generatePageMetadata({
  title: 'Field Inspector Tools | Income, Routes, Weather & Tracking',
  description: 'Preview field inspector tools for income planning, route decisions, weather, applications, client tracking, and AI-assisted workflow support.',
  path: '/tools',
})

export default function ToolsPage() {
  return <ToolsView />
}
