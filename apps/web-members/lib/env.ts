const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_OUTSETA_DOMAIN',
    'AC_API_URL',
    'AC_API_KEY',
    'AC_CONNECTION_ID',
] as const

export function validateEnv() {
    const missing = requiredEnvs.filter((key) => !process.env[key])

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}. ` +
            `Please check your .env.local file.`
        )
    }
}

// Optional: Validate on import if this file is imported in a critical path
if (process.env.NODE_ENV === 'development') {
    validateEnv()
}

export const env = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    outsetaDomain: process.env.NEXT_PUBLIC_OUTSETA_DOMAIN!,
    acApiUrl: process.env.AC_API_URL!,
    acApiKey: process.env.AC_API_KEY!,
    acConnectionId: process.env.AC_CONNECTION_ID!,
    // AC Tracking (public — goes in browser script)
    acActId: process.env.NEXT_PUBLIC_AC_ACTID,
    // AC Event Tracking (server-side only)
    acEventKey: process.env.AC_EVENT_KEY,
    acEventActId: process.env.AC_EVENT_ACTID,
    // Optional
    newsApiKey: process.env.NEWSAPI_KEY,
}
