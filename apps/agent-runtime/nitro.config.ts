import { defineConfig } from 'nitro'
import type { ModuleOptions } from 'workflow/nitro'

const workflow: ModuleOptions = {
  dirs: ['./workflows'],
  runtime: 'nodejs22.x',
  typescriptPlugin: true,
}

const config = {
  compatibilityDate: '2026-08-27',
  modules: ['workflow/nitro'],
  serverDir: './server',
  workflow,
}

export default defineConfig(config as Parameters<typeof defineConfig>[0] & { workflow: ModuleOptions })
