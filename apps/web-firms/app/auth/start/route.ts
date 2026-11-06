import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { FIRM_STATE_COOKIE, firmsOrigin, requireEnabled } from '@/lib/firm-profile/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    requireEnabled()
    const state = randomBytes(32).toString('hex')
    const callback = new URL('/auth/callback',firmsOrigin())
    callback.searchParams.set('state',state)
    const target = new URL('https://nested-objects.outseta.com/auth')
    target.searchParams.set('widgetMode','login')
    target.searchParams.set('authenticationCallbackUrl',callback.toString())
    const response = NextResponse.redirect(target,303)
    response.cookies.set(FIRM_STATE_COOKIE,state,{ httpOnly:true, secure:true, sameSite:'lax', path:'/', maxAge:600 })
    response.headers.set('Cache-Control','private, no-store')
    response.headers.set('Referrer-Policy','no-referrer')
    return response
  } catch {
    return NextResponse.json({ error:'Firm workspace setup is not finished.' },{ status:503,headers:{'Cache-Control':'private, no-store'} })
  }
}
