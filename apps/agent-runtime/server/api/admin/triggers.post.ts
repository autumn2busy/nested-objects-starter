import { start } from 'workflow/api'
import { defineEventHandler } from 'nitro/h3'

import {
  parseAdminTriggerRequest,
  readAdminJson,
  syntheticRequestedAtForKey,
  workflowForTrigger,
} from '../../../src/http/admin-contracts.js'
import { verifyAdminServiceRequest } from '../../../src/http/admin-request-auth.js'
import { adminErrorResponse } from '../../../src/http/admin-responses.js'
import { jsonResponse } from '../../../src/http/web.js'
import { loadAdminRuntimeConfiguration, resolveAdminRuntimeContext } from '../../../src/runtime/admin-runtime.js'
import { stableUuid } from '../../../src/stable-id.js'
import {
  conversionReviewWorkflow,
  dailyBusinessHealthWorkflow,
  weeklyOperatingReviewWorkflow,
} from '../../../workflows/operating-reviews.js'
import { createSyntheticOperatingFixture } from '../../../workflows/synthetic-operating-fixtures.js'

const WORKFLOWS = {
  conversion_review: conversionReviewWorkflow,
  daily_business_health: dailyBusinessHealthWorkflow,
  weekly_operating_review: weeklyOperatingReviewWorkflow,
} as const

export default defineEventHandler(async ({ req }) => {
  try {
    const { bodyText, value } = await readAdminJson(req)
    const configuration = loadAdminRuntimeConfiguration()
    const auth = verifyAdminServiceRequest(req, bodyText, {
      sharedSecret: configuration.sharedSecret,
      autumnSubjectId: configuration.autumnSubjectId,
      allowedOrigin: configuration.allowedOrigin,
    })
    const context = await resolveAdminRuntimeContext(process.env, configuration)
    const trigger = parseAdminTriggerRequest(value)
    const workflowName = workflowForTrigger(trigger)
    const requestedAt = syntheticRequestedAtForKey(trigger.businessKey)
    const idempotencyKey = `phase-c5:${workflowName}:${trigger.businessKey}`
    const correlationId = stableUuid('phase-c7-protected-trigger', idempotencyKey)
    const causationId = trigger.triggerCategory === 'event'
      ? stableUuid('phase-c7-source-event', trigger.sourceEventId)
      : null
    await context.store.consumeNonce({
      nonceDigest: auth.nonceDigest,
      requestType: `trigger.${trigger.triggerCategory}.${workflowName}`,
      actorSubject: auth.actorSubject,
      expiresAt: new Date(Date.parse(auth.timestamp) + 5 * 60_000).toISOString(),
      correlation: { correlationId, causationId, traceId: 'phase-c7-protected-trigger' },
    })
    const run = await start(WORKFLOWS[workflowName], [{
      fixture: createSyntheticOperatingFixture({ trigger, requestedAt, correlationId }),
      binding: context.configuration.durable.binding,
      idempotencyKey,
      requestedAt,
      correlation: { correlationId, causationId, traceId: 'phase-c7-protected-trigger' },
    }])
    return jsonResponse({
      ok: true,
      status: 'queued',
      workflowName,
      workflowVersion: 'phase-c5-v1',
      workflowRunId: run.runId,
      correlationId,
      triggerCategory: trigger.triggerCategory,
      fixtureMode: 'synthetic',
      mutationAllowed: false,
    }, 202, { 'x-correlation-id': correlationId })
  } catch (error) {
    return adminErrorResponse(error, 'protected-trigger')
  }
})
