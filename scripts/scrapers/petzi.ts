// scripts/scrapers/petzi.ts
// Petzi — Schweizer Netzwerk unabhängiger Konzertstätten
// Gibt alle Schweizer Petzi-Venues zurück — wir filtern auf Bern via Venue-Registry.
// Nur Events von bekannten Berner Venues kommen durch; URL wird direkt aus Registry gesetzt.

import * as cheerio from 'cheerio'
import type { RawEvent } from '../types'
import { lookupVenueUrl } from '../venues'

const PETZI_URL = 'https://petzi.ch/events'

export async function scrapePetzi(date: string): Promise<RawEvent[]> {
  let html: string
  try {
    const res = await fetch(PETZI_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'de-CH,de;q=0.9',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    html = await res.text()
  } catch (err) {
    console.error(`  [Petzi] Fehler beim Abrufen: ${err}`)
    return []
  }

  const $ = cheerio.load(html)
  const events: RawEvent[] = []

  $('a.masonry-grid__item').each((_, el) => {
    const eventDate = $(el).find('time').attr('datetime')
    if (eventDate !== date) return

    const rawName = $(el).find('.tile__title').text().trim()
    const venue   = $(el).find('.tile__place').text().trim()

    if (!rawName || !venue) return

    // Nur bekannte Berner Venues durchlassen — Petzi listet alle Schweizer Venues
    const venueUrl = lookupVenueUrl(venue, 'bern')
    if (!venueUrl) return

    events.push({
      name:         rawName,
      rawName,
      location:     venue,
      locationCity: 'Bern',
      date,
      time:         '20:00', // Petzi zeigt keine Uhrzeiten in der Listenansicht
      url:          venueUrl, // Direkte Venue-URL statt Aggregator
      source:       'petzi',
    })
  })

  console.log(`  [Petzi] ${events.length} Events gefunden für ${date}`)
  return events
}
