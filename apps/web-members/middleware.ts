import { NextResponse, type NextRequest } from 'next/server'

const securityHeaders: Record<string, string> = {
  'X-DNS-Prefetch-Control': 'on',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=(self)',
}

export function middleware(request: NextRequest) {
  const isDisabledToolRoute = request.nextUrl.pathname.startsWith('/tools/')
  const response = isDisabledToolRoute
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
