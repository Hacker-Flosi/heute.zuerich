// scripts/scrapers/coucou.ts
// Coucou Magazin Kalender-Scraper für Winterthur
// https://www.coucoumagazin.ch/de/kalender.html

import * as cheerio from 'cheerio'
import type { RawEvent, EventType } from '../types'
import { isAggregatorUrl, lookupVenueUrl } from '../venues'

const BASE = 'https://www.coucoumagazin.ch'
const CALENDAR_URL = `${BASE}/de/kalender.html`
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; waslauft-bot/1.0)' }
const TIMEOUT_MS = 12_000
const CONCURRENCY = 4

// Nur Winterthur-Locations behalten (Schloss Kyburg etc. ausschliessen)
const WINTERTHUR_TERMS = ['winterthur']

function isWinterthurLocation(location: string): boolean {
  const loc = location.toLowerCase()
  return WINTERTHUR_TERMS.some((t) => loc.includes(t))
}

// Coucou-Kategorien → EventType
function categoryToEventType(cat: string): EventType {
  switch (cat.toLowerCase()) {
    case 'musik':          return 'konzert'
    case 'theater/tanz':
    case 'literatur':
    case 'film':           return 'kultur'
    case 'ausstellung':
    case 'vernissage':     return 'kunst'
    case 'kinder':
    case 'diverses':
    case 'historisches':   return 'special'
    default:               return 'special'
  }
}

// Parst "18:00 - 19:15 Uhr, CHF 38\nCasinotheater Winterthur"
// Gibt { time, location } zurück
function parseInfoBlock(text: string): { time: string; location: string } {
  const lines = text.split(/\n|<br\s*\/?>/).map((l) => l.trim()).filter(Boolean)
  let time = '00:00'
  let location = ''

  for (const line of lines) {
    const timeMatch = line.match(/^(\d{2}:\d{2})/)
    if (timeMatch) {
      time = timeMatch[1]
    } else if (!location && line.length > 1) {
      location = line
    }
  }
  return { time, location }
}

// Datum aus einem deutschen Datums-String extrahieren: "So 19. Apr" oder "Mo 20. April 2026"
const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mär: 3, mar: 3, apr: 4, mai: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dez: 12,
}

function parseDateHeader(text: string, year: number): string | null {
  const clean = text.toLowerCase().trim()
  const m = clean.match(/(\d{1,2})\.\s*([a-zä]+)/)
  if (!m) return null
  const day = parseInt(m[1])
  const monthKey = m[2].slice(0, 3)
  const month = MONTHS[monthKey]
  if (!month) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) return null
    return res.text()
  } catch {
    return null
  }
}

/** Visit a coucou detail page and extract the organizer/venue URL from the Links section */
async function resolveOrganizerUrl(detailUrl: string, location: string): Promise<string> {
  const html = await fetchHtml(detailUrl)
  if (html) {
    const $ = cheerio.load(html)
    // Links section: <div class="calendarInfoBlock"><h5>Links</h5><p>...<a href="...">
    let found: string | null = null
    $('.calendarInfoBlock').each((_, block) => {
      if (found) return
      const heading = $(block).find('h5').text().trim().toLowerCase()
      if (heading === 'links') {
        $(block).find('a[href]').each((_, a) => {
          if (found) return
          const href = $(a).attr('href') ?? ''
          if (href.startsWith('http') && !href.includes('coucoumagazin.ch') && !isAggregatorUrl(href)) {
            found = href
          }
        })
      }
    })
    if (found) return found
  }
  // Fallback: venue registry
  return lookupVenueUrl(location, 'winterthur') ?? ''
}

export async function scrapeCoucou(date: string): Promise<RawEvent[]> {
  const html = await fetchHtml(CALENDAR_URL)
  if (!html) {
    console.warn('[Coucou] Kalender-Seite nicht erreichbar')
    return []
  }

  const $ = cheerio.load(html)
  const year = parseInt(date.split('-')[0])

  // Structure: div.calendarDayGroup contains:
  //   div.calendarColDate > h1  →  "So 19. Apr"
  //   div.calendarColTiles > article.calendarTile  →  events
  const candidates: Array<{
    name: string
    detailUrl: string
    time: string
    location: string
    category: string
  }> = []

  $('.calendarDayGroup').each((_, group) => {
    const dateText = $(group).find('.calendarColDate h1').first().text().trim()
    const groupDate = parseDateHeader(dateText, year)
    if (groupDate !== date) return

    $(group).find('article.calendarTile').each((_, tile) => {
      const name = $(tile).find('h2 a, h1 a').first().text().trim()
      if (!name) return

      const detailUrl = $(tile).attr('data-webzen-link')
        ?? $(tile).find('h2 a, h1 a').first().attr('href')
        ?? ''
      if (!detailUrl.startsWith('http')) return

      const category = $(tile).find('h4').first().text().trim()

      // Parse "18:00 - 19:15 Uhr, CHF 38<br />Casinotheater Winterthur"
      const infoHtml = $(tile).find('p.calendarTileInfo').html() ?? ''
      const infoText = infoHtml.replace(/<br\s*\/?>/gi, '\n')
      const { time, location } = parseInfoBlock(cheerio.load(infoText).root().text())

      if (!location || !isWinterthurLocation(location)) return

      candidates.push({ name, detailUrl, time, location, category })
    })
  })

  console.log(`[Coucou] ${candidates.length} Winterthur-Events für ${date}`)
  if (candidates.length === 0) return []

  // Resolve organizer URLs with limited concurrency
  const results: RawEvent[] = []
  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const batch = candidates.slice(i, i + CONCURRENCY)
    const resolved = await Promise.all(
      batch.map(async (entry) => {
        const url = await resolveOrganizerUrl(entry.detailUrl, entry.location)
        return {
          name: entry.name,
          rawName: entry.name,
          location: entry.location,
          date,
          time: entry.time,
          url,
          source: 'coucou' as const,
          locationCity: 'Winterthur',
          eventType: categoryToEventType(entry.category),
        } satisfies RawEvent
      })
    )
    results.push(...resolved)
  }

  return results
}
