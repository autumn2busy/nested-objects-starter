import { handleReadinessRequest } from '../src/preview/handlers.js'

export default async function readiness(request: Request): Promise<Response> {
  return handleReadinessRequest(request)
}
