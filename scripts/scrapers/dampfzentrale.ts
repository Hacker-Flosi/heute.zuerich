// scripts/scrapers/dampfzentrale.ts
// Dampfzentrale Bern — Kulturzentrum Bern (WordPress-Site)
// Scrapet die Homepage-Eventliste. URLs zeigen direkt auf dampfzentrale.ch (kein Aggregator).
// HTML-Struktur: div.event-entry → a.overlay-link (href) + .col-xs-4.col-md-3.col-lg-2 (date "18.4.26") + <time> (HH:MM) + h2 (name)

import * as cheerio from 'cheerio'
import type { RawEvent } from '../types'

const BASE_URL = 'https://www.dampfzentrale.ch'
const LIST_URL = 'https://www.dampfzentrale.ch/'

function parseDampfDate(raw: string): string | null {
  // Format: "18.4.26" oder "18.04.26" oder "18.4.2026"
  const m = raw.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/)
  if (!m) return null
  const day   = m[1].padStart(2, '0')
  const month = m[2].padStart(2, '0')
  const year  = m[3].length === 2 ? `20${m[3]}` : m[3]
  return `${year}-${month}-${day}`
}

export async function scrapeDampfzentrale(date: string): Promise<RawEvent[]> {
  let html: string
  try {
    const res = await fetch(LIST_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'de-CH,de;q=0.9',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    html = await res.text()
  } catch (err) {
    console.error(`  [Dampfzentrale] Fehler beim Abrufen: ${err}`)
    return []
  }

  const $ = cheerio.load(html)
  const events: RawEvent[] = []
  const seen = new Set<string>()

  $('.event-entry').each((_, el) => {
    // URL
    const href = $(el).find('a.overlay-link, a.row').first().attr('href') ?? ''
    if (!href.includes('/event/')) return
    if (seen.has(href)) return

    // Datum: div.col-xs-4.col-md-3.col-lg-2 enthält "18.4.26"
    const dateRaw = $(el).find('.col-xs-4.col-md-3.col-lg-2').first().text().trim()
    const parsedDate = parseDampfDate(dateRaw)

    // Mehrtägige Events: check alle Datum-Kandidaten im Container
    // (manche Events haben mehrere Datum-Divs)
    if (!parsedDate || parsedDate !== date) return

    // Name: h2.text-l
    const name = $(el).find('h2.text-l').first().text().trim()
    if (!name) return

    // Subtitle als Teil des Namens wenn vorhanden
    const subtitle = $(el).find('h3.text-m').first().text().trim()
    const fullName = subtitle ? `${name} — ${subtitle}` : name

    // Zeit
    const timeRaw = $(el).find('time').first().text().trim()
    const time = timeRaw.match(/^\d{2}:\d{2}$/) ? timeRaw : '20:00'

    // URL direkt auf dampfzentrale.ch — kein Aggregator
    const url = href.startsWith('http') ? href : `${BASE_URL}${href}`

    seen.add(href)
    events.push({
      name:         fullName,
      rawName:      fullName,
      location:     'Dampfzentrale',
      locationCity: 'Bern',
      date,
      time,
      url,
      source:       'dampfzentrale',
    })
  })

  console.log(`  [Dampfzentrale] ${events.length} Events gefunden für ${date}`)
  return events
}
