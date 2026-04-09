// scripts/scrapers/saiten.ts
// Saiten.ch Kalender-Scraper für St. Gallen
// Schritt 1: Kalender-Seite → .a-calendar-item mit href-Attribut direkt am Element
// Schritt 2: Pro Event-Detailseite → Organizer-URL extrahieren

import * as cheerio from 'cheerio'
import type { RawEvent } from '../types'
import { isAggregatorUrl, lookupVenueUrl } from '../venues'

const BASE = 'https://www.saiten.ch'
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; waslauft-bot/1.0)' }
const TIMEOUT_MS = 10_000
const CONCURRENCY = 5

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

/** Check if a date string like "Do.9.4." or "9.4.—11.4." contains the target YYYY-MM-DD */
function matchesDate(dateText: string, targetDate: string): boolean {
  const [, month, day] = targetDate.split('-').map(Number)
  const matches = [...dateText.matchAll(/(\d{1,2})\.(\d{1,2})\./g)]
  if (matches.length >= 2) {
    const startDay = parseInt(matches[0][1]), startMo = parseInt(matches[0][2])
    const endDay = parseInt(matches[1][1]), endMo = parseInt(matches[1][2])
    if (startMo === month && endMo === month) return day >= startDay && day <= endDay
    if (startMo === month && startDay === day) return true
    if (endMo === month && endDay === day) return true
    return false
  }
  for (const m of matches) {
    if (parseInt(m[1]) === day && parseInt(m[2]) === month) return true
  }
  return false
}

/** Extract organizer URL from a saiten.ch event detail page */
async function resolveOrganizerUrl(saitenUrl: string, location: string): Promise<string> {
  const html = await fetchHtml(saitenUrl)
  if (html) {
    const $ = cheerio.load(html)
    let found: string | null = null

    $('a[href]').each((_, el) => {
      if (found) return
      const href = $(el).attr('href') ?? ''
      const text = $(el).text().trim()
      if (!href.startsWith('http')) return
      if (href.includes('saiten.ch') || href.includes('saiten-kalender.ch')) return
      if (isAggregatorUrl(href)) return
      // Organizer links are shown as plain domain text: "www.venue.ch"
      if (/^www\./i.test(text) || /^https?:\/\//i.test(text)) {
        found = href
      }
    })

    if (found) return found
  }

  // Fallback: venue URL registry
  const venueUrl = lookupVenueUrl(location, 'stgallen')
  if (venueUrl) return venueUrl

  // Last resort: saiten.ch event page
  return saitenUrl
}

export async function scrapeSaiten(date: string): Promise<RawEvent[]> {
  const html = await fetchHtml(`${BASE}/kalender`)
  if (!html) {
    console.warn('[Saiten] Kalender-Seite nicht erreichbar')
    return []
  }

  const $ = cheerio.load(html)
  const seenSlugs = new Set<string>()
  const entries: Array<{ slug: string; name: string; location: string; time: string }> = []

  $('.a-calendar-item').each((_, el) => {
    // href is directly on the element (not a child <a>)
    const href = (el as any).attribs?.href ?? ''
    if (!href.startsWith('kalender/')) return
    const slug = href.replace('kalender/', '').trim()
    if (!slug || seenSlugs.has(slug)) return
    seenSlugs.add(slug)

    const rawDate = $(el).find('.a-calendar-item__date').text().replace(/\s+/g, '').trim()
    if (!matchesDate(rawDate, date)) return

    const name = $(el).find('.a-calendar-item__title').text().trim()
    if (!name) return

    const place = $(el).find('.a-calendar-item__location__place').text().trim()
    const city = $(el).find('.a-calendar-item__location__name').text().trim()
    // Only keep St. Gallen events
    if (!city.toLowerCase().match(/st\.?\s*gallen/)) return

    const rawTime = $(el).find('.a-calendar-item__time').text().trim()
    const timeMatch = rawTime.match(/(\d{2}:\d{2})/)
    const time = timeMatch ? timeMatch[1] : '00:00'

    entries.push({ slug, name, location: place, time })
  })

  console.log(`[Saiten] ${entries.length} Events gefunden für ${date}`)
  if (entries.length === 0) return []

  // Resolve organizer URLs with limited concurrency
  const results: RawEvent[] = []
  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const batch = entries.slice(i, i + CONCURRENCY)
    const resolved = await Promise.all(
      batch.map(async (entry) => {
        const saitenUrl = `${BASE}/${entry.slug.startsWith('kalender/') ? entry.slug : 'kalender/' + entry.slug}`
        const url = await resolveOrganizerUrl(saitenUrl, entry.location)
        return {
          name: entry.name,
          rawName: entry.name,
          location: entry.location,
          date,
          time: entry.time,
          url,
          source: 'saiten' as const,
          locationCity: 'St. Gallen',
        } satisfies RawEvent
      })
    )
    results.push(...resolved)
  }

  console.log(`[Saiten] ${results.length} Events mit URLs aufgelöst`)
  return results
}
