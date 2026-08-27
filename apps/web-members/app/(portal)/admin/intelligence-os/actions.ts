'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import {
  assertIntelligenceAdminSameOrigin,
  decideIntelligenceAction,
  getIntelligenceOwnerSession,
  intelligenceAdminErrorMessage,
  startSyntheticIntelligenceWorkflow,
  verifyIntelligenceAdminFormToken,
  type SyntheticTriggerInput,
} from '@/lib/intelligence-os-admin'

const WORKFLOW_NAMES = new Set([
  'conversion_review',
  'daily_business_health',
  'weekly_operating_review',
])
const EVENT_TYPES = new Set([
  'member_created',
  'trial_started',
  'upgrade',
  'downgrade',
  'cancellation',
  'payment_failure',
  'paywall_hit',
  'training_completion',
  'firm_inquiry',
  'opportunity_ingestion',
  'critical_integration_failure',
])
const STABLE_KEY = /^(synthetic|validation)-[a-z0-9:._-]{8,240}$/

export async function startSyntheticWorkflow(formData: FormData): Promise<never> {
  let outcome: { kind: 'notice' | 'error'; message: string }
  try {
    const session = await requireOwnerSession()
    assertIntelligenceAdminSameOrigin()
    verifyIntelligenceAdminFormToken(textField(formData, 'formToken'), 'trigger', session.subject)
    const triggerCategory = textField(formData, 'triggerCategory')
    const businessKey = stableKeyField(formData, 'businessKey')
    let input: SyntheticTriggerInput
    if (triggerCategory === 'event') {
      const eventType = textField(formData, 'eventType')
      if (!EVENT_TYPES.has(eventType)) throw new Error('Unsupported event trigger')
      input = {
        triggerCategory,
        eventType,
        sourceEventId: stableKeyField(formData, 'sourceEventId'),
        businessKey,
        fixtureMode: 'synthetic',
      }
    } else {
      const workflowName = textField(formData, 'workflowName')
      if (!WORKFLOW_NAMES.has(workflowName)) throw new Error('Unsupported workflow')
      if (triggerCategory === 'daily' && workflowName !== 'daily_business_health') throw new Error('Invalid daily workflow')
      if (triggerCategory === 'weekly' && workflowName !== 'weekly_operating_review') throw new Error('Invalid weekly workflow')
      if (triggerCategory !== 'manual' && triggerCategory !== 'daily' && triggerCategory !== 'weekly') {
        throw new Error('Unsupported trigger category')
      }
      input = {
        triggerCategory,
        workflowName: workflowName as SyntheticTriggerInput['workflowName'],
        businessKey,
        fixtureMode: 'synthetic',
      }
    }
    const result = await startSyntheticIntelligenceWorkflow(session, input)
    outcome = {
      kind: 'notice',
      message: `${result.workflowName.replaceAll('_', ' ')} queued with synthetic evidence only.`,
    }
  } catch (error) {
    outcome = { kind: 'error', message: intelligenceAdminErrorMessage(error) }
  }
  revalidatePath('/admin/intelligence-os')
  redirect(withMessage(outcome))
}

export async function submitIntelligenceActionDecision(formData: FormData): Promise<never> {
  let outcome: { kind: 'notice' | 'error'; message: string }
  try {
    const session = await requireOwnerSession()
    assertIntelligenceAdminSameOrigin()
    const actionId = textField(formData, 'actionId')
    verifyIntelligenceAdminFormToken(textField(formData, 'formToken'), `action:${actionId}`, session.subject)
    const decision = textField(formData, 'decision')
    if (decision !== 'approved' && decision !== 'rejected') throw new Error('Invalid decision')
    const expectedVersion = Number(textField(formData, 'expectedVersion'))
    const expectedPayloadDigest = textField(formData, 'expectedPayloadDigest')
    const reason = textField(formData, 'reason').trim()
    if (!Number.isInteger(expectedVersion) || expectedVersion < 0) throw new Error('Invalid version')
    if (!/^[a-f0-9]{64}$/.test(expectedPayloadDigest)) throw new Error('Invalid payload digest')
    if (reason.length < 3 || reason.length > 1_000) throw new Error('Invalid review reason')
    const response = await decideIntelligenceAction(session, actionId, {
      decision,
      expectedVersion,
      expectedPayloadDigest,
      reason,
    })
    if (response.result.executionStarted !== false) throw new Error('Approval boundary violation')
    outcome = {
      kind: 'notice',
      message: `Action ${response.result.status}. No execution was started.`,
    }
  } catch (error) {
    outcome = { kind: 'error', message: intelligenceAdminErrorMessage(error) }
  }
  revalidatePath('/admin/intelligence-os')
  redirect(withMessage(outcome))
}

async function requireOwnerSession() {
  const session = await getIntelligenceOwnerSession()
  if (!session) throw new Error('Stable owner subject is required')
  return session
}

function textField(formData: FormData, name: string): string {
  const value = formData.get(name)
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing ${name}`)
  return value.trim()
}

function stableKeyField(formData: FormData, name: string): string {
  const value = textField(formData, name).toLowerCase()
  if (!STABLE_KEY.test(value)) throw new Error(`Invalid ${name}`)
  return value
}

function withMessage(outcome: { kind: 'notice' | 'error'; message: string }): string {
  const params = new URLSearchParams({ [outcome.kind]: outcome.message })
  return `/admin/intelligence-os?${params.toString()}`
}
