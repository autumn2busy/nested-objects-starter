/**
 * SEO-004: Comprehensive unit tests for hardened monitor cron authentication,
 * publication gate, default-branch determination, and sanitized GitHub content error handling.
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

const VALID_DEDICATED_SECRET = 'test-dedicated-cron-secret-value-1234'
const VALID_VERCEL_CRON_SECRET = 'test-vercel-cron-secret-value-5678'

// ============================================================
// Monitor Authentication & Vercel CRON_SECRET Compatibility Tests
// ============================================================

test('SEO-004: Monitor authentication & Vercel CRON_SECRET compatibility', async (t) => {
  await t.test('rejects when neither cron secret is configured', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({})
    const req = makeRequest({ headers: { Authorization: `Bearer ${VALID_DEDICATED_SECRET}` } })
    const result = authenticateMonitorRequest(req)
    assert.strictEqual(result.authorized, false)
    assert.match(result.reason, /not configured/i)
  })

  await t.test('accepts dedicated SEO_MONITOR_CRON_SECRET', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({
      SEO_MONITOR_CRON_SECRET: VALID_DEDICATED_SECRET,
    })
    const req = makeRequest({
      headers: { Authorization: `Bearer ${VALID_DEDICATED_SECRET}` },
    })
    const result = authenticateMonitorRequest(req)
    assert.strictEqual(result.authorized, true)
  })

  await t.test('accepts Vercel automatic CRON_SECRET authorization', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({
      CRON_SECRET: VALID_VERCEL_CRON_SECRET,
    })
    const req = makeRequest({
      headers: { Authorization: `Bearer ${VALID_VERCEL_CRON_SECRET}` },
    })
    const result = authenticateMonitorRequest(req)
    assert.strictEqual(result.authorized, true)
  })

  await t.test('accepts either secret when both are configured', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({
      SEO_MONITOR_CRON_SECRET: VALID_DEDICATED_SECRET,
      CRON_SECRET: VALID_VERCEL_CRON_SECRET,
    })

    const req1 = makeRequest({ headers: { Authorization: `Bearer ${VALID_DEDICATED_SECRET}` } })
    assert.strictEqual(authenticateMonitorRequest(req1).authorized, true)

    const req2 = makeRequest({ headers: { Authorization: `Bearer ${VALID_VERCEL_CRON_SECRET}` } })
    assert.strictEqual(authenticateMonitorRequest(req2).authorized, true)
  })

  await t.test('rejects wrong bearer token when both secrets are configured', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({
      SEO_MONITOR_CRON_SECRET: VALID_DEDICATED_SECRET,
      CRON_SECRET: VALID_VERCEL_CRON_SECRET,
    })
    const req = makeRequest({ headers: { Authorization: 'Bearer wrong-secret-token' } })
    const result = authenticateMonitorRequest(req)
    assert.strictEqual(result.authorized, false)
    assert.match(result.reason, /invalid bearer token/i)
  })

  await t.test('rejects query-string secret (even if correct)', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({
      SEO_MONITOR_CRON_SECRET: VALID_DEDICATED_SECRET,
    })
    const req = makeRequest({
      url: `https://example.com/api/cron/seo-content-monitor?secret=${VALID_DEDICATED_SECRET}`,
      headers: { Authorization: `Bearer ${VALID_DEDICATED_SECRET}` },
    })
    const result = authenticateMonitorRequest(req)
    assert.strictEqual(result.authorized, false)
    assert.match(result.reason, /query parameters/i)
  })

  await t.test('rejects query-string token parameter', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({
      CRON_SECRET: VALID_VERCEL_CRON_SECRET,
    })
    const req = makeRequest({
      url: `https://example.com/api/cron/seo-content-monitor?token=${VALID_VERCEL_CRON_SECRET}`,
      headers: { Authorization: `Bearer ${VALID_VERCEL_CRON_SECRET}` },
    })
    const result = authenticateMonitorRequest(req)
    assert.strictEqual(result.authorized, false)
    assert.match(result.reason, /query parameters/i)
  })

  await t.test('rejects spoofed x-vercel-cron header without bearer token', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({
      CRON_SECRET: VALID_VERCEL_CRON_SECRET,
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
    })
    const req = makeRequest({})
    const result = authenticateMonitorRequest(req)
    assert.strictEqual(result.authorized, false)
  })

  await t.test('rejects missing Authorization header entirely', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({
      SEO_MONITOR_CRON_SECRET: VALID_DEDICATED_SECRET,
    })
    const req = makeRequest({ headers: {} })
    const result = authenticateMonitorRequest(req)
    assert.strictEqual(result.authorized, false)
    assert.match(result.reason, /authorization header is required/i)
  })

  await t.test('rejects non-Bearer authorization scheme', () => {
    const { authenticateMonitorRequest } = loadMonitorAuth({
      SEO_MONITOR_CRON_SECRET: VALID_DEDICATED_SECRET,
    })
    const req = makeRequest({
      headers: { Authorization: `Basic ${VALID_DEDICATED_SECRET}` },
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

  await t.test('query commit=1 does not grant publication authority', () => {
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

  await t.test('rejects branch "main" statically', () => {
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

  await t.test('rejects branch "master" statically', () => {
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
// Default Branch Verification & Sanitized Error Tests
// ============================================================

const VALID_GITHUB_ENV = {
  BLOG_GITHUB_TOKEN: 'ghp_test_token_1234567890',
  BLOG_GITHUB_OWNER: 'test-owner',
  BLOG_GITHUB_REPO: 'test-repo',
  BLOG_GITHUB_BRANCH: 'content/seo-reports',
}

const VALID_REPORT_PATH = 'apps/web-members/content/seo-content-opportunities.json'

test('SEO-004: Default branch determination & fail-closed behavior', async (t) => {
  await t.test('rejects when configured branch matches repository default branch (e.g. trunk)', async () => {
    const mockFetch = async (url) => {
      if (url.includes('/repos/test-owner/test-repo')) {
        return Response.json({ default_branch: 'trunk' })
      }
      throw new Error('Should not reach contents')
    }

    const { commitJsonToGitHub } = loadGitHubContent({
      ...VALID_GITHUB_ENV,
      BLOG_GITHUB_BRANCH: 'trunk',
    }, mockFetch)

    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })
    assert.strictEqual(result.committed, false)
    assert.match(result.reason, /repository default branch/i)
    assert.match(result.reason, /trunk/i)
  })

  await t.test('fails closed when default branch check API returns HTTP 401', async () => {
    const mockFetch = async (url) => {
      if (url.includes('/repos/test-owner/test-repo')) {
        return new Response('Unauthorized', { status: 401 })
      }
      throw new Error('Should not reach contents')
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })
    assert.strictEqual(result.committed, false)
    assert.strictEqual(result.reason, 'Could not verify repository default branch: HTTP 401')
  })

  await t.test('fails closed when default branch check API returns HTTP 500', async () => {
    const mockFetch = async (url) => {
      if (url.includes('/repos/test-owner/test-repo')) {
        return new Response('Internal Server Error', { status: 500 })
      }
      throw new Error('Should not reach contents')
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })
    assert.strictEqual(result.committed, false)
    assert.strictEqual(result.reason, 'Could not verify repository default branch: HTTP 500')
  })

  await t.test('fails closed when default branch check throws network error', async () => {
    const mockFetch = async (url) => {
      if (url.includes('/repos/test-owner/test-repo')) {
        throw new Error('ECONNRESET')
      }
      throw new Error('Should not reach contents')
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })
    assert.strictEqual(result.committed, false)
    assert.strictEqual(result.reason, 'Could not verify repository default branch: network error')
  })

  await t.test('fails closed when default_branch is missing from repository response', async () => {
    const mockFetch = async (url) => {
      if (url.includes('/repos/test-owner/test-repo')) {
        return Response.json({ name: 'test-repo' }) // no default_branch
      }
      throw new Error('Should not reach contents')
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })
    assert.strictEqual(result.committed, false)
    assert.match(result.reason, /Could not determine repository default branch/i)
  })

  await t.test('fails closed when repository metadata is JSON null', async () => {
    const mockFetch = async (url) => {
      if (url.includes('/repos/test-owner/test-repo')) {
        return new Response('null', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      throw new Error('Should not reach contents')
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })
    assert.strictEqual(result.committed, false)
    assert.match(result.reason, /Could not determine repository default branch/i)
  })

  await t.test('fails closed when default_branch is a number (e.g. 42)', async () => {
    const mockFetch = async (url) => {
      if (url.includes('/repos/test-owner/test-repo')) {
        return Response.json({ default_branch: 42 })
      }
      throw new Error('Should not reach contents')
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })
    assert.strictEqual(result.committed, false)
    assert.match(result.reason, /Could not determine repository default branch/i)
  })

  await t.test('fails closed when default_branch is whitespace', async () => {
    const mockFetch = async (url) => {
      if (url.includes('/repos/test-owner/test-repo')) {
        return Response.json({ default_branch: '   ' })
      }
      throw new Error('Should not reach contents')
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })
    assert.strictEqual(result.committed, false)
    assert.match(result.reason, /Could not determine repository default branch/i)
  })
})

// ============================================================
// Sanitized Error Handling & PII/Secret Leak Prevention Tests
// ============================================================

test('SEO-004: Sanitized error messages & leak prevention', async (t) => {
  const INVENTED_SECRET = 'ghp_fake_invented_secret_token_123456789'
  const INVENTED_EMAIL = 'member.confidential@example.org'
  const INVENTED_PHONE = '+1 (555) 867-5309'
  const INVENTED_PAYLOAD = JSON.stringify({
    token: INVENTED_SECRET,
    email: INVENTED_EMAIL,
    phone: INVENTED_PHONE,
    member: 'John Doe Sensitive Account',
  })

  await t.test('read error returns fixed message and contains no secrets or contact PII', async () => {
    const mockFetch = async (url) => {
      if (url.includes('/repos/test-owner/test-repo/contents/')) {
        return new Response(INVENTED_PAYLOAD, { status: 403 })
      }
      // Repo check passes with default_branch: 'main'
      return Response.json({ default_branch: 'main' })
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })

    assert.strictEqual(result.committed, false)
    assert.strictEqual(result.reason, `Could not read ${VALID_REPORT_PATH}: HTTP 403`)
    // Assert strictly that neither secret nor contact-like data appears in reason
    assert.strictEqual(result.reason.includes(INVENTED_SECRET), false)
    assert.strictEqual(result.reason.includes(INVENTED_EMAIL), false)
    assert.strictEqual(result.reason.includes(INVENTED_PHONE), false)
    assert.strictEqual(result.reason.includes('John Doe'), false)
  })

  await t.test('commit error returns fixed message and contains no secrets or contact PII', async () => {
    const mockFetch = async (url, options) => {
      if (url.includes('/repos/test-owner/test-repo/contents/')) {
        if (options.method === 'GET') {
          return new Response('Not Found', { status: 404 })
        }
        if (options.method === 'PUT') {
          return new Response(INVENTED_PAYLOAD, { status: 422 })
        }
      }
      return Response.json({ default_branch: 'main' })
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })

    assert.strictEqual(result.committed, false)
    assert.strictEqual(result.reason, `Could not commit ${VALID_REPORT_PATH}: HTTP 422`)
    assert.strictEqual(result.reason.includes(INVENTED_SECRET), false)
    assert.strictEqual(result.reason.includes(INVENTED_EMAIL), false)
    assert.strictEqual(result.reason.includes(INVENTED_PHONE), false)
    assert.strictEqual(result.reason.includes('John Doe'), false)
  })

  await t.test('thrown network error returns fixed message and contains no secrets or contact PII', async () => {
    const mockFetch = async (url) => {
      if (url.includes('/repos/test-owner/test-repo/contents/')) {
        throw new Error(`Connection failed with credentials: ${INVENTED_SECRET} for ${INVENTED_EMAIL}`)
      }
      return Response.json({ default_branch: 'main' })
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })

    assert.strictEqual(result.committed, false)
    assert.strictEqual(result.reason, `GitHub read failed for ${VALID_REPORT_PATH}: network error`)
    assert.strictEqual(result.reason.includes(INVENTED_SECRET), false)
    assert.strictEqual(result.reason.includes(INVENTED_EMAIL), false)
    assert.strictEqual(result.reason.includes(INVENTED_PHONE), false)
  })

  await t.test('thrown write network error returns fixed message without raw details', async () => {
    const mockFetch = async (url, options) => {
      if (url.includes('/repos/test-owner/test-repo/contents/')) {
        if (options.method === 'GET') {
          return new Response('Not Found', { status: 404 })
        }
        if (options.method === 'PUT') {
          throw new Error(`Write failed with credentials: ${INVENTED_SECRET}`)
        }
      }
      return Response.json({ default_branch: 'main' })
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })

    assert.strictEqual(result.committed, false)
    assert.strictEqual(result.reason, `GitHub write failed for ${VALID_REPORT_PATH}: network error`)
    assert.strictEqual(result.reason.includes(INVENTED_SECRET), false)
  })
  await t.test('read error returns fixed sanitized failure when content-read JSON is malformed', async () => {
    const mockFetch = async (url) => {
      if (url.includes('/repos/test-owner/test-repo/contents/')) {
        return new Response('{ this is not valid json', { status: 200 })
      }
      return Response.json({ default_branch: 'main' })
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })

    assert.strictEqual(result.committed, false)
    assert.strictEqual(result.reason, `Could not read ${VALID_REPORT_PATH}: invalid response`)
  })

  await t.test('read error returns fixed sanitized failure when content-read JSON is null or missing content string', async () => {
    const mockFetch = async (url) => {
      if (url.includes('/repos/test-owner/test-repo/contents/')) {
        return Response.json({ no_content: true })
      }
      return Response.json({ default_branch: 'main' })
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { test: true },
      message: 'test commit',
    })

    assert.strictEqual(result.committed, false)
    assert.strictEqual(result.reason, `Could not read ${VALID_REPORT_PATH}: invalid response`)
  })
})

// ============================================================
// Successful commit & unchanged content tests
// ============================================================

test('SEO-004: commitJsonToGitHub success & no-op', async (t) => {
  await t.test('commits successfully when default branch is verified and content is new', async () => {
    const fetchCalls = []
    const mockFetch = async (url, options) => {
      fetchCalls.push({ url, options })
      if (url === 'https://api.github.com/repos/test-owner/test-repo') {
        return Response.json({ default_branch: 'main' })
      }
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
      data: { score: 90 },
      message: 'Update SEO report',
    })
    assert.strictEqual(result.committed, true)
    assert.strictEqual(result.branch, 'content/seo-reports')
    assert.ok(result.commitUrl)
    assert.strictEqual(fetchCalls.length, 3) // Repo check + GET contents + PUT contents
  })

  await t.test('commits successfully when write succeeds even if write response body is unreadable/malformed JSON', async () => {
    const mockFetch = async (url, options) => {
      if (url === 'https://api.github.com/repos/test-owner/test-repo') {
        return Response.json({ default_branch: 'main' })
      }
      if (options.method === 'GET') {
        return new Response('Not Found', { status: 404 })
      }
      if (options.method === 'PUT') {
        // Write succeeded with 201 Created, but body is malformed JSON
        return new Response('{ malformed json body', { status: 201 })
      }
      return new Response('Bad Request', { status: 400 })
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { score: 90 },
      message: 'Update SEO report',
    })

    // Must NOT claim failure since the write completed
    assert.strictEqual(result.committed, true)
    assert.strictEqual(result.branch, 'content/seo-reports')
    assert.strictEqual(result.commitUrl, null)
  })

  await t.test('commits successfully when write succeeds even if write response body is null', async () => {
    const mockFetch = async (url, options) => {
      if (url === 'https://api.github.com/repos/test-owner/test-repo') {
        return Response.json({ default_branch: 'main' })
      }
      if (options.method === 'GET') {
        return new Response('Not Found', { status: 404 })
      }
      if (options.method === 'PUT') {
        return new Response('null', { status: 200, headers: { 'content-type': 'application/json' } })
      }
      return new Response('Bad Request', { status: 400 })
    }

    const { commitJsonToGitHub } = loadGitHubContent(VALID_GITHUB_ENV, mockFetch)
    const result = await commitJsonToGitHub({
      path: VALID_REPORT_PATH,
      data: { score: 90 },
      message: 'Update SEO report',
    })

    assert.strictEqual(result.committed, true)
    assert.strictEqual(result.branch, 'content/seo-reports')
    assert.strictEqual(result.commitUrl, null)
  })

  await t.test('no-ops when report content has not changed', async () => {
    const existingData = { score: 90 }
    const existingContent = JSON.stringify(existingData, null, 2) + '\n'
    const encodedContent = Buffer.from(existingContent).toString('base64')

    const mockFetch = async (url, options) => {
      if (url === 'https://api.github.com/repos/test-owner/test-repo') {
        return Response.json({ default_branch: 'main' })
      }
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
})
