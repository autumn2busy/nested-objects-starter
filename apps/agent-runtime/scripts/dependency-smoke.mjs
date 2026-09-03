import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const requirements = [
  ['@openai/agents', ['Agent', 'run']],
  ['@supabase/supabase-js', ['createClient']],
  ['@workflow/core', ['FatalError', 'RetryableError', 'getStepMetadata', 'getWorkflowMetadata']],
  ['workflow/api', ['start']],
  ['zod', ['z']],
]

for (const [packageName, exports] of requirements) {
  const module = await import(packageName)
  for (const exportName of exports) {
    if (!(exportName in module)) {
      throw new Error(`${packageName} is missing required export ${exportName}`)
    }
  }
}

const persistenceFiles = [
  'admin-control-plane-store.ts',
  'control-plane-store.ts',
  'durable-workflow-store.ts',
  'learning-trace-store.ts',
  'operating-workflow-store.ts',
  'projection-store.ts',
  'sensor-observation-store.ts',
]

for (const fileName of persistenceFiles) {
  const fileUrl = new URL(`../src/persistence/${fileName}`, import.meta.url)
  const source = await readFile(fileUrl, 'utf8')
  if (!source.includes("import('@supabase/supabase-js')") || source.includes('import(packageName)')) {
    throw new Error(
      `${fileURLToPath(fileUrl)} must use a literal Supabase import so isolated Workflow steps bundle the dependency`,
    )
  }
}

console.log('Pinned runtime dependency smoke check passed.')
