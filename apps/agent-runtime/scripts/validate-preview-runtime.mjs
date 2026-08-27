import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8')
const [
  packageSource,
  tsconfigSource,
  envSource,
  readmeSource,
  fixtureSource,
  vercelSource,
  robotsSource,
  healthSource,
  evaluateSource,
  contractSource,
  runtimeSource,
  evaluationRuntimeSource,
  webSource,
  indexSource,
] = await Promise.all([
  read('package.json'),
  read('tsconfig.json'),
  read('.env.example'),
  read('README.md'),
  read('fixtures/preview-evaluation.synthetic.json'),
  read('vercel.json'),
  read('public/robots.txt'),
  read('api/health.ts'),
  read('api/preview/evaluate.ts'),
  read('src/http/preview-contract.ts'),
  read('src/http/preview-runtime.ts'),
  read('src/runtime/preview-evaluation.ts'),
  read('src/http/web.ts'),
  read('src/index.ts'),
])

const failures = []
let packageJson
let tsconfigJson
let fixtureJson
let vercelJson
try {
  packageJson = JSON.parse(packageSource)
} catch (error) {
  failures.push(`package.json is invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
}
try {
  tsconfigJson = JSON.parse(tsconfigSource)
} catch (error) {
  failures.push(`tsconfig.json is invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
}
try {
  fixtureJson = JSON.parse(fixtureSource)
} catch (error) {
  failures.push(`preview fixture is invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
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
]) {
  if (!envSource.includes(fragment)) failures.push(`.env.example is missing ${fragment}`)
}

for (const pattern of [
  /^AGENT_PREVIEW_API_TOKEN=.+$/m,
  /^SUPABASE_URL=/m,
  /^SUPABASE_SERVICE_ROLE_KEY=/m,
  /^AGENT_STAGING_PROJECT_REF=/m,
  /^OPENAI_API_KEY=.+$/m,
]) {
  if (pattern.test(envSource)) failures.push(`.env.example violates the Phase C2 secret or database boundary: ${pattern}`)
}

for (const forbidden of [
  'AGENT_PREVIEW_PERSISTENCE_ENABLED=true',
  'SUPABASE_SERVICE_ROLE_KEY=<staging secret key>',
  'Later staging persistence requires',
  'Optional persistence is separately gated',
]) {
  if (readmeSource.includes(forbidden)) failures.push(`README contains obsolete persistence setup: ${forbidden}`)
}
if (!readmeSource.includes('Strict dry-run execution with no Supabase credentials, database writes, or persistence mode.')) {
  failures.push('README does not state the final dry-run-only database boundary')
}

if (packageJson) {
  const scripts = packageJson.scripts ?? {}
  if (packageJson.engines?.node !== '>=22.16.0 <23') {
    failures.push('package.json must pin the isolated Vercel runtime to Node 22.16 or newer within major 22')
  }
  if (!String(scripts.typecheck ?? '').includes('tsconfig.api.json')) {
    failures.push('package.json typecheck does not validate the Vercel API entrypoints')
  }
  if (scripts.build !== 'npm run clean && tsc -p tsconfig.json') {
    failures.push('package.json build must preserve the validated TypeScript library build')
  }
  if (!String(scripts.validate ?? '').includes('preview:check')) {
    failures.push('package.json validate does not include preview:check')
  }
  if (packageJson.dependencies?.workflow || packageJson.dependencies?.['@vercel/workflow']) {
    failures.push('Phase C2 unexpectedly installs a durable workflow package before the preview boundary is proven')
  }
}

if (Object.hasOwn(tsconfigJson?.compilerOptions ?? {}, 'rootDir')) {
  failures.push('tsconfig.json must infer a root that contains both Vercel api/ functions and src/ imports')
}

if (vercelJson) {
  const functions = vercelJson.functions ?? {}
  if (vercelJson.buildCommand !== 'npm run build') {
    failures.push('Phase C2 must run the validated TypeScript build before Vercel packages its functions')
  }
  if (vercelJson.outputDirectory !== 'public') {
    failures.push('Phase C2 must publish only its minimal public directory as static output')
  }
  if (!functions['api/health.ts']) failures.push('vercel.json is missing api/health.ts')
  if (!functions['api/preview/evaluate.ts']) failures.push('vercel.json is missing api/preview/evaluate.ts')
  if (vercelJson.crons) failures.push('Phase C2 must not schedule preview execution')
  if (vercelJson.routes || vercelJson.rewrites) failures.push('Phase C2 must not add public routing aliases')
}

if (robotsSource.trim() !== 'User-agent: *\nDisallow: /') {
  failures.push('public/robots.txt must discourage indexing of the isolated preview runtime')
}

if (fixtureJson) validateSyntheticFixture(fixtureJson, failures)

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
  'SYNTHETIC_FIXTURE_UUID_PATTERN',
  'Phase C2 fixture UUIDs must use the reserved 31800000-',
  'nullableSyntheticIdentifierSchema',
  "endsWith('.invalid')",
  "state: z.enum(['ZZ'])",
  'Phase C2 preview does not accept phone numbers',
  'Phase C2 preview does not accept profile headline or biography text',
  'Phase C2 preview does not accept conversion event payload values',
  'Phase C2 preview does not accept ActiveCampaign custom field values',
  'External identifiers must begin with validation- or synthetic-.',
  'Object.values(input.activeCampaignMirrorByMemberId)',
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
  'Phase C2 preview does not permit database persistence',
  'Phase C2 preview must not be configured with Supabase credentials',
  'Phase C2 preview does not accept a staging project reference',
  'persistenceEnabled: false',
  'timingSafeEqual',
]) {
  if (!runtimeSource.includes(fragment)) failures.push(`Preview runtime guard is missing ${fragment}`)
}

for (const fragment of [
  'if (input.persist)',
  'PreviewPersistenceDisabledError',
  "execution: 'dry_run'",
]) {
  if (!evaluationRuntimeSource.includes(fragment)) failures.push(`Dry-run evaluation guard is missing ${fragment}`)
}

for (const forbidden of [
  'createSupabaseProjectionRunStore',
  'createSupabaseProjectionStore',
  'persistPreviewEvaluation',
  'persistMemberProjection',
]) {
  if (evaluationRuntimeSource.includes(forbidden)) {
    failures.push(`Phase C2 evaluation still contains forbidden persistence capability: ${forbidden}`)
  }
}

if (indexSource.includes('projection-run-store')) {
  failures.push('Runtime index still exports the removed Phase C2 projection run store')
}

try {
  await read('src/persistence/projection-run-store.ts')
  failures.push('Phase C2 projection run persistence file still exists')
} catch (error) {
  if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('Static Phase C2 preview deployment and dry-run safety contract check passed.')
}

function validateSyntheticFixture(fixture, errors) {
  const uuidPattern = /^31800000-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const syntheticIdentifier = (value) => {
    const normalized = String(value ?? '').trim().toLowerCase()
    return normalized.startsWith('synthetic-') || normalized.startsWith('validation-')
  }
  const syntheticLabel = (value) => {
    const normalized = String(value ?? '').trim().toLowerCase()
    return normalized.startsWith('synthetic ') || normalized.startsWith('validation ')
  }

  const uuids = [
    fixture.correlationId,
    fixture.causationId,
    ...(fixture.profiles ?? []).flatMap((profile) => [profile.id, profile.user_id]),
    ...(fixture.conversionEvents ?? []).map((event) => event.id),
    ...Object.keys(fixture.productAccessByMemberId ?? {}),
    ...Object.values(fixture.productAccessByMemberId ?? {}).map((snapshot) => snapshot.memberId),
    ...Object.keys(fixture.activeCampaignMirrorByMemberId ?? {}),
  ].filter(Boolean)
  if (uuids.some((value) => !uuidPattern.test(String(value)))) {
    errors.push('Preview fixture contains a UUID outside the reserved 31800000 namespace')
  }

  const externalIds = [
    ...(fixture.profiles ?? []).flatMap((profile) => [
      profile.outseta_person_uid,
      profile.outseta_account_id,
      profile.plan_uid,
    ]),
    ...(fixture.conversionEvents ?? []).flatMap((event) => [
      event.client_event_id,
      event.anonymous_id,
      event.session_id,
      event.member_uid,
      event.plan_uid,
      event.source,
      event.utm_source,
      event.utm_medium,
      event.utm_campaign,
    ]),
    ...(fixture.activeCampaignContacts ?? []).map((contact) => contact.contactId),
    ...(fixture.activeCampaignAssets ?? []).map((asset) => asset.externalId),
    ...Object.values(fixture.activeCampaignMirrorByMemberId ?? {}).map((mirror) => mirror.contactId),
  ].filter(Boolean)
  if (externalIds.some((value) => !syntheticIdentifier(value))) {
    errors.push('Preview fixture contains an external identifier without a synthetic or validation prefix')
  }

  const emails = [
    ...(fixture.profiles ?? []).flatMap((profile) => [profile.user_email, profile.email]),
    ...(fixture.conversionEvents ?? []).map((event) => event.member_email),
    ...(fixture.activeCampaignContacts ?? []).map((contact) => contact.email),
    ...(fixture.marketingConfig?.approvedInternalMemberEmails ?? []),
  ].filter(Boolean)
  if (emails.some((value) => !String(value).toLowerCase().endsWith('.invalid'))) {
    errors.push('Preview fixture contains a non-.invalid email address')
  }

  if ((fixture.marketingConfig?.internalDomains ?? []).some(
    (value) => !String(value).toLowerCase().endsWith('.invalid'),
  )) {
    errors.push('Preview fixture contains a real internal domain')
  }
  if ((fixture.profiles ?? []).some((profile) => profile.state && profile.state !== 'ZZ')) {
    errors.push('Preview fixture contains a real geographic state')
  }
  if ((fixture.profiles ?? []).some((profile) =>
    [...(Array.isArray(profile.service_areas) ? profile.service_areas : [profile.service_areas]),
      ...(Array.isArray(profile.primary_services) ? profile.primary_services : [profile.primary_services])]
      .filter(Boolean)
      .some((value) => !syntheticLabel(value)),
  )) {
    errors.push('Preview fixture contains an unmarked profile label')
  }
  if ((fixture.activeCampaignContacts ?? []).some((contact) =>
    Object.keys(contact.customFields ?? {}).length > 0
    || [...(contact.tagNames ?? []), ...(contact.listNames ?? [])].some((value) => !syntheticLabel(value)),
  )) {
    errors.push('Preview fixture contains ActiveCampaign custom fields or unmarked asset labels')
  }
  if ((fixture.activeCampaignAssets ?? []).some((asset) => !syntheticLabel(asset.name))) {
    errors.push('Preview fixture contains an unmarked ActiveCampaign asset name')
  }
  if ((fixture.conversionEvents ?? []).some((event) => event.event_data && Object.keys(event.event_data).length > 0)) {
    errors.push('Preview fixture contains conversion event payload values')
  }
}
