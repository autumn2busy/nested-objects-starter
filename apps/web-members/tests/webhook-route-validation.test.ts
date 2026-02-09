import { test } from 'node:test'
import assert from 'node:assert'
import { NextRequest } from 'next/server'

import { POST as webhookPost } from '../app/api/webhooks/outseta/route'

test('Outseta webhook rejects invalid signatures', async () => {
  process.env.OUTSETA_WEBHOOK_SECRET = 'deadbeef'

  const request = new NextRequest('http://localhost/api/webhooks/outseta', {
    method: 'POST',
    headers: { 'x-hub-signature-256': 'sha256=invalid' },
    body: JSON.stringify({ event: 'test' }),
  })

  const response = await webhookPost(request)
  const data = await response.json()

  assert.strictEqual(response.status, 401)
  assert.strictEqual(data.error, 'Invalid signature')
})
