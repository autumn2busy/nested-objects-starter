import { test, mock } from 'node:test'
import assert from 'node:assert'
import { NextRequest } from 'next/server'

import * as authServer from '../lib/auth-server'
import * as supabaseServer from '../lib/supabase-server'
import { PATCH as patchMemberJob } from '../app/api/member-jobs/[id]/route'
import { DELETE as deleteJob } from '../app/api/jobs/[id]/route'

test('member job updates are scoped to the authenticated user', async () => {
  const eqCalls: Array<[string, unknown]> = []
  let updatePayload: Record<string, unknown> | null = null

  const builder = {
    update: (payload: Record<string, unknown>) => {
      updatePayload = payload
      return builder
    },
    eq: (column: string, value: unknown) => {
      eqCalls.push([column, value])
      return builder
    },
    select: () => builder,
    single: async () => ({ data: { id: 'job-123' }, error: null }),
  }

  mock.method(supabaseServer, 'createClient', () => ({
    from: () => builder,
  }))
  mock.method(authServer, 'getCurrentUser', async () => ({ 'outseta:planUid': 'L9nbKV9Z' }))
  mock.method(authServer, 'hasAccess', () => true)
  mock.method(authServer, 'getOutsetaUserId', () => 'user-123')

  const request = new NextRequest('http://localhost/api/member-jobs/job-123', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Updated title' }),
  })

  const response = await patchMemberJob(request, { params: { id: 'job-123' } })

  assert.strictEqual(response.status, 200)
  assert.ok(eqCalls.some(([column, value]) => column === 'user_id' && value === 'user-123'))
  assert.ok(eqCalls.some(([column, value]) => column === 'id' && value === 'job-123'))
  assert.strictEqual(updatePayload?.user_id, 'user-123')

  mock.restoreAll()
})

test('job deletions enforce tenant scoping by user_id', async () => {
  const eqCalls: Array<[string, unknown]> = []

  const builder = {
    error: null as null,
    delete: () => builder,
    eq: (column: string, value: unknown) => {
      eqCalls.push([column, value])
      return builder
    },
  }

  mock.method(supabaseServer, 'createClient', () => ({
    from: () => builder,
  }))
  mock.method(authServer, 'getCurrentUser', async () => ({ 'outseta:planUid': 'L9nbKV9Z' }))
  mock.method(authServer, 'hasAccess', () => true)
  mock.method(authServer, 'getOutsetaUserId', () => 'user-456')

  const request = new NextRequest('http://localhost/api/jobs/job-999', { method: 'DELETE' })
  const response = await deleteJob(request, { params: { id: 'job-999' } })

  assert.strictEqual(response.status, 200)
  assert.ok(eqCalls.some(([column, value]) => column === 'user_id' && value === 'user-456'))
  assert.ok(eqCalls.some(([column, value]) => column === 'id' && value === 'job-999'))

  mock.restoreAll()
})
