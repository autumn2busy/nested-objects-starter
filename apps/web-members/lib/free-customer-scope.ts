/** Separate, expiring operator scope. This flag never participates in webhook routing. */
export const FREE_CUSTOMER_OPERATION = 'free-customer-only-v1'
export type FreeCustomerScope = {
  mode: 'verify' | 'apply'; accountUid: string; personUid: string; acContactId: string; expiresAt: string
}
export type FreeCustomerRequest = {
  operation: typeof FREE_CUSTOMER_OPERATION; mode: 'verify' | 'apply';
  issuedAt: number; accountUid: string; personUid: string
}
const uid = (v: unknown) => typeof v === 'string' && /^[A-Za-z0-9]{4,40}$/.test(v)
const exactKeys = (v: unknown, keys: string): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).sort().join(',') === keys

export function readFreeCustomerScope(env: Record<string, string | undefined>, now: number): FreeCustomerScope {
  if (!env.AC_FREE_CUSTOMER_SYNC_SCOPE) throw Error('free_customer_sync_disabled')
  if (env.VERCEL_ENV !== 'production') throw Error('production_only_operator')
  if (env.AC_NONRECURRING_SYNC_MODE) throw Error('global_routing_mode_must_remain_unset')
  let value: unknown
  try { value = JSON.parse(env.AC_FREE_CUSTOMER_SYNC_SCOPE) } catch { throw Error('invalid_free_customer_scope') }
  if (!exactKeys(value, 'acContactId,accountUid,expiresAt,mode,personUid') ||
      typeof value.mode !== 'string' || !['verify', 'apply'].includes(value.mode) || !uid(value.accountUid) || !uid(value.personUid) ||
      typeof value.acContactId !== 'string' || !/^[1-9]\d*$/.test(value.acContactId) ||
      typeof value.expiresAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(value.expiresAt)) throw Error('invalid_free_customer_scope')
  const expires = Date.parse(value.expiresAt)
  if (!Number.isFinite(now) || !Number.isFinite(expires) || expires <= now || expires - now > 86_400_000) throw Error('free_customer_scope_expired_or_unbounded')
  return value as FreeCustomerScope
}

export function validateFreeCustomerRequest(value: unknown, scope: FreeCustomerScope, now: number): FreeCustomerRequest {
  if (!exactKeys(value, 'accountUid,issuedAt,mode,operation,personUid') || value.operation !== FREE_CUSTOMER_OPERATION ||
      value.mode !== scope.mode || value.accountUid !== scope.accountUid || value.personUid !== scope.personUid ||
      typeof value.issuedAt !== 'number' || !Number.isSafeInteger(value.issuedAt) || value.issuedAt > now ||
      now - value.issuedAt > 120_000) throw Error('invalid_free_customer_request')
  return value as FreeCustomerRequest
}
