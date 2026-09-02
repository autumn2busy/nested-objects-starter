import 'server-only'

import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-server'

const LOGIN_URL = 'https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous'

// Explicit professional fields for the owner's profile view only: no private
// resume workspaces, contact details, billing records or identity keys.
export const MEMBER_PROFILE_FIELDS = [
  'id', 'display_name', 'avatar_url', 'verified_at', 'rating', 'rating_count',
  'service_areas', 'primary_services', 'training_modules_completed',
  'training_modules_total', 'role', 'city', 'state', 'subscription_tier',
  'trust_score', 'bio', 'experience_level', 'created_at', 'is_published',
].join(',')

export type MemberProfile = {
  id: string
  display_name: string | null
  avatar_url: string | null
  verified_at: string | null
  rating: number | null
  rating_count: number | null
  service_areas: string[] | null
  primary_services: string | null
  training_modules_completed: number | null
  training_modules_total: number | null
  role: string | null
  city: string | null
  state: string | null
  subscription_tier: string | null
  trust_score: number | null
  bio: string | null
  experience_level: string | null
  created_at: string | null
  is_published: boolean | null
}

async function requireViewer() {
  const user = await getCurrentUser()
  // Account/subscription IDs and editable profile roles are NOT person identity.
  if (!user || typeof user.sub !== 'string' || !user.sub.trim()) redirect(LOGIN_URL)

  return { subject: user.sub }
}

export async function redirectToOwnProfile(): Promise<never> {
  await requireViewer()
  // Inspector-first release: there is no firm directory permission or environment
  // override. A future firm product requires its own reviewed authorization model.
  redirect('/profile')
}

export async function getAuthorizedMemberProfile(memberId: string) {
  const viewer = await requireViewer()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberId)) notFound()

  const supabase = createServiceRoleClient()
  // Filter by identity AND requested ID before reading any profile fields.
  // Owners can view their own unpublished profile, regardless of paid tier.
  const own = await supabase.from('profiles')
    .select(MEMBER_PROFILE_FIELDS)
    .eq('id', memberId)
    .eq('outseta_person_uid', viewer.subject)
    .maybeSingle()
  if (own.error) throw new Error('Unable to load your member profile')
  if (!own.data) notFound()
  return { profile: own.data as unknown as MemberProfile }
}
