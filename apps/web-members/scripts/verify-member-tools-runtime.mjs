import process from 'node:process'

const baseUrl = new URL(process.env.MEMBER_SURFACE_BASE_URL || process.argv[2] || 'http://localhost:3018')
const failures = []

const catalogResponse = await request('/tools')
if (catalogResponse.status !== 200) {
  failures.push(`/tools returned ${catalogResponse.status}, expected 200`)
} else {
  const catalogHtml = await catalogResponse.text()
  for (const marker of ['Member tools by plan', 'Income scenario planner', 'AI concierge', 'Route economics calculator']) {
    if (!catalogHtml.includes(marker)) failures.push(`/tools response is missing ${JSON.stringify(marker)}`)
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

// A login return must reach token verification before either portal auth guard.
// These are invalid synthetic values, never a real member token.
for (const route of [
  '/inspector-dashboard?access_token=synthetic-login-regression',
  '/profile?access_token=synthetic-login-regression',
  '/members?access_token=synthetic-login-regression',
  '/members/11111111-1111-1111-1111-111111111111?access_token=synthetic-login-regression',
  '/auth/callback?access_token=synthetic-login-regression',
]) {
  const response = await request(route, { redirect: 'manual' })
  const location = response.headers.get('location')
  if (response.status !== 303 || location !== `${baseUrl.origin}/auth/callback?error=invalid_session`) {
    failures.push(`Login return did not reach verification (status=${response.status})`)
  }
  if (response.headers.get('set-cookie')?.includes('outseta_access_token=')) {
    failures.push('An invalid login token created a session cookie')
  }
  if (!response.headers.get('cache-control')?.includes('no-store')) {
    failures.push('Login return is missing no-store')
  }
  if (response.headers.get('referrer-policy') !== 'no-referrer') {
    failures.push('Login return is missing no-referrer')
  }
  if ([...response.headers].some(([, value]) => value.includes('synthetic-login-regression'))) {
    failures.push('Login response headers echo the supplied token')
  }
}

// Check the real Next.js router as well as the signed-identity unit fixtures.
// A cookie's presence alone must never grant access to member payloads.
for (const route of ['/members', '/members/11111111-1111-1111-1111-111111111111']) {
  for (const forgedCookie of [false, true]) {
    const response = await request(route, {
      redirect: 'manual',
      headers: forgedCookie ? { cookie: 'outseta_access_token=synthetic-invalid' } : {},
    })
    const location = response.headers.get('location')
    if (response.status !== 307 || !location?.startsWith('https://nested-objects.outseta.com/auth?widgetMode=login')) {
      failures.push(`${route} exposed a member view without verified identity (status=${response.status})`)
    }
    if (!response.headers.get('cache-control')?.includes('no-store')) {
      failures.push(`${route} is missing no-store`)
    }
    if (response.headers.get('x-robots-tag') !== 'noindex, nofollow, noarchive') {
      failures.push(`${route} is missing private indexing headers`)
    }
  }
}

const protectedToolRoutes = [
  '/tools/ai-concierge',
  '/tools/ai-resume',
  '/tools/clients',
  '/tools/companies',
  '/tools/job-tracker',
  '/tools/job-tracking',
  '/tools/routing',
  '/tools/weather',
]

for (const route of protectedToolRoutes) {
  const response = await request(route, { redirect: 'manual' })
  const location = response.headers.get('location')
  if (response.status !== 307 || !location?.startsWith('https://nested-objects.outseta.com/auth?widgetMode=login')) {
    failures.push(`${route} did not require a verified member session (status=${response.status}, location=${location})`)
  }
}

for (const route of ['/tools/income-calculator', '/tools/notary-route-calculator']) {
  const response = await request(route, { redirect: 'manual' })
  const location = response.headers.get('location')
  if (response.status !== 307 || !location?.startsWith('https://nested-objects.outseta.com/auth?widgetMode=login')) {
    failures.push(`${route} did not require a verified member session (status=${response.status}, location=${location})`)
  }
}

const protectedEndpoints = [
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
  { method: 'GET', route: '/api/client-tracker' },
  { method: 'POST', route: '/api/client-tracker' },
  { method: 'DELETE', route: '/api/client-tracker' },
]

for (const endpoint of protectedEndpoints) {
  const response = await request(endpoint.route, {
    method: endpoint.method,
    headers: endpoint.method === 'GET' ? undefined : { 'Content-Type': 'application/json' },
    body: endpoint.method === 'GET' ? undefined : '{}',
  })
  const payload = await response.json().catch(() => ({}))
  if (response.status !== 401) {
    failures.push(
      `${endpoint.method} ${endpoint.route} did not reject a signed-out request ` +
      `(status=${response.status}, error=${JSON.stringify(payload.error)})`,
    )
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'))
  process.exitCode = 1
} else {
  console.log(`Member tools authentication boundary passed at ${baseUrl.origin}.`)
}

async function request(route, init = {}) {
  return fetch(new URL(route, baseUrl), {
    ...init,
    signal: AbortSignal.timeout(60_000),
  })
}
