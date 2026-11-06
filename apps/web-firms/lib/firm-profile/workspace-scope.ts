import 'server-only'
import { firmSession, readFirmProfile } from './server'
import { FirmProfileError } from './contracts'

/** Private server context, never a candidate-sharing or assignment authorization. */
export type FirmWorkspaceScope = Readonly<{
  accountUid: string
  profileId: string
  profileRevision: number
  serviceZips: readonly string[]
  inspectionTypes: readonly string[]
}>

/** No caller-supplied identity: reuses current session and tenant-scoped profile read. */
export async function readAuthorizedFirmWorkspaceScope(): Promise<FirmWorkspaceScope | null> {
  const identity = await firmSession()
  const { profile } = await readFirmProfile(identity)
  if (!profile) return null
  if (!profile.id || !Number.isSafeInteger(profile.revision) || profile.revision < 0 ||
      !Array.isArray(profile.serviceZips) || !profile.serviceZips.every(zip => typeof zip === 'string' && /^\d{5}$/.test(zip)) ||
      !Array.isArray(profile.inspectionTypes) || !profile.inspectionTypes.every(value => typeof value === 'string')) {
    throw new FirmProfileError(503, 'Firm workspace scope is unavailable.')
  }
  return Object.freeze({
    accountUid: identity.accountUid,
    profileId: profile.id,
    profileRevision: profile.revision,
    serviceZips: Object.freeze([...profile.serviceZips]),
    inspectionTypes: Object.freeze([...profile.inspectionTypes]),
  })
}
