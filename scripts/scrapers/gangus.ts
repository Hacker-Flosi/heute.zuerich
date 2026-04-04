// scripts/scrapers/gangus.ts
// gangus.ch Scraper für Luzern (Zentralschweiz)
// Nutzt die Drupal JSON:API: null41.nodehive.app/jsonapi/node/event

import type { RawEvent } from '../types'

const API_BASE = 'https://null41.nodehive.app/jsonapi'
const PAGE_SIZE = 50

// Only include events in the Luzern region
const LU_CITIES = ['luzern', 'lucerne', 'emmen', 'kriens', 'horw', 'ebikon']

interface JsonApiRelationship {
  data: { type: string; id: string } | null
}

interface JsonApiNode {
  id: string
  attributes: {
    title: string
    field_event_date?: { value: string; end_value?: string } | null
    field_short_description?: string | null
    field_ticket_link?: string | null
    field_website?: string | null
  }
  relationships: {
    field_location_reference?: JsonApiRelationship
  }
}

interface JsonApiLocationNode {
  id: string
  attributes: {
    title: string
    field_location_address?: {
      locality?: string
    } | null
    field_website?: { uri?: string } | null
  }
}

interface JsonApiResponse {
  data: JsonApiNode[]
  included?: JsonApiLocationNode[]
  links?: { next?: { href: string } }
}

function formatTime(iso: string): string {
  // ISO-8601 → HH:MM in Europe/Zurich
  const d = new Date(iso)
  return d.toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Zurich',
  })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })
}

export async function scrapeGangus(date: string): Promise<RawEvent[]> {
  const events: RawEvent[] = []
  const locationCache = new Map<string, JsonApiLocationNode>()

  // Date boundaries (Europe/Zurich midnight)
  const dayStart = `${date}T00:00:00`
  const dayEnd = `${date}T23:59:59`

  // Drupal JSON:API filter for events on target date
  const filter = [
    `filter[start][condition][path]=field_event_date.value`,
    `filter[start][condition][operator]=%3E%3D`,
    `filter[start][condition][value]=${encodeURIComponent(dayStart)}`,
    `filter[end][condition][path]=field_event_date.value`,
    `filter[end][condition][operator]=%3C%3D`,
    `filter[end][condition][value]=${encodeURIComponent(dayEnd)}`,
    `include=field_location_reference`,
    `page[limit]=${PAGE_SIZE}`,
    `sort=field_event_date`,
  ].join('&')

  let nextUrl: string | null = `${API_BASE}/node/event?${filter}`

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

    // Cache included location nodes
    for (const inc of data.included ?? []) {
      locationCache.set(inc.id, inc)
    }

    for (const node of data.data ?? []) {
      const attrs = node.attributes
      if (!attrs.title) continue

      const rawDate = attrs.field_event_date?.value
      if (!rawDate) continue

      // Client-side date check (API filter might be imprecise with timezones)
      const eventDate = formatDate(rawDate)
      if (eventDate !== date) continue

      // Resolve location
      const locId = node.relationships.field_location_reference?.data?.id
      const locNode = locId ? locationCache.get(locId) : null
      const locationName = locNode?.attributes.title ?? 'Luzern'
      const locality = locNode?.attributes.field_location_address?.locality?.toLowerCase() ?? ''

      // Geo-filter: only Luzern region
      if (!LU_CITIES.some((c) => locality.includes(c))) continue

      // URL: prefer organizer website, then ticket link, then gangus event page
      const url =
        attrs.field_website?.trim() ||
        attrs.field_ticket_link?.trim() ||
        `https://gangus.ch`

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
