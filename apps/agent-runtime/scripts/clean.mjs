import { rm } from 'node:fs/promises'

await Promise.all([
  rm(new URL('../dist', import.meta.url), { recursive: true, force: true }),
  rm(new URL('../dist-api', import.meta.url), { recursive: true, force: true }),
  rm(new URL('../.workflow-test', import.meta.url), { recursive: true, force: true }),
])
