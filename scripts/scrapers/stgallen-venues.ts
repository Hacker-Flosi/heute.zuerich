// scripts/scrapers/stgallen-venues.ts
// Direktes Scraping der wichtigsten St. Gallen Nightlife-Venues
// Ergänzt saiten.ch (Kultur) mit Club/Konzert-Coverage
// Venues: Palace, Grabenhalle, KUGL, OYA Bar

import * as cheerio from 'cheerio'
import type { RawEvent } from '../types'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'de-CH,de;q=0.9',
}
const TIMEOUT_MS = 12_000
const CONCURRENCY = 4

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

// ─── Palace St. Gallen ────────────────────────────────────────────────────────
// palace.sg — onclick-Attribute auf Hauptseite enthalten Datum + Event-ID
// Detail-Fragment: /index/event/xEvent/{id} → Name + Türzeit

async function scrapePalace(date: string): Promise<RawEvent[]> {
  const html = await fetchHtml('https://palace.sg')
  if (!html) {
    console.log('  [stgallen-venues/palace] Fetch fehlgeschlagen')
    return []
  }

  // onclick='javascript: submitRequest( "/index/event/xEvent/2844", "#content", "Event/2026-04-25" )'
  const pattern = /submitRequest\(\s*["']\/index\/event\/xEvent\/(\d+)["'],\s*["'][^"']*["'],\s*["']Event\/(\d{4}-\d{2}-\d{2})["']\s*\)/g
  const matches: Array<{ id: string; eventDate: string }> = []
  let m: RegExpExecArray | null
  while ((m = pattern.exec(html)) !== null) {
    if (m[2] === date && !matches.find(x => x.id === m![1])) {
      matches.push({ id: m[1], eventDate: m[2] })
    }
  }

  if (matches.length === 0) return []

  // Detail-Fragmente parallel laden (max CONCURRENCY)
  const results: RawEvent[] = []
  for (let i = 0; i < matches.length; i += CONCURRENCY) {
    const batch = matches.slice(i, i + CONCURRENCY)
    const fetched = await Promise.all(batch.map(async ({ id }) => {
      const detail = await fetchHtml(`https://palace.sg/index/event/xEvent/${id}`)
      if (!detail) return null

      const $ = cheerio.load(detail)
      const name = $('div.act').first().text().trim()
      if (!name) return null

      // "Tür\u00a020:00" → "20:00"
      const adminText = $('div.admin span').first().text().replace(/\u00a0/g, ' ').trim()
      const timeMatch = adminText.match(/(\d{2}:\d{2})/)
      const time = timeMatch ? timeMatch[1] : '20:00'

      return {
        name,
        rawName: name,
        location: 'Palace',
        date,
        time,
        url: `https://www.palace.sg/index/event/id/${id}`,
        source: 'stgallen-venues' as const,
        locationCity: 'St. Gallen',
      } satisfies RawEvent
    }))
    fetched.forEach(e => { if (e) results.push(e) })
  }

  console.log(`  [stgallen-venues/palace] ${results.length} Events`)
  return results
}

// ─── Grabenhalle ──────────────────────────────────────────────────────────────
// grabenhalle.ch — WordPress Datum-Archiv: grabenhalle.ch/YYYY/MM/DD/
// Struktur: div#listing > .post → h2.posttitle a + div.smallMeta (icon-time)

async function scrapeGrabenhalle(date: string): Promise<RawEvent[]> {
  const [year, month, day] = date.split('-')
  const html = await fetchHtml(`https://grabenhalle.ch/${year}/${month}/${day}/`)
  if (!html) {
    console.log('  [stgallen-venues/grabenhalle] Fetch fehlgeschlagen')
    return []
  }

  const $ = cheerio.load(html)
  const results: RawEvent[] = []

  $('#listing .post').each((_, el) => {
    const name = $(el).find('h2.posttitle a').text().trim()
    const url  = $(el).find('h2.posttitle a').attr('href') ?? ''
    if (!name) return

    // smallMeta: "... icon-time &nbsp;&nbsp; 19:00 &nbsp;&nbsp; icon-group ..."
    const metaText = $(el).find('div.smallMeta').text().replace(/\u00a0/g, ' ')
    const timeMatch = metaText.match(/(\d{1,2}:\d{2})/)
    const time = timeMatch ? timeMatch[1].padStart(5, '0') : '20:00'

    results.push({
      name,
      rawName: name,
      location: 'Grabenhalle',
      date,
      time,
      url,
      source: 'stgallen-venues' as const,
      locationCity: 'St. Gallen',
    } satisfies RawEvent)
  })

  console.log(`  [stgallen-venues/grabenhalle] ${results.length} Events`)
  return results
}

// ─── KUGL ─────────────────────────────────────────────────────────────────────
// kugl.ch/programm/ — Single-Page-Listing
// Struktur: div.event-item → div.event-date (DD.MM.) + div.event-headline + a.event-detail[href] + div.event-subline

async function scrapeKugl(date: string): Promise<RawEvent[]> {
  const html = await fetchHtml('https://kugl.ch/programm/')
  if (!html) {
    console.log('  [stgallen-venues/kugl] Fetch fehlgeschlagen')
    return []
  }

  const [, month, day] = date.split('-').map(Number)
  const $ = cheerio.load(html)
  const results: RawEvent[] = []

  $('.event-item').each((_, el) => {
    const rawDate = $(el).find('.event-date').text().trim() // "25.04."
    const parts = rawDate.replace(/\.$/, '').split('.')
    if (parts.length < 2) return
    if (parseInt(parts[0]) !== day || parseInt(parts[1]) !== month) return

    const name = $(el).find('.event-headline').text().trim()
    const url  = $(el).find('a.event-detail').attr('href') ?? 'https://kugl.ch/programm/'
    if (!name) return

    // Subline: "Pop, Rap / 18+ / Doors: 21:00 / 21:30" oder "23:00–05:00"
    const subline = $(el).find('.event-subline').text()
    const doorsMatch = subline.match(/Doors:\s*(\d{2}:\d{2})/)
    const timeMatch  = subline.match(/(\d{2}:\d{2})/)
    const time = doorsMatch ? doorsMatch[1] : (timeMatch ? timeMatch[1] : '22:00')

    results.push({
      name,
      rawName: name,
      location: 'KUGL',
      date,
      time,
      url,
      source: 'stgallen-venues' as const,
      locationCity: 'St. Gallen',
    } satisfies RawEvent)
  })

  console.log(`  [stgallen-venues/kugl] ${results.length} Events`)
  return results
}

// ─── OYA Bar ──────────────────────────────────────────────────────────────────
// oya-bar.ch/programm/ — Listing mit Datum im Titel ("Samstag 25. April")
// Detail-Seite für Event-Name + Zeit

const DE_MONTHS: Record<string, number> = {
  januar: 1, februar: 2, märz: 3, april: 4, mai: 5, juni: 6,
  juli: 7, august: 8, september: 9, oktober: 10, november: 11, dezember: 12,
}

function parseOyaTitle(text: string, year: number): string | null {
  // "Samstag 25. April" → "2026-04-25"
  const m = text.trim().match(/(\d{1,2})\.\s+(\w+)/i)
  if (!m) return null
  const day = parseInt(m[1])
  const monthNum = DE_MONTHS[m[2].toLowerCase()]
  if (!monthNum) return null
  return `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

async function fetchOyaDetail(url: string): Promise<{ name: string; time: string } | null> {
  const html = await fetchHtml(url)
  if (!html) return null

  const $ = cheerio.load(html)
  const content = $('div.offbeat-event-content')

  // Zweite <strong>-Zeile ist meistens der Event-Name (erste ist das Datum)
  const strongs = content.find('p strong, p b').map((_, el) => $(el).text().trim()).get()
  const name = strongs.find(s => s.length > 3 && !s.match(/^\d/) && !s.toLowerCase().includes('uhr') && !s.toLowerCase().startsWith('vorverkauf') && !s.toLowerCase().startsWith('acts'))
  if (!name) return null

  // Zeit: "19 Uhr" oder "19:00 Uhr" oder "19:30"
  const bodyText = content.text()
  const timeMatch = bodyText.match(/(\d{1,2}):(\d{2})\s*Uhr/) ?? bodyText.match(/(\d{1,2})\s*Uhr/)
  let time = '21:00'
  if (timeMatch) {
    const h = timeMatch[1].padStart(2, '0')
    const min = timeMatch[2] ? timeMatch[2] : '00'
    time = `${h}:${min}`
  }

  return { name, time }
}

async function scrapeOya(date: string): Promise<RawEvent[]> {
  const html = await fetchHtml('https://oya-bar.ch/programm/')
  if (!html) {
    console.log('  [stgallen-venues/oya] Fetch fehlgeschlagen')
    return []
  }

  const year = parseInt(date.split('-')[0])
  const $ = cheerio.load(html)

  const candidates: Array<{ url: string }> = []
  $('.edgtf-el-item').each((_, el) => {
    const titleText = $(el).find('h3.edgtf-el-item-title a').text().trim()
    const href = $(el).find('h3.edgtf-el-item-title a').attr('href') ?? $(el).find('a.edgtf-el-link').attr('href') ?? ''
    const parsed = parseOyaTitle(titleText, year)
    if (parsed === date && href) candidates.push({ url: href })
  })

  if (candidates.length === 0) {
    console.log('  [stgallen-venues/oya] 0 Events')
    return []
  }

  // Detail-Seiten parallel laden
  const results: RawEvent[] = []
  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const batch = candidates.slice(i, i + CONCURRENCY)
    const fetched = await Promise.all(batch.map(async ({ url }) => {
      const detail = await fetchOyaDetail(url)
      if (!detail) return null
      return {
        name:     detail.name,
        rawName:  detail.name,
        location: 'OYA Bar',
        date,
        time:     detail.time,
        url,
        source:   'stgallen-venues' as const,
        locationCity: 'St. Gallen',
      } satisfies RawEvent
    }))
    fetched.forEach(e => { if (e) results.push(e) })
  }

  console.log(`  [stgallen-venues/oya] ${results.length} Events`)
  return results
}

// ─── Flon St. Gallen ──────────────────────────────────────────────────────────
// flon-sg.ch/programm — SSR HTML
// Listing: a[href*="/veranstaltungen/YYYY-MM-DD"] → Text "SA 2.5.2026 Eventname"
// Detail-Seite für Zeit: /veranstaltungen/YYYY-MM-DD

async function scrapeFlon(date: string): Promise<RawEvent[]> {
  const html = await fetchHtml('https://flon-sg.ch/programm')
  if (!html) {
    console.log('  [stgallen-venues/flon] Fetch fehlgeschlagen')
    return []
  }

  const $ = cheerio.load(html)
  const results: RawEvent[] = []

  const seenUrls = new Set<string>()
  $('a[href*="/veranstaltungen/"]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    if (!href.includes(date)) return
    if (seenUrls.has(href)) return
    seenUrls.add(href)

    const text = $(el).clone().find('img').remove().end().text().replace(/\s+/g, ' ').trim()
    // "SA 2.5.2026 Eventname" → strip day + date prefix
    const nameMatch = text.match(/^[A-Z]{2}\s+\d{1,2}\.\d{1,2}\.\d{4}\s+(.+)$/i)
    const name = nameMatch ? nameMatch[1].replace(/\s*\/\/\s*$/, '').trim() : ''
    if (!name) return

    const url = `https://flon-sg.ch${href}`
    results.push({
      name,
      rawName: name,
      location: 'Flon',
      date,
      time: '21:00',
      url,
      source: 'stgallen-venues' as const,
      locationCity: 'St. Gallen',
    } satisfies RawEvent)
  })

  // Fetch detail page for time (one request per matched date)
  if (results.length > 0) {
    const detail = await fetchHtml(`https://flon-sg.ch/veranstaltungen/${date}`)
    if (detail) {
      const $d = cheerio.load(detail)
      const bodyText = $d('body').text()
      const timeMatch = bodyText.match(/(\d{2}:\d{2})\s*(?:Uhr|h\b)/)
        ?? bodyText.match(/Türöffnung[:\s]+(\d{2}:\d{2})/)
        ?? bodyText.match(/Doors?[:\s]+(\d{2}:\d{2})/i)
      if (timeMatch) results.forEach(e => { e.time = timeMatch[1] })
    }
  }

  console.log(`  [stgallen-venues/flon] ${results.length} Events`)
  return results
}

// ─── Talhof St. Gallen ────────────────────────────────────────────────────────
// talhof.sg/veranstaltungen — Grav CMS SSR
// Struktur: div.event → span.date ("Di 28.4.2026") + span.title + p ("Türöffnung: 21:00")

async function scrapeTalhof(date: string): Promise<RawEvent[]> {
  const html = await fetchHtml('https://www.talhof.sg/veranstaltungen')
  if (!html) {
    console.log('  [stgallen-venues/talhof] Fetch fehlgeschlagen')
    return []
  }

  const [year, month, day] = date.split('-').map(Number)
  const $ = cheerio.load(html)
  const results: RawEvent[] = []

  $('div.event').each((_, el) => {
    const dateText = $(el).find('span.date').text().trim()
    // "Di 28.4.2026" or "Fr 1.5.2026"
    const dateMatch = dateText.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
    if (!dateMatch) return
    if (parseInt(dateMatch[1]) !== day || parseInt(dateMatch[2]) !== month || parseInt(dateMatch[3]) !== year) return

    const name = $(el).find('span.title').text().trim()
    if (!name) return

    // "Türöffnung: 21:00" or "Türöffnung: 21:00 / Eintritt: 5"
    const pText = $(el).find('p').first().text()
    const timeMatch = pText.match(/(\d{2}:\d{2})/)
    const time = timeMatch ? timeMatch[1] : '21:00'

    results.push({
      name,
      rawName: name,
      location: 'Talhof',
      date,
      time,
      url: 'https://www.talhof.sg/veranstaltungen',
      source: 'stgallen-venues' as const,
      locationCity: 'St. Gallen',
    } satisfies RawEvent)
  })

  console.log(`  [stgallen-venues/talhof] ${results.length} Events`)
  return results
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function scrapeStGallenVenues(date: string): Promise<RawEvent[]> {
  const [palace, grabenhalle, kugl, oya, flon, talhof] = await Promise.all([
    scrapePalace(date),
    scrapeGrabenhalle(date),
    scrapeKugl(date),
    scrapeOya(date),
    scrapeFlon(date),
    scrapeTalhof(date),
  ])

  const all = [...palace, ...grabenhalle, ...kugl, ...oya, ...flon, ...talhof]
  console.log(`[stgallen-venues] ${all.length} Events total für ${date}`)
  return all
}
