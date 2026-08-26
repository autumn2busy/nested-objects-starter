import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8')
const [packageSource, envSource, vercelSource, healthSource, evaluateSource, contractSource, runtimeSource, webSource] =
  await Promise.all([
    read('package.json'),
    read('.env.example'),
    read('vercel.json'),
    read('api/health.ts'),
    read('api/preview/evaluate.ts'),
    read('src/http/preview-contract.ts'),
    read('src/http/preview-runtime.ts'),
    read('src/http/web.ts'),
  ])

const failures = []
let packageJson
let vercelJson
try {
  packageJson = JSON.parse(packageSource)
} catch (error) {
  failures.push(`package.json is invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
}
try {
  vercelJson = JSON.parse(vercelSource)
} catch (error) {
  failures.push(`vercel.json is invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
}

for (const fragment of [
  'AGENT_RUNTIME_ENV=preview',
  'AGENT_RUNTIME_MODE=dry_run',
  'AGENT_MUTATIONS_ENABLED=false',
  'AGENT_MODEL_EXECUTION_ENABLED=false',
  'AGENT_WORKFLOW_PROVIDER=in_memory',
  'AGENT_PREVIEW_SYNTHETIC_ONLY=true',
  'AGENT_PREVIEW_PERSISTENCE_ENABLED=false',
  'AGENT_PREVIEW_API_TOKEN=',
  'AGENT_STAGING_PROJECT_REF=',
]) {
  if (!envSource.includes(fragment)) failures.push(`.env.example is missing ${fragment}`)
}

for (const pattern of [
  /^AGENT_PREVIEW_API_TOKEN=.+$/m,
  /^SUPABASE_SERVICE_ROLE_KEY=.+$/m,
  /^OPENAI_API_KEY=.+$/m,
]) {
  if (pattern.test(envSource)) failures.push(`.env.example contains a committed secret matching ${pattern}`)
}

if (packageJson) {
  const scripts = packageJson.scripts ?? {}
  if (!String(scripts.typecheck ?? '').includes('tsconfig.api.json')) {
    failures.push('package.json typecheck does not validate the Vercel API entrypoints')
  }
  if (!String(scripts.validate ?? '').includes('preview:check')) {
    failures.push('package.json validate does not include preview:check')
  }
  if (packageJson.dependencies?.workflow || packageJson.dependencies?.['@vercel/workflow']) {
    failures.push('Phase C2 unexpectedly installs a durable workflow package before the preview boundary is proven')
  }
}

if (vercelJson) {
  const functions = vercelJson.functions ?? {}
  if (!functions['api/health.ts']) failures.push('vercel.json is missing api/health.ts')
  if (!functions['api/preview/evaluate.ts']) failures.push('vercel.json is missing api/preview/evaluate.ts')
  if (vercelJson.crons) failures.push('Phase C2 must not schedule preview execution')
  if (vercelJson.routes || vercelJson.rewrites) failures.push('Phase C2 must not add public routing aliases')
}

if (!healthSource.includes('previewHealthSnapshot')) failures.push('Health endpoint is missing previewHealthSnapshot')
if (!runtimeSource.includes('configurationValid')) failures.push('Preview health does not expose configuration validity')
if (!webSource.includes("'cache-control': 'no-store")) failures.push('JSON responses are missing no-store cache control')

for (const fragment of [
  'loadPreviewRuntimeConfiguration',
  'authenticatePreviewRequest',
  'readBoundedJson',
  'evaluatePreviewRequest',
]) {
  if (!evaluateSource.includes(fragment)) failures.push(`Evaluate endpoint is missing ${fragment}`)
}
const authenticationIndex = evaluateSource.indexOf('authenticatePreviewRequest(request')
const bodyReadIndex = evaluateSource.indexOf('readBoundedJson(request)')
if (authenticationIndex < 0 || bodyReadIndex < 0 || authenticationIndex > bodyReadIndex) {
  failures.push('Evaluate endpoint must authenticate before reading the request body')
}

for (const fragment of [
  "endsWith('.invalid')",
  'Phase C2 preview does not accept phone numbers',
  'Contact and asset IDs must begin with validation- or synthetic-.',
  'requestBytes: 1_500_000',
]) {
  if (!contractSource.includes(fragment)) failures.push(`Synthetic preview contract is missing ${fragment}`)
}

for (const fragment of [
  "runtime.environment !== 'preview'",
  "vercelEnvironment === 'production'",
  "runtime.mode !== 'dry_run'",
  "runtime.workflowProvider !== 'in_memory'",
  'Phase C2 preview does not permit model execution',
  'assertStagingSupabaseUrl',
  'timingSafeEqual',
]) {
  if (!runtimeSource.includes(fragment)) failures.push(`Preview runtime guard is missing ${fragment}`)
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('Static Phase C2 preview deployment and safety contract check passed.')
}
