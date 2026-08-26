import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8')

const [
  toolsLayout,
  toolCatalog,
  authProvider,
  authServer,
  homepage,
  seo,
  plans,
  membershipView,
] = await Promise.all([
  read('app/tools/layout.tsx'),
  read('lib/tool-catalog.ts'),
  read('components/auth-provider.tsx'),
  read('lib/auth-server.ts'),
  read('app/page.tsx'),
  read('lib/seo.ts'),
  read('lib/ai-datasets.ts'),
  read('app/membership-pricing/MembershipView.tsx'),
])

const failures = []
const requireText = (source, fragment, label) => {
  if (!source.includes(fragment)) failures.push(`${label}: missing ${fragment}`)
}
const forbidText = (source, fragment, label) => {
  if (source.includes(fragment)) failures.push(`${label}: contains forbidden ${fragment}`)
}

requireText(toolsLayout, 'data-tool-preview-only="true"', 'tools layout')
requireText(toolsLayout, 'The actual tool, forms, data requests, and mutations are not mounted', 'tools layout')
requireText(toolCatalog, "feature: 'income_calculator'", 'tool catalog')
requireText(toolCatalog, "minimumPlan: 'Free'", 'tool catalog')
requireText(authProvider, "income_calculator: 'L9nbKV9Z'", 'client entitlements')
requireText(authProvider, "ai_concierge: 'zWZD0rQp'", 'client entitlements')
requireText(authProvider, "job_routing: 'rQVqlLm6'", 'client entitlements')
requireText(authServer, 'income_calculator:', 'server entitlements')
requireText(authServer, 'notary_route_calculator:', 'server entitlements')
requireText(plans, 'export const publicMembershipPlans', 'public plan allowlist')
requireText(membershipView, 'publicMembershipPlans', 'pricing view')

forbidText(homepage, 'Can I do Mobile Notary for real estate closings?', 'homepage')
forbidText(homepage, 'No signup required', 'homepage')
forbidText(seo, 'The #1 Hub for Mortgage Field Inspection services, Mobile Notary', 'global SEO')

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('Tools access, public plan, and homepage positioning audit passed.')
}
