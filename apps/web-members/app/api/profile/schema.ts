export const PROFILE_GUARANTEED_COLUMNS = [
  'id',
  'outseta_person_uid',
  'user_email',
  'full_name',
  'display_name',
  'first_name',
  'last_name',
  'email',
  'phone',
  'subscription_tier',
  'subscription_status',
  'created_at',
] as const

export const PROFILE_OPTIONAL_COLUMNS = [
  'user_id',
  'avatar_url',
  'headline',
  'bio',
  'city',
  'state',
  'service_areas',
  'primary_services',
  'experience_level',
  'tools_used',
  'preferred_job_types',
  'max_travel_distance',
  'trust_score',
  'trust_tier',
  'trust_score_breakdown',
  'background_check_status',
  'background_check_verified_at',
  'shield_id',
  'shield_ic_rating',
  'training_modules_completed',
  'training_modules_total',
  'inspections_completed',
  'certifications',
  'identity_verified',
  'phone_verified',
  'email_verified',
  'verified_at',
  'is_published',
  'rating',
  'rating_count',
] as const

export const PROFILE_CRITICAL_COLUMNS = [
  'is_published',
  'training_modules_completed',
  'training_modules_total',
  'trust_score',
  'trust_tier',
  'trust_score_breakdown',
] as const

export type ProfileSchemaInfo = {
  availableColumns: Set<string>
  missingCriticalColumns: string[]
}

export function buildFallbackProfileSchemaInfo(): ProfileSchemaInfo {
  return {
    availableColumns: new Set([...PROFILE_GUARANTEED_COLUMNS, ...PROFILE_OPTIONAL_COLUMNS]),
    missingCriticalColumns: [],
  }
}

export function buildProfileQueryColumns(availableColumns: Set<string>) {
  return [
    ...PROFILE_GUARANTEED_COLUMNS,
    ...PROFILE_OPTIONAL_COLUMNS.filter((column) => availableColumns.has(column)),
  ]
}

export function buildDegradedProfile(outsetaUser: any, userEmail: string | null, userPhone: string | null, data: any = {}) {
  return {
    id: data.id ?? null,
    user_email: data.user_email ?? userEmail,
    full_name: data.full_name ?? outsetaUser?.name ?? outsetaUser?.FullName ?? null,
    display_name: data.display_name ?? outsetaUser?.first_name ?? outsetaUser?.FirstName ?? null,
    first_name: data.first_name ?? outsetaUser?.first_name ?? outsetaUser?.FirstName ?? null,
    last_name: data.last_name ?? outsetaUser?.last_name ?? outsetaUser?.LastName ?? null,
    email: data.email ?? userEmail,
    phone: data.phone ?? userPhone,
    avatar_url: data.avatar_url ?? null,
    is_published: data.is_published ?? false,
    trust_score: data.trust_score ?? 0,
    trust_tier: data.trust_tier ?? 'bronze',
    trust_score_breakdown: data.trust_score_breakdown ?? null,
    background_check_status: data.background_check_status ?? 'not_started',
    training_modules_completed: data.training_modules_completed ?? 0,
    training_modules_total: data.training_modules_total ?? 8,
    inspections_completed: data.inspections_completed ?? 0,
    email_verified: data.email_verified ?? true,
    phone_verified: data.phone_verified ?? false,
    identity_verified: data.identity_verified ?? false,
    created_at: data.created_at ?? new Date().toISOString(),
    headline: data.headline ?? null,
    bio: data.bio ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    service_areas: data.service_areas ?? null,
    primary_services: data.primary_services ?? null,
    experience_level: data.experience_level ?? null,
    tools_used: data.tools_used ?? null,
    preferred_job_types: data.preferred_job_types ?? null,
    max_travel_distance: data.max_travel_distance ?? null,
    subscription_tier: data.subscription_tier ?? 'free',
    subscription_status: data.subscription_status ?? 'active',
    rating: data.rating ?? null,
    rating_count: data.rating_count ?? null,
  }
}
