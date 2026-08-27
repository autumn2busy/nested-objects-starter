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

console.log('Pinned runtime dependency smoke check passed.')
