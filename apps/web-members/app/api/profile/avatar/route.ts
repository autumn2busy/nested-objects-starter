import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { verifyOutsetaToken, getOutsetaUserId, getCurrentUser } from '@/lib/auth-server'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const AVATAR_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET || 'avatars'

const limiter = rateLimit({ limit: 5, intervalMs: 60 * 1000 }); // 5 uploads per minute

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase URL or service role key is not configured.')
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auth Check (Cookie or Header)
    let user = await getCurrentUser();

    if (!user) {
      const authHeader = req.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1]
        user = await verifyOutsetaToken(token)
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // 2. Rate Limiting
    const userId = getOutsetaUserId(user)
    if (userId) {
      try {
        await limiter.check(userId);
      } catch {
        return NextResponse.json(
          { error: 'Too many upload attempts. Please wait a minute.' },
          { status: 429 }
        );
      }
    }


    if (!userId) {
      return NextResponse.json({ error: 'Could not identify user' }, { status: 401 })
    }

    // 2. Parse File
    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
    }

    // 3. Validation
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 })
    }

    // 4. Storage Path
    const ext = file.name.split('.').pop() || 'png'
    // Force lowercase extension and strictly use user ID to prevent path traversal or overwrites
    const safeExt = ext.replace(/[^a-z0-9]/gi, '').toLowerCase()

    // Path: avatars/{uid}/avatar.{ext}
    // Note: We rename to 'avatar' to simplify retrieval, or we could keep random.
    // User requested "profiles/{userId}/..." structure in audit, but let's stick to existing bucket "avatars" structure effectively.
    // Actually Audit said: "Store files under a user-specific path (e.g., profiles/{userId}/avatar.ext)"
    // Usage of 'AVATAR_BUCKET' variable implies the top level is the bucket.
    // So "avatars/{uid}/avatar.png" is good.
    const filePath = `${userId}/avatar.${safeExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const supabase = getSupabase()

    // 5. Upload (Overwrite enabled to allow replacing avatar)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError || !uploadData) {
      console.error('Supabase upload error', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload image to storage.' },
        { status: 500 },
      )
    }

    // 6. Get Public URL
    const { data: publicUrlData } = getSupabase().storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(uploadData.path)

    // Add cache buster to URL so UI updates immediately
    const publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`
    // Store the clean URL (without cache buster) in the database
    const cleanUrl = publicUrlData.publicUrl

    // 7. Update the profiles table with the new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: cleanUrl })
      .or(`id.eq.${userId},outseta_person_uid.eq.${userId}`)

    if (updateError) {
      console.error('Failed to update profile avatar_url:', updateError)
      // Non-fatal — the image uploaded successfully, just didn't save to profile
    }

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error('Avatar upload unexpected error', err)
    return NextResponse.json(
      { error: 'Unexpected error during avatar upload.' },
      { status: 500 },
    )
  }
}