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

function getGitHubConfig() {
  const token = process.env.BLOG_GITHUB_TOKEN || process.env.GITHUB_TOKEN
  const owner = process.env.BLOG_GITHUB_OWNER || 'autumn2busy'
  const repo = process.env.BLOG_GITHUB_REPO || 'nested-objects-starter'
  const branch = process.env.BLOG_GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || 'main'

  return { token, owner, repo, branch }
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
  const { token, owner, repo, branch } = getGitHubConfig()

  if (!token) {
    return {
      committed: false,
      branch,
      reason: 'GitHub token not configured. Set BLOG_GITHUB_TOKEN or GITHUB_TOKEN.',
    }
  }

  const nextContent = `${JSON.stringify(data, null, 2)}\n`
  const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`

  const currentFileResponse = await fetch(fileUrl, {
    method: 'GET',
    headers: githubHeaders(token),
    cache: 'no-store',
  })

  let sha: string | undefined
  let currentContent: string | null = null

  if (currentFileResponse.ok) {
    const currentFile = (await currentFileResponse.json()) as GitHubContentResponse
    sha = currentFile.sha
    currentContent = decodeGitHubContent(currentFile.content)
  } else if (currentFileResponse.status !== 404) {
    const errorText = await currentFileResponse.text()
    return {
      committed: false,
      branch,
      reason: `Could not read ${path}: ${errorText}`,
    }
  }

  if (currentContent === nextContent) {
    return {
      committed: false,
      branch,
      reason: 'No content changes to commit.',
    }
  }

  const updateResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: githubHeaders(token),
    body: JSON.stringify({
      message,
      content: encodeGitHubContent(nextContent),
      branch,
      ...(sha ? { sha } : {}),
    }),
  })

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text()
    return {
      committed: false,
      branch,
      reason: `Could not commit ${path}: ${errorText}`,
    }
  }

  const updateResult = (await updateResponse.json()) as GitHubUpdateResponse

  return {
    committed: true,
    branch,
    commitUrl: updateResult.commit?.html_url || null,
  }
}

