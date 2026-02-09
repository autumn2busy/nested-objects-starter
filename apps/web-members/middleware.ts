import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { createLogger, getRequestId, REQUEST_ID_HEADER } from '@/lib/logger';

const apiLimiter = rateLimit({ limit: 60, intervalMs: 60 * 1000 });

function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || forwardedFor;
  }

  return request.ip || request.headers.get('x-real-ip') || 'unknown';
}

export async function middleware(request: NextRequest) {
  const requestId = getRequestId(request.headers);
  const logger = createLogger({ requestId, source: 'middleware' });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  if (request.nextUrl.pathname.startsWith('/api')) {
    const clientId = getClientIdentifier(request);
    try {
      await apiLimiter.check(clientId);
    } catch {
      logger.warn('API rate limit exceeded', {
        clientId,
        path: request.nextUrl.pathname,
        method: request.method,
      });

      const response = NextResponse.json(
        { error: 'Too many requests. Please try again later.', requestId },
        { status: 429 }
      );
      response.headers.set(REQUEST_ID_HEADER, requestId);
      return response;
    }
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
