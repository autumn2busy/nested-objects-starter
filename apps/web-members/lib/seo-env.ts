const LOCAL_DEV_SITE_URL = 'http://localhost:3000'

const requiredSeoEnvKeys = ['NEXT_PUBLIC_SITE_URL'] as const

type SeoEnvKey = (typeof requiredSeoEnvKeys)[number]

function getMissingSeoEnvKeys(): SeoEnvKey[] {
  return requiredSeoEnvKeys.filter((key) => !process.env[key])
}

export function validateSeoEnv() {
  const missing = getMissingSeoEnvKeys()

  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(
      `Missing required SEO environment variables: ${missing.join(', ')}.`
    )
  }
}

export function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (siteUrl) {
    return siteUrl.replace(/\/$/, '')
  }

  if (process.env.NODE_ENV !== 'production') {
    return LOCAL_DEV_SITE_URL
  }

  throw new Error(
    'NEXT_PUBLIC_SITE_URL is required in production for SEO metadata generation.'
  )
}

if (process.env.NODE_ENV === 'production') {
  validateSeoEnv()
}
