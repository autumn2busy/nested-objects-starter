import { NextRequest, NextResponse } from 'next/server'
import { verifyOutsetaToken } from '@/lib/auth-server'
import { safeAuthRedirect } from '@/lib/auth-redirect'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Complete hosted Outseta login before any protected layout or client code runs. */
export async function GET(request: NextRequest) {
  const tokens = request.nextUrl.searchParams.getAll('access_token')
  const token = tokens.length === 0
    ? request.headers.get('x-outseta-login-token')
    : tokens.length === 1 ? tokens[0] : null
  let authenticated = false
  try {
    if (token && token.length <= 16_384) {
      const user = await verifyOutsetaToken(token)
      authenticated = typeof user?.sub === 'string' && user.sub.length > 0
    }
  } catch {
    // Never log a callback URL, token, or provider response.
  }

  const destination = authenticated
    ? safeAuthRedirect(request.nextUrl.searchParams.get('redirect'))
    : '/auth/callback?error=invalid_session'
  const response = NextResponse.redirect(new URL(destination, request.url), 303)
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  response.headers.set('Referrer-Policy', 'no-referrer')
  if (authenticated && token) {
    response.cookies.set('outseta_access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
  }
  return response
}
