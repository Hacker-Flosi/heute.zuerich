// scripts/scrapers/gangus.ts
// gangus.ch Scraper für Luzern (Zentralschweiz)
// Drupal JSON:API: null41.nodehive.app/jsonapi/node/event

import type { RawEvent } from '../types'

const API_BASE = 'https://null41.nodehive.app/jsonapi'
const PAGE_SIZE = 50

interface JsonApiAttributes {
  title: string
  field_event_date?: { value: string; end_value?: string } | null
  field_ticket_link?: string | null
  field_website?: { uri?: string } | null
}

interface JsonApiNode {
  id: string
  attributes: JsonApiAttributes
  relationships: {
    field_location_reference?: { data: { id: string } | null }
  }
}

interface JsonApiLocation {
  id: string
  attributes: {
    title: string
    field_location_address?: { locality?: string } | null
    field_website?: { uri?: string } | null
  }
}

interface JsonApiResponse {
  data: JsonApiNode[]
  included?: JsonApiLocation[]
  links?: { next?: { href: string } }
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('de-CH', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Zurich',
  })
}

function formatDate(iso: string): string {
  // Convert to Zurich time and extract YYYY-MM-DD
  const d = new Date(iso)
  const zurich = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Zurich' }))
  const y = zurich.getFullYear()
  const m = String(zurich.getMonth() + 1).padStart(2, '0')
  const day = String(zurich.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function scrapeGangus(date: string): Promise<RawEvent[]> {
  const events: RawEvent[] = []
  const locationCache = new Map<string, JsonApiLocation>()

  // Build query string manually — URLSearchParams double-encodes brackets
  const qs = [
    `filter%5Bstart%5D%5Bcondition%5D%5Bpath%5D=field_event_date.value`,
    `filter%5Bstart%5D%5Bcondition%5D%5Boperator%5D=%3E%3D`,
    `filter%5Bstart%5D%5Bcondition%5D%5Bvalue%5D=${date}T00%3A00%3A00`,
    `filter%5Bend%5D%5Bcondition%5D%5Bpath%5D=field_event_date.value`,
    `filter%5Bend%5D%5Bcondition%5D%5Boperator%5D=%3C%3D`,
    `filter%5Bend%5D%5Bcondition%5D%5Bvalue%5D=${date}T23%3A59%3A59`,
    `include=field_location_reference`,
    `page%5Blimit%5D=${PAGE_SIZE}`,
    `sort=field_event_date.value`,
  ].join('&')

  let nextUrl: string | null = `${API_BASE}/node/event?${qs}`

  while (nextUrl) {
    const res = await fetch(nextUrl, {
      headers: {
        'Accept': 'application/vnd.api+json',
        'User-Agent': 'Mozilla/5.0 (compatible; waslauft.in/1.0)',
      },
    })

    if (!res.ok) {
      console.error(`[gangus] API error: ${res.status}`)
      break
    }

    const data: JsonApiResponse = await res.json()

    for (const inc of (data.included ?? []) as JsonApiLocation[]) {
      locationCache.set(inc.id, inc)
    }

    for (const node of data.data ?? []) {
      const attrs = node.attributes
      if (!attrs.title) continue

      const rawDate = attrs.field_event_date?.value
      if (!rawDate) continue

      // Double-check date (timezone safety)
      if (formatDate(rawDate) !== date) continue

      const locId = node.relationships.field_location_reference?.data?.id
      const locNode = locId ? locationCache.get(locId) : null
      const locTitle = locNode?.attributes.title ?? ''
      const locality = locNode?.attributes.field_location_address?.locality ?? ''
      // Include locality so geo-filter in pipeline can match city names
      const locationName = locTitle
        ? (locality ? `${locTitle}, ${locality}` : locTitle)
        : (locality || 'Luzern')

      const url =
        attrs.field_website?.uri?.trim() ||
        attrs.field_ticket_link?.trim() ||
        locNode?.attributes.field_website?.uri?.trim() ||
        'https://gangus.ch'

      events.push({
        name: attrs.title,
        rawName: attrs.title,
        location: locationName,
        date,
        time: formatTime(rawDate),
        url,
        source: 'gangus',
      })
    }

    nextUrl = data.links?.next?.href ?? null
  }

  console.log(`[gangus] ${events.length} Events gefunden für ${date}`)
  return events
}
