import 'server-only'
import { cookies } from 'next/headers'
import { authorizeFirm } from './access'
import { OUTSETA_ISSUER, verifyFirmJwt } from './token'
import { assertFirmSessionTokenSize, FirmProfileError, type FirmProfile, type FirmProfileInput, type VerifiedFirmIdentity } from './contracts'

export const FIRM_SESSION_COOKIE = '__Host-no_firm_session'
export const FIRM_STATE_COOKIE = '__Host-no_firm_login'
const issuer = OUTSETA_ISSUER
export function firmsOrigin(): string {
  const origin = process.env.FIRMS_APP_ORIGIN
  if (!origin) throw new FirmProfileError(503, 'Firm workspace setup is not finished. Please contact Nested Objects.')
  const parsed = new URL(origin)
  if (parsed.protocol !== 'https:' || parsed.origin !== origin || parsed.username || parsed.password) throw new FirmProfileError(503, 'Firm workspace configuration is unavailable.')
  return parsed.origin
}
export function requireEnabled() {
  if (process.env.FIRM_PROFILE_ENABLED !== 'true') throw new FirmProfileError(503, 'Firm workspace setup is not finished. Please contact Nested Objects.')
  firmsOrigin()
}
export async function verifyFirmToken(token: string) {
  requireEnabled()
  if (!token) throw new FirmProfileError(401, 'Please sign in to your firm account.')
  assertFirmSessionTokenSize(token)
  let claims
  try {
    claims = await verifyFirmJwt(token)
  } catch { throw new FirmProfileError(401, 'Your firm sign-in expired. Please sign in again.') }
  const accountUid = claims['outseta:accountUid']
  if (typeof accountUid !== 'string' || !/^[a-zA-Z0-9]{4,40}$/.test(accountUid)) throw new FirmProfileError(403, 'Firm account could not be verified.')
  const key = process.env.OUTSETA_API_KEY, secret = process.env.OUTSETA_API_SECRET
  if (!key || !secret) throw new FirmProfileError(503, 'Firm membership verification is unavailable.')
  const url = new URL(`${issuer}/api/v1/crm/accounts/${encodeURIComponent(accountUid)}`)
  url.searchParams.set('fields','Uid,IsDemo,AccountStage,PrimaryContact.Uid,CurrentSubscription.Uid,CurrentSubscription.EndDate,CurrentSubscription.Plan.Uid,CurrentSubscription.Account.Uid,PersonAccount.Person.Uid')
  let response: Response
  try { response = await fetch(url, { headers: { Authorization: `Outseta ${key}:${secret}` }, cache: 'no-store', signal: AbortSignal.timeout(10000) }) }
  catch { throw new FirmProfileError(503, 'Firm membership verification is temporarily unavailable.') }
  if (!response.ok) throw new FirmProfileError(503, 'Firm membership verification is temporarily unavailable.')
  let account
  try { account = await response.json() } catch { throw new FirmProfileError(503, 'Firm membership verification is temporarily unavailable.') }
  const identity = authorizeFirm(claims, account)
  return { identity, expiresAt: claims.exp! }
}
export async function firmSession() {
  const token = (await cookies()).get(FIRM_SESSION_COOKIE)?.value
  if (!token) throw new FirmProfileError(401, 'Please sign in to your firm account.')
  return (await verifyFirmToken(token)).identity
}
type ProfileResult = { profile: FirmProfile | null; canEdit: boolean }
async function rpc(name: string, identity: VerifiedFirmIdentity, extra: Record<string, unknown> = {}): Promise<ProfileResult> {
  requireEnabled()
  const origin = process.env.FIRM_SUPABASE_URL, key = process.env.FIRM_SUPABASE_SERVICE_ROLE_KEY
  if (!origin || !key) throw new FirmProfileError(503, 'Firm profile storage is not connected yet.')
  const url = new URL(origin)
  if (url.protocol !== 'https:' || url.origin !== origin || !url.hostname.endsWith('.supabase.co')) throw new FirmProfileError(503, 'Firm profile storage configuration is unavailable.')
  let response: Response
  try { response = await fetch(`${origin}/rest/v1/rpc/${name}`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_account_uid: identity.accountUid, p_person_uid: identity.personUid, p_is_primary: identity.isPrimary, ...extra }), cache: 'no-store', signal: AbortSignal.timeout(10000) }) }
  catch { throw new FirmProfileError(503, 'Firm profile storage is temporarily unavailable.') }
  if (!response.ok) {
    const failure = await response.json().catch(() => ({}))
    if (failure.code === '42501') throw new FirmProfileError(403, 'Your firm profile requires an access review. Please contact Nested Objects.')
    if (failure.code === '40001') throw new FirmProfileError(409, 'This profile changed. Reload before saving your changes.')
    if (failure.code === '22023') throw new FirmProfileError(400, 'Please check your company details.')
    throw new FirmProfileError(503, 'Firm profile storage is temporarily unavailable.')
  }
  const result = await response.json()
  if (!result || typeof result.canEdit !== 'boolean' || !('profile' in result)) throw new FirmProfileError(503, 'Firm profile storage returned an invalid response.')
  return result
}
export const readFirmProfile = (identity: VerifiedFirmIdentity) => rpc('read_firm_customer_profile',identity)
export const saveFirmProfile = (identity: VerifiedFirmIdentity, profile: FirmProfileInput, revision: number) => rpc('save_firm_customer_profile',identity,{ p_profile: profile, p_expected_revision: revision })
