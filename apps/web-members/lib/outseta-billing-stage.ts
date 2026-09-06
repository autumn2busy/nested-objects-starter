export type OutsetaBillingStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'

// Outseta account billing stages, not ActiveCampaign tags or payment settlement.
// https://go.outseta.com/support/kb/articles/Kj9boWnd/account-billing-stages
// The existing projection combines canceling/expired into canceled. Raw Outseta
// data must still determine access and distinguish pending cancellation.
export function mapOutsetaBillingStage(stage?: number, label?: string): OutsetaBillingStatus | null {
  const stages: Record<number, OutsetaBillingStatus> = {
    2: 'trialing', 3: 'active', 4: 'canceled', 5: 'canceled',
    6: 'canceled', 7: 'past_due', 8: 'trialing',
  }
  const labels: Record<string, OutsetaBillingStatus> = {
    trialing: 'trialing', subscribing: 'active', active: 'active',
    canceling: 'canceled', cancelling: 'canceled', canceled: 'canceled', cancelled: 'canceled',
    expired: 'canceled', 'trial expired': 'canceled', 'past due': 'past_due',
    'cancelling trial': 'trialing', 'canceling trial': 'trialing', paused: 'paused',
  }
  const normalized = label?.trim().toLowerCase().replace(/_/g, ' ')
  const fromStage = stage === undefined ? undefined : stages[stage]
  const fromLabel = normalized ? labels[normalized] : undefined
  // A supplied unknown value or disagreement is not evidence of active membership.
  if (stage !== undefined && !fromStage) return null
  if (normalized && !fromLabel) return null
  if (fromStage && fromLabel && fromStage !== fromLabel) return null
  return fromStage ?? fromLabel ?? null
}
