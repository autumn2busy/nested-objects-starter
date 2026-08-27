import { workflow } from '@workflow/vitest'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    workflow({
      cwd: '.',
      rootDir: './.workflow-test',
    }),
  ],
  test: {
    include: ['workflows/**/*.integration.test.ts'],
    testTimeout: 60_000,
  },
})
