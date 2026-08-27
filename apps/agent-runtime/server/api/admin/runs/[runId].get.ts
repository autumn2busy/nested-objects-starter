import { defineEventHandler, getRouterParam } from 'nitro/h3'

import { assertAdminUuid } from '../../../../src/http/admin-contracts.js'
import { verifyAdminServiceRequest } from '../../../../src/http/admin-request-auth.js'
import { adminErrorResponse } from '../../../../src/http/admin-responses.js'
import { jsonResponse } from '../../../../src/http/web.js'
import { loadAdminRuntimeConfiguration, resolveAdminRuntimeContext } from '../../../../src/runtime/admin-runtime.js'

export default defineEventHandler(async (event) => {
  try {
    const configuration = loadAdminRuntimeConfiguration()
    const auth = verifyAdminServiceRequest(event.req, '', {
      sharedSecret: configuration.sharedSecret,
      autumnSubjectId: configuration.autumnSubjectId,
      allowedOrigin: configuration.allowedOrigin,
    })
    const context = await resolveAdminRuntimeContext(process.env, configuration)
    const runId = assertAdminUuid(getRouterParam(event, 'runId') ?? '', 'Run')
    const detail = await context.store.getRun(auth.actorSubject, runId)
    if (!detail) return jsonResponse({ ok: false, error: { code: 'ADMIN_CONTROL_PLANE_NOT_FOUND', message: 'Not found.' } }, 404)
    return jsonResponse({ ok: true, detail })
  } catch (error) {
    return adminErrorResponse(error, 'run-detail')
  }
})
