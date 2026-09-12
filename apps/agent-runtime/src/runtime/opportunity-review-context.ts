import { createSupabaseControlPlaneStore } from '../persistence/control-plane-store.js'
import type { OpportunityReviewContext } from '../workflows/opportunity-review.js'
import { loadDurableRuntimeConfiguration } from './durable-runtime.js'
import { resolveDurableStepContext } from './durable-step-context.js'
import type { StagingDestinationBinding } from './staging-destination.js'

const TEST_KEY = '__nestedObjectsOpportunityReviewTestContext'

export function installOpportunityReviewTestContext(context: OpportunityReviewContext): () => void {
  if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) throw new Error('Opportunity test context requires test mode')
  const globalRecord = globalThis as typeof globalThis & Record<string, unknown>
  globalRecord[TEST_KEY] = context
  return () => { delete globalRecord[TEST_KEY] }
}

export async function resolveOpportunityReviewContext(binding: StagingDestinationBinding): Promise<OpportunityReviewContext> {
  const test = (process.env.NODE_ENV === 'test' || process.env.VITEST)
    ? (globalThis as typeof globalThis & Record<string, unknown>)[TEST_KEY] as OpportunityReviewContext | undefined : undefined
  if (test) {
    if (JSON.stringify(test.binding) !== JSON.stringify(binding)) throw new Error('Opportunity test destination mismatch')
    await test.durableStore.verifyDestination(binding)
    return test
  }
  // Reuse the existing synthetic-only, Preview-only, destination-bound guard.
  const configuration = loadDurableRuntimeConfiguration(process.env)
  const durable = await resolveDurableStepContext(binding)
  const proposalStore = await createSupabaseControlPlaneStore({
    url: configuration.runtime.supabaseUrl!, serviceRoleKey: configuration.runtime.supabaseServiceRoleKey!,
  })
  return { durableStore: durable.store, proposalStore, binding: durable.binding,
    runtimeVersion: durable.runtimeVersion, now: () => new Date() }
}
