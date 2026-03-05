import test from 'node:test'
import assert from 'node:assert/strict'

import { isBackgroundCheckAdmin } from './backgroundcheck-admin-auth'

test('non-admin denied when no role claims are available', async () => {
  const user = {
    sub: 'user-1',
    email: 'member@example.com',
  }

  const result = await isBackgroundCheckAdmin(user, 'user-1', async () => null)

  assert.equal(result, false)
})

test('admin allowed from verified identity claims', async () => {
  const user = {
    sub: 'admin-1',
    email: 'admin@example.com',
    roles: ['admin'],
  }

  const result = await isBackgroundCheckAdmin(user, 'admin-1', async () => null)

  assert.equal(result, true)
})

test('malformed token denied (no verified user claims)', async () => {
  const result = await isBackgroundCheckAdmin(null, null, async () => ({
    role: 'admin',
    permissions: ['background_check:verify'],
  }))

  assert.equal(result, false)
})
