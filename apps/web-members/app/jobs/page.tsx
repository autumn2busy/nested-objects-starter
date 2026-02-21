import { Suspense } from 'react'
import { JobsView } from './JobsView'
import { generatePageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generatePageMetadata({
  title: 'Job Command Center | Find & Track Inspections',
  description: 'Find new field inspection work, track applications, and manage your pipeline in one place.',
  path: '/jobs',
})

export default function JobsPage() {
  return (
    <Suspense>
      <JobsView />
    </Suspense>
  )
}
