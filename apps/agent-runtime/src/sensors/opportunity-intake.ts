import { createHash } from 'node:crypto'
import { z } from 'zod'
import { ContractValidationError } from '../contracts.js'

const fact = z.string().trim().min(1).max(1000).refine(
  (value) => !/[<>\u0000-\u001f]/.test(value), 'Only plain structured facts are accepted',
)
const factsSchema = z.object({
  company: fact.refine((value) => value.length <= 160),
  work: fact,
  coverage: z.array(fact).min(1).max(60),
  immediateNeed: z.array(fact).max(60),
  requirements: fact,
  advertisedRate: fact,
  paymentTerms: fact,
  applicationInstructions: fact,
  applicationUrl: z.string().url().max(2000),
  expiresAt: z.string().datetime().nullable(),
  withdrawn: z.boolean(),
}).strict()

export type OpportunityFacts = z.infer<typeof factsSchema>

export interface OpportunitySourcePolicy {
  // Supplied privately by the approved source adapter, never embedded in a public fixture.
  mailboxKey: string
  sender: string
  subject: string
  applicationHosts: readonly string[]
  applicationEmails: readonly string[]
}

export interface OpportunityEnvelope {
  mailboxKey: string
  gmailMessageId: string
  sender: string
  subject: string
  internalDateMs: number
  receiverAuthentication: { receiver: 'gmail'; spf: 'pass'; alignedDkim: 'pass'; dmarc: 'pass' } | null
  // Extraction is a separate trust boundary: an LLM/parser success is not a fact review.
  extraction: { state: 'reviewed'; sourceSha256: string; facts: unknown } | null
}

export interface NormalizedOpportunity {
  policyVersion: 'opportunity-v1'
  sourceKey: string
  identityKey: string
  revisionKey: string
  sourceSha256: string
  receivedAt: string
  dueAt: string
  facts: OpportunityFacts
}

export function opportunityHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

export function normalizeOpportunity(
  envelope: OpportunityEnvelope,
  policy: OpportunitySourcePolicy,
  observedAt: string,
): NormalizedOpportunity {
  const auth = envelope.receiverAuthentication
  if (!policy.mailboxKey || !policy.sender || !policy.subject
    || (!policy.applicationHosts.length && !policy.applicationEmails.length)
    || envelope.mailboxKey !== policy.mailboxKey || envelope.sender !== policy.sender
    || envelope.subject !== policy.subject || !/^[a-zA-Z0-9_-]{1,200}$/.test(envelope.gmailMessageId)
    || auth?.receiver !== 'gmail' || auth.spf !== 'pass' || auth.alignedDkim !== 'pass' || auth.dmarc !== 'pass'
    || envelope.extraction?.state !== 'reviewed' || !/^[a-f0-9]{64}$/.test(envelope.extraction.sourceSha256)) {
    throw new ContractValidationError('Opportunity source or reviewed extraction is unavailable or outside scope')
  }
  const now = Date.parse(observedAt)
  if (!Number.isFinite(now) || !Number.isSafeInteger(envelope.internalDateMs)
    || envelope.internalDateMs <= 0 || envelope.internalDateMs > now) {
    throw new ContractValidationError('Invalid opportunity receipt time')
  }
  const parsed = factsSchema.safeParse(envelope.extraction.facts)
  if (!parsed.success) throw new ContractValidationError('Opportunity structured facts failed validation')
  const facts = parsed.data
  const url = new URL(facts.applicationUrl)
  const permittedWeb = url.protocol === 'https:' && !url.username && !url.password && !url.port
    && policy.applicationHosts.includes(url.hostname) && !url.hash
  const permittedEmail = url.protocol === 'mailto:' && !url.search && !url.hash
    && /^[a-zA-Z0-9.!+_-]+@[a-zA-Z0-9.-]+$/.test(url.pathname)
    && policy.applicationEmails.includes(url.pathname)
  if (!permittedWeb && !permittedEmail) {
    throw new ContractValidationError('Opportunity application URL is outside the approved scope')
  }
  const normalized = (value: string) => value.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
  const coverage = [...new Set(facts.coverage.map(normalized))].sort()
  const identity = [normalized(facts.company), normalized(facts.work), url.href]
  const receivedAt = new Date(envelope.internalDateMs).toISOString()
  const dueAt = new Date(envelope.internalDateMs + 86_400_000).toISOString()
  return {
    policyVersion: 'opportunity-v1',
    sourceKey: opportunityHash([policy.mailboxKey, envelope.gmailMessageId]),
    identityKey: opportunityHash(identity),
    revisionKey: opportunityHash([identity, coverage, [...new Set(facts.immediateNeed.map(normalized))].sort(),
      normalized(facts.applicationInstructions), normalized(facts.requirements),
      normalized(facts.advertisedRate), normalized(facts.paymentTerms), facts.expiresAt, facts.withdrawn]),
    sourceSha256: envelope.extraction.sourceSha256,
    receivedAt,
    dueAt,
    facts: { ...facts, coverage: [...facts.coverage].sort(), applicationUrl: url.href },
  }
}
