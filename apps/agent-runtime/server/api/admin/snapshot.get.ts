import { defineEventHandler } from 'nitro/h3'

import { verifyAdminServiceRequest } from '../../../src/http/admin-request-auth.js'
import { adminErrorResponse } from '../../../src/http/admin-responses.js'
import { jsonResponse } from '../../../src/http/web.js'
import { loadAdminRuntimeConfiguration, resolveAdminRuntimeContext } from '../../../src/runtime/admin-runtime.js'

export default defineEventHandler(async ({ req }) => {
  try {
    const configuration = loadAdminRuntimeConfiguration()
    const auth = verifyAdminServiceRequest(req, '', {
      sharedSecret: configuration.sharedSecret,
      autumnSubjectId: configuration.autumnSubjectId,
      allowedOrigin: configuration.allowedOrigin,
    })
    const context = await resolveAdminRuntimeContext(process.env, configuration)
    const snapshot = await context.store.getSnapshot(auth.actorSubject)
    return jsonResponse({ ok: true, snapshot })
  } catch (error) {
    return adminErrorResponse(error, 'snapshot')
  }
})
