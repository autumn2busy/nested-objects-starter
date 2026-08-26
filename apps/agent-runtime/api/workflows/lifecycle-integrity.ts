import { handleLifecycleIntegrityRequest } from '../../src/preview/handlers.js'

export default async function lifecycleIntegrity(request: Request): Promise<Response> {
  return handleLifecycleIntegrityRequest(request)
}
