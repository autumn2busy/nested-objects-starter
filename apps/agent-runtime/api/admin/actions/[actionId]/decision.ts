import {
  assertActionId,
  parseAdminActionDecision,
  readAdminJson,
} from '../../../../src/http/admin-contracts.js'
import { verifyAdminServiceRequest } from '../../../../src/http/admin-request-auth.js'
import { adminErrorResponse } from '../../../../src/http/admin-responses.js'
import { jsonResponse, methodNotAllowed } from '../../../../src/http/web.js'
import {
  loadAdminRuntimeConfiguration,
  resolveAdminRuntimeContext,
} from '../../../../src/runtime/admin-runtime.js'

const DECISION_PATH = /^\/api\/admin\/actions\/([^/]+)\/decision\/?$/

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return methodNotAllowed(['POST'])

    try {
      const { bodyText, value } = await readAdminJson(request)
      const configuration = loadAdminRuntimeConfiguration()
      const auth = verifyAdminServiceRequest(request, bodyText, {
        sharedSecret: configuration.sharedSecret,
        autumnSubjectId: configuration.autumnSubjectId,
        allowedOrigin: configuration.allowedOrigin,
      })
      const context = await resolveAdminRuntimeContext(process.env, configuration)
      const actionId = assertActionId(DECISION_PATH.exec(new URL(request.url).pathname)?.[1] ?? '')
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
  },
}
