import { NextRequest, NextResponse } from 'next/server'
import { handleAvatarUpload } from '../../../../lib/avatar-upload'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  return handleAvatarUpload(req)
}
