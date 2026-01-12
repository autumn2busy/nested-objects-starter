/**
 * Cost Control Utilities
 * Implements caching, rate limiting, and usage tracking
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Plan tier limits
const DAILY_LIMITS = {
    ai_resume: {
        L9nbKV9Z: 3,     // Starter
        zWZD0rQp: 3,     // Directory pass
        rQVqlLm6: 10,    // Pro
        NmdnNO90: 25,    // Elite
        rmk5Xk9g: 100,   // Agency
    },
    concierge: {
        L9nbKV9Z: 0,     // Starter - no access
        zWZD0rQp: 0,     // Directory pass - no access
        rQVqlLm6: 10,    // Pro
        NmdnNO90: 50,    // Elite
        rmk5Xk9g: 200,   // Agency
    },
    routing: {
        L9nbKV9Z: 10,    // Starter
        zWZD0rQp: 10,    // Directory pass
        rQVqlLm6: 50,    // Pro
        NmdnNO90: 200,   // Elite
        rmk5Xk9g: 500,   // Agency
    },
}

type FeatureType = keyof typeof DAILY_LIMITS

/**
 * Check if user has exceeded their daily quota for a feature
 */
export async function checkRateL limit(
    userId: string,
    planUid: string,
    feature: FeatureType
): Promise < { allowed: boolean; remaining: number; limit: number } > {
    const limit = DAILY_LIMITS[feature][planUid as keyof typeof DAILY_LIMITS[typeof feature]] || 0

  if(limit === 0) {
    return { allowed: false, remaining: 0, limit: 0 }
}

const today = new Date().toISOString().split('T')[0]
const column = `${feature}_calls` as const

// Get or create today's usage record
const { data, error } = await supabase
    .from('api_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

if (error && error.code !== 'PGRST116') {
    console.error('Rate limit check error:', error)
    return { allowed: true, remaining: limit, limit } // Fail open
}

const currentCalls = data?.[column] || 0
const remaining = Math.max(0, limit - currentCalls)

return {
    allowed: currentCalls < limit,
    remaining,
    limit,
}
}

/**
 * Increment usage counter for a feature
 */
export async function incrementUsage(
    userId: string,
    feature: FeatureType
): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    const column = `${feature}_calls` as const

    const { error } = await supabase.rpc('increment_api_usage', {
        p_user_id: userId,
        p_date: today,
        p_feature: column,
    })

    if (error) {
        console.error('Failed to increment usage:', error)
    }
}

/**
 * Get cached weather data
 */
export async function getCachedWeather(
    locationKey: string
): Promise<any | null> {
    const { data, error } = await supabase
        .from('weather_cache')
        .select('data')
        .eq('location_key', locationKey)
        .gt('expires_at', new Date().toISOString())
        .single()

    if (error || !data) return null
    return data.data
}

/**
 * Cache weather data with 1-hour TTL
 */
export async function cacheWeather(
    locationKey: string,
    weatherData: any
): Promise<void> {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    const { error } = await supabase
        .from('weather_cache')
        .upsert({
            location_key: locationKey,
            data: weatherData,
            expires_at: expiresAt.toISOString(),
        })

    if (error) {
        console.error('Failed to cache weather:', error)
    }
}

/**
 * Get cached distance between two locations
 */
export async function getCachedDistance(
    fromKey: string,
    toKey: string
): Promise<{ distance_miles: number; duration_mins: number } | null> {
    const { data, error } = await supabase
        .from('distance_cache')
        .select('distance_miles, duration_mins')
        .eq('from_key', fromKey)
        .eq('to_key', toKey)
        .single()

    if (error || !data) return null
    return data
}

/**
 * Cache distance between two locations (infinite TTL)
 */
export async function cacheDistance(
    fromKey: string,
    toKey: string,
    distanceMiles: number,
    durationMins: number
): Promise<void> {
    const { error } = await supabase
        .from('distance_cache')
        .upsert({
            from_key: fromKey,
            to_key: toKey,
            distance_miles: distanceMiles,
            duration_mins: durationMins,
        })

    if (error) {
        console.error('Failed to cache distance:', error)
    }
}

/**
 * Get cached AI resume output
 */
export async function getCachedResumeOutput(
    userId: string,
    profileHash: string
): Promise<any | null> {
    const { data, error } = await supabase
        .from('resume_ai_cache')
        .select('outputs')
        .eq('user_id', userId)
        .eq('profile_hash', profileHash)
        .single()

    if (error || !data) return null
    return data.outputs
}

/**
 * Cache AI resume output (infinite TTL)
 */
export async function cacheResumeOutput(
    userId: string,
    profileHash: string,
    outputs: any
): Promise<void> {
    const { error } = await supabase
        .from('resume_ai_cache')
        .upsert({
            user_id: userId,
            profile_hash: profileHash,
            outputs,
        })

    if (error) {
        console.error('Failed to cache resume output:', error)
    }
}

/**
 * Simple hash function for consistent cache keys
 */
export function hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort())
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(36)
}
