'use client'

import { MapPin } from 'lucide-react'

// ─── Static map via OpenStreetMap (free, no API key) ────────────

type StaticMapProps = {
    lat: number
    lng: number
    name: string
    zoom?: number
    className?: string
}

function StaticOSMMap({ lat, lng, name, zoom = 12, className = '' }: StaticMapProps) {
    return (
        <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
            {/* Embedded Leaflet-style map via iframe to OpenStreetMap */}
            <iframe
                title={`Map showing ${name} location`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.05}%2C${lat - 0.03}%2C${lng + 0.05}%2C${lat + 0.03}&layer=mapnik&marker=${lat}%2C${lng}`}
            />
            {/* Link to full map */}
            <a
                href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-600 shadow-sm transition hover:bg-white hover:text-brand"
            >
                View larger map ↗
            </a>
        </div>
    )
}

// ─── Service Area Card (no map, shows coverage info) ────────────

type ServiceAreaCardProps = {
    coverage: string | null
    address: string | null
    name: string
    className?: string
}

function parseRegions(coverage: string | null): string[] {
    if (!coverage) return []
    // Split on commas, slashes, or newlines
    return coverage
        .split(/[,/\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12) // Cap at 12 badges
}

function getCoverageType(coverage: string | null): 'national' | 'regional' | 'unknown' {
    if (!coverage) return 'unknown'
    const lower = coverage.toLowerCase()
    if (
        lower.includes('national') ||
        lower.includes('nationwide') ||
        lower.includes('all 50') ||
        lower.includes('all states') ||
        lower.includes('united states')
    ) {
        return 'national'
    }
    return 'regional'
}

function ServiceAreaCard({ coverage, address, name, className = '' }: ServiceAreaCardProps) {
    const coverageType = getCoverageType(coverage)
    const regions = parseRegions(coverage)

    return (
        <div className={`flex flex-col items-center justify-center p-5 ${className}`}>
            {/* Coverage type indicator */}
            <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${coverageType === 'national'
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : coverageType === 'regional'
                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                        : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200'
                }`}>
                <MapPin className="h-3 w-3" />
                {coverageType === 'national' ? 'National coverage' : coverageType === 'regional' ? 'Regional coverage' : 'Coverage area TBD'}
            </div>

            {/* Region badges */}
            {regions.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                    {regions.map((region) => (
                        <span
                            key={region}
                            className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200/60"
                        >
                            {region}
                        </span>
                    ))}
                </div>
            )}

            {/* Address if available */}
            {address && (
                <a
                    href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="mt-3 text-xs text-slate-500 transition hover:text-brand"
                >
                    📍 {address}
                </a>
            )}

            {!coverage && !address && (
                <p className="mt-1 text-xs text-slate-400">
                    Service area details coming soon
                </p>
            )}
        </div>
    )
}

// ─── Combined component ─────────────────────────────────────────

type FirmServiceAreaProps = {
    name: string
    latitude: number | null
    longitude: number | null
    coverage: string | null
    address: string | null
    className?: string
}

export function FirmServiceArea({
    name,
    latitude,
    longitude,
    coverage,
    address,
    className = '',
}: FirmServiceAreaProps) {
    const hasCoordinates =
        latitude != null &&
        longitude != null &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        !(latitude === 0 && longitude === 0)

    return (
        <div className={`overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-sm ${className}`}>
            <div className="border-b border-border-subtle px-5 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <MapPin className="h-4 w-4 text-brand" /> Service area
                </h3>
            </div>
            <div className="h-56">
                {hasCoordinates ? (
                    <StaticOSMMap
                        lat={latitude!}
                        lng={longitude!}
                        name={name}
                        className="h-full w-full"
                    />
                ) : (
                    <ServiceAreaCard
                        coverage={coverage}
                        address={address}
                        name={name}
                        className="h-full"
                    />
                )}
            </div>
            {address && hasCoordinates && (
                <div className="border-t border-border-subtle px-5 py-3">
                    <p className="text-xs text-slate-500">{address}</p>
                </div>
            )}
        </div>
    )
}
