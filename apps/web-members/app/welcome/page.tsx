import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo'
import { WelcomeActivation } from './WelcomeActivation'

type WelcomePageProps = {
  searchParams?: {
    new_user?: string | string[]
  }
}

export const metadata: Metadata = generatePageMetadata({
  title: 'Welcome to Nested Objects',
  description: 'Activate your Nested Objects member account and start finding field inspection work near you.',
  path: '/welcome',
})

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default function WelcomePage({ searchParams }: WelcomePageProps) {
  const isNewUser = getSearchParamValue(searchParams?.new_user) === 'true'

  return <WelcomeActivation isNewUser={isNewUser} />
}
