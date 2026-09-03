import { defineConfig } from 'nitro'
import type { ModuleOptions } from 'workflow/nitro'

const workflow: ModuleOptions = {
  dirs: ['./workflows'],
  runtime: 'nodejs22.x',
  typescriptPlugin: true,
}

const config = {
  compatibilityDate: {
    default: '2026-08-27',
    // Nitro 3's newer Vercel route splitting aliases every API path to the
    // same function in this project, causing non-health routes to serve the
    // health handler. Keep the application compatibility date current while
    // routing Vercel requests through the single Nitro dispatcher.
    vercel: '2025-07-14',
  },
  modules: ['workflow/nitro'],
  serverDir: './server',
  workflow,
}

export default defineConfig(config as Parameters<typeof defineConfig>[0] & { workflow: ModuleOptions })
