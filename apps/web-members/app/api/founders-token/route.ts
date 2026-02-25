import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

/**
 * GET /api/founders-token?token=xxx
 * Validates a founders invite token. Returns the associated email if valid.
 *
 * POST /api/founders-token
 * Marks a token as redeemed after the member completes signup.
 * Body: { token: string }
 */

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ valid: false, error: 'No token provided' }, { status: 400 })
  }

  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('founders_invite_tokens')
      .select('email, first_name, full_name, redeemed')
      .eq('token', token)
      .single()

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 404 })
    }

    if (data.redeemed) {
      return NextResponse.json({
        valid: false,
        redeemed: true,
        error: 'This invite has already been used',
      }, { status: 410 })
    }

    return NextResponse.json({
      valid: true,
      email: data.email,
      firstName: data.first_name,
      fullName: data.full_name,
    })
  } catch (err) {
    console.error('[founders-token] Validation error:', err)
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, error: 'No token' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('founders_invite_tokens')
      .update({ redeemed: true, redeemed_at: new Date().toISOString() })
      .eq('token', token)
      .eq('redeemed', false)
      .select('email')
      .single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Token not found or already used' }, { status: 404 })
    }

    return NextResponse.json({ success: true, email: data.email })
  } catch (err) {
    console.error('[founders-token] Redeem error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
