import {
  createSupabaseDurableWorkflowStore,
  type DurableWorkflowStore,
} from '../persistence/durable-workflow-store.js'
import { loadDurableRuntimeConfiguration } from './durable-runtime.js'
import type { StagingDestinationBinding } from './staging-destination.js'

interface DurableStepContext {
  store: DurableWorkflowStore
  binding: StagingDestinationBinding
  runtimeVersion: string
}

const TEST_CONTEXT_KEY = '__nestedObjectsDurableWorkflowTestContext'

export async function resolveDurableStepContext(
  expectedBinding: StagingDestinationBinding,
): Promise<DurableStepContext> {
  const testContext = readTestContext()
  if (testContext) {
    assertSameBinding(expectedBinding, testContext.binding)
    await testContext.store.verifyDestination(testContext.binding)
    return testContext
  }

  const configuration = loadDurableRuntimeConfiguration(process.env)
  assertSameBinding(expectedBinding, configuration.binding)
  const store = await createSupabaseDurableWorkflowStore({
    url: requiredValue(configuration.runtime.supabaseUrl),
    serviceRoleKey: requiredValue(configuration.runtime.supabaseServiceRoleKey),
  })
  await store.verifyDestination(configuration.binding)
  return {
    store,
    binding: configuration.binding,
    runtimeVersion: configuration.runtime.runtimeVersion,
  }
}

export function installDurableWorkflowTestContext(context: DurableStepContext): () => void {
  if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
    throw new DurableStepContextError('The in-memory durable workflow context is available only to tests')
  }
  const globalRecord = globalThis as typeof globalThis & Record<string, unknown>
  globalRecord[TEST_CONTEXT_KEY] = context
  return () => {
    delete globalRecord[TEST_CONTEXT_KEY]
  }
}

function readTestContext(): DurableStepContext | null {
  if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) return null
  const globalRecord = globalThis as typeof globalThis & Record<string, unknown>
  const value = globalRecord[TEST_CONTEXT_KEY]
  if (!value || typeof value !== 'object') return null
  return value as DurableStepContext
}

function assertSameBinding(
  expected: StagingDestinationBinding,
  actual: StagingDestinationBinding,
): void {
  if (
    expected.bindingKey !== actual.bindingKey ||
    expected.policyVersion !== actual.policyVersion ||
    expected.projectRef !== actual.projectRef ||
    expected.hostname !== actual.hostname ||
    expected.destinationFingerprint !== actual.destinationFingerprint
  ) {
    throw new DurableStepContextError('Workflow destination binding does not match the verified runtime binding')
  }
}

function requiredValue(value: string | null): string {
  if (!value) throw new DurableStepContextError('Durable workflow credential is unexpectedly absent')
  return value
}

export class DurableStepContextError extends Error {
  readonly code = 'DURABLE_STEP_CONTEXT_FAILED'

  constructor(message: string) {
    super(message)
    this.name = 'DurableStepContextError'
  }
}
