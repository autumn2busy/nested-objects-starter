import { createServiceRoleClient } from './supabase-server'

export type OffboardingIdentity = { accountUid?: unknown; personUid?: unknown }
export type OffboardingState = 'allowed' | 'blocked' | 'unavailable'

function stableUid(value: unknown): string | null {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value) ? value : null
}

/** Read on every request: a valid, unexpired JWT is not a revocation check. */
export async function readMemberOffboardingState(identity: OffboardingIdentity): Promise<OffboardingState> {
  const accountUid = stableUid(identity.accountUid)
  const personUid = stableUid(identity.personUid)
  if ((identity.accountUid != null && !accountUid) || (identity.personUid != null && !personUid)) {
    return 'unavailable'
  }
  if (!accountUid && !personUid) return 'unavailable'

  try {
    const supabase = createServiceRoleClient()
    let query = supabase.from('member_offboarding_holds')
      .select('account_uid')
      .is('released_at', null)

    // A token's signed account controls account-scoped access. For person-only
    // webhooks/legacy tokens, suppress updates if that person has an active hold.
    query = accountUid ? query.eq('account_uid', accountUid) : query.eq('person_uid', personUid!)
    const { data, error } = await query.limit(1).abortSignal(AbortSignal.timeout(5_000))
    if (error || !Array.isArray(data)) return 'unavailable'
    return data.length ? 'blocked' : 'allowed'
  } catch {
    // Missing configuration/table and provider errors must not reopen access.
    return 'unavailable'
  }
}
