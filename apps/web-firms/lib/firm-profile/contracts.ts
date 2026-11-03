export const FIRM_PLAN_IDS = ['wmjGbGQV', 'A93NbYQ0'] as const
export type VerifiedFirmIdentity = { accountUid: string; personUid: string; subscriptionUid: string; planUid: string; isPrimary: boolean }
export type FirmProfileInput = { legalName: string; displayName: string; website: string; address: string; primaryContactName: string; primaryContactEmail: string; serviceZips: string[]; inspectionTypes: string[]; requirements: string }
export type FirmProfile = FirmProfileInput & { id: string; revision: number; pilotStage: string; updatedAt: string }
export class FirmProfileError extends Error {
  constructor(public readonly status: number, message: string) { super(message) }
}
