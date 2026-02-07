// =================================================================
// middleware.ts - Edge middleware for route protection
// Protects private routes from unauthenticated access
// Resolves: AUD-SEC-001
// =================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication (Hard Gate)
const PROTECTED_ROUTES = [
    '/dashboard',
    '/members',         // Hard gate per user request
    '/settings',
    '/profile',
];

// Routes allowed to be viewed by guests (Preview Gate or Public)
// Note: '/training', '/jobs', '/directory' are NOW permitted to fall through
// so the page component can handle the "PreviewGate" logic.

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the route is protected
    const isProtectedRoute = PROTECTED_ROUTES.some(route =>
        pathname.startsWith(route)
    );

    if (!isProtectedRoute) {
        return NextResponse.next();
    }

    // Check for Outseta auth cookie
    const authCookie = request.cookies.get('outseta_access_token');

    if (!authCookie?.value) {
        // Redirect to login with return URL
        const loginUrl = new URL('/login', request.url);
        // If Outseta login is handled on the client via fragment, we might direct to a page that opens it.
        // But per request: "redirect to /auth/login (or Outseta login) with returnTo=originalUrl"
        // Existing implementation used /login?returnUrl=...
        // We will keep that for consistency with current auth flow.

        loginUrl.searchParams.set('returnUrl', pathname);

        // Set a header to indicate this was an auth redirect (useful for debugging)
        const response = NextResponse.redirect(loginUrl);
        response.headers.set('x-middleware-cache', 'no-cache');

        return response;
    }

    // User has auth cookie, allow request to proceed
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files (images, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
};
