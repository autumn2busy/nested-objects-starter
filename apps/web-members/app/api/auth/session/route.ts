import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyOutsetaToken, getOutsetaUserId } from '@/lib/auth-server'

// GET /api/auth/session
// Used by the client to get the current user context from the HttpOnly cookie
export async function GET() {
    const cookieStore = cookies()
    const token = cookieStore.get('outseta_access_token')?.value

    if (!token) {
        return NextResponse.json({ user: null, isAuthenticated: false })
    }

    const user = await verifyOutsetaToken(token)

    if (!user) {
        // Token valid format but verification failed (expired/invalid signature)
        return NextResponse.json({ user: null, isAuthenticated: false }, { status: 401 })
    }

    return NextResponse.json({
        user,
        isAuthenticated: true,
        planUid: user['outseta:planUid'],
        userId: getOutsetaUserId(user)
    })
}

// POST /api/auth/session
// Used by the auth callback to exchange the raw token for an HttpOnly cookie
export async function POST(request: Request) {
    try {
        const { accessToken } = await request.json()

        if (!accessToken) {
            return NextResponse.json({ error: 'Missing access token' }, { status: 400 })
        }

        // Verify token before setting cookie
        const user = await verifyOutsetaToken(accessToken)
        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const cookieStore = cookies()
        const cookieDomain =
            process.env.NEXT_PUBLIC_MEMBERS_COOKIE_DOMAIN ||
            (process.env.NODE_ENV === 'production' ? 'members.nestedobjects.com' : undefined)

        // Set HttpOnly cookie
        cookieStore.set('outseta_access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            domain: cookieDomain,
            maxAge: 60 * 60 * 24 * 7 // 7 days matches Outseta token life
        })

        return NextResponse.json({ success: true, user })
    } catch (error) {
        console.error('Session creation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/auth/session
// Used to logout
export async function DELETE() {
    const cookieStore = cookies()
    const cookieDomain =
        process.env.NEXT_PUBLIC_MEMBERS_COOKIE_DOMAIN ||
        (process.env.NODE_ENV === 'production' ? 'members.nestedobjects.com' : undefined)
    if (cookieDomain) {
        cookieStore.set('outseta_access_token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            domain: cookieDomain,
            expires: new Date(0),
        })
    } else {
        cookieStore.delete('outseta_access_token')
    }
    return NextResponse.json({ success: true })
}
