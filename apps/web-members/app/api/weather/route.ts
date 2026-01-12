import { NextRequest, NextResponse } from 'next/server'

/**
 * Weather API Route
 * Uses Open-Meteo API (free, no API key required)
 * https://open-meteo.com/en/docs
 */

type WeatherParams = {
    latitude: number
    longitude: number
    location?: string
}

type ForecastDay = {
    date: string
    tempMax: number
    tempMin: number
    precipitationSum: number
    windSpeedMax: number
    weatherCode: number
    sunrise: string
    sunset: string
}

type SafetyWarning = {
    type: 'wind' | 'rain' | 'lightning'
    severity: 'low' | 'medium' | 'high'
    message: string
}

type WeatherResponse = {
    location: string
    latitude: number
    longitude: number
    timezone: string
    forecast: ForecastDay[]
    safetyWarnings: SafetyWarning[]
}

function getWeatherDescription(code: number): string {
    // WMO Weather interpretation codes
    const codes: Record<number, string> = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail',
    }
    return codes[code] || 'Unknown'
}

function generateSafetyWarnings(forecast: ForecastDay[]): SafetyWarning[] {
    const warnings: SafetyWarning[] = []

    // Check first 3 days
    const nearTermForecast = forecast.slice(0, 3)

    nearTermForecast.forEach((day, index) => {
        const dayLabel = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : 'Next 2 days'

        // Wind warnings for ladder work
        if (day.windSpeedMax > 25) {
            warnings.push({
                type: 'wind',
                severity: 'high',
                message: `${dayLabel}: High winds (${Math.round(day.windSpeedMax)} mph) - UNSAFE for ladder work and drones`,
            })
        } else if (day.windSpeedMax > 15) {
            warnings.push({
                type: 'wind',
                severity: 'medium',
                message: `${dayLabel}: Moderate winds (${Math.round(day.windSpeedMax)} mph) - Use caution with ladders`,
            })
        }

        // Rain warnings
        if (day.precipitationSum > 0.5) {
            warnings.push({
                type: 'rain',
                severity: day.precipitationSum > 1.0 ? 'high' : 'medium',
                message: `${dayLabel}: Rain expected (${day.precipitationSum.toFixed(1)}" total) - Plan for wet conditions`,
            })
        }

        // Lightning/thunderstorm warnings
        if (day.weatherCode >= 95) {
            warnings.push({
                type: 'lightning',
                severity: 'high',
                message: `${dayLabel}: Thunderstorms predicted - UNSAFE for outdoor work`,
            })
        }
    })

    return warnings
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const lat = searchParams.get('lat')
        const lon = searchParams.get('lon')
        const location = searchParams.get('location') || 'Unknown Location'

        if (!lat || !lon) {
            return NextResponse.json(
                { error: 'Missing latitude or longitude parameters' },
                { status: 400 }
            )
        }

        const latitude = parseFloat(lat)
        const longitude = parseFloat(lon)

        if (isNaN(latitude) || isNaN(longitude)) {
            return NextResponse.json(
                { error: 'Invalid latitude or longitude' },
                { status: 400 }
            )
        }

        // Call Open-Meteo API
        const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast')
        weatherUrl.searchParams.set('latitude', latitude.toString())
        weatherUrl.searchParams.set('longitude', longitude.toString())
        weatherUrl.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode,sunrise,sunset')
        weatherUrl.searchParams.set('temperature_unit', 'fahrenheit')
        weatherUrl.searchParams.set('windspeed_unit', 'mph')
        weatherUrl.searchParams.set('precipitation_unit', 'inch')
        weatherUrl.searchParams.set('timezone', 'auto')
        weatherUrl.searchParams.set('forecast_days', '7')

        const weatherRes = await fetch(weatherUrl.toString())

        if (!weatherRes.ok) {
            throw new Error(`Open-Meteo API returned ${weatherRes.status}`)
        }

        const weatherData = await weatherRes.json()

        // Parse forecast data
        const forecast: ForecastDay[] = weatherData.daily.time.map((date: string, index: number) => ({
            date,
            tempMax: Math.round(weatherData.daily.temperature_2m_max[index]),
            tempMin: Math.round(weatherData.daily.temperature_2m_min[index]),
            precipitationSum: weatherData.daily.precipitation_sum[index],
            windSpeedMax: weatherData.daily.windspeed_10m_max[index],
            weatherCode: weatherData.daily.weathercode[index],
            sunrise: weatherData.daily.sunrise[index],
            sunset: weatherData.daily.sunset[index],
        }))

        // Generate safety warnings
        const safetyWarnings = generateSafetyWarnings(forecast)

        const response: WeatherResponse = {
            location,
            latitude,
            longitude,
            timezone: weatherData.timezone,
            forecast,
            safetyWarnings,
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Weather API error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch weather data' },
            { status: 500 }
        )
    }
}
