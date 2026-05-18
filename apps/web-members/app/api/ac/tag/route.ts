import { NextResponse } from 'next/server'
import { applyACContactTag } from '@/lib/ac-event-tracking'
import { getCurrentUser } from '@/lib/auth-server'

const ALLOWED_TAGS = new Set(['member-activated', 'onboarding-complete'])

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json().catch(() => null)
        const tag = body?.tag

        if (typeof tag !== 'string' || !ALLOWED_TAGS.has(tag)) {
            return NextResponse.json({ error: 'Unsupported tag' }, { status: 400 })
        }

        const success = await applyACContactTag({ email: user.email, tag })

        return NextResponse.json({ success })
    } catch (error) {
        console.error('[AC Tag] Error applying contact tag:', error)
        return NextResponse.json({ error: 'Failed to apply tag' }, { status: 500 })
    }
}
