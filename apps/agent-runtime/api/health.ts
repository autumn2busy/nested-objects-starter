import { runtimeHealthSnapshot } from '../src/http/runtime-health.js'
import { jsonResponse, methodNotAllowed } from '../src/http/web.js'

export default {
  fetch(request: Request): Response {
    if (request.method !== 'GET') return methodNotAllowed(['GET'])
    const health = runtimeHealthSnapshot(process.env)
    return jsonResponse(health, health.ok ? 200 : 503)
  },
}
