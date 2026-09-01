import { defineEventHandler, getRouterParam } from 'nitro/h3'

import {
  assertActionId,
  parseAdminActionDecision,
  readAdminJson,
} from '../../../../../src/http/admin-contracts.js'
import { verifyAdminServiceRequest } from '../../../../../src/http/admin-request-auth.js'
import { adminErrorResponse } from '../../../../../src/http/admin-responses.js'
import { jsonResponse } from '../../../../../src/http/web.js'
import {
  loadAdminRuntimeConfiguration,
  resolveAdminRuntimeContext,
} from '../../../../../src/runtime/admin-runtime.js'

export default defineEventHandler(async (event) => {
  try {
    const { bodyText, value } = await readAdminJson(event.req)
    const configuration = loadAdminRuntimeConfiguration()
    const auth = verifyAdminServiceRequest(event.req, bodyText, {
      sharedSecret: configuration.sharedSecret,
      autumnSubjectId: configuration.autumnSubjectId,
      allowedOrigin: configuration.allowedOrigin,
    })
    const context = await resolveAdminRuntimeContext(process.env, configuration)
    const actionId = assertActionId(getRouterParam(event, 'actionId') ?? '')
    const body = parseAdminActionDecision(value)
    const decidedAt = new Date().toISOString()
    const result = await context.store.decideAction({
      actionId,
      decision: body.decision,
      expectedVersion: body.expectedVersion,
      expectedPayloadDigest: body.expectedPayloadDigest,
      reason: body.reason,
      actorSubject: auth.actorSubject,
      nonceDigest: auth.nonceDigest,
      nonceExpiresAt: new Date(Date.parse(auth.timestamp) + 5 * 60_000).toISOString(),
      decidedAt,
      requestIdempotencyKey: `admin-action-decision:${auth.nonceDigest}`,
    })
    return jsonResponse({ ok: true, result })
  } catch (error) {
    return adminErrorResponse(error, 'action-decision')
  }
})
