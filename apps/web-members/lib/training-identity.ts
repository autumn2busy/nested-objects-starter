export type TrainingIdentity = {
    canonicalUserId: string
    fallbackUserIds: string[]
    profile: any
    resolvedViaEmail: boolean
}

const PROFILE_SELECT = 'id, user_id, outseta_person_uid, email'

function uniqueIds(values: Array<string | null | undefined>): string[] {
    return Array.from(new Set(values.filter((v): v is string => Boolean(v && v.trim()))))
}

export function getLookupUserIds(identity: TrainingIdentity): string[] {
    return uniqueIds([identity.canonicalUserId, ...identity.fallbackUserIds])
}

export async function resolveTrainingIdentity({
    supabase,
    outsetaId,
    user,
}: {
    supabase: any
    outsetaId: string
    user: any
}): Promise<TrainingIdentity | null> {
    let { data: profile } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT)
        .or(`outseta_person_uid.eq.${outsetaId},user_id.eq.${outsetaId}`)
        .limit(1)
        .single()

    let resolvedViaEmail = false

    if (!profile && user?.email) {
        const { data: emailProfile } = await supabase
            .from('profiles')
            .select(PROFILE_SELECT)
            .eq('email', user.email)
            .single()

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
        const { data: newProfile, error } = await supabase
            .from('profiles')
            .insert({
                user_id: outsetaId,
                outseta_person_uid: outsetaId,
                email: user?.email,
                full_name: user?.name || 'Unknown User',
                updated_at: new Date().toISOString(),
            })
            .select(PROFILE_SELECT)
            .single()

        if (error || !newProfile) {
            console.error('[TRAINING_IDENTITY] Failed to create profile:', error)
            return null
        }

        profile = newProfile
    }

    const canonicalUserId = outsetaId
    const fallbackUserIds = uniqueIds([profile.user_id, profile.outseta_person_uid]).filter((id) => id !== canonicalUserId)

    return { canonicalUserId, fallbackUserIds, profile, resolvedViaEmail }
}

export async function runTrainingUserIdMigrationPerRuntime(supabase: any, identity: TrainingIdentity): Promise<void> {
    const lookupIds = getLookupUserIds(identity).filter((id) => id !== identity.canonicalUserId)
    for (const staleId of lookupIds) {
        await supabase
            .from('training_progress')
            .update({ user_id: identity.canonicalUserId, updated_at: new Date().toISOString() })
            .eq('user_id', staleId)

        await supabase
            .from('quiz_attempts')
            .update({ user_id: identity.canonicalUserId })
            .eq('user_id', staleId)
    }
}

export function logRowsetTelemetry(event: string, identity: TrainingIdentity, details?: Record<string, unknown>) {
    console.warn(`[${event}]`, {
        canonicalUserId: identity.canonicalUserId,
        fallbackUserIds: identity.fallbackUserIds,
        outsetaId: identity.canonicalUserId,
        resolvedViaEmail: identity.resolvedViaEmail,
        ...(details || {}),
    })
}
