import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPersonUidFromClaims, verifyOutsetaToken } from '../../../../lib/auth-server'

export const runtime = 'nodejs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const AVATAR_BUCKET =
  process.env.SUPABASE_AVATAR_BUCKET ||
  process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET ||
  'avatars'
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024
const SIGNED_URL_TTL_SECONDS = 60 * 60

type SupabaseClientFactory = () => ReturnType<typeof createClient>
type VerifyTokenFn = typeof verifyOutsetaToken
type PersonUidFn = typeof getPersonUidFromClaims

let createSupabaseClient: SupabaseClientFactory = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase URL or service role key is not configured.')
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}
let verifyToken: VerifyTokenFn = verifyOutsetaToken
let getPersonUid: PersonUidFn = getPersonUidFromClaims

export function __setSupabaseClientForTests(factory: SupabaseClientFactory) {
  createSupabaseClient = factory
}

export function __setVerifyOutsetaTokenForTests(fn: VerifyTokenFn) {
  verifyToken = fn
}

export function __setPersonUidForTests(fn: PersonUidFn) {
  getPersonUid = fn
}

function getBearerToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null
  const [scheme, token] = authHeader.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token.trim()
}

function getTokenFromRequest(req: NextRequest) {
  const bearerToken = getBearerToken(req)
  if (bearerToken) return bearerToken
  return req.cookies.get('outseta_access_token')?.value ?? null
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: { message } }, { status })
}

function getExtensionForMimeType(mimeType: string) {
  switch (mimeType) {
    case 'image/png':
      return 'png'
    case 'image/jpeg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    default:
      return 'bin'
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) {
      return errorResponse('Authentication required.', 401)
    }

    const claims = await verifyToken(token)
    if (!claims) {
      return errorResponse('Invalid or expired token.', 401)
    }

    const personUid = getPersonUid(claims)
    if (!personUid) {
      return errorResponse('Token missing person identifier.', 401)
    }

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return errorResponse('No file uploaded.')
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return errorResponse('Invalid file type.')
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return errorResponse('File size exceeds 2MB limit.')
    }

    const ext = getExtensionForMimeType(file.type)
    const filePath = `avatars/${personUid}/avatar.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const supabase = createSupabaseClient()

    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error || !data) {
      console.error('Supabase upload error', error)
      return errorResponse('Failed to upload image to storage.', 500)
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(data.path, SIGNED_URL_TTL_SECONDS)

    if (signedUrlError || !signedUrlData) {
      console.error('Supabase signed URL error', signedUrlError)
      return errorResponse('Failed to generate avatar URL.', 500)
    }

    return NextResponse.json({
      path: data.path,
      url: signedUrlData.signedUrl,
    })
  } catch (err) {
    console.error('Avatar upload unexpected error', err)
    return errorResponse('Unexpected error during avatar upload.', 500)
  }
}
