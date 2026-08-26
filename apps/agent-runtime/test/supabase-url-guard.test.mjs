import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ServerOnlyAccessError,
  assertServerOnlyControlPlaneAccess,
} from '../dist/index.js'

function legacyJwt(role) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role })}.signature`
}

const serviceRoleKey = legacyJwt('service_role')

test('server-only Supabase guard permits HTTPS and local loopback HTTP endpoints', () => {
  for (const url of [
    'https://staging-project.supabase.co',
    'http://localhost:54321',
    'http://127.0.0.1:54321',
    'http://[::1]:54321',
  ]) {
    assert.doesNotThrow(() =>
      assertServerOnlyControlPlaneAccess({
        url,
        serviceRoleKey,
        browserEnvironment: false,
      }),
    )
  }
})

test('server-only Supabase guard rejects insecure non-loopback and malformed endpoints', () => {
  for (const url of [
    'http://staging-project.supabase.co',
    'http://192.168.1.15:54321',
    'ftp://localhost:54321',
    'not-a-url',
  ]) {
    assert.throws(
      () =>
        assertServerOnlyControlPlaneAccess({
          url,
          serviceRoleKey,
          browserEnvironment: false,
        }),
      ServerOnlyAccessError,
    )
  }
})
