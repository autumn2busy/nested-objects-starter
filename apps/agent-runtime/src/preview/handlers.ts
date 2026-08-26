import { randomUUID } from 'node:crypto'

import { ContractValidationError } from '../contracts.js'
import type { RuntimeEnvironmentVariables } from '../env.js'
import { getProcessEnvironment } from '../env.js'
import {
  authorizePreviewRequest,
  loadPreviewDeploymentConfiguration,
  type PreviewDeploymentConfiguration,
} from './config.js'
import { parsePreviewLifecycleInvocation } from './contracts.js'
import {
  assertPreviewDependencies,
  createSupabasePreviewRuntimeDependencies,
  PREVIEW_REQUIRED_TABLES,
  PreviewDependencyError,
  type PreviewRuntimeDependencies,
} from './dependencies.js'
import { executePreviewLifecycleIntegrity } from './execution.js'
import {
  jsonResponse,
  methodNotAllowed,
  parseJsonBody,
  PreviewHttpError,
} from './http.js'

export interface PreviewHandlerOptions {
  environment?: RuntimeEnvironmentVariables
  dependencies?: PreviewRuntimeDependencies
  dependencyFactory?: (
    configuration: PreviewDeploymentConfiguration,
  ) => Promise<PreviewRuntimeDependencies>
  now?: () => string
}

export async function handleHealthRequest(
  request: Request,
  options: PreviewHandlerOptions = {},
): Promise<Response> {
  if (request.method !== 'GET') return methodNotAllowed(['GET'])
  const environment = options.environment ?? getProcessEnvironment()
  const runtimeEnvironment = environment.AGENT_RUNTIME_ENV?.trim() || 'unconfigured'
  const runtimeVersion = environment.AGENT_RUNTIME_VERSION?.trim() || 'unconfigured'

  return jsonResponse({
    ok: true,
    service: 'nested-objects-agent-runtime',
    status: 'healthy',
    environment: runtimeEnvironment,
    runtimeVersion,
    capabilities: {
      protectedPreviewWorkflow: true,
      syntheticOnly: true,
      externalMutations: false,
      modelExecution: false,
    },
    commit: environment.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || null,
    checkedAt: (options.now ?? (() => new Date().toISOString()))(),
  })
}

export async function handleReadinessRequest(
  request: Request,
  options: PreviewHandlerOptions = {},
): Promise<Response> {
  if (request.method !== 'GET') return methodNotAllowed(['GET'])
  const requestId = randomUUID()
  try {
    const configuration = loadPreviewDeploymentConfiguration(options.environment ?? getProcessEnvironment())
    authorizePreviewRequest(request, configuration.apiSecret)
    const dependencies = await resolveDependencies(configuration, options)
    await dependencies.checkReadiness()

    return jsonResponse({
      ok: true,
      status: 'ready',
      environment: configuration.runtime.environment,
      workflowProvider: configuration.runtime.workflowProvider,
      requiredContracts: PREVIEW_REQUIRED_TABLES,
      checkedAt: (options.now ?? (() => new Date().toISOString()))(),
      requestId,
    }, 200, { 'x-request-id': requestId })
  } catch (error) {
    return problemResponse(error, requestId)
  }
}

export async function handleLifecycleIntegrityRequest(
  request: Request,
  options: PreviewHandlerOptions = {},
): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST'])
  const requestId = randomUUID()
  try {
    const configuration = loadPreviewDeploymentConfiguration(options.environment ?? getProcessEnvironment())
    authorizePreviewRequest(request, configuration.apiSecret)
    const invocation = parsePreviewLifecycleInvocation(await parseJsonBody(request))
    const dependencies = await resolveDependencies(configuration, options)
    const summary = await executePreviewLifecycleIntegrity(
      invocation,
      dependencies,
      (options.now ?? (() => new Date().toISOString()))(),
    )

    const status = summary.duplicate && ['queued', 'running'].includes(summary.status)
      ? 202
      : summary.duplicate && summary.status === 'failed'
        ? 409
        : 200

    return jsonResponse({
      ok: status < 400,
      workflow: 'phase-c2-preview-lifecycle-integrity',
      ...summary,
      requestId,
    }, status, { 'x-request-id': requestId })
  } catch (error) {
    return problemResponse(error, requestId)
  }
}

async function resolveDependencies(
  configuration: PreviewDeploymentConfiguration,
  options: PreviewHandlerOptions,
): Promise<PreviewRuntimeDependencies> {
  if (options.dependencies) {
    assertPreviewDependencies(options.dependencies)
    return options.dependencies
  }
  const dependencies = await (options.dependencyFactory ?? createSupabasePreviewRuntimeDependencies)(configuration)
  assertPreviewDependencies(dependencies)
  return dependencies
}

function problemResponse(error: unknown, requestId: string): Response {
  if (error instanceof PreviewHttpError) {
    return jsonResponse({
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      requestId,
    }, error.status, { 'x-request-id': requestId })
  }

  if (error instanceof ContractValidationError) {
    return jsonResponse({
      ok: false,
      error: {
        code: error.code,
        message: error.message,
      },
      requestId,
    }, 503, { 'x-request-id': requestId })
  }

  if (error instanceof PreviewDependencyError) {
    return jsonResponse({
      ok: false,
      error: {
        code: error.code,
        message: 'A required preview dependency is unavailable.',
      },
      requestId,
    }, 503, { 'x-request-id': requestId })
  }

  return jsonResponse({
    ok: false,
    error: {
      code: 'PREVIEW_RUNTIME_FAILED',
      message: 'The preview runtime could not complete the request.',
    },
    requestId,
  }, 500, { 'x-request-id': requestId })
}
