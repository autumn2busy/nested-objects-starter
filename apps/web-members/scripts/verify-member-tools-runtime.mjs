import process from 'node:process'

const baseUrl = new URL(process.env.MEMBER_SURFACE_BASE_URL || process.argv[2] || 'http://localhost:3018')
const failures = []

const previewResponse = await request('/tools')
if (previewResponse.status !== 200) {
  failures.push(`/tools returned ${previewResponse.status}, expected 200`)
} else {
  const previewHtml = await previewResponse.text()
  for (const marker of ['Preview mode', 'Preview only. No function enabled']) {
    if (!previewHtml.includes(marker)) failures.push(`/tools response is missing ${JSON.stringify(marker)}`)
  }
}

const dashboardResponse = await request('/inspector-dashboard', { redirect: 'manual' })
const dashboardLocation = dashboardResponse.headers.get('location')
if (
  ![307, 308].includes(dashboardResponse.status) ||
  !dashboardLocation?.startsWith('https://nested-objects.outseta.com/auth?widgetMode=login')
) {
  failures.push(
    `/inspector-dashboard did not redirect signed-out visitors to login ` +
    `(status=${dashboardResponse.status}, location=${dashboardLocation})`,
  )
}

const disabledToolRoutes = [
  '/tools/ai-concierge',
  '/tools/ai-resume',
  '/tools/clients',
  '/tools/companies',
  '/tools/income-calculator',
  '/tools/job-tracker',
  '/tools/job-tracking',
  '/tools/notary-route-calculator',
  '/tools/routing',
  '/tools/weather',
]

for (const route of disabledToolRoutes) {
  const response = await request(route, { redirect: 'manual' })
  const location = response.headers.get('location')
  const redirectedPath = location ? new URL(location, baseUrl).pathname : null
  if (![307, 308].includes(response.status) || redirectedPath !== '/tools') {
    failures.push(`${route} did not redirect to /tools (status=${response.status}, location=${location})`)
  }
}

const disabledEndpoints = [
  { method: 'POST', route: '/api/ai/concierge' },
  { method: 'POST', route: '/api/ai/resume' },
  { method: 'POST', route: '/api/ai/resume/parse' },
  { method: 'GET', route: '/api/ai/resume/parse' },
  { method: 'POST', route: '/api/ai/resume/generate' },
  { method: 'GET', route: '/api/weather?q=Denver' },
  { method: 'GET', route: '/api/company-tracker' },
  { method: 'POST', route: '/api/company-tracker' },
  { method: 'PATCH', route: '/api/company-tracker' },
  { method: 'DELETE', route: '/api/company-tracker' },
]

for (const endpoint of disabledEndpoints) {
  const response = await request(endpoint.route, {
    method: endpoint.method,
    headers: endpoint.method === 'GET' ? undefined : { 'Content-Type': 'application/json' },
    body: endpoint.method === 'GET' ? undefined : '{}',
  })
  const payload = await response.json().catch(() => ({}))
  if (response.status !== 503 || payload.code !== 'MEMBER_TOOLS_PREVIEW_ONLY') {
    failures.push(
      `${endpoint.method} ${endpoint.route} did not fail closed ` +
      `(status=${response.status}, code=${JSON.stringify(payload.code)})`,
    )
  }
  if (!response.headers.get('cache-control')?.includes('no-store')) {
    failures.push(`${endpoint.method} ${endpoint.route} did not return Cache-Control: no-store`)
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'))
  process.exitCode = 1
} else {
  console.log(`Member tools runtime boundary passed at ${baseUrl.origin}.`)
}

async function request(route, init = {}) {
  return fetch(new URL(route, baseUrl), {
    ...init,
    signal: AbortSignal.timeout(60_000),
  })
}
