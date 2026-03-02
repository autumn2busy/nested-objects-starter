export type TrainingIdentityProfile = {
    id: string
    user_id: string | null
    outseta_person_uid: string | null
    background_check_status?: string | null
    trust_score?: number | null
    trust_score_breakdown?: Record<string, number> | null
    training_modules_completed?: number | null
}

type ResolveTrainingIdentityParams = {
    supabase: any
    outsetaId: string
    user: { email?: string | null; name?: string | null }
    profileSelect: string
}

export type ResolvedTrainingIdentity = {
    profile: TrainingIdentityProfile
    outsetaId: string
    canonicalUserId: string
    fallbackUserIds: string[]
    resolvedViaEmail: boolean
}

const migrationPromises = new Map<string, Promise<void>>()

function uniqueNonEmpty(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim()))))
}

export function redactUserId(value: string | null | undefined) {
    if (!value) return 'none'
    if (value.length <= 6) return `${value.slice(0, 1)}***${value.slice(-1)}`
    return `${value.slice(0, 3)}***${value.slice(-3)}`
}

export async function resolveTrainingIdentity(params: ResolveTrainingIdentityParams): Promise<ResolvedTrainingIdentity | null> {
    const { supabase, outsetaId, user, profileSelect } = params

    let resolvedViaEmail = false

    let { data: profile } = await supabase
        .from('profiles')
        .select(profileSelect)
        .or(`outseta_person_uid.eq.${outsetaId},user_id.eq.${outsetaId}`)
        .limit(1)
        .maybeSingle()

    if (!profile && user.email) {
        const { data: emailProfile } = await supabase
            .from('profiles')
            .select(profileSelect)
            .eq('email', user.email)
            .maybeSingle()

        if (emailProfile) {
            resolvedViaEmail = true
            const updatePayload: Record<string, string> = {}
            if (!emailProfile.outseta_person_uid) updatePayload.outseta_person_uid = outsetaId
            if (!emailProfile.user_id) updatePayload.user_id = outsetaId

            if (Object.keys(updatePayload).length > 0) {
                await supabase.from('profiles').update(updatePayload).eq('id', emailProfile.id)
            }

            profile = {
                ...emailProfile,
                ...updatePayload,
            }
        }
    }

    if (!profile) {
        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
                user_id: outsetaId,
                outseta_person_uid: outsetaId,
                email: user.email,
                full_name: user.name || 'Unknown User',
                updated_at: new Date().toISOString(),
            })
            .select(profileSelect)
            .single()

        if (createError || !newProfile) {
            return null
        }
        profile = newProfile
    }

    const canonicalUserId = profile.user_id || profile.outseta_person_uid || outsetaId
    const fallbackUserIds = uniqueNonEmpty([outsetaId, profile.user_id, profile.outseta_person_uid]).filter(
        (value) => value !== canonicalUserId
    )

    return {
        profile,
        outsetaId,
        canonicalUserId,
        fallbackUserIds,
        resolvedViaEmail,
    }
}

export function getLookupUserIds(identity: ResolvedTrainingIdentity) {
    return [identity.canonicalUserId, ...identity.fallbackUserIds]
}

export async function runTrainingUserIdMigrationOncePerRuntime(supabase: any, identity: ResolvedTrainingIdentity) {
    const lookupIds = getLookupUserIds(identity)
    if (lookupIds.length <= 1) return

    let migrationPromise = migrationPromises.get(identity.canonicalUserId)

    if (!migrationPromise) {
        migrationPromise = (async () => {
            await supabase
                .from('training_progress')
                .update({ user_id: identity.canonicalUserId, updated_at: new Date().toISOString() })
                .in('user_id', identity.fallbackUserIds)

            await supabase
                .from('quiz_attempts')
                .update({ user_id: identity.canonicalUserId })
                .in('user_id', identity.fallbackUserIds)
        })().finally(() => {
            migrationPromises.delete(identity.canonicalUserId)
        })

        migrationPromises.set(identity.canonicalUserId, migrationPromise)
    }

    await migrationPromise
}

export function logNoRowsTelemetry(scope: string, identity: ResolvedTrainingIdentity, context: Record<string, unknown> = {}) {
    console.warn(`[${scope}] no rows found for user`, {
        canonicalUserId: redactUserId(identity.canonicalUserId),
        fallbackUserIds: identity.fallbackUserIds.map(redactUserId),
        outsetaId: redactUserId(identity.outsetaId),
        resolvedViaEmail: identity.resolvedViaEmail,
        ...context,
    })
}
