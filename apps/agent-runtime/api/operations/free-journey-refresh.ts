import { evaluateScheduledFreeJourneyRefresh, FreeJourneyRefreshError } from '../../src/http/free-journey-refresh.js'
import { FreeJourneyOperationConfigurationError } from '../../src/http/free-journey-operation-request.js'
import { jsonResponse, methodNotAllowed } from '../../src/http/web.js'

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') return methodNotAllowed(['GET'])
    try {
      const result = await evaluateScheduledFreeJourneyRefresh(request)
      console.info('Free journey refresh result', {
        ok: result.ok, previewOnly: result.previewOnly, coverage: result.coverage,
        outcomes: result.outcomes, stages: result.stages, reasonCounts: result.reasonCounts, sourceHealth: result.sourceHealth,
        attemptedWrites: result.attemptedWrites, confirmedWrites: result.confirmedWrites,
        recoveryRequired: result.recoveryRequired, sourceReviewExpiresAt: result.sourceReviewExpiresAt,
        writeApprovalExpiresAt: result.writeApprovalExpiresAt,
      })
      return jsonResponse(result, result.ok ? 200 : 503)
    } catch (error) {
      const known = error instanceof FreeJourneyRefreshError || error instanceof FreeJourneyOperationConfigurationError
      const code = known ? error.code : 'FREE_JOURNEY_REFRESH_FAILED'
      console.error('Free journey refresh held', { code })
      return jsonResponse({ ok: false, error: { code, message: 'Scheduled eligibility refresh did not complete.' } },
        error instanceof FreeJourneyRefreshError ? error.httpStatus : 503)
    }
  },
}
