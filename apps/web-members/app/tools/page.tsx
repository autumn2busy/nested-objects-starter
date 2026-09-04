import { ToolsView } from './ToolsView'
import { generatePageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generatePageMetadata({
  title: 'Field Inspector Member Tools | Nested Objects',
  description: 'Use member income and route-economics calculators, and see which connected field-inspector tools are being verified next.',
  path: '/tools',
})

export default function ToolsPage() {
  return <ToolsView />
}
