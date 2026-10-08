import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { runFreeJourneyOperation } from '../dist/operations/free-journey-operation.js'
import { OnboardingReceiptReadOnlyClient } from '../dist/sensors/onboarding-receipt-reader.js'

// Bounded pre-activation acceptance only. This is not a scheduler, signup trigger, cohort runner,
// enrollment path, or email sender. Automation 527 must still be inactive when provider reads run.

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
    if (!policy || typeof policy !== 'object') {
      stop('reviewed_read_policy_missing')
    } else if (requestedMode === 'write'
      && (process.env.FREE_JOURNEY_OPERATION_MODE !== 'write'
        || process.env.FREE_JOURNEY_WRITE_ENABLED !== 'true')) {
      stop('write_mode_not_enabled')
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
