import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { trackACServerEvent } from '@/lib/ac-event-tracking'

/**
 * POST /api/ac/track-event
 *
 * Client-side proxy for AC Event Tracking API.
 * The client fires events here; we forward them server-side
 * so the AC_EVENT_KEY is never exposed to the browser.
 *
 * Body: { event: string, eventData?: Record<string, any> }
 */
export async function POST(request: Request) {
    try {
        // Get the authenticated user's email
        const user = await getCurrentUser()

        if (!user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { event, eventData } = body

        if (!event || typeof event !== 'string') {
            return NextResponse.json(
                { error: 'Event name is required' },
                { status: 400 }
            )
        }

        const success = await trackACServerEvent({
            email: user.email,
            event,
            eventData: eventData ? JSON.stringify(eventData) : undefined,
        })

        return NextResponse.json({ success })
    } catch (error) {
        console.error('[AC Track Event] Error:', error)
        return NextResponse.json(
            { error: 'Failed to track event' },
            { status: 500 }
        )
    }
}
