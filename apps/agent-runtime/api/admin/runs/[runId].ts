import { assertAdminUuid } from '../../../src/http/admin-contracts.js'
import { verifyAdminServiceRequest } from '../../../src/http/admin-request-auth.js'
import { adminErrorResponse } from '../../../src/http/admin-responses.js'
import { jsonResponse, methodNotAllowed } from '../../../src/http/web.js'
import { loadAdminRuntimeConfiguration, resolveAdminRuntimeContext } from '../../../src/runtime/admin-runtime.js'

const RUN_PATH = /^\/api\/admin\/runs\/([^/]+)\/?$/

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') return methodNotAllowed(['GET'])

    try {
      const configuration = loadAdminRuntimeConfiguration()
      const auth = verifyAdminServiceRequest(request, '', {
        sharedSecret: configuration.sharedSecret,
        autumnSubjectId: configuration.autumnSubjectId,
        allowedOrigin: configuration.allowedOrigin,
      })
      const context = await resolveAdminRuntimeContext(process.env, configuration)
      const runId = assertAdminUuid(RUN_PATH.exec(new URL(request.url).pathname)?.[1] ?? '', 'Run')
      const detail = await context.store.getRun(auth.actorSubject, runId)
      if (!detail) {
        return jsonResponse({
          ok: false,
          error: { code: 'ADMIN_CONTROL_PLANE_NOT_FOUND', message: 'Not found.' },
        }, 404)
      }
      return jsonResponse({ ok: true, detail })
    } catch (error) {
      return adminErrorResponse(error, 'run-detail')
    }
  },
}
