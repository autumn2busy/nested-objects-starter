import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const [runtimeSource, endpointSource] = await Promise.all([
  readFile(path.join(root, 'src/http/preview-runtime.ts'), 'utf8'),
  readFile(path.join(root, 'api/preview/evaluate.ts'), 'utf8'),
])

const failures = []
for (const fragment of [
  'ContractValidationError',
  'loadBaseRuntimeConfiguration',
  'error instanceof ContractValidationError',
  "throw new PreviewRuntimeConfigurationError('Base runtime configuration is invalid.')",
]) {
  if (!runtimeSource.includes(fragment)) {
    failures.push(`Preview runtime does not normalize base configuration failures: ${fragment}`)
  }
}

for (const fragment of [
  'error instanceof PreviewRuntimeConfigurationError',
  "message: 'Preview runtime is not safely configured.'",
  '503',
]) {
  if (!endpointSource.includes(fragment)) {
    failures.push(`Preview endpoint does not map configuration failure to 503: ${fragment}`)
  }
}

const configurationBranch = endpointSource.indexOf('error instanceof PreviewRuntimeConfigurationError')
const genericFailureBranch = endpointSource.indexOf("code: 'PREVIEW_EVALUATION_FAILED'")
if (configurationBranch < 0 || genericFailureBranch < 0 || configurationBranch > genericFailureBranch) {
  failures.push('Preview configuration errors must be handled before the generic 500 response')
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('Static Phase C2 preview configuration error mapping check passed.')
}
