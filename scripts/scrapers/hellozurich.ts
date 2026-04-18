// scripts/scrapers/hellozurich.ts
// hellozurich.ch Scraper für heute.zürich
// Nutzt die interne JSON API: /de/events-api.html?date=YYYY-MM-DD

import * as cheerio from 'cheerio'
import type { RawEvent } from '../types'

const BASE_URL = 'https://www.hellozurich.ch'

// Domains that are not useful as event links
const SKIP_DOMAINS = [
  'hellozurich.ch', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com',
  'youtube.com', 'google.', 'maps.google', 'apple.com/maps',
]

// Ticket platforms — accepted as fallback if no venue/organizer URL found
const TICKET_DOMAINS = [
  'ticketcorner.ch', 'ticketmaster.', 'starticket.ch',
  'eventfrog.ch', 'eventbrite.', 'reservix.de', 'petzi.ch',
]

interface HellozurichEvent {
  headline: string
  place: string
  date: string        // "DD.MM.YYYY"
  startTime: string | null  // "HH:MM:SS"
  link: string        // "/de/events/event.html?id=..."
  website?: string    // organizer website (preferred)
  city?: string
  [key: string]: unknown  // capture other fields
}

interface HellozurichResponse {
  events: HellozurichEvent[]
}

/**
 * Scrapes the hellozurich event detail page to find the best external URL.
 * Priority: organizer/venue website > ticket platform > null (skip event)
 */
async function fetchOrganizerUrl(detailLink: string): Promise<string | null> {
  const url = detailLink.startsWith('http') ? detailLink : `${BASE_URL}${detailLink}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; heute-zuerich/1.0)' },
    })
    if (!res.ok) return null
    const html = await res.text()
    const $ = cheerio.load(html)

    let organizerUrl: string | null = null
    let ticketUrl: string | null = null

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || ''
      if (!href.startsWith('http')) return
      if (SKIP_DOMAINS.some((d) => href.includes(d))) return

      if (!ticketUrl && TICKET_DOMAINS.some((d) => href.includes(d))) {
        ticketUrl = href
        return
      }
      if (!organizerUrl) {
        organizerUrl = href
      }
    })

    // Prefer real organizer URL, fall back to ticket platform, never hellozurich
    return organizerUrl ?? ticketUrl
  } catch {
    return null
  }
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

    // Build raw list first, then resolve missing organizer URLs in parallel
    const raw: Array<{ event: HellozurichEvent; time: string }> = []

    for (const event of data.events) {
      if (!event.headline || !event.place) continue
      const time = event.startTime
        ? event.startTime.slice(0, 5)  // "HH:MM:SS" → "HH:MM"
        : '00:00'
      raw.push({ event, time })
    }

    // For events without organizer website, scrape detail page (batches of 5)
    const BATCH = 5
    for (let i = 0; i < raw.length; i += BATCH) {
      await Promise.all(
        raw.slice(i, i + BATCH).map(async ({ event }) => {
          if (!event.website) {
            event.website = (await fetchOrganizerUrl(event.link)) ?? undefined
          }
        })
      )
    }

    for (const { event, time } of raw) {
      events.push({
        name: event.headline,
        rawName: event.headline,
        location: event.place,
        date,
        time,
        url: event.website ?? '',  // kein hellozurich-Fallback — lieber leer
        source: 'hellozurich',
      })
    }
  } catch (error) {
    console.error('hellozurich scraping error:', error)
  }

  console.log(`[hellozurich] ${events.length} Events gefunden für ${date}`)
  return events
}
