import assert from 'node:assert/strict'
import test from 'node:test'
import {
  bindVerifiedActiveCampaignMessage,
  prepareActiveCampaignOpportunityDraftPlan,
  reconcileActiveCampaignOpportunityDraft,
  runOpportunityAgent,
  transitionAction,
} from '../dist/index.js'
import { fixture } from './fixtures/opportunity.mjs'

const now = '2026-09-07T17:00:00.000Z'
const checksum = 'b'.repeat(64)

function preparation() {
  const reviewInput = fixture()
  const action = runOpportunityAgent(reviewInput).proposedActions[0]
  return {
    action,
    reviewInput,
    preparedAt: now,
    opportunityAlertConsent: [{
      source: 'activecampaign_api',
      memberId: 'member-1',
      contactId: 'contact-1',
      listId: 33,
      status: 'active',
      observedAt: now,
      responseChecksum: checksum,
    }],
  }
}

test('builds a deterministic list-33 Draft preview with documented tracking and no send path', () => {
  const input = preparation()
  const first = prepareActiveCampaignOpportunityDraftPlan(input)
  const second = prepareActiveCampaignOpportunityDraftPlan(input)
  assert.deepEqual(first, second)
  assert.equal(first.state, 'reviewable')
  assert.deepEqual(first.holds, [])
  assert.equal(first.accountHostname, 'awilliams.api-us1.com')
  assert.equal(first.listId, 33)
  assert.equal(first.ownerDraftApprovalVerified, false)
  assert.equal(first.executionAvailable, false)
  assert.equal(first.automaticRetryAllowed, false)
  assert.equal(first.messageRequest.path, '/api/3/messages')
  assert.equal(first.messageRequest.body.message.fromname, 'Nested Objects')
  assert.equal(first.messageRequest.body.message.fromemail, 'info@nestedobjects.com')
  assert.equal(first.messageRequest.body.message.reply2, 'support@nestedobjects.com')
  assert.equal(first.messageRequest.body.message.format, 'mime')
  assert.match(first.campaignName, /^Nested Objects \| Elite Opportunity \| 2026-09-07 \| [a-f0-9]{12}$/)
  assert.deepEqual(first.recipientSnapshot, [{ memberId: 'member-1', contactId: 'contact-1' }])
  assert.ok(!JSON.stringify(first).includes('/enable'))
  assert.ok(!JSON.stringify(first).includes('/finish'))
})

test('binds a verified message ID to an unscheduled private campaign with all requested tracking', () => {
  const plan = prepareActiveCampaignOpportunityDraftPlan(preparation())
  const request = bindVerifiedActiveCampaignMessage(plan, '954')
  assert.equal(request.path, '/api/3/campaigns')
  assert.deepEqual(request.body.campaign.listIds, [33])
  assert.deepEqual(request.body.campaign.messages, [{ messageId: 954, percentage: 100 }])
  assert.equal(request.body.campaign.scheduledDate, null)
  assert.equal(request.body.campaign.trackLinks, 'all')
  assert.equal(request.body.campaign.trackReads, true)
  assert.equal(request.body.campaign.trackReplies, true)
  assert.equal(request.body.campaign.public, false)
  assert.match(request.body.campaign.analyticsCampaignName, /^no_elite_opportunity_[a-f0-9]{12}$/)
  assert.throws(() => bindVerifiedActiveCampaignMessage(plan, '0'))
  assert.throws(() => bindVerifiedActiveCampaignMessage(plan, '9'.repeat(40)))
  assert.throws(() => bindVerifiedActiveCampaignMessage({ ...plan, state: 'held' }, '954'))
})

test('recognizes only an owner-approved action with the exact reviewed payload digest', () => {
  const input = preparation()
  const preview = prepareActiveCampaignOpportunityDraftPlan(input)
  const awaiting = transitionAction(input.action, 'awaiting_approval', { now })
  const approved = transitionAction(awaiting, 'approved', { now, approval: {
    approvedBy: 'autumn', approvedAt: now, approvalContext: { operation: 'create_unscheduled_draft' },
  } })
  const verified = prepareActiveCampaignOpportunityDraftPlan({
    ...input, action: approved, approvedPayloadDigest: preview.actionPayloadDigest,
  })
  assert.equal(verified.state, 'reviewable')
  assert.equal(verified.ownerDraftApprovalVerified, true)
  assert.equal(verified.executionAvailable, false)
  const mismatch = prepareActiveCampaignOpportunityDraftPlan({
    ...input, action: approved, approvedPayloadDigest: 'c'.repeat(64),
  })
  assert.equal(mismatch.state, 'held')
  assert.ok(mismatch.holds.includes('approval_binding_mismatch'))
  assert.equal(mismatch.messageRequest, null)
})

test('holds missing, duplicate, stale, future or wrong-list opportunity consent evidence', () => {
  const mutations = [
    (input) => { input.opportunityAlertConsent = [] },
    (input) => { input.opportunityAlertConsent.push(structuredClone(input.opportunityAlertConsent[0])) },
    (input) => { input.opportunityAlertConsent[0].listId = 12 },
    (input) => { input.opportunityAlertConsent[0].status = 'inactive' },
    (input) => { input.opportunityAlertConsent[0].observedAt = '2026-09-07T16:44:59.000Z' },
    (input) => { input.opportunityAlertConsent[0].observedAt = '2026-09-07T17:00:01.000Z' },
    (input) => { input.opportunityAlertConsent[0].responseChecksum = '' },
  ]
  for (const mutate of mutations) {
    const input = preparation()
    mutate(input)
    const plan = prepareActiveCampaignOpportunityDraftPlan(input)
    assert.equal(plan.state, 'held')
    assert.ok(plan.holds.includes('opportunity_specific_consent_missing_or_stale'))
    assert.equal(plan.messageRequest, null)
  }
})

test('holds stale review evidence, overdue opportunities and any changed proposal binding', () => {
  const beforeReview = preparation()
  beforeReview.preparedAt = '2026-09-07T16:59:59.999Z'
  beforeReview.opportunityAlertConsent[0].observedAt = beforeReview.preparedAt
  assert.ok(prepareActiveCampaignOpportunityDraftPlan(beforeReview).holds.includes('preparation_precedes_review'))

  const stale = preparation()
  stale.preparedAt = '2026-09-07T17:15:00.001Z'
  stale.opportunityAlertConsent[0].observedAt = stale.preparedAt
  assert.ok(prepareActiveCampaignOpportunityDraftPlan(stale).holds.includes('evidence_expired'))

  const overdue = preparation()
  overdue.preparedAt = '2026-09-08T16:51:35.001Z'
  overdue.opportunityAlertConsent[0].observedAt = overdue.preparedAt
  assert.ok(prepareActiveCampaignOpportunityDraftPlan(overdue).holds.includes('opportunity_expired_or_overdue'))

  const changed = preparation()
  changed.action.payload = { ...changed.action.payload, listId: 12 }
  assert.ok(prepareActiveCampaignOpportunityDraftPlan(changed).holds.includes('action_binding_mismatch'))
})

test('partial and unknown API outcomes never authorize an automatic retry', () => {
  const plan = prepareActiveCampaignOpportunityDraftPlan(preparation())
  const cases = [
    [{ state: 'not_started' }, { state: 'not_started' }, 'not_started'],
    [{ state: 'failed' }, { state: 'not_started' }, 'message_failure'],
    [{ state: 'unknown' }, { state: 'not_started' }, 'message_outcome_unknown'],
    [{ state: 'created', id: '953' }, { state: 'not_started' }, 'message_created_campaign_not_started'],
    [{ state: 'created', id: '953' }, { state: 'failed' }, 'campaign_failure_after_message'],
    [{ state: 'created', id: '953' }, { state: 'unknown' }, 'campaign_outcome_unknown'],
    [{ state: 'created', id: '953' }, { state: 'created', id: '890' }, 'draft_readback_required'],
  ]
  for (const [message, campaign, state] of cases) {
    const result = reconcileActiveCampaignOpportunityDraft({ plan, message, campaign })
    assert.equal(result.state, state)
    assert.equal(result.automaticRetryAllowed, false)
  }
})

test('verifies only an exact zero-send Draft readback', () => {
  const plan = prepareActiveCampaignOpportunityDraftPlan(preparation())
  const input = {
    plan,
    message: { state: 'created', id: '953' },
    campaign: { state: 'created', id: '890' },
    readback: {
      campaignId: '890', name: plan.campaignName, type: 'single', status: '0', schedule: '0', scheduledDate: null,
      sendAmount: '0', totalAmount: '0', listIds: ['33'], messageIds: ['953'],
    },
  }
  const verified = reconcileActiveCampaignOpportunityDraft(input)
  assert.equal(verified.state, 'draft_verified')
  assert.equal(verified.campaignId, '890')
  for (const mutate of [
    (copy) => { copy.readback.status = '1' },
    (copy) => { copy.readback.schedule = '1' },
    (copy) => { copy.readback.scheduledDate = now },
    (copy) => { copy.readback.sendAmount = '1' },
    (copy) => { copy.readback.totalAmount = '1' },
    (copy) => { copy.readback.listIds = ['12'] },
    (copy) => { copy.readback.listIds = ['33', '33'] },
    (copy) => { copy.readback.messageIds = ['954'] },
  ]) {
    const copy = structuredClone(input)
    mutate(copy)
    assert.equal(reconcileActiveCampaignOpportunityDraft(copy).state, 'draft_verification_failed')
  }
})
