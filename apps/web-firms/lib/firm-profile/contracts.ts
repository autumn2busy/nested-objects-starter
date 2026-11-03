export const FIRM_PLAN_IDS = ['wmjGbGQV', 'A93NbYQ0'] as const
// JWS tokens are ASCII. Leave more than 500 bytes for the cookie name and attributes
// below common browsers' 4096-byte per-cookie limit.
export const MAX_FIRM_SESSION_TOKEN_BYTES = 3500
export class FirmSessionSizeError extends Error {}
export function assertFirmSessionTokenSize(token: string) {
  if (new TextEncoder().encode(token).byteLength > MAX_FIRM_SESSION_TOKEN_BYTES) throw new FirmSessionSizeError('Firm sign-in exceeds the supported browser session size.')
}
export type VerifiedFirmIdentity = { accountUid: string; personUid: string; subscriptionUid: string; planUid: string; isPrimary: boolean }
export type FirmProfileInput = { legalName: string; displayName: string; website: string; address: string; primaryContactName: string; primaryContactEmail: string; serviceZips: string[]; inspectionTypes: string[]; requirements: string }
export type FirmProfile = FirmProfileInput & { id: string; revision: number; pilotStage: string; updatedAt: string }
export class FirmProfileError extends Error {
  constructor(public readonly status: number, message: string) { super(message) }
}
