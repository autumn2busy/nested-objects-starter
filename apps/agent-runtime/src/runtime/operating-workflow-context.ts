import {
  createSupabaseDurableWorkflowStore,
  type DurableWorkflowStore,
} from '../persistence/durable-workflow-store.js'
import {
  createSupabaseOperatingWorkflowStore,
  type OperatingWorkflowStore,
} from '../persistence/operating-workflow-store.js'
import {
  createSupabaseSensorObservationStore,
  type SensorObservationStore,
} from '../persistence/sensor-observation-store.js'
import { loadDurableRuntimeConfiguration } from './durable-runtime.js'
import type { StagingDestinationBinding } from './staging-destination.js'

export interface OperatingWorkflowContext {
  durableStore: DurableWorkflowStore
  operatingStore: OperatingWorkflowStore
  sensorStore: SensorObservationStore
  binding: StagingDestinationBinding
  runtimeVersion: string
}

const TEST_CONTEXT_KEY = '__nestedObjectsOperatingWorkflowTestContext'

export async function resolveOperatingWorkflowContext(
  expectedBinding: StagingDestinationBinding,
): Promise<OperatingWorkflowContext> {
  const testContext = readTestContext()
  if (testContext) {
    assertSameBinding(expectedBinding, testContext.binding)
    await testContext.durableStore.verifyDestination(testContext.binding)
    return testContext
  }

  const configuration = loadDurableRuntimeConfiguration(process.env)
  assertSameBinding(expectedBinding, configuration.binding)
  const credentials = {
    url: requiredValue(configuration.runtime.supabaseUrl),
    serviceRoleKey: requiredValue(configuration.runtime.supabaseServiceRoleKey),
  }
  const [durableStore, operatingStore, sensorStore] = await Promise.all([
    createSupabaseDurableWorkflowStore(credentials),
    createSupabaseOperatingWorkflowStore(credentials),
    createSupabaseSensorObservationStore(credentials),
  ])
  await durableStore.verifyDestination(configuration.binding)
  return {
    durableStore,
    operatingStore,
    sensorStore,
    binding: configuration.binding,
    runtimeVersion: configuration.runtime.runtimeVersion,
  }
}

export function installOperatingWorkflowTestContext(context: OperatingWorkflowContext): () => void {
  if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
    throw new OperatingWorkflowContextError('The in-memory operating workflow context is available only to tests')
  }
  const globalRecord = globalThis as typeof globalThis & Record<string, unknown>
  globalRecord[TEST_CONTEXT_KEY] = context
  return () => {
    delete globalRecord[TEST_CONTEXT_KEY]
  }
}

function readTestContext(): OperatingWorkflowContext | null {
  if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) return null
  const globalRecord = globalThis as typeof globalThis & Record<string, unknown>
  const value = globalRecord[TEST_CONTEXT_KEY]
  if (!value || typeof value !== 'object') return null
  return value as OperatingWorkflowContext
}

function assertSameBinding(expected: StagingDestinationBinding, actual: StagingDestinationBinding): void {
  if (
    expected.bindingKey !== actual.bindingKey
    || expected.policyVersion !== actual.policyVersion
    || expected.projectRef !== actual.projectRef
    || expected.hostname !== actual.hostname
    || expected.destinationFingerprint !== actual.destinationFingerprint
  ) {
    throw new OperatingWorkflowContextError('Operating workflow destination binding does not match runtime configuration')
  }
}

function requiredValue(value: string | null): string {
  if (!value) throw new OperatingWorkflowContextError('Operating workflow credential is unexpectedly absent')
  return value
}

export class OperatingWorkflowContextError extends Error {
  readonly code = 'OPERATING_WORKFLOW_CONTEXT_FAILED'

  constructor(message: string) {
    super(message)
    this.name = 'OperatingWorkflowContextError'
  }
}
