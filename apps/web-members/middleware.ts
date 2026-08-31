import { NextResponse, type NextRequest } from 'next/server'

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
  '/profile',
  '/security',
]

const OUTSETA_LOGIN_URL = 'https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtectedPortalRoute = protectedPortalPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  const hasSessionCookie = Boolean(request.cookies.get('outseta_access_token')?.value)
  const isDisabledToolRoute = pathname.startsWith('/tools/')

  const response = isProtectedPortalRoute && !hasSessionCookie
    ? NextResponse.redirect(OUTSETA_LOGIN_URL, 307)
    : isDisabledToolRoute
      ? NextResponse.redirect(new URL('/tools', request.url), 307)
      : NextResponse.next()

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

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
