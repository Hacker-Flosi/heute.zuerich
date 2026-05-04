// src/lib/weather.ts
// Open-Meteo API — fetch today's weather for a city
// Docs: https://open-meteo.com/en/docs

export interface WeatherResult {
  isRainy: boolean                          // today (backwards compat)
  isRainyDays: [boolean, boolean, boolean]  // [heute, morgen, übermorgen]
  description: string
  icon: string
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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=weathercode,precipitation_sum&timezone=Europe%2FZurich&forecast_days=3`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null

    const data = await res.json()
    const codes: number[] = data?.daily?.weathercode ?? [0, 0, 0]
    const precips: number[] = data?.daily?.precipitation_sum ?? [0, 0, 0]

    const isRainyDays = [0, 1, 2].map(
      i => BAD_WEATHER_CODES.has(codes[i] ?? 0) || (precips[i] ?? 0) >= 1.0
    ) as [boolean, boolean, boolean]

    const isRainy = isRainyDays[0]
    const { description, icon } = isRainy ? describeCode(codes[0] ?? 0) : { description: 'Gutes Wetter', icon: '☀️' }

    return { isRainy, isRainyDays, description, icon }
  } catch {
    return null
  }
}
