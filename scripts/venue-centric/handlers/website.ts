// scripts/venue-centric/handlers/website.ts
// Website Handler für das venue-zentrische System
//
// Fetch-Kaskade: normaler fetch → Playwright (JS-Sites) → Fehler
// Parse-Kaskade: Schema.org LD+JSON → Claude API Fallback

import * as cheerio from 'cheerio'
import Anthropic from '@anthropic-ai/sdk'
import { fetchHtmlPlaywright } from '../playwright-fetch'
import type { NormalizedEvent, VenueWithSources, ScrapeSource } from '../types'

const MAX_HTML_CHARS = 40_000  // Limit für Claude-Fallback

// ─── Fetch Helper ─────────────────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string | null> {
  // Mehrere User-Agent Varianten versuchen (einige Sites blocken Node.js)
  const agents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  ]

  for (const agent of agents) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':      agent,
          'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'de-CH,de;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control':   'no-cache',
          'Pragma':          'no-cache',
        },
        redirect: 'follow',
        signal:   AbortSignal.timeout(20_000),
      })
      if (res.ok) return await res.text()
      if (res.status === 404) {
        console.log(`    [website] 404 für ${url}`)
        return null
      }
      // Bei anderen Fehlern nächsten Agent versuchen
    } catch { /* nächsten Agent versuchen */ }
  }

  console.log(`    [website] Fetch fehlgeschlagen für ${url}`)
  return null
}

// ─── Stufe 1: Schema.org LD+JSON ─────────────────────────────────────────────

interface LdEvent {
  '@type': string | string[]
  '@graph'?: LdEvent[]
  name?: string
  startDate?: string
  endDate?: string
  url?: string
  image?: string | { url?: string } | Array<string | { url?: string }>
  description?: string
  offers?: { price?: string | number; url?: string } | Array<{ price?: string | number; url?: string }>
  location?: { name?: string }
}

function extractImageUrl(image: LdEvent['image']): string | undefined {
  if (!image) return undefined
  if (typeof image === 'string') return image
  if (Array.isArray(image)) {
    const first = image[0]
    return typeof first === 'string' ? first : first?.url
  }
  return (image as { url?: string }).url
}

function extractTicketUrl(offers: LdEvent['offers']): string | undefined {
  if (!offers) return undefined
  const arr = Array.isArray(offers) ? offers : [offers]
  return arr[0]?.url ?? undefined
}

function extractPrice(offers: LdEvent['offers']): string | undefined {
  if (!offers) return undefined
  const arr = Array.isArray(offers) ? offers : [offers]
  const p = arr[0]?.price
  return p !== undefined ? String(p) : undefined
}

function parseLdDate(raw: string): { date: string; time?: string } | null {
  if (!raw) return null
  // ISO: "2026-04-25T22:00:00" or "2026-04-25"
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/)
  if (!match) return null
  return { date: match[1], time: match[2] ?? undefined }
}

function extractLdEvents(html: string, targetDate: string): LdJsonResult[] {
  const $ = cheerio.load(html)
  const results: LdJsonResult[] = []

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html() ?? ''
      const data = JSON.parse(raw)

      // Kann ein einzelnes Objekt oder Array sein
      const items: LdEvent[] = Array.isArray(data) ? data : [data]

      for (const item of items) {
        // @graph Pattern
        if (item['@graph']) {
          items.push(...(item['@graph'] as LdEvent[]))
          continue
        }

        const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']]
        if (!types.some((t) => t === 'Event' || t === 'MusicEvent' || t === 'SocialEvent' || t === 'TheaterEvent')) continue

        if (!item.name || !item.startDate) continue

        const parsed = parseLdDate(item.startDate)
        if (!parsed || parsed.date !== targetDate) continue

        results.push({
          title:       item.name,
          date:        parsed.date,
          time:        parsed.time,
          eventUrl:    item.url,
          imageUrl:    extractImageUrl(item.image),
          description: item.description,
          ticketUrl:   extractTicketUrl(item.offers),
          price:       extractPrice(item.offers),
        })
      }
    } catch { /* JSON parse fehler ignorieren */ }
  })

  return results
}

interface LdJsonResult {
  title:        string
  date:         string
  time?:        string
  eventUrl?:    string
  imageUrl?:    string
  description?: string
  ticketUrl?:   string
  price?:       string
}

// ─── Stufe 2: Claude API Fallback ────────────────────────────────────────────

function stripHtml(html: string): string {
  const $ = cheerio.load(html)
  // Navigations, Footer, Scripts, Styles entfernen
  $('nav, footer, header, script, style, svg, iframe, noscript, [role="navigation"]').remove()
  // Nur relevante Text-Elemente
  const text = $('main, article, section, .events, .programm, .program, #content, body')
    .first()
    .text()
    .replace(/\s+/g, ' ')
    .trim()
  return text.slice(0, MAX_HTML_CHARS)
}

interface ClaudeEvent {
  title:        string
  date:         string   // YYYY-MM-DD
  time?:        string   // HH:MM
  eventUrl?:    string
  ticketUrl?:   string
  imageUrl?:    string
  price?:       string
  description?: string
}

async function extractViaClaudeApi(
  html:        string,
  targetDate:  string,
  venueName:   string,
): Promise<ClaudeEvent[]> {
  const anthropic = new Anthropic()
  const stripped  = stripHtml(html)

  if (stripped.length < 50) {
    console.log(`    [website/claude] Zu wenig Text nach Strip — übersprungen`)
    return []
  }

  const prompt = `Du bist ein Scraper für Veranstaltungs-Websites.

Extrahiere alle Events vom ${targetDate} (${venueName}) aus dem folgenden Website-Text.
Gib NUR Events zurück die EXAKT am ${targetDate} stattfinden — keine anderen Daten.

Antworte mit einem JSON-Array (kein Markdown):
[
  {
    "title": "Event-Titel",
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "eventUrl": "https://...",
    "ticketUrl": "https://...",
    "price": "CHF 20"
  }
]

Falls keine Events am ${targetDate} vorhanden: leeres Array [].

Website-Text:
${stripped}`

  try {
    const message = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages:   [{ role: 'user', content: prompt }],
    })

    const text = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return []

    const parsed: ClaudeEvent[] = JSON.parse(match[0])
    return Array.isArray(parsed)
    ? parsed.filter((e) =>
        e.date === targetDate &&
        e.title &&
        e.title.toLowerCase() !== 'unknown' &&
        e.title.toLowerCase() !== 'unbekannt' &&
        !e.title.toLowerCase().startsWith('keine ') &&
        e.title.trim().length > 2
      )
    : []
  } catch (err) {
    console.log(`    [website/claude] API-Fehler: ${err instanceof Error ? err.message : err}`)
    return []
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function handleWebsite(
  venue:  VenueWithSources,
  source: ScrapeSource,
  date:   string,
): Promise<NormalizedEvent[]> {
  const scrapedAt = new Date().toISOString()
  const url       = source.url

  // Fetch-Kaskade: normaler fetch → Playwright
  let html = await fetchHtml(url)
  if (!html) {
    console.log(`    [playwright] ${venue.name}: normaler Fetch fehlgeschlagen — versuche Playwright`)
    html = await fetchHtmlPlaywright(url)
  }
  if (!html) return []

  // Stufe 1: Schema.org LD+JSON
  const ldEvents = extractLdEvents(html, date)
  if (ldEvents.length > 0) {
    console.log(`    [website/ld+json] ${venue.name}: ${ldEvents.length} Events via Schema.org`)
    return ldEvents.map((e): NormalizedEvent => ({
      title:          e.title,
      venueId:        venue._id,
      venueName:      venue.name,
      city:           venue.city,
      startDate:      e.date,
      startTime:      e.time,
      description:    e.description,
      imageUrl:       e.imageUrl,
      ticketUrl:      e.ticketUrl,
      eventUrl:       e.eventUrl ?? url,
      price:          e.price,
      sourceType:     'website',
      sourceUrl:      url,
      sourcePriority: source.priority,
      scrapedAt,
    }))
  }

  // Stufe 2: Claude API Fallback
  console.log(`    [website/claude] ${venue.name}: kein LD+JSON — Claude Fallback`)
  const claudeEvents = await extractViaClaudeApi(html, date, venue.name)
  if (claudeEvents.length > 0) {
    console.log(`    [website/claude] ${venue.name}: ${claudeEvents.length} Events extrahiert`)
  }

  return claudeEvents.map((e): NormalizedEvent => ({
    title:          e.title,
    venueId:        venue._id,
    venueName:      venue.name,
    city:           venue.city,
    startDate:      e.date,
    startTime:      e.time,
    description:    e.description,
    imageUrl:       e.imageUrl,
    ticketUrl:      e.ticketUrl,
    eventUrl:       e.eventUrl ?? url,
    price:          e.price,
    sourceType:     'website',
    sourceUrl:      url,
    sourcePriority: source.priority,
    scrapedAt,
  }))
}
