import { NextResponse, type NextRequest } from 'next/server'
import { safeAuthRedirect } from './lib/auth-redirect'
import { isEnabledMemberToolPath } from './lib/member-tool-access'

const securityHeaders: Record<string, string> = {
  'X-DNS-Prefetch-Control': 'on',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=(self)',
}

const protectedPortalPrefixes = [
  '/admin',
  '/directory-preview',
  '/inspector-dashboard',
  '/members',
  '/profile',
  '/security',
]

const OUTSETA_LOGIN_URL = 'https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isEnabledToolRoute = isEnabledMemberToolPath(pathname)
  const isProtectedPortalRoute = isEnabledToolRoute || protectedPortalPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  const hasSessionCookie = Boolean(request.cookies.get('outseta_access_token')?.value)
  const isDisabledToolRoute = pathname.startsWith('/tools/') && !isEnabledToolRoute

  // Hosted login returns to a protected page before its HttpOnly session exists.
  // Rewrite to verification, never render the portal just because a token is present.
  const isLoginReturn = request.method === 'GET'
    && request.nextUrl.searchParams.has('access_token')
    && (isProtectedPortalRoute || pathname === '/auth/callback')
  let response: NextResponse
  if (isLoginReturn) {
    const destination = pathname === '/auth/callback'
      ? safeAuthRedirect(request.nextUrl.searchParams.get('redirect'))
      : safeAuthRedirect(pathname + request.nextUrl.search)
    const completionUrl = new URL('/api/auth/complete', request.url)
    completionUrl.searchParams.set('redirect', destination)
    const tokens = request.nextUrl.searchParams.getAll('access_token')
    const forwardedHeaders = new Headers(request.headers)
    // Next exposes the rewrite URL as a response header. Keep credentials out of it.
    // Always overwrite incoming values; the handler still verifies the JWT.
    const token = tokens.length === 1 && tokens[0].length <= 16_384
      && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(tokens[0]) ? tokens[0] : ''
    forwardedHeaders.set('x-outseta-login-token', token)
    response = NextResponse.rewrite(completionUrl, { request: { headers: forwardedHeaders } })
  } else {
    response = isProtectedPortalRoute && !hasSessionCookie
      ? NextResponse.redirect(OUTSETA_LOGIN_URL, 307)
      : isDisabledToolRoute
        ? NextResponse.redirect(new URL('/tools', request.url), 307)
        : NextResponse.next()
  }

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  if (isProtectedPortalRoute || isLoginReturn || pathname.startsWith('/auth/')) {
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
    response.headers.set('Referrer-Policy', 'no-referrer')
  }

  if (pathname === '/members' || pathname.startsWith('/members/') || pathname.startsWith('/tools/')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  }

  if (request.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|map|txt|xml)$).*)',
  ],
}
