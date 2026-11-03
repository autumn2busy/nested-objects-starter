import { FirmProfileError, type FirmProfileInput } from './contracts'
const fields = ['legalName', 'displayName', 'website', 'address', 'primaryContactName', 'primaryContactEmail', 'serviceZips', 'inspectionTypes', 'requirements']
function text(value: unknown, name: string, max: number, required = false): string {
  if (typeof value !== 'string') throw new FirmProfileError(400, `Invalid ${name}.`)
  const result = value.trim()
  if ((required && !result) || result.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(result)) throw new FirmProfileError(400, `Invalid ${name}.`)
  return result
}
function strings(value: unknown, name: string, max: number): string[] {
  if (!Array.isArray(value) || value.length > max) throw new FirmProfileError(400, `Invalid ${name}.`)
  return Array.from(new Set(value.map(item => text(item, name, 80, true))))
}
export function parseProfile(value: unknown): FirmProfileInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new FirmProfileError(400, 'Invalid profile.')
  const record = value as Record<string, unknown>
  if (Object.keys(record).some(key => !fields.includes(key))) throw new FirmProfileError(400, 'Unrecognized profile field.')
  const website = text(record.website, 'website', 500)
  if (website) {
    let parsed: URL
    try { parsed = new URL(website) } catch { throw new FirmProfileError(400, 'Use a full HTTPS website address.') }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new FirmProfileError(400, 'Use an HTTPS website address without credentials.')
  }
  const email = text(record.primaryContactEmail, 'contact email', 254, true)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new FirmProfileError(400, 'Invalid contact email.')
  const serviceZips = strings(record.serviceZips, 'service ZIP codes', 500)
  if (serviceZips.some(zip => !/^\d{5}$/.test(zip))) throw new FirmProfileError(400, 'Use five-digit service ZIP codes.')
  return { legalName: text(record.legalName, 'legal company name', 200, true), displayName: text(record.displayName, 'display name', 200, true), website, address: text(record.address, 'company address', 1000), primaryContactName: text(record.primaryContactName, 'primary contact', 200, true), primaryContactEmail: email, serviceZips, inspectionTypes: strings(record.inspectionTypes, 'inspection types', 30), requirements: text(record.requirements, 'requirements', 5000) }
}
export function parseRevision(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) throw new FirmProfileError(400, 'Invalid profile revision.')
  return Number(value)
}
