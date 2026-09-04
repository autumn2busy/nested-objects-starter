import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { canAccessMemberTool, MEMBER_TOOL_IDS } from '@/lib/member-tool-access'

// Cache settings: 30 minutes
export const revalidate = 1800

async function geocode(location: string) {
    try {
        const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
        )
        const data = await res.json()
        if (!data.results?.[0]) return null
        return { lat: data.results[0].latitude, lon: data.results[0].longitude, name: data.results[0].name }
    } catch (e) {
        return null
    }
}

export async function GET(req: Request) {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    if (!canAccessMemberTool(user['outseta:planUid'], MEMBER_TOOL_IDS.WEATHER)) {
        return NextResponse.json({ error: 'Weather is available with Pro, Elite, and Agency.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim().slice(0, 120)
    let lat = parseFloat(searchParams.get('lat') || '0')
    let lon = parseFloat(searchParams.get('lon') || '0')
    let locationName = searchParams.get('name') || ''

    if (q) {
        const coords = await geocode(q)
        if (!coords) {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 })
        }
        lat = coords.lat
        lon = coords.lon
        locationName = coords.name
    } else if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) {
        return NextResponse.json({ error: 'Enter a city, state, or postal code.' }, { status: 400 })
    }

    // Round to 2 decimal places (approx 1.1km precision) for cache hits
    const rLat = Math.round(lat * 100) / 100
    const rLon = Math.round(lon * 100) / 100

    try {
        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${rLat}&longitude=${rLon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`,
            { next: { revalidate: 1800 } }
        )

        if (!weatherRes.ok) throw new Error('Weather API failed')

        const data = await weatherRes.json()

        return NextResponse.json({
            location: { name: locationName, lat: rLat, lon: rLon },
            current: data.current,
            daily: data.daily,
            cached: true
        })
    } catch (error) {
        console.error('Weather API Error:', error)
        return NextResponse.json({ error: 'Weather service unavailable' }, { status: 502 })
    }
}
