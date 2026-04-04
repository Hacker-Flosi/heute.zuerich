// scripts/scrapers/saiten.ts
// saiten.ch Scraper für St. Gallen
// Nutzt die JSON REST API: /api/calendar-list.json

import type { RawEvent } from '../types'

const BASE_URL = 'https://www.saiten.ch'
const PAGE_SIZE = 100

// Only include events in the St. Gallen region
const SG_CITIES = ['st. gallen', 'st gallen', 'saint-gallen', 'gossau', 'rorschach', 'arbon', 'romanshorn']

interface SaitenItem {
  title: string
  date: string        // "Sa. 4.4." or "Sa. 4. Apr."
  time: string        // "19:00–22:00" or "19:00"
  location: {
    place: string     // venue name
    city: string      // city name
  }
  url: string         // relative, e.g. "kalender/event-slug"
  category?: string
}

interface SaitenResponse {
  items: SaitenItem[]
  totalCount: number
  totalPages: number
}

function parseTime(raw: string | null | undefined): string {
  if (!raw) return '00:00'
  // "19:00–22:00" or "19:00 – 22:00" → take start time
  const clean = raw.split(/[–\-]/)[0].trim()
  // Validate HH:MM
  if (/^\d{1,2}:\d{2}$/.test(clean)) {
    const [h, m] = clean.split(':')
    return `${h.padStart(2, '0')}:${m}`
  }
  return '00:00'
}

function isInStGallen(item: SaitenItem): boolean {
  const city = item.location?.city?.toLowerCase() ?? ''
  return SG_CITIES.some((c) => city.includes(c))
}

export async function scrapeSaiten(date: string): Promise<RawEvent[]> {
  const events: RawEvent[] = []
  let offset = 0

  while (true) {
    const url = `${BASE_URL}/api/calendar-list.json?from=${date}&to=${date}&limit=${PAGE_SIZE}&offset=${offset}`

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; waslauft.in/1.0)',
      },
    })

    if (!res.ok) {
      console.error(`[saiten] API error: ${res.status}`)
      break
    }

    const data: SaitenResponse = await res.json()
    if (!data.items?.length) break

    for (const item of data.items) {
      if (!item.title || !item.location?.place) continue
      if (!isInStGallen(item)) continue

      const eventUrl = item.url
        ? (item.url.startsWith('http') ? item.url : `${BASE_URL}/${item.url}`)
        : BASE_URL

      events.push({
        name: item.title,
        rawName: item.title,
        location: item.location.place,
        date,
        time: parseTime(item.time),
        url: eventUrl,
        source: 'saiten',
      })
    }

    if (offset + PAGE_SIZE >= data.totalCount) break
    offset += PAGE_SIZE
  }

  console.log(`[saiten] ${events.length} Events gefunden für ${date}`)
  return events
}
