import { test, mock } from 'node:test'
import assert from 'node:assert'
import { NextRequest } from 'next/server'

import * as authServer from '../lib/auth-server'
import * as aiQuota from '../lib/ai-quota'
import * as nextHeaders from 'next/headers'
import { POST as conciergePost } from '../app/api/ai/concierge/route'
import { POST as resumeGeneratePost } from '../app/api/ai/resume/generate/route'
import { POST as resumeParsePost } from '../app/api/ai/resume/parse/route'

test('AI concierge rejects empty prompts', async () => {
  mock.method(authServer, 'getCurrentUser', async () => ({
    'outseta:planUid': 'rQVqlLm6',
  }))
  mock.method(authServer, 'getOutsetaUserId', () => 'user-123')
  mock.method(authServer, 'hasAccess', () => true)
  mock.method(aiQuota, 'checkAIQuota', async () => undefined)
  mock.method(aiQuota, 'trackAIUsage', async () => undefined)
  mock.method(nextHeaders, 'cookies', () => ({
    get: () => ({ value: 'token' }),
  }))

  const request = new Request('http://localhost/api/ai/concierge', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: '   ' }),
  })

  const response = await conciergePost(request)
  const data = await response.json()

  assert.strictEqual(response.status, 400)
  assert.strictEqual(data.error, 'Prompt is required')

  mock.restoreAll()
})

test('AI resume generator requires contact info and target roles', async () => {
  mock.method(nextHeaders, 'headers', () => new Headers({ authorization: 'Bearer token' }))

  const request = new Request('http://localhost/api/ai/resume/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  })

  const response = await resumeGeneratePost(request)
  const data = await response.json()

  assert.strictEqual(response.status, 400)
  assert.strictEqual(
    data.error,
    'Resume data must include contact information and at least one target role.',
  )

  mock.restoreAll()
})

test('AI resume parser requires a file upload', async () => {
  const formData = new FormData()
  const request = new NextRequest('http://localhost/api/ai/resume/parse', {
    method: 'POST',
    headers: { authorization: 'Bearer token' },
    body: formData,
  })

  const response = await resumeParsePost(request)
  const data = await response.json()

  assert.strictEqual(response.status, 400)
  assert.strictEqual(data.error, 'No file uploaded. Please select a resume file.')
})
