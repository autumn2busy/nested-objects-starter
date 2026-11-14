import Link from 'next/link'
import type { ReactNode } from 'react'
import { getCurrentUser } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-admin'
import { canOpenTrainingModule, readTrainingAccess } from '@/lib/training-access'

export const dynamic = 'force-dynamic'

export default async function TrainingModuleLayout({ children, params }: { children: ReactNode; params: { moduleId: string } }) {
  const user = await getCurrentUser()
  let message = 'Sign in to view your training access.'
  if (user) {
    try {
      const state = await readTrainingAccess(createServiceRoleClient(), user)
      const trainingModule = state.modules.find(item => item.id === params.moduleId || item.slug === params.moduleId)
      if (trainingModule && canOpenTrainingModule(user['outseta:planUid'], trainingModule, state)) return <>{children}</>
      message = 'This module requires an eligible plan and a saved passing assessment for the previous module, or an approved prerequisite waiver.'
    } catch { message = 'Training access could not be checked. Please try again shortly.' }
  }
  return <main className="mx-auto max-w-3xl px-6 py-12"><h1 className="text-2xl font-bold">Training access</h1><p className="mt-4">{message}</p><Link className="mt-4 inline-block underline" href="/challenges">Back to curriculum</Link></main>
}
