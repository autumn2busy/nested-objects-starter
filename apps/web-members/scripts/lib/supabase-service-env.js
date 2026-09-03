'use strict'

function readRequiredValue(environment, name) {
  const value = environment[name]
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function requireSupabaseServiceEnv(environment = process.env) {
  const url =
    readRequiredValue(environment, 'SUPABASE_URL') ||
    readRequiredValue(environment, 'NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = readRequiredValue(environment, 'SUPABASE_SERVICE_ROLE_KEY')
  const missing = []

  if (!url) missing.push('SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)')
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')

  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`)
  }

  return Object.freeze({ url, serviceRoleKey })
}

module.exports = { requireSupabaseServiceEnv }
