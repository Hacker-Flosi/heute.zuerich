// scripts/scrapers/hellozurich.ts
// hellozurich.ch Scraper für heute.zürich
// Nutzt die interne JSON API: /de/events-api.html?date=YYYY-MM-DD

import type { RawEvent } from '../types'

const BASE_URL = 'https://www.hellozurich.ch'

interface HellozurichEvent {
  headline: string
  place: string
  date: string        // "DD.MM.YYYY"
  startTime: string | null  // "HH:MM:SS"
  link: string        // "/de/events/event.html?id=..."
  website?: string    // organizer website (preferred)
  city?: string
}

interface HellozurichResponse {
  events: HellozurichEvent[]
}

/**
 * Holt Events von hellozurich.ch für ein bestimmtes Datum via JSON API
 * @param date - Datum im Format YYYY-MM-DD
 * @returns Array von normalisierten RawEvents
 */
export async function scrapeHellozurich(date: string): Promise<RawEvent[]> {
  const events: RawEvent[] = []

  try {
    const response = await fetch(`${BASE_URL}/de/events-api.html?date=${date}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; heute-zuerich/1.0)',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`hellozurich API error: ${response.status}`)
      return events
    }

    const data: HellozurichResponse = await response.json()

    for (const event of data.events) {
      if (!event.headline || !event.place) continue

      // Skip events with no start time (exhibitions without specific time)
      // These would show as 00:00 which is misleading
      const time = event.startTime
        ? event.startTime.slice(0, 5)  // "HH:MM:SS" → "HH:MM"
        : '00:00'

      // Prefer organizer website over hellozurich listing
      const url = event.website
        || (event.link.startsWith('http') ? event.link : `${BASE_URL}${event.link}`)

      events.push({
        name: event.headline,
        rawName: event.headline,
        location: event.place,
        date,
        time,
        url,
        source: 'hellozurich',
      })
    }
  } catch (error) {
    console.error('hellozurich scraping error:', error)
  }

  console.log(`[hellozurich] ${events.length} Events gefunden für ${date}`)
  return events
}
