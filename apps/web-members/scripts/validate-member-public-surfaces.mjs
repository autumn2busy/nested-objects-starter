import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repositoryRoot = path.resolve(webRoot, '..', '..')
const failures = []

const read = (relativePath) => readFile(path.join(webRoot, relativePath), 'utf8')

const [toolsSource, middlewareSource, planSource, pricingSource, pricingPageSource, planDataSource, homeSource, roleSource, sitemapSource, availabilitySource, memberToolAccessSource, memberToolLinksSource, contentGeneratorSource, blogReviewSource, portalLayoutSource, toolLayoutSource] =
  await Promise.all([
    read('app/tools/ToolsView.tsx'),
    read('middleware.ts'),
    read('lib/plan-config.ts'),
    read('app/membership-pricing/MembershipView.tsx'),
    read('app/membership-pricing/page.tsx'),
    read('lib/ai-datasets.ts'),
    read('app/page.tsx'),
    read('components/RoleCarousel.tsx'),
    read('app/sitemap.ts'),
    read('lib/member-tools-availability.ts'),
    read('lib/member-tool-access.ts'),
    read('lib/member-tool-links.ts'),
    read('lib/content-brief-generator.ts'),
    read('app/blog/review/page.tsx'),
    read('app/(portal)/layout.tsx'),
    read('app/tools/_components/ToolLayout.tsx'),
  ])

for (const required of [
  'Two tools available now',
  'All signed-in member plans',
  'Elite and Agency',
  "href: '/tools/income-calculator'",
  "href: '/tools/notary-route-calculator'",
  'Not yet enabled',
  'disabled',
  'aria-disabled="true"',
]) {
  requireText(toolsSource, required, `member-tools catalog is missing ${JSON.stringify(required)}`)
}

for (const required of [
  "pathname.startsWith('/tools/')",
  'const isEnabledToolRoute = isEnabledMemberToolPath(pathname)',
  '!isEnabledToolRoute',
  "NextResponse.redirect(new URL('/tools', request.url), 307)",
]) {
  requireText(middlewareSource, required, `middleware is missing the default-deny tool boundary ${JSON.stringify(required)}`)
}

for (const required of [
  "'/inspector-dashboard'",
  "request.cookies.get('outseta_access_token')?.value",
  'isProtectedPortalRoute && !hasSessionCookie',
  'NextResponse.redirect(OUTSETA_LOGIN_URL, 307)',
]) {
  requireText(middlewareSource, required, `middleware is missing the signed-out portal redirect ${JSON.stringify(required)}`)
}

for (const required of [
  "searchParams.has('access_token')",
  "new URL('/api/auth/complete', request.url)",
  'NextResponse.rewrite(completionUrl,',
]) {
  requireText(middlewareSource, required, `middleware is missing the verified login-return handoff ${JSON.stringify(required)}`)
}

for (const required of [
  "import { getCurrentUser } from \"@/lib/auth-server\"",
  'const user = await getCurrentUser()',
  'if (!user)',
  'redirect(OUTSETA_LOGIN_URL)',
]) {
  requireText(portalLayoutSource, required, `portal layout is missing the unauthenticated redirect boundary ${JSON.stringify(required)}`)
}

if (toolLayoutSource.includes("href: '/inspector-dashboard'")) {
  failures.push('public tool layout still exposes Dashboard navigation to signed-out visitors')
}

for (const publicPlan of ['PLAN_UIDS.FREE', 'PLAN_UIDS.PRO', 'PLAN_UIDS.ELITE', 'PLAN_UIDS.AGENCY']) {
  requireText(publicPlanBlock(planSource), publicPlan, `public pricing allowlist omits ${publicPlan}`)
}

for (const legacyPlan of ['PLAN_UIDS.FOUNDERS', 'PLAN_UIDS.STARTER']) {
  if (publicPlanBlock(planSource).includes(legacyPlan)) {
    failures.push(`public pricing allowlist includes legacy plan ${legacyPlan}`)
  }
  requireText(paidPlanBlock(planSource), legacyPlan, `legacy entitlement list omits ${legacyPlan}`)
}

requireText(
  pricingSource,
  '.filter((plan) => isPublicPlanUid(plan.planUid))',
  'pricing render does not use the explicit public-plan allowlist',
)

if (pricingSource.includes('.filter((plan) => !plan.hidden)')) {
  failures.push('pricing render still relies on the mutable hidden display flag')
}

for (const forbidden of [
  'No signup required',
  'Instant results',
  'Calculate your specific area',
]) {
  if (homeSource.toLowerCase().includes(forbidden.toLowerCase())) {
    failures.push(`homepage still advertises a functional Free tool: ${JSON.stringify(forbidden)}`)
  }
}

requireText(homeSource, 'href="/tools"', 'homepage does not link to the member-tools catalog')
requireText(homeSource, 'href="/tools/income-calculator"', 'homepage does not link to the available income planner')
requireText(homeSource, 'Results are estimates, not income promises.', 'homepage income-planner copy omits its estimate boundary')
requireText(pricingPageSource, 'Field Inspector Membership Plans', 'pricing metadata is not field-inspector-first')
requireText(pricingPageSource, '.filter((plan) => isPublicPlanUid(plan.planUid))', 'pricing schema does not reuse the public-plan allowlist')

const publicProBlock = extractObjectBetween(planDataSource, "name: 'Pro'", "name: 'Elite'")
for (const forbidden of ['Full AI tools', 'full access to AI tools', 'Full AI Concierge access', 'Full AI Resume Builder access']) {
  if (publicProBlock.toLowerCase().includes(forbidden.toLowerCase())) {
    failures.push(`public Pro checkout copy promises disabled execution: ${JSON.stringify(forbidden)}`)
  }
}
requireText(publicProBlock, 'Income scenario planner', 'public Pro checkout copy omits the available income planner')
requireText(publicProBlock, 'connected workflow tools', 'public Pro checkout copy does not distinguish disabled connected tools')

for (const forbidden of ['test the tools', 'Turn on AI tools', 'unlock AI tools', 'AI tools are non-refundable']) {
  if (pricingSource.toLowerCase().includes(forbidden.toLowerCase())) {
    failures.push(`pricing support copy promises disabled execution: ${JSON.stringify(forbidden)}`)
  }
}

const productTruthSources = new Map(
  await Promise.all(
    [
      'app/about-us/page.tsx',
      'app/faqs/page.tsx',
      'app/hiring-firms/[state]/page.tsx',
      'app/refund-policy/page.tsx',
      'app/roles/inspector/page.tsx',
      'app/terms-conditions/page.tsx',
      'app/welcome-back/WelcomeBackView.tsx',
      'lib/ai-datasets.ts',
    ].map(async (file) => [file, await read(file)]),
  ),
)

for (const [file, source] of productTruthSources) {
  for (const forbidden of [
    'Ask anything about firms, routes, or requirements — grounded answers instantly.',
    'AI Resume Builder access',
    'Limited AI Concierge usage',
    'Limited AI Resume Builder usage',
    'Use the AI concierge to compare',
    'AI tools that help you choose',
    'AI tools, and training resources',
    'AI tools, templates, and intel is delivered instantly',
  ]) {
    if (source.includes(forbidden)) {
      failures.push(`${file} promises disabled member-tool execution: ${JSON.stringify(forbidden)}`)
    }
  }
}

const mortgageRoleIndex = roleSource.indexOf("slug: 'mortgage-field-inspector'")
const lossControlRoleIndex = roleSource.indexOf("slug: 'insurance-loss-control'")
const notaryRoleIndex = roleSource.indexOf("slug: 'mobile-notary'")
if (!(mortgageRoleIndex >= 0 && mortgageRoleIndex < lossControlRoleIndex && lossControlRoleIndex < notaryRoleIndex)) {
  failures.push('role ordering does not keep field inspection primary and mobile notary adjacent')
}

if (sitemapSource.includes('STATIC_TOOL_SLUGS') || sitemapSource.includes('...toolEntries')) {
  failures.push('sitemap still publishes disabled /tools/* execution routes')
}

for (const required of [
  'export const MEMBER_TOOL_EXECUTION_ENABLED = false',
  "export const MEMBER_TOOLS_DISABLED_CODE = 'MEMBER_TOOLS_PREVIEW_ONLY'",
  'status: 503',
  "'Cache-Control': 'no-store'",
]) {
  requireText(availabilitySource, required, `member-tool server guard is missing ${JSON.stringify(required)}`)
}

const guardedRoutes = new Map([
  ['app/api/ai/concierge/route.ts', 1],
  ['app/api/ai/resume/route.ts', 1],
  ['app/api/ai/resume/parse/route.ts', 2],
  ['app/api/ai/resume/generate/route.ts', 1],
  ['app/api/weather/route.ts', 1],
  ['app/api/company-tracker/route.ts', 4],
])

for (const [route, expectedGuards] of guardedRoutes) {
  const source = await read(route)
  const guardCount = source.match(/memberToolsUnavailableResponse\(\)/g)?.length || 0
  if (guardCount < expectedGuards) {
    failures.push(`${route} has ${guardCount} disabled-tool guards; expected at least ${expectedGuards}`)
  }
}

for (const sharedRoute of [
  'app/api/jobs/[id]/route.ts',
  'app/api/member-jobs/route.ts',
  'app/api/member-jobs/[id]/route.ts',
]) {
  const source = await read(sharedRoute)
  if (source.includes('memberToolsUnavailableResponse')) {
    failures.push(`${sharedRoute} is shared by the standalone Jobs experience and must not inherit the /tools kill switch`)
  }
}

const disabledToolPages = [
  'ai-concierge',
  'ai-resume',
  'clients',
  'companies',
  'job-tracker',
  'job-tracking',
  'routing',
  'weather',
]

for (const route of disabledToolPages) {
  const source = await read(`app/tools/${route}/page.tsx`)
  requireText(source, 'redirectDisabledMemberTool()', `${route} lacks a route-local preview redirect`)
  if (/createClient|\.from\(|fetch\(/.test(source)) {
    failures.push(`${route} still contains executable data access in its route module`)
  }
}

for (const [route, marker] of [
  ['income-calculator', 'MEMBER_TOOL_IDS.INCOME_SCENARIO'],
  ['notary-route-calculator', 'MEMBER_TOOL_IDS.ROUTE_ECONOMICS'],
]) {
  const source = await read(`app/tools/${route}/page.tsx`)
  requireText(source, marker, `${route} does not enforce its member-tool policy`)
  requireText(source, 'getCurrentUser()', `${route} does not verify the signed-in member on the server`)
  if (source.includes('redirectDisabledMemberTool()')) {
    failures.push(`${route} still redirects through the obsolete blanket tool lock`)
  }
}

for (const required of [
  "'/tools/income-calculator'",
  "'/tools/notary-route-calculator'",
  'isEnabledMemberToolPath',
  'canAccessMemberTool',
]) {
  requireText(memberToolAccessSource, required, `member-tool access policy is missing ${JSON.stringify(required)}`)
}

for (const required of ["href.startsWith('/tools/')", 'isEnabledMemberToolPath', "href: '/tools'"]) {
  requireText(memberToolLinksSource, required, `member-tool link normalizer is missing ${JSON.stringify(required)}`)
}
requireText(contentGeneratorSource, 'normalizeMemberToolLink', 'content brief generation does not normalize historical tool links')
requireText(blogReviewSource, 'normalizeMemberToolHref', 'blog review does not normalize historical tool targets')

const contentFiles = (await collect(path.join(webRoot, 'content'))).filter((file) => file.endsWith('.json'))
for (const file of contentFiles) {
  const value = JSON.parse(await readFile(file, 'utf8'))
  inspectStructuredLinks(value, path.relative(webRoot, file))
}

const exposedSourceFiles = [
  ...await collect(path.join(webRoot, 'app')),
  ...await collect(path.join(webRoot, 'components')),
  ...await collect(path.join(webRoot, 'constants')),
  ...await collect(path.join(webRoot, 'lib')),
].filter((file) => /\.(ts|tsx)$/.test(file) && !file.includes(`${path.sep}app${path.sep}tools${path.sep}`))

for (const file of exposedSourceFiles) {
  const source = await readFile(file, 'utf8')
  for (const match of source.matchAll(/(?:href|targetPage)\s*[:=]\s*["'`](\/tools\/[^"'`?#]*)/g)) {
    if (!isEnabledToolHref(match[1])) {
      failures.push(`exposed source links to a disabled tool route: ${path.relative(webRoot, file)} -> ${match[1]}`)
    }
  }
  if (/fetch\(\s*["'`]\/api\/company-tracker/.test(source)) {
    failures.push(`exposed source still calls the disabled company tracker API: ${path.relative(webRoot, file)}`)
  }
}

for (const workflow of ['apply-member-surface-fix.yml', 'audit-member-surface.yml']) {
  const workflowPath = path.join(repositoryRoot, '.github', 'workflows', workflow)
  try {
    await access(workflowPath)
    failures.push(`broken one-shot workflow still exists: ${workflow}`)
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
}

const durableWorkflow = await readFile(path.join(repositoryRoot, '.github', 'workflows', 'member-public-surfaces.yml'), 'utf8')
for (const required of ['audit:member-surfaces', 'verify:member-tools-runtime', 'npm run dev']) {
  requireText(durableWorkflow, required, `member-surface CI is missing ${JSON.stringify(required)}`)
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'))
  process.exitCode = 1
} else {
  console.log('Member public-surface contract check passed.')
}

function requireText(source, expected, message) {
  if (!source.includes(expected)) failures.push(message)
}

function publicPlanBlock(source) {
  return extractArray(source, 'PUBLIC_PLAN_UIDS')
}

function paidPlanBlock(source) {
  return extractArray(source, 'PAID_PLANS')
}

function extractArray(source, exportName) {
  const match = source.match(new RegExp(`export const ${exportName}[^=]*= \\[(.*?)\\]`, 's'))
  if (!match) {
    failures.push(`could not locate ${exportName}`)
    return ''
  }
  return match[1]
}

function extractObjectBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, start + startMarker.length)
  if (start < 0 || end < 0) {
    failures.push(`could not locate object block between ${startMarker} and ${endMarker}`)
    return ''
  }
  return source.slice(start, end)
}

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collect(absolute))
    else files.push(absolute)
  }
  return files
}

function inspectStructuredLinks(value, location) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectStructuredLinks(item, `${location}[${index}]`))
    return
  }
  if (!value || typeof value !== 'object') return

  for (const [key, child] of Object.entries(value)) {
    const childLocation = `${location}.${key}`
    if ((key === 'href' || key === 'targetPage') && typeof child === 'string'
      && child.startsWith('/tools/') && !isEnabledToolHref(child)) {
      failures.push(`checked-in content targets a disabled tool route: ${childLocation}`)
    }
    inspectStructuredLinks(child, childLocation)
  }
}

function isEnabledToolHref(href) {
  const pathname = href.split(/[?#]/, 1)[0].replace(/\/$/, '')
  return pathname === '/tools/income-calculator' || pathname === '/tools/notary-route-calculator'
}
