import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import type { NextRequest } from 'next/server'
import {
  POST,
  __setPersonUidForTests,
  __setSupabaseClientForTests,
  __setVerifyOutsetaTokenForTests,
} from '../app/api/profile/avatar/route'

type UploadCall = {
  bucket: string
  path: string
  options: { upsert: boolean; contentType: string }
}

const tokenClaims = {
  sub: 'person-123',
  email: 'person@example.com',
  name: 'Person Example',
  'outseta:accountUid': 'account-1',
  'outseta:subscriptionUid': 'subscription-1',
  'outseta:planUid': 'plan-1',
  aud: 'nested-objects',
  iss: 'https://nested-objects.outseta.com',
  exp: Math.floor(Date.now() / 1000) + 3600,
}

function buildRequest(formData?: FormData, withAuth = true) {
  const headers: Record<string, string> = {}
  if (withAuth) {
    headers.authorization = 'Bearer test-token'
  }
  const req = new Request('http://localhost/api/profile/avatar', {
    method: 'POST',
    headers,
    body: formData,
  }) as NextRequest
  ;(req as unknown as { cookies?: { get: (name: string) => { value: string } | undefined } })
    .cookies = {
    get: () => undefined,
  }
  return req
}

function createFile(size: number, type: string, name: string) {
  const buffer = Buffer.alloc(size, 1)
  return new File([buffer], name, { type })
}

beforeEach(() => {
  const uploadCalls: UploadCall[] = []
  __setSupabaseClientForTests(() => ({
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, _buffer: Buffer, options: UploadCall['options']) => {
          uploadCalls.push({ bucket, path, options })
          return { data: { path }, error: null }
        },
        createSignedUrl: async (path: string) => ({
          data: { signedUrl: `https://signed.example/${path}` },
          error: null,
        }),
      }),
    },
  }) as any)

  __setVerifyOutsetaTokenForTests(async () => tokenClaims)
  __setPersonUidForTests((claims) => claims?.sub ?? null)

  ;(globalThis as typeof globalThis & { __uploadCalls?: UploadCall[] }).__uploadCalls =
    uploadCalls
})

test('unauthenticated requests return 401', async () => {
  const formData = new FormData()
  const req = buildRequest(formData, false)
  const res = await POST(req)
  assert.equal(res.status, 401)
})

test('invalid MIME types return 400', async () => {
  const formData = new FormData()
  formData.set('file', createFile(10, 'text/plain', 'notes.txt'))
  const req = buildRequest(formData)
  const res = await POST(req)
  assert.equal(res.status, 400)
})

test('oversized files return 400', async () => {
  const formData = new FormData()
  formData.set('file', createFile(2 * 1024 * 1024 + 1, 'image/png', 'avatar.png'))
  const req = buildRequest(formData)
  const res = await POST(req)
  assert.equal(res.status, 400)
})

test('valid uploads return deterministic path', async () => {
  const formData = new FormData()
  formData.set('file', createFile(128, 'image/png', 'avatar.png'))
  const req = buildRequest(formData)
  const res = await POST(req)
  assert.equal(res.status, 200)
  const payload = (await res.json()) as { path: string }
  assert.equal(payload.path, 'avatars/person-123/avatar.png')
})

test('second upload overwrites the same path', async () => {
  const makeRequest = () => {
    const formData = new FormData()
    formData.set('file', createFile(128, 'image/png', 'avatar.png'))
    return buildRequest(formData)
  }

  await POST(makeRequest())
  await POST(makeRequest())

  const uploadCalls = (globalThis as typeof globalThis & { __uploadCalls?: UploadCall[] })
    .__uploadCalls
  assert.equal(uploadCalls?.length, 2)
  assert.equal(uploadCalls?.[0]?.path, 'avatars/person-123/avatar.png')
  assert.equal(uploadCalls?.[1]?.path, 'avatars/person-123/avatar.png')
  assert.equal(uploadCalls?.[0]?.options.upsert, true)
  assert.equal(uploadCalls?.[1]?.options.upsert, true)
})
