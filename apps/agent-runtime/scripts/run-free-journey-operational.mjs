import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { runFreeJourneyOperation } from '../dist/operations/free-journey-operation.js'
import { OnboardingReceiptReadOnlyClient } from '../dist/sensors/onboarding-receipt-reader.js'

// Single-event operational consumer for an already-active automation 527. It re-reads existing
// profile and conversion_events evidence and never creates contacts, changes consent, enrolls a
// contact, starts an automation, sends email, schedules itself, or retries uncertain writes.

function argument(name) {
  const prefix = `--${name}=`
  return process.argv.find(value => value.startsWith(prefix))?.slice(prefix.length).trim() ?? ''
}

function stop(reason, exitCode = 2) {
  console.log(JSON.stringify({ status: 'withheld', reason }))
  process.exitCode = exitCode
}

const inputName = argument('input')
const requestedMode = argument('mode') || 'preview'
if (!inputName || !['preview', 'write'].includes(requestedMode)) {
  stop('usage_requires_one_input_and_preview_or_write_mode')
} else {
  try {
    const inputPath = path.resolve(process.cwd(), inputName)
    const payload = JSON.parse(await readFile(inputPath, 'utf8'))
    const policy = payload?.policy
    if (!policy || typeof policy !== 'object' || !payload?.sourceEvent) {
      stop('reviewed_event_policy_missing')
    } else if (requestedMode === 'write'
      && (process.env.FREE_JOURNEY_OPERATIONAL_MODE !== 'write'
        || process.env.FREE_JOURNEY_WRITE_ENABLED !== 'true'
        || process.env.FREE_JOURNEY_ACTIVE_527_ENABLED !== 'true')) {
      stop('operational_write_mode_not_enabled')
    } else {
      const reader = new OnboardingReceiptReadOnlyClient({
        policy,
        mode: 'approved_live',
        liveReadsEnabled: process.env.FREE_JOURNEY_LIVE_READS_ENABLED === 'true',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      })
      const storedSources = await reader.collect()
      const result = await runFreeJourneyOperation({
        mode: requestedMode,
        executionPhase: 'operational',
        sourceEvent: payload.sourceEvent,
        now: new Date().toISOString(),
        maxEvidenceAgeMs: payload.maxEvidenceAgeMs,
        evidenceExpiresAt: payload.evidenceExpiresAt,
        outsetaPersonUid: policy.outsetaPersonUid,
        subscriptionUid: policy.subscriptionUid,
        storedSources,
        external: payload.external,
        activeCampaign: {
          apiUrl: process.env.AC_API_URL ?? '',
          apiKey: process.env.AC_API_KEY ?? '',
          consentListId: '34',
          consentFormId: '90',
          stageFieldId: '193',
          expiryFieldId: '194',
          automationId: '527',
          expectedAutomationStatus: 'active',
          accountTimeZone: 'America/New_York',
          timeoutMs: policy.timeoutMs,
        },
        ...(payload.writeApproval === undefined ? {} : { writeApproval: payload.writeApproval }),
      })
      console.log(JSON.stringify(result))
      if (['withheld', 'failed', 'partial'].includes(result.status)) process.exitCode = 2
    }
  } catch {
    stop('operation_unavailable')
  }
}
