/**
 * SEO-004: Focused tests for hardened monitor cron authentication, publication gate,
 * and GitHub content helper.
 *
 * Uses node:test and vm-based module loading to test the TypeScript modules
 * without a full bundler, consistent with the repository's existing test pattern.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)

// --- Compile modules ---

function compileTs(relativePath) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
}

const monitorAuthCompiled = compileTs('../lib/monitor-auth.ts')
const githubContentCompiled = compileTs('../lib/github-content.ts')

// --- Helpers ---

function loadMonitorAuth(envOverrides = {}) {
  const exports = {}
  const env = { ...envOverrides }
  vm.runInNewContext(monitorAuthCompiled, {
    exports,
    require(name) {
      if (name === 'crypto') return require('node:crypto')
      throw new Error(`Unexpected require: ${name}`)
    },
    process: { env },
    URL,
    Buffer,
  })
  return exports
}

function loadGitHubContent(envOverrides = {}, fetchImpl = async () => new Response('{}', { status: 200 })) {
  const exports = {}
  const env = { ...envOverrides }
  vm.runInNewContext(githubContentCompiled, {
    exports,
    require(name) {
      if (name === 'crypto') return require('node:crypto')
      throw new Error(`Unexpected require: ${name}`)
    },
    process: { env },
    URL,
    Buffer,
    Response,
    fetch: fetchImpl,
    console,
    encodeURIComponent,
    JSON,
  })
  return exports
}

function makeRequest(options = {}) {
  const {
    url = 'https://example.com/api/cron/seo-content-monitor',
    headers = {},
    method = 'GET',
  } = options
  return new Request(url, { method, headers })
}

const VALID_SECRET = 'test-dedicated-cron-secret-value-1234'

// ============================================================
// Monitor Authentication Tests
// ============================================================

test('SEO-004: Monitor authentication', async (t) => {
  await t.test('rejects when dedicated cron secret is not configured', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({})
    const req = makeRequest({ headers: { Authorization: `Bearer ${VALID_SECRET}` } })
    const result = authenticateMonitorRequest(req)
    assert.strictEqual(result.authorized, false)
    assert.match(result.reason, /not configured/i)
  })

  await t.test('rejects wrong bearer token', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({
      SEO_MONITOR_CRON_SECRET: VALID_SECRET,
    })
    const req = makeRequest({ headers: { Authorization: 'Bearer wrong-token' } })
    const result = authenticateMonitorRequest(req)
    assert.strictEqual(result.authorized, false)
    assert.match(result.reason, /invalid bearer token/i)
  })

  await t.test('rejects query-string secret (even if correct)', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({
      SEO_MONITOR_CRON_SECRET: VALID_SECRET,
    })
    const req = makeRequest({
      url: `https://example.com/api/cron/seo-content-monitor?secret=${VALID_SECRET}`,
      headers: { Authorization: `Bearer ${VALID_SECRET}` },
    })
    const result = authenticateMonitorRequest(req)
    assert.strictEqual(result.authorized, false)
    assert.match(result.reason, /query parameters/i)
  })

  await t.test('rejects query-string token parameter', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({
      SEO_MONITOR_CRON_SECRET: VALID_SECRET,
    })
    const req = makeRequest({
      url: `https://example.com/api/cron/seo-content-monitor?token=${VALID_SECRET}`,
      headers: { Authorization: `Bearer ${VALID_SECRET}` },
    })
    const result = authenticateMonitorRequest(req)
    assert.strictEqual(result.authorized, false)
    assert.match(result.reason, /query parameters/i)
  })

  await t.test('rejects spoofed x-vercel-cron header without bearer token', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({
      SEO_MONITOR_CRON_SECRET: VALID_SECRET,
    })
    const req = makeRequest({
      headers: { 'x-vercel-cron': '1' },
    })
    const result = authenticateMonitorRequest(req)
    assert.strictEqual(result.authorized, false)
    assert.match(result.reason, /authorization header is required/i)
  })

  await t.test('rejects development mode without authentication', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({
      NODE_ENV: 'development',
      // No SEO_MONITOR_CRON_SECRET configured
    })
    const req = makeRequest({})
    const result = authenticateMonitorRequest(req)
    assert.strictEqual(result.authorized, false)
  })

  await t.test('rejects development mode with cron secret but without bearer header', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({
      NODE_ENV: 'development',
      SEO_MONITOR_CRON_SECRET: VALID_SECRET,
    })
    const req = makeRequest({})
    const result = authenticateMonitorRequest(req)
    assert.strictEqual(result.authorized, false)
  })

  await t.test('accepts valid bearer token with dedicated secret', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({
      SEO_MONITOR_CRON_SECRET: VALID_SECRET,
    })
    const req = makeRequest({
      headers: { Authorization: `Bearer ${VALID_SECRET}` },
    })
    const result = authenticateMonitorRequest(req)
    assert.strictEqual(result.authorized, true)
  })

  await t.test('rejects missing Authorization header entirely', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({
      SEO_MONITOR_CRON_SECRET: VALID_SECRET,
    })
    const req = makeRequest({ headers: {} })
    const result = authenticateMonitorRequest(req)
    assert.strictEqual(result.authorized, false)
    assert.match(result.reason, /authorization header is required/i)
  })

  await t.test('rejects non-Bearer authorization scheme', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({
      SEO_MONITOR_CRON_SECRET: VALID_SECRET,
    })
    const req = makeRequest({
      headers: { Authorization: `Basic ${VALID_SECRET}` },
    })
    const result = authenticateMonitorRequest(req)
    assert.strictEqual(result.authorized, false)
    assert.match(result.reason, /bearer scheme/i)
  })
})

// ============================================================
// Publication Gate Tests
// ============================================================

test('SEO-004: Publication gate', async (t) => {
  await t.test('dry run is the default when publication gate is not enabled', () => {
    const { checkPublicationGate } = loadMonitorAuth({})
    const result = checkPublicationGate()
    assert.strictEqual(result.publish, false)
    assert.match(result.reason, /not enabled/i)
  })

  await t.test('query commit=1 does not grant publication authority (gate controls publication)', () => {
    // Publication is controlled by MONITOR_PUBLICATION_ENABLED, not by commit=1
    const { checkPublicationGate } = loadMonitorAuth({
      MONITOR_PUBLICATION_ENABLED: 'false',
    })
    const result = checkPublicationGate()
    assert.strictEqual(result.publish, false)
  })

  await t.test('publication gate enabled allows publication', () => {
    const { checkPublicationGate } = loadMonitorAuth({
      MONITOR_PUBLICATION_ENABLED: 'true',
    })
    const result = checkPublicationGate()
    assert.strictEqual(result.publish, true)
  })

  await t.test('publication gate rejects non-true values', () => {
    for (const value of ['1', 'yes', 'TRUE', 'True', '']) {
      const { checkPublicationGate } = loadMonitorAuth({
        MONITOR_PUBLICATION_ENABLED: value,
      })
      const result = checkPublicationGate()
      assert.strictEqual(result.publish, false, `Should reject MONITOR_PUBLICATION_ENABLED='${value}'`)
    }
  })
})

// ============================================================
// GitHub Content Configuration Tests
// ============================================================

test('SEO-004: GitHub content configuration', async (t) => {
  await t.test('rejects missing BLOG_GITHUB_TOKEN (does not accept generic GITHUB_TOKEN)', () => {
    const { getGitHubConfig } = loadGitHubContent({
      GITHUB_TOKEN: 'generic-token',
      BLOG_GITHUB_OWNER: 'test-owner',
      BLOG_GITHUB_REPO: 'test-repo',
      BLOG_GITHUB_BRANCH: 'review-branch',
    })
    const result = getGitHubConfig()
    assert.strictEqual(typeof result, 'string')
    assert.match(result, /BLOG_GITHUB_TOKEN/i)
    assert.match(result, /not accepted/i)
  })

  await t.test('rejects missing BLOG_GITHUB_OWNER', () => {
    const { getGitHubConfig } = loadGitHubContent({
      BLOG_GITHUB_TOKEN: 'test-token',
      BLOG_GITHUB_REPO: 'test-repo',
      BLOG_GITHUB_BRANCH: 'review-branch',
    })
    const result = getGitHubConfig()
    assert.strictEqual(typeof result, 'string')
    assert.match(result, /BLOG_GITHUB_OWNER/i)
  })

  await t.test('rejects missing BLOG_GITHUB_REPO', () => {
    const { getGitHubConfig } = loadGitHubContent({
      BLOG_GITHUB_TOKEN: 'test-token',
      BLOG_GITHUB_OWNER: 'test-owner',
      BLOG_GITHUB_BRANCH: 'review-branch',
    })
    const result = getGitHubConfig()
    assert.strictEqual(typeof result, 'string')
    assert.match(result, /BLOG_GITHUB_REPO/i)
  })

  await t.test('rejects missing BLOG_GITHUB_BRANCH (does not fall back to VERCEL_GIT_COMMIT_REF)', () => {
    const { getGitHubConfig } = loadGitHubContent({
      BLOG_GITHUB_TOKEN: 'test-token',
      BLOG_GITHUB_OWNER: 'test-owner',
      BLOG_GITHUB_REPO: 'test-repo',
      VERCEL_GIT_COMMIT_REF: 'some-vercel-branch',
    })
    const result = getGitHubConfig()
    assert.strictEqual(typeof result, 'string')
    assert.match(result, /BLOG_GITHUB_BRANCH/i)
    assert.match(result, /not permitted/i)
  })

  await t.test('rejects branch "main"', () => {
    const { getGitHubConfig } = loadGitHubContent({
      BLOG_GITHUB_TOKEN: 'test-token',
      BLOG_GITHUB_OWNER: 'test-owner',
      BLOG_GITHUB_REPO: 'test-repo',
      BLOG_GITHUB_BRANCH: 'main',
    })
    const result = getGitHubConfig()
    assert.strictEqual(typeof result, 'string')
    assert.match(result, /protected default branch/i)
  })

  await t.test('rejects branch "master"', () => {
    const { getGitHubConfig } = loadGitHubContent({
      BLOG_GITHUB_TOKEN: 'test-token',
      BLOG_GITHUB_OWNER: 'test-owner',
      BLOG_GITHUB_REPO: 'test-repo',
      BLOG_GITHUB_BRANCH: 'master',
    })
    const result = getGitHubConfig()
    assert.strictEqual(typeof result, 'string')
    assert.match(result, /protected default branch/i)
  })

  await t.test('rejects branch "Main" (case-insensitive)', () => {
    const { getGitHubConfig } = loadGitHubContent({
      BLOG_GITHUB_TOKEN: 'test-token',
      BLOG_GITHUB_OWNER: 'test-owner',
      BLOG_GITHUB_REPO: 'test-repo',
      BLOG_GITHUB_BRANCH: 'Main',
    })
    const result = getGitHubConfig()
    assert.strictEqual(typeof result, 'string')
    assert.match(result, /protected default branch/i)
  })

  await t.test('accepts valid review branch configuration', () => {
    const { getGitHubConfig } = loadGitHubContent({
      BLOG_GITHUB_TOKEN: 'test-token',
      BLOG_GITHUB_OWNER: 'test-owner',
      BLOG_GITHUB_REPO: 'test-repo',
      BLOG_GITHUB_BRANCH: 'content/seo-reports',
    })
    const result = getGitHubConfig()
    assert.strictEqual(typeof result, 'object')
    assert.strictEqual(result.token, 'test-token')
    assert.strictEqual(result.owner, 'test-owner')
    assert.strictEqual(result.repo, 'test-repo')
    assert.strictEqual(result.branch, 'content/seo-reports')
  })
})

// ============================================================
// Report Path Restriction Tests
// ============================================================

test('SEO-004: Report path restrictions', async (t) => {
  await t.test('accepts expected SEO report path', () => {
    const { isAllowedReportPath } = loadGitHubContent({})
    assert.strictEqual(isAllowedReportPath('apps/web-members/content/seo-content-opportunities.json'), true)
  })

  await t.test('accepts expected AEO report path', () => {
    const { isAllowedReportPath } = loadGitHubContent({})
    assert.strictEqual(isAllowedReportPath('apps/web-members/content/ai-aeo-opportunities.json'), true)
  })

  await t.test('accepts expected content briefs report path', () => {
    const { isAllowedReportPath } = loadGitHubContent({})
    assert.strictEqual(isAllowedReportPath('apps/web-members/content/content-briefs.json'), true)
  })

  await t.test('rejects unexpected report path', () => {
    const { isAllowedReportPath } = loadGitHubContent({})
    assert.strictEqual(isAllowedReportPath('apps/web-members/content/malicious-file.json'), false)
    assert.strictEqual(isAllowedReportPath('package.json'), false)
    assert.strictEqual(isAllowedReportPath('.env'), false)
    assert.strictEqual(isAllowedReportPath(''), false)
  })
})

// ============================================================
// commitJsonToGitHub Integration Tests (with mocked fetch)
// ============================================================

const VALID_GITHUB_ENV = {
  BLOG_GITHUB_TOKEN: 'ghp_test_token_1234567890',
  BLOG_GITHUB_OWNER: 'test-owner',
  BLOG_GITHUB_REPO: 'test-repo',
  BLOG_GITHUB_BRANCH: 'content/seo-reports',
}

const VALID_REPORT_PATH = 'apps/web-members/content/seo-content-opportunities.json'

test('SEO-004: commitJsonToGitHub', async (t) => {
  await t.test('rejects missing GitHub configuration', async () => {
    const { commitJsonToGitHub } = loadGitHubContent({})
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })
    assert.strictEqual(result.committed, false)
    assert.match(result.reason, /BLOG_GITHUB_TOKEN/i)
  })

  await t.test('rejects unexpected report path', async () => {
    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV)
    const result = await commitJsonToGitHub({
      path: 'some/unexpected/path.json',
      data: { test: true },
      message: 'test commit',
    })
    assert.strictEqual(result.committed, false)
    assert.match(result.reason, /not an allowed monitor report path/i)
  })

  await t.test('commits successfully with mocked GitHub (new file)', async () => {
    const fetchCalls = []
    const mockFetch = async (url, options) => {
      fetchCalls.push({ url, options })
      if (options.method === 'GET') {
        return new Response('Not Found', { status: 404 })
      }
      if (options.method === 'PUT') {
        return Response.json({
          commit: { html_url: 'https://github.com/test-owner/test-repo/commit/abc123' },
        })
      }
      return new Response('Bad Request', { status: 400 })
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { score: 85 },
      message: 'Update SEO report',
    })
    assert.strictEqual(result.committed, true)
    assert.strictEqual(result.branch, 'content/seo-reports')
    assert.ok(result.commitUrl)
    assert.strictEqual(fetchCalls.length, 2) // GET + PUT
  })

  await t.test('no-ops when report content has not changed', async () => {
    const existingData = { score: 85 }
    const existingContent = JSON.stringify(existingData, null, 2) + '\n'
    const encodedContent = Buffer.from(existingContent).toString('base64')

    const mockFetch = async (url, options) => {
      if (options.method === 'GET') {
        return Response.json({
          sha: 'existing-sha-123',
          content: encodedContent,
        })
      }
      throw new Error('PUT should not be called for unchanged content')
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: existingData,
      message: 'Update SEO report',
    })
    assert.strictEqual(result.committed, false)
    assert.match(result.reason, /no content changes/i)
  })

  await t.test('handles GitHub read failure with redacted output', async () => {
    const mockFetch = async (url, options) => {
      if (options.method === 'GET') {
        return new Response('{"message":"Bad credentials","documentation_url":"https://docs.github.com"}', {
          status: 401,
        })
      }
      throw new Error('Should not reach PUT')
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })
    assert.strictEqual(result.committed, false)
    assert.match(result.reason, /could not read/i)
    // Must not contain raw token
    assert.ok(!result.reason.includes('ghp_test_token_1234567890'))
  })

  await t.test('handles GitHub write failure with redacted output', async () => {
    const mockFetch = async (url, options) => {
      if (options.method === 'GET') {
        return new Response('Not Found', { status: 404 })
      }
      if (options.method === 'PUT') {
        return new Response('{"message":"Bad credentials ghp_leaked_token"}', { status: 401 })
      }
      return new Response('Bad Request', { status: 400 })
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })
    assert.strictEqual(result.committed, false)
    assert.match(result.reason, /could not commit/i)
    // Token patterns must be redacted
    assert.ok(!result.reason.includes('ghp_leaked_token'))
    assert.match(result.reason, /\[REDACTED\]/)
  })

  await t.test('handles GitHub read network error with redacted output', async () => {
    const mockFetch = async () => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:443 with token ghp_secret_value')
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })
    assert.strictEqual(result.committed, false)
    assert.match(result.reason, /github read failed/i)
    assert.ok(!result.reason.includes('ghp_secret_value'))
  })

  await t.test('rejects main branch even with valid token', async () => {
    const { commitJsonToGitHub } = loadGitHubContent({
      ...VALID_GITHUB_ENV,
      BLOG_GITHUB_BRANCH: 'main',
    })
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })
    assert.strictEqual(result.committed, false)
    assert.match(result.reason, /protected default branch/i)
  })

  await t.test('rejects generic GITHUB_TOKEN alone', async () => {
    const { commitJsonToGitHub } = loadGitHubContent({
      GITHUB_TOKEN: 'generic-token',
      BLOG_GITHUB_OWNER: 'test-owner',
      BLOG_GITHUB_REPO: 'test-repo',
      BLOG_GITHUB_BRANCH: 'review-branch',
    })
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })
    assert.strictEqual(result.committed, false)
    assert.match(result.reason, /BLOG_GITHUB_TOKEN/i)
  })
})

// ============================================================
// Authenticated dry run test
// ============================================================

test('SEO-004: Authenticated dry run', async (t) => {
  await t.test('authenticated request with publication gate disabled returns dry run', () => {
    const { authenticateMonitorRequest, checkPublicationGate } = loadMonitorAuth({
      SEO_MONITOR_CRON_SECRET: VALID_SECRET,
    })

    const req = makeRequest({
      headers: { Authorization: `Bearer ${VALID_SECRET}` },
    })

    const auth = authenticateMonitorRequest(req)
    assert.strictEqual(auth.authorized, true)

    const pub = checkPublicationGate()
    assert.strictEqual(pub.publish, false)
  })
})
