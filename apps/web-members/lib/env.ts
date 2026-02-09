const requiredEnvs = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_OUTSETA_DOMAIN',
] as const

export function validateEnv() {
  const missing = requiredEnvs.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}.`
    )
  }
}

export function requireEnv(key: string) {
  const value = process.env[key]

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

export function requireEnvInProduction(key: string) {
  if (process.env.NODE_ENV === 'production') {
    return requireEnv(key)
  }

  return process.env[key]
}

validateEnv()

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  outsetaDomain: process.env.NEXT_PUBLIC_OUTSETA_DOMAIN!,
  // Optional
  newsApiKey: process.env.NEWSAPI_KEY,
}
