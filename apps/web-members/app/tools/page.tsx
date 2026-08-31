import { ToolsView } from './ToolsView'
import { generatePageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generatePageMetadata({
  title: 'Field Inspector Tools Preview | Nested Objects',
  description: 'Preview planned tools for field inspectors. Tool execution and data submission remain disabled while access and safeguards are finalized.',
  path: '/tools',
})

export default function ToolsPage() {
  return <ToolsView />
}
