import { NextRequest, NextResponse } from 'next/server'
import { FIRM_SESSION_COOKIE, FIRM_STATE_COOKIE, firmsOrigin } from '@/lib/firm-profile/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest) {
  let origin: string
  try { origin = firmsOrigin() } catch { return NextResponse.json({error:'Firm workspace setup is not finished.'},{status:503}) }
  if (request.headers.get('origin') !== origin) return NextResponse.json({error:'Please sign out from your firm workspace.'},{status:403})
  const response = NextResponse.redirect(new URL('/login',origin),303)
  for (const name of [FIRM_SESSION_COOKIE,FIRM_STATE_COOKIE]) response.cookies.set(name,'',{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:0})
  response.headers.set('Cache-Control','private, no-store')
  return response
}
