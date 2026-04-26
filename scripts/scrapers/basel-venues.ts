// scripts/scrapers/basel-venues.ts
// Direktes Scraping der wichtigsten Basel Venues für Nightlife + Kultur
// Venues: Kaserne Basel (Strapi API), Kuppel Basel (HTML), Hirscheneck (HTML), RA Basel (GraphQL)

import * as cheerio from 'cheerio'
import type { RawEvent } from '../types'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'de-CH,de;q=0.9',
}
const TIMEOUT_MS = 12_000

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: 'follow',
    })
    if (!res.ok) return null
    return res.text()
  } catch {
    return null
  }
}

// ─── Kaserne Basel ────────────────────────────────────────────────────────────
// Strapi v4 REST API — api.kaserne-basel.ch/api/plays
// Plays enthalten Datum + Uhrzeit in `starts` (UTC) + Eventname in `title`
// Event-Beziehung ist über öffentliche API nicht abrufbar → URL = /de/events listing

async function scrapeKaserne(date: string): Promise<RawEvent[]> {
  // Build UTC date range for the target Swiss date (CEST = UTC+2)
  // Cover midnight CEST (22:00 UTC prev day) through next midnight CEST (22:00 UTC same day)
  const [year, month, day] = date.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, day - 1, 22, 0, 0))
  const end   = new Date(Date.UTC(year, month - 1, day,     22, 0, 0))

  const params = new URLSearchParams({
    'filters[starts][$gte]': start.toISOString(),
    'filters[starts][$lt]':  end.toISOString(),
    'sort': 'starts:asc',
    'pagination[pageSize]': '50',
  })

  let data: { data: { id: number; attributes: Record<string, unknown> }[]; meta: unknown }
  try {
    const res = await fetch(`https://api.kaserne-basel.ch/api/plays?${params}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) {
      console.log(`  [basel-venues/kaserne] HTTP ${res.status}`)
      return []
    }
    data = await res.json() as typeof data
  } catch {
    console.log(`  [basel-venues/kaserne] Fetch fehlgeschlagen`)
    return []
  }

  const plays = data.data ?? []
  const results: RawEvent[] = []

  for (const play of plays) {
    const a = play.attributes
    const rawTitle = String(a.title ?? '')
    // Strip date suffix like "-26.4.2026" or "-26.04.2026"
    const name = rawTitle.replace(/-\d{1,2}\.\d{1,2}\.\d{4}$/, '').trim()
    if (!name) continue

    const startsStr = String(a.starts ?? a.startsUtc ?? '')
    if (!startsStr) continue

    // Convert UTC time to Swiss time (CET/CEST)
    const startsDate = new Date(startsStr)
    // Get Swiss local date to verify it matches target date
    const swissDateStr = startsDate.toLocaleDateString('de-CH', {
      timeZone: 'Europe/Zurich',
      year: 'numeric', month: '2-digit', day: '2-digit',
    })
    // Format: "26.04.2026" → need "2026-04-26"
    const [swissDay, swissMonth, swissYear] = swissDateStr.split('.')
    const swissIsoDate = `${swissYear}-${swissMonth}-${swissDay}`
    if (swissIsoDate !== date) continue

    // Extract time in Swiss timezone
    const timeStr = startsDate.toLocaleTimeString('de-CH', {
      timeZone: 'Europe/Zurich',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })

    // Doors time fallback
    const doorsStr = String(a.doors ?? '')
    let time = timeStr
    if (doorsStr) {
      const doorsDate = new Date(doorsStr)
      const doorsTime = doorsDate.toLocaleTimeString('de-CH', {
        timeZone: 'Europe/Zurich',
        hour: '2-digit', minute: '2-digit', hour12: false,
      })
      // Prefer doors time if it looks like an evening event
      const doorsH = parseInt(doorsTime.split(':')[0])
      if (doorsH >= 16 && doorsH <= 22) time = doorsTime
    }

    results.push({
      name,
      rawName: rawTitle,
      location: 'Kaserne Basel',
      date,
      time,
      url: 'https://kaserne-basel.ch/de/events',
      source: 'basel-venues' as const,
      locationCity: 'Basel',
    } satisfies RawEvent)
  }

  console.log(`  [basel-venues/kaserne] ${results.length} Events`)
  return results
}

// ─── Kuppel Basel ─────────────────────────────────────────────────────────────
// kuppel-basel.ch/programm — SSR HTML-Listing
// Struktur: div.month[id="l-YYYY-MM"] → ul.flexbox → li.event → a[href] + section.info-block
// Datum in p.xl: "Sa, 04.04.2026" | Zeit in zweitem p.xl | Name in h1

async function scrapeKuppel(date: string): Promise<RawEvent[]> {
  const html = await fetchHtml('https://kuppel-basel.ch/programm')
  if (!html) {
    console.log(`  [basel-venues/kuppel] Fetch fehlgeschlagen`)
    return []
  }

  const [year, month, day] = date.split('-').map(Number)
  const $ = cheerio.load(html)
  const results: RawEvent[] = []

  // Target date as DD.MM.YYYY for string matching
  const targetDate = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`

  // Find the relevant month section
  const monthId = `l-${year}-${String(month).padStart(2, '0')}`
  const monthSection = $(`#${monthId}`)
  if (!monthSection.length) {
    console.log(`  [basel-venues/kuppel] 0 Events (kein Monats-Abschnitt für ${monthId})`)
    return []
  }

  monthSection.find('li.event').each((_, el) => {
    const $el = $(el)
    const link = $el.find('a').first()
    const url = link.attr('href') ?? 'https://kuppel-basel.ch/programm'

    const xlTexts = link.find('p.xl').map((_, p) => $(p).text().replace(/\u00a0/g, ' ').trim()).get()
    // xlTexts[0]: "Sa,  04.04.2026", xlTexts[1]: "22:00", xlTexts[2]: "Kuppel"
    if (xlTexts.length < 2) return

    // Check if this event is on the target date
    const dateText = xlTexts[0]
    if (!dateText.includes(targetDate)) return

    const time = xlTexts[1].match(/\d{2}:\d{2}/) ? xlTexts[1] : '20:00'
    // h1 may contain nested .notice div — extract only direct text nodes
    const h1 = link.find('h1').first()
    const name = h1.clone().children().remove().end().text().replace(/\s+/g, ' ').trim()
    if (!name) return

    results.push({
      name,
      rawName: name,
      location: 'Kuppel',
      date,
      time,
      url,
      source: 'basel-venues' as const,
      locationCity: 'Basel',
    } satisfies RawEvent)
  })

  console.log(`  [basel-venues/kuppel] ${results.length} Events`)
  return results
}

// ─── Hirscheneck ──────────────────────────────────────────────────────────────
// hirscheneck.ch/veranstaltungen — Webflow SSR
// Struktur: section[id="DD.MM.YYYY"] → .text-block-3.black (Name) + .text-block-2-zeit-preis (Zeit)

async function scrapeHirscheneck(date: string): Promise<RawEvent[]> {
  const html = await fetchHtml('https://hirscheneck.ch/veranstaltungen')
  if (!html) {
    console.log(`  [basel-venues/hirscheneck] Fetch fehlgeschlagen`)
    return []
  }

  const [year, month, day] = date.split('-').map(Number)
  const targetId = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`

  const $ = cheerio.load(html)
  const results: RawEvent[] = []

  $(`section[id="${targetId}"]`).each((_, el) => {
    const $el = $(el)

    // Name: may contain <br> tags — take first line or full text
    const nameRaw = $el.find('.text-block-3.black').first().text().replace(/\s+/g, ' ').trim()
    const name = nameRaw.split(/\n|  /)[0].trim()
    if (!name) return

    // Time: "Doors 20:00 15/20/25CHF" or "20:00 Uhr" or "20h"
    const zeitText = $el.find('.text-block-2-zeit-preis.veranstaltung').first().text().trim()
    const timeMatch = zeitText.match(/(\d{1,2}):(\d{2})/) ?? zeitText.match(/(\d{1,2})h\b/)
    let time = '20:00'
    if (timeMatch) {
      const h = timeMatch[1].padStart(2, '0')
      const min = timeMatch[2] ?? '00'
      time = `${h}:${min}`
    }

    const url = `https://hirscheneck.ch/veranstaltungen#${targetId}`

    results.push({
      name,
      rawName: nameRaw,
      location: 'Hirscheneck',
      date,
      time,
      url,
      source: 'basel-venues' as const,
      locationCity: 'Basel',
    } satisfies RawEvent)
  })

  console.log(`  [basel-venues/hirscheneck] ${results.length} Events`)
  return results
}

// ─── Denkmal.org Basel ────────────────────────────────────────────────────────
// denkmal.org/de/basel/{date} — Nuxt SSR, vollständiges Event-HTML im Body
// Struktur: li.DayEvents-list-item → a.Event[href] + span.text-overflow-ellipsis (Venue)
//           + time[datetime] (ISO-Zeit) + div.Event-description (Titel)

async function scrapeDenkmal(date: string): Promise<RawEvent[]> {
  const html = await fetchHtml(`https://denkmal.org/de/basel/${date}`)
  if (!html) {
    console.log(`  [basel-venues/denkmal] Fetch fehlgeschlagen`)
    return []
  }

  const $ = cheerio.load(html)
  const results: RawEvent[] = []

  $('li.DayEvents-list-item').each((_, el) => {
    const link = $(el).find('a.Event').first()
    const href = link.attr('href')
    if (!href) return

    const url = `https://denkmal.org${href}`

    // ISO time from datetime attribute: "2026-04-26T17:00:00+02:00"
    const datetime = link.find('time').first().attr('datetime') ?? ''
    const timeMatch = datetime.match(/T(\d{2}:\d{2})/)
    const time = timeMatch ? timeMatch[1] : '22:00'

    const venue = link.find('span.text-overflow-ellipsis').first().text().trim()

    // Title is the first text node of Event-description (before the Genres span)
    const descEl = link.find('div.Event-description').first()
    const titleRaw = descEl.clone().children().remove().end().text().replace(/\s+/g, ' ').trim()
    // Strip trailing period added by denkmal
    const name = titleRaw.replace(/\.$/, '').trim()
    if (!name) return

    results.push({
      name,
      rawName: name,
      location: venue || 'Basel',
      date,
      time,
      url,
      source: 'basel-venues' as const,
      locationCity: 'Basel',
    } satisfies RawEvent)
  })

  console.log(`  [basel-venues/denkmal] ${results.length} Events`)
  return results
}

// ─── Resident Advisor Basel ───────────────────────────────────────────────────
// ra.co/events/ch/basel — GraphQL API, Area ID 391
// Liefert Club/Electronic-Events, primär Wochenenden

const RA_GRAPHQL = 'https://ra.co/graphql'
const BASEL_AREA_ID = 391

const RA_QUERY = `
  query GET_EVENT_LISTINGS($filters: FilterInputDtoInput, $pageSize: Int, $page: Int) {
    eventListings(
      filters: $filters
      pageSize: $pageSize
      page: $page
      sort: { listingDate: { priority: 1, order: ASCENDING } }
    ) {
      data {
        id
        listingDate
        event {
          id
          title
          startTime
          contentUrl
          venue { id name address }
        }
      }
      totalResults
    }
  }
`

async function scrapeRABasel(date: string): Promise<RawEvent[]> {
  const events: RawEvent[] = []
  let page = 1
  let totalFetched = 0
  let totalResults = Infinity

  while (totalFetched < totalResults) {
    let res: Response
    try {
      res = await fetch(RA_GRAPHQL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; waslauft.in/1.0)',
          'Referer': 'https://ra.co',
          'Origin': 'https://ra.co',
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        body: JSON.stringify({
          operationName: 'GET_EVENT_LISTINGS',
          variables: {
            filters: {
              areas: { eq: BASEL_AREA_ID },
              listingDate: { gte: date, lte: date },
            },
            pageSize: 50,
            page,
          },
          query: RA_QUERY,
        }),
      })
    } catch {
      console.log(`  [basel-venues/ra] Fetch fehlgeschlagen`)
      break
    }

    if (!res.ok) {
      console.log(`  [basel-venues/ra] HTTP ${res.status}`)
      break
    }

    const data = await res.json()
    if (data.errors) break

    const listings = data.data?.eventListings
    if (!listings) break

    totalResults = listings.totalResults ?? 0

    for (const listing of listings.data ?? []) {
      const event = listing.event
      if (!event?.title) continue

      // startTime is local datetime "2026-04-11T23:00:00.000" — treat as Swiss local time
      const startTime = event.startTime ?? listing.listingDate
      const [datePart, timePart] = startTime.split('T')
      if (datePart !== date) continue
      const time = timePart ? timePart.slice(0, 5) : '22:00'

      const venueName = event.venue?.name ?? 'Basel'
      const raUrl = event.contentUrl ? `https://ra.co${event.contentUrl}` : 'https://ra.co/events/ch/basel'

      events.push({
        name: event.title,
        rawName: event.title,
        location: venueName,
        date,
        time,
        url: raUrl,
        source: 'basel-venues' as const,
        eventType: 'dj_club',
        locationCity: 'Basel',
      } satisfies RawEvent)
    }

    totalFetched += listings.data?.length ?? 0
    if ((listings.data?.length ?? 0) < 50) break
    page++
  }

  console.log(`  [basel-venues/ra] ${events.length} Events`)
  return events
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function scrapeBaselVenues(date: string): Promise<RawEvent[]> {
  const [kaserne, kuppel, hirscheneck, ra, denkmal] = await Promise.all([
    scrapeKaserne(date),
    scrapeKuppel(date),
    scrapeHirscheneck(date),
    scrapeRABasel(date),
    scrapeDenkmal(date),
  ])

  const all = [...kaserne, ...kuppel, ...hirscheneck, ...ra, ...denkmal]
  console.log(`[basel-venues] ${all.length} Events total für ${date}`)
  return all
}
