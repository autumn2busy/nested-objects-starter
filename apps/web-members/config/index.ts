const PRODUCTION_SITE_URL = 'https://members.nestedobjects.com'
const DEFAULT_DEV_SITE_URL = 'https://nested-objects-starter.vercel.app'

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === 'production'
    ? PRODUCTION_SITE_URL
    : DEFAULT_DEV_SITE_URL)

export const branding = {
  domain: siteUrl,
  theme: 'vendor-hub',
  logo: '/logo.png',
  email: 'support@nestedobjects.com',
} as const

export const integrations = {
  outseta: {
    domain: process.env.NEXT_PUBLIC_OUTSETA_DOMAIN || 'nested-objects.outseta.com',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  activeCampaign: {
    apiUrl: process.env.ACTIVE_CAMPAIGN_API_URL,
    apiKey: process.env.ACTIVE_CAMPAIGN_API_KEY,
  },
  n8n: {
    resumeWebhookUrl: process.env.N8N_AI_RESUME_WEBHOOK_URL,
    conciergeWebhookUrl: process.env.N8N_AI_CONCIERGE_WEBHOOK_URL,
  },
} as const
