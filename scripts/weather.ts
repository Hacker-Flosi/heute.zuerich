// scripts/weather.ts
// Prüft Regenwetter für aktive Städte via Open-Meteo API (kein API-Key nötig)

export interface WeatherResult {
  isRain: boolean
  description: string  // z.B. "Regen", "Gewitter"
}

export interface CityWeather {
  zuerich:  WeatherResult
  stgallen: WeatherResult
  luzern:   WeatherResult
}

const CITY_COORDS: Record<keyof CityWeather, { lat: number; lon: number }> = {
  zuerich:  { lat: 47.3769, lon: 8.5417 },
  stgallen: { lat: 47.4245, lon: 9.3767 },
  luzern:   { lat: 47.0505, lon: 8.3048 },
}

// WMO weather codes → Beschreibung (nur Regen-relevante)
function codeToDescription(code: number): string | null {
  if (code >= 51 && code <= 57) return 'Regen'   // Nieselregen / Eisregen
  if (code >= 61 && code <= 67) return 'Regen'   // Regen / Schneeregen
  if (code >= 80 && code <= 82) return 'Regen'   // Regenschauer
  if (code >= 95 && code <= 99) return 'Gewitter'
  return null
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherResult> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode&forecast_days=1&timezone=Europe%2FZurich`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { daily?: { weathercode?: number[] } }
    const code = data?.daily?.weathercode?.[0] ?? 0
    const desc = codeToDescription(code)
    console.log(`[weather] lat=${lat} lon=${lon} → code=${code} → ${desc ?? 'kein Regen'}`)
    return { isRain: desc !== null, description: desc ?? '' }
  } catch (err) {
    console.warn(`[weather] Fehler (lat=${lat}):`, err)
    return { isRain: false, description: '' }
  }
}

export async function fetchCityWeather(): Promise<CityWeather> {
  const [zh, sg, lz] = await Promise.all([
    fetchWeather(CITY_COORDS.zuerich.lat,  CITY_COORDS.zuerich.lon),
    fetchWeather(CITY_COORDS.stgallen.lat, CITY_COORDS.stgallen.lon),
    fetchWeather(CITY_COORDS.luzern.lat,   CITY_COORDS.luzern.lon),
  ])
  return { zuerich: zh, stgallen: sg, luzern: lz }
}
