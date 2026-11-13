import { NextRequest, NextResponse } from 'next/server'
import { FirmProfileError } from '@/lib/firm-profile/contracts'
import { parseProfile, parseRevision } from '@/lib/firm-profile/validation'
import { readBoundedJson } from '@/lib/firm-profile/http'
import { firmSession, firmsOrigin, readFirmProfile, saveFirmProfile } from '@/lib/firm-profile/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }
function failure(error: unknown) {
  return NextResponse.json({ error: error instanceof FirmProfileError ? error.message : 'Your firm profile is temporarily unavailable.' }, { status: error instanceof FirmProfileError ? error.status : 503, headers })
}
export async function GET() {
  try { return NextResponse.json(await readFirmProfile(await firmSession()), { headers }) } catch(error) { return failure(error) }
}
export async function PUT(request: NextRequest) {
  try {
    if (request.headers.get('origin') !== firmsOrigin() || request.headers.get('sec-fetch-site') === 'cross-site') throw new FirmProfileError(403,'Please save from the firm workspace.')
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') throw new FirmProfileError(415,'Use a JSON profile request.')
    const identity = await firmSession()
    const body = await readBoundedJson(request)
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['profile','revision'].includes(key))) throw new FirmProfileError(400,'Invalid profile request.')
    const input = body as Record<string,unknown>
    return NextResponse.json(await saveFirmProfile(identity,parseProfile(input.profile),parseRevision(input.revision)), { headers })
  } catch(error) { return failure(error) }
}
