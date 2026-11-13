import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { assertFirmSessionTokenSize, FirmSessionSizeError } from '@/lib/firm-profile/contracts'
import { FIRM_SESSION_COOKIE, FIRM_STATE_COOKIE, firmsOrigin, readFirmProfile, verifyFirmToken } from '@/lib/firm-profile/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  let origin: string
  try { origin = firmsOrigin() } catch { return NextResponse.json({error:'Firm workspace setup is not finished.'},{status:503,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}}) }
  let response: NextResponse
  try {
    const state = request.nextUrl.searchParams.get('state') || ''
    const expected = request.cookies.get(FIRM_STATE_COOKIE)?.value || ''
    if (!/^[a-f0-9]{64}$/.test(state) || state.length !== expected.length || !timingSafeEqual(Buffer.from(state),Buffer.from(expected))) throw new Error('Invalid login state')
    const token = request.nextUrl.searchParams.get('access_token') || ''
    assertFirmSessionTokenSize(token)
    const verified = await verifyFirmToken(token)
    await readFirmProfile(verified.identity)
    response = NextResponse.redirect(new URL('/profile',origin),303)
    response.cookies.set(FIRM_SESSION_COOKIE,token,{ httpOnly:true, secure:true, sameSite:'lax', path:'/', maxAge:Math.max(0,Math.min(3600,verified.expiresAt-Math.floor(Date.now()/1000))) })
  } catch(error) {
    response = NextResponse.redirect(new URL(error instanceof FirmSessionSizeError ? '/login?notice=session-size' : '/login?notice=verification',origin),303)
    response.cookies.set(FIRM_SESSION_COOKIE,'',{ httpOnly:true, secure:true, sameSite:'lax', path:'/', maxAge:0 })
  }
  response.cookies.set(FIRM_STATE_COOKIE,'',{ httpOnly:true, secure:true, sameSite:'lax', path:'/', maxAge:0 })
  response.headers.set('Cache-Control','private, no-store')
  response.headers.set('Referrer-Policy','no-referrer')
  return response
}
