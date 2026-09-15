type GitHubContentResponse = {
  sha: string
  content: string
}

type GitHubUpdateResponse = {
  commit?: {
    html_url?: string
  }
}

type GitHubRepoResponse = {
  default_branch?: string
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
 * The repository default branch is also verified and rejected dynamically.
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
 * Returns a rejection reason if the branch is a known protected default branch name,
 * or null if the branch passes static checks.
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

  // Determine and reject the configured repository's actual default branch.
  // Fails closed if the check is unavailable or fails.
  const repoUrl = `https://api.github.com/repos/${owner}/${repo}`
  let repoResponse: Response
  try {
    repoResponse = await fetch(repoUrl, {
      method: 'GET',
      headers: githubHeaders(token),
      cache: 'no-store',
    })
  } catch {
    return {
      committed: false,
      branch,
      reason: 'Could not verify repository default branch: network error',
    }
  }

  if (!repoResponse.ok) {
    return {
      committed: false,
      branch,
      reason: `Could not verify repository default branch: HTTP ${repoResponse.status}`,
    }
  }

  let repoInfo: unknown
  try {
    repoInfo = await repoResponse.json()
  } catch {
    return {
      committed: false,
      branch,
      reason: 'Could not verify repository default branch: invalid response',
    }
  }

  if (
    !repoInfo ||
    typeof repoInfo !== 'object' ||
    !('default_branch' in repoInfo) ||
    typeof (repoInfo as { default_branch?: unknown }).default_branch !== 'string'
  ) {
    return {
      committed: false,
      branch,
      reason: 'Could not determine repository default branch.',
    }
  }

  const defaultBranch = (repoInfo as { default_branch: string }).default_branch.trim()
  if (!defaultBranch) {
    return {
      committed: false,
      branch,
      reason: 'Could not determine repository default branch.',
    }
  }

  if (branch.trim().toLowerCase() === defaultBranch.toLowerCase()) {
    return {
      committed: false,
      branch,
      reason: `Branch '${branch}' is the repository default branch (${defaultBranch}) and cannot receive automated monitor commits.`,
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
  } catch {
    return {
      committed: false,
      branch,
      reason: `GitHub read failed for ${path}: network error`,
    }
  }

  let sha: string | undefined
  let currentContent: string | null = null

  if (currentFileResponse.ok) {
    try {
      const currentFile = (await currentFileResponse.json()) as unknown
      if (
        !currentFile ||
        typeof currentFile !== 'object' ||
        typeof (currentFile as { content?: unknown }).content !== 'string'
      ) {
        return {
          committed: false,
          branch,
          reason: `Could not read ${path}: invalid response`,
        }
      }
      const validFile = currentFile as { content: string; sha?: unknown }
      sha = typeof validFile.sha === 'string' ? validFile.sha : undefined
      currentContent = decodeGitHubContent(validFile.content)
    } catch {
      return {
        committed: false,
        branch,
        reason: `Could not read ${path}: invalid response`,
      }
    }
  } else if (currentFileResponse.status !== 404) {
    // Fixed sanitized message: never include raw provider response text or excerpts
    return {
      committed: false,
      branch,
      reason: `Could not read ${path}: HTTP ${currentFileResponse.status}`,
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
  } catch {
    return {
      committed: false,
      branch,
      reason: `GitHub write failed for ${path}: network error`,
    }
  }

  if (!updateResponse.ok) {
    // Fixed sanitized message: never include raw provider response text or excerpts
    return {
      committed: false,
      branch,
      reason: `Could not commit ${path}: HTTP ${updateResponse.status}`,
    }
  }

  let commitUrl: string | null = null
  try {
    const updateResult = (await updateResponse.json()) as unknown
    if (
      updateResult &&
      typeof updateResult === 'object' &&
      'commit' in updateResult &&
      updateResult.commit &&
      typeof updateResult.commit === 'object' &&
      'html_url' in updateResult.commit &&
      typeof (updateResult.commit as { html_url?: unknown }).html_url === 'string'
    ) {
      commitUrl = (updateResult.commit as { html_url: string }).html_url
    }
  } catch {
    // Write succeeded, but response body was unreadable/malformed.
    // Do NOT claim committed: false since the write actually completed.
    commitUrl = null
  }

  return {
    committed: true,
    branch,
    commitUrl,
  }
}
