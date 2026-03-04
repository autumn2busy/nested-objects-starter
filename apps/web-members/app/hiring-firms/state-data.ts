import { US_STATES } from './constants'

/** Slug-friendly state name: "New York" → "new-york" */
function toSlug(label: string) {
    return label.toLowerCase().replace(/\s+/g, '-')
}

export type StateInfo = {
    code: string
    label: string
    slug: string
}

/** Map of slug → state info for all 50 US states */
export const STATE_MAP: Record<string, StateInfo> = Object.fromEntries(
    US_STATES
        .filter((s) => s.code !== 'ALL')
        .map((s) => [toSlug(s.label), { code: s.code, label: s.label, slug: toSlug(s.label) }])
)

/** Array of all state slugs for generateStaticParams */
export const ALL_STATE_SLUGS = Object.keys(STATE_MAP)

/** Top states for cross-linking (by inspector job volume) */
export const TOP_STATES = [
    'texas', 'florida', 'california', 'new-york', 'georgia',
    'north-carolina', 'ohio', 'pennsylvania', 'illinois', 'virginia',
    'michigan', 'arizona', 'tennessee', 'indiana', 'maryland',
    'colorado', 'missouri', 'south-carolina', 'minnesota', 'washington',
]
