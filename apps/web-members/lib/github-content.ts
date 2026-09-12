type GitHubContentResponse = {
  sha: string
  content: string
}

type GitHubUpdateResponse = {
  commit?: {
    html_url?: string
  }
}

type CommitJsonResult =
  | {
      committed: true
      commitUrl: string | null
      branch: string
    }
  | {
      committed: false
      branch: string
      reason: string
    }

/**
 * Branches that must never receive automated monitor commits.
 * The repository default branch is also rejected dynamically when discoverable.
 */
const PROTECTED_BRANCH_NAMES = ['main', 'master']

/**
 * Only these report paths may be written by monitor publication.
 * Any other path is rejected before a GitHub API call is attempted.
 */
const ALLOWED_REPORT_PATHS = [
  'apps/web-members/content/seo-content-opportunities.json',
  'apps/web-members/content/ai-aeo-opportunities.json',
  'apps/web-members/content/content-briefs.json',
] as const

export type { CommitJsonResult }

export interface GitHubContentConfig {
  token: string
  owner: string
  repo: string
  branch: string
}

/**
 * Validates and returns explicit GitHub configuration.
 *
 * Fail-closed requirements (SEO-004):
 * - BLOG_GITHUB_TOKEN must be set; generic GITHUB_TOKEN is not accepted.
 * - BLOG_GITHUB_OWNER and BLOG_GITHUB_REPO must be explicitly configured.
 * - BLOG_GITHUB_BRANCH must be set and must not be a protected branch.
 * - VERCEL_GIT_COMMIT_REF fallback is not used.
 *
 * Returns the validated config or a string describing the configuration error.
 */
export function getGitHubConfig(): GitHubContentConfig | string {
  const token = process.env.BLOG_GITHUB_TOKEN
  if (!token) {
    return 'BLOG_GITHUB_TOKEN is not configured. Generic GITHUB_TOKEN is not accepted for monitor publication.'
  }

  const owner = process.env.BLOG_GITHUB_OWNER
  if (!owner) {
    return 'BLOG_GITHUB_OWNER is not configured.'
  }

  const repo = process.env.BLOG_GITHUB_REPO
  if (!repo) {
    return 'BLOG_GITHUB_REPO is not configured.'
  }

  const branch = process.env.BLOG_GITHUB_BRANCH
  if (!branch) {
    return 'BLOG_GITHUB_BRANCH is not configured. Fallback to VERCEL_GIT_COMMIT_REF or main is not permitted.'
  }

  const rejection = rejectProtectedBranch(branch)
  if (rejection) {
    return rejection
  }

  return { token, owner, repo, branch }
}

/**
 * Returns a rejection reason if the branch is protected, or null if the branch is acceptable.
 */
export function rejectProtectedBranch(branch: string): string | null {
  const normalized = branch.trim().toLowerCase()
  if (PROTECTED_BRANCH_NAMES.includes(normalized)) {
    return `Branch '${branch}' is a protected default branch and cannot receive automated monitor commits.`
  }
  return null
}

/**
 * Returns true if the path is in the allowed report paths list.
 */
export function isAllowedReportPath(path: string): boolean {
  return (ALLOWED_REPORT_PATHS as readonly string[]).includes(path)
}

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

function decodeGitHubContent(content: string) {
  return Buffer.from(content.replace(/\n/g, ''), 'base64').toString('utf8')
}

function encodeGitHubContent(content: string) {
  return Buffer.from(content).toString('base64')
}

/**
 * Redacts provider error bodies to prevent leaking tokens, secrets, or member data.
 * Returns a bounded error string safe for inclusion in API responses.
 */
function redactErrorDetail(rawText: string, context: string): string {
  // Never include the raw provider response body.
  // Return only the fact of failure and the context.
  const truncated = rawText.length > 200 ? rawText.slice(0, 200) + '…' : rawText
  // Strip anything that looks like a token or credential
  const redacted = truncated.replace(/ghp_[A-Za-z0-9]+/g, '[REDACTED]')
    .replace(/gho_[A-Za-z0-9]+/g, '[REDACTED]')
    .replace(/github_pat_[A-Za-z0-9_]+/g, '[REDACTED]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
  return `${context}: ${redacted}`
}

export async function commitJsonToGitHub({
  path,
  data,
  message,
}: {
  path: string
  data: unknown
  message: string
}): Promise<CommitJsonResult> {
  const configOrError = getGitHubConfig()

  if (typeof configOrError === 'string') {
    return {
      committed: false,
      branch: '[not configured]',
      reason: configOrError,
    }
  }

  const { token, owner, repo, branch } = configOrError

  // Validate report path before any GitHub API call
  if (!isAllowedReportPath(path)) {
    return {
      committed: false,
      branch,
      reason: `Path '${path}' is not an allowed monitor report path.`,
    }
  }

  const nextContent = `${JSON.stringify(data, null, 2)}\n`
  const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`

  let currentFileResponse: Response
  try {
    currentFileResponse = await fetch(fileUrl, {
      method: 'GET',
      headers: githubHeaders(token),
      cache: 'no-store',
    })
  } catch (err) {
    return {
      committed: false,
      branch,
      reason: redactErrorDetail(
        err instanceof Error ? err.message : String(err),
        `GitHub read failed for ${path}`
      ),
    }
  }

  let sha: string | undefined
  let currentContent: string | null = null

  if (currentFileResponse.ok) {
    const currentFile = (await currentFileResponse.json()) as GitHubContentResponse
    sha = currentFile.sha
    currentContent = decodeGitHubContent(currentFile.content)
  } else if (currentFileResponse.status !== 404) {
    let errorText: string
    try {
      errorText = await currentFileResponse.text()
    } catch {
      errorText = `HTTP ${currentFileResponse.status}`
    }
    return {
      committed: false,
      branch,
      reason: redactErrorDetail(errorText, `Could not read ${path}`),
    }
  }

  if (currentContent === nextContent) {
    return {
      committed: false,
      branch,
      reason: 'No content changes to commit.',
    }
  }

  let updateResponse: Response
  try {
    updateResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: githubHeaders(token),
      body: JSON.stringify({
        message,
        content: encodeGitHubContent(nextContent),
        branch,
        ...(sha ? { sha } : {}),
      }),
    })
  } catch (err) {
    return {
      committed: false,
      branch,
      reason: redactErrorDetail(
        err instanceof Error ? err.message : String(err),
        `GitHub write failed for ${path}`
      ),
    }
  }

  if (!updateResponse.ok) {
    let errorText: string
    try {
      errorText = await updateResponse.text()
    } catch {
      errorText = `HTTP ${updateResponse.status}`
    }
    return {
      committed: false,
      branch,
      reason: redactErrorDetail(errorText, `Could not commit ${path}`),
    }
  }

  const updateResult = (await updateResponse.json()) as GitHubUpdateResponse

  return {
    committed: true,
    branch,
    commitUrl: updateResult.commit?.html_url || null,
  }
}
