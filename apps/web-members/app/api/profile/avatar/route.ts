import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import type { Profile } from '@/types/profile'

function resolveUserEmail(user: any) {
  return (
    (user?.email as string | undefined) ??
    (user?.Email as string | undefined) ??
    null
  )
}

function resolveUserIdentifier(user: any) {
  return (
    user?.sub ||
    user?.Uid ||
    user?.uid ||
    user?.Id ||
    user?.id ||
    resolveUserEmail(user) ||
    'user'
  )
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const userEmail = resolveUserEmail(user)

    if (!userEmail) {
      return NextResponse.json({ error: 'No user email found for this session.' }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image uploads are supported.' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const bucket = process.env.SUPABASE_AVATAR_BUCKET || 'avatars'

    const { data: existingBucket } = await supabase.storage.getBucket(bucket)
    if (!existingBucket) {
      const { error: bucketError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
      })

      if (bucketError && !bucketError.message.includes('already exists')) {
        console.error('[PROFILE_AVATAR_BUCKET_ERROR]', bucketError)
        return NextResponse.json({ error: 'Could not prepare avatar storage.' }, { status: 500 })
      }
    }

    const fileExt = file.name?.split('.').pop() || 'jpg'
    const sanitizedExt = fileExt.replace(/[^a-zA-Z0-9]/g, '') || 'jpg'
    const path = `${resolveUserIdentifier(user)}/avatar-${Date.now()}.${sanitizedExt}`
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, fileBuffer, {
      contentType: file.type,
      upsert: true,
    })

    if (uploadError) {
      console.error('[PROFILE_AVATAR_UPLOAD_ERROR]', uploadError)
      return NextResponse.json({ error: 'Failed to upload avatar.' }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path)
    const avatarUrl = publicUrlData?.publicUrl

    if (!avatarUrl) {
      return NextResponse.json({ error: 'Could not resolve avatar URL.' }, { status: 500 })
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ user_email: userEmail, avatar_url: avatarUrl }, { onConflict: 'user_email' })
      .select()
      .single()

    if (error) {
      console.error('[PROFILE_AVATAR_SAVE_ERROR]', error)
      return NextResponse.json({ error: 'Failed to save avatar URL.' }, { status: 500 })
    }

    return NextResponse.json({ profile: data as Profile })
  } catch (error) {
    console.error('[PROFILE_AVATAR_POST_UNEXPECTED]', error)
    return NextResponse.json({ error: 'Unexpected error while uploading avatar.' }, { status: 500 })
  }
}
