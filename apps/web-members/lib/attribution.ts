/**
 * UTM Attribution Capture & Persistence
 *
 * Captures UTM parameters from the URL on landing pages and persists them:
 * - sessionStorage: first-touch attribution (cleared when tab closes)
 * - localStorage: last-touch attribution (persists across sessions)
 *
 * On signup / contact sync, attach these as AC custom fields.
 */

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

type UtmData = Partial<Record<(typeof UTM_PARAMS)[number] | 'landing_page' | 'signup_source', string>>

const SESSION_KEY = 'ac_utm_first_touch'
const LOCAL_KEY = 'ac_utm_last_touch'

/**
 * Call on every page load (in the tracker component).
 * Captures UTM params from the current URL and stores them.
 */
export function captureAttribution(): void {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)
    const utmData: UtmData = {}
    let hasUtm = false

    for (const param of UTM_PARAMS) {
        const value = url.searchParams.get(param)
        if (value) {
            utmData[param] = value
            hasUtm = true
        }
    }

    if (!hasUtm) return

    // Always record landing page
    utmData.landing_page = window.location.pathname

    // First-touch: only set if not already present in this session
    if (!sessionStorage.getItem(SESSION_KEY)) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(utmData))
    }

    // Last-touch: always overwrite
    localStorage.setItem(LOCAL_KEY, JSON.stringify(utmData))
}

/**
 * Returns first-touch UTM data (from this session).
 */
export function getFirstTouchAttribution(): UtmData | null {
    if (typeof window === 'undefined') return null
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
}

/**
 * Returns last-touch UTM data (most recent UTM visit ever).
 */
export function getLastTouchAttribution(): UtmData | null {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : null
}

/**
 * Returns the best available attribution data (first-touch preferred).
 * Adds `signup_source` from the current page path.
 */
export function getAttributionForSignup(): UtmData {
    const firstTouch = getFirstTouchAttribution()
    const lastTouch = getLastTouchAttribution()
    const data = firstTouch || lastTouch || {}

    if (typeof window !== 'undefined') {
        data.signup_source = window.location.pathname
    }

    return data
}

/**
 * Converts UTM data to ActiveCampaign custom field format.
 * Custom fields must be created in AC dashboard first.
 */
export function attributionToACFields(data: UtmData): Record<string, string> {
    const fields: Record<string, string> = {}

    if (data.utm_source) fields['utm_source'] = data.utm_source
    if (data.utm_medium) fields['utm_medium'] = data.utm_medium
    if (data.utm_campaign) fields['utm_campaign'] = data.utm_campaign
    if (data.utm_content) fields['utm_content'] = data.utm_content
    if (data.utm_term) fields['utm_term'] = data.utm_term
    if (data.landing_page) fields['landing_page'] = data.landing_page
    if (data.signup_source) fields['signup_source'] = data.signup_source

    return fields
}
