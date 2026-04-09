// src/lib/weather.ts
// Open-Meteo API — fetch today's weather for a city
// Docs: https://open-meteo.com/en/docs

export interface WeatherResult {
  isRainy: boolean       // true if rain/snow expected today
  description: string   // human readable, e.g. "Regen erwartet"
  icon: string          // emoji
}

// City coordinates
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  zuerich:  { lat: 47.3769, lon: 8.5417 },
  stgallen: { lat: 47.4245, lon: 9.3767 },
  luzern:   { lat: 47.0502, lon: 8.3093 },
}

// WMO weather codes that mean "bad weather" (rain, snow, storm)
// https://open-meteo.com/en/docs#weathervariables
const BAD_WEATHER_CODES = new Set([
  51, 53, 55,           // Drizzle
  61, 63, 65,           // Rain
  66, 67,               // Freezing rain
  71, 73, 75, 77,       // Snow
  80, 81, 82,           // Rain showers
  85, 86,               // Snow showers
  95, 96, 99,           // Thunderstorm
])

function describeCode(code: number): { description: string; icon: string } {
  if (code >= 95) return { description: 'Gewitter erwartet', icon: '⛈' }
  if (code >= 71) return { description: 'Schnee erwartet', icon: '🌨' }
  if (code >= 61) return { description: 'Regen erwartet', icon: '🌧' }
  if (code >= 51) return { description: 'Nieselregen erwartet', icon: '🌦' }
  if (code >= 80) return { description: 'Regenschauer erwartet', icon: '🌧' }
  return { description: 'Schlechtes Wetter', icon: '☔' }
}

export async function fetchWeather(city: string): Promise<WeatherResult | null> {
  const coords = CITY_COORDS[city]
  if (!coords) return null

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=weathercode,precipitation_sum&timezone=Europe%2FZurich&forecast_days=1`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null

    const data = await res.json()
    const code: number = data?.daily?.weathercode?.[0] ?? 0
    const precip: number = data?.daily?.precipitation_sum?.[0] ?? 0

    const isRainy = BAD_WEATHER_CODES.has(code) || precip >= 1.0

    if (!isRainy) return { isRainy: false, description: 'Gutes Wetter', icon: '☀️' }

    const { description, icon } = describeCode(code)
    return { isRainy: true, description, icon }
  } catch {
    return null
  }
}
