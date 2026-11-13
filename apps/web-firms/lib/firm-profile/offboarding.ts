import 'server-only'

export const FIRM_OFFBOARDING_UID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/
export type FirmOffboardingAccess = 'allowed' | 'blocked' | 'unavailable'
export type FirmOffboardingSubject = { accountUid?: string; personUid: string }

const TIMEOUT_MS = 5000

export function isFirmOffboardingUid(value: unknown): value is string {
  return typeof value === 'string' && FIRM_OFFBOARDING_UID_PATTERN.test(value)
}

function isLegacyServiceRoleKey(key: string): boolean {
  const parts = key.split('.')
  if (parts.length !== 3 || parts.some(part => !part)) return false
  try {
    const payload: unknown = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    return typeof payload === 'object' && payload !== null && (payload as { role?: unknown }).role === 'service_role'
  } catch {
    return false
  }
}

function configuration(): { origin: string; key: string } | null {
  const origin = process.env.FIRM_OFFBOARDING_SUPABASE_URL
  const key = process.env.FIRM_OFFBOARDING_SUPABASE_SERVICE_ROLE_KEY
  if (!origin || !key || key.length > 8192 || /\s/.test(key) || !isLegacyServiceRoleKey(key)) return null

  try {
    const parsed = new URL(origin)
    if (
      parsed.protocol !== 'https:' ||
      parsed.origin !== origin ||
      parsed.username ||
      parsed.password ||
      parsed.port ||
      !/^[a-z0-9]+\.supabase\.co$/i.test(parsed.hostname)
    ) return null
  } catch {
    return null
  }

  return { origin, key }
}

export async function readFirmOffboardingAccess(subject: FirmOffboardingSubject): Promise<FirmOffboardingAccess> {
  const configured = configuration()
  const hasAccountContext = subject.accountUid !== undefined
  if (
    !configured ||
    !isFirmOffboardingUid(subject.personUid) ||
    (hasAccountContext && !isFirmOffboardingUid(subject.accountUid))
  ) return 'unavailable'

  const url = new URL('/rest/v1/member_offboarding_holds', configured.origin)
  url.searchParams.set('select', 'account_uid')
  url.searchParams.set('released_at', 'is.null')
  if (hasAccountContext) url.searchParams.set('account_uid', `eq.${subject.accountUid}`)
  else url.searchParams.set('person_uid', `eq.${subject.personUid}`)
  url.searchParams.set('limit', '1')

  let response: Response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        apikey: configured.key,
        Authorization: `Bearer ${configured.key}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    return 'unavailable'
  }

  if (!response.ok) return 'unavailable'
  try {
    const rows: unknown = await response.json()
    if (!Array.isArray(rows)) return 'unavailable'
    return rows.length === 0 ? 'allowed' : 'blocked'
  } catch {
    return 'unavailable'
  }
}
