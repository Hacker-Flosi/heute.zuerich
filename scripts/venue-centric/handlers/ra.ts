// scripts/venue-centric/handlers/ra.ts
// Resident Advisor Handler für das venue-zentrische System
//
// Strategie: Holt Events für den Zürich-Bereich (Area 390) und filtert
// client-seitig nach Venue-Name. Robuster als Venue-ID-Lookup (kein
// separater Auflösungsschritt nötig, RA-API bleibt gleich).

import type { NormalizedEvent, VenueWithSources, ScrapeSource } from '../types'

const RA_GRAPHQL    = 'https://ra.co/graphql'
const ZURICH_AREA   = 390
const PAGE_SIZE     = 100

const QUERY = `
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
          images { filename }
          venue { id name address }
        }
      }
      totalResults
    }
  }
`

// ─── RA Area Cache (pro Run) ──────────────────────────────────────────────────
// Alle Zürich-RA-Events pro Datum einmal holen, dann pro Venue filtern.
// Verhindert 21 separate API-Calls für 21 Venues.

const raCache: Map<string, RaListing[]> = new Map()

interface RaListing {
  id:        string
  startTime: string
  title:     string
  raUrl:     string
  venueName: string
  imageUrl?: string
}

async function fetchRaArea(date: string): Promise<RaListing[]> {
  if (raCache.has(date)) return raCache.get(date)!

  const listings: RaListing[] = []
  let page = 1
  let totalFetched = 0
  let totalResults = Infinity

  while (totalFetched < totalResults) {
    const res = await fetch(RA_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; waslauft.in/1.0)',
        'Referer':    'https://ra.co',
        'Origin':     'https://ra.co',
      },
      body: JSON.stringify({
        operationName: 'GET_EVENT_LISTINGS',
        variables: {
          filters: {
            areas:       { eq: ZURICH_AREA },
            listingDate: { gte: date, lte: date },
          },
          pageSize: PAGE_SIZE,
          page,
        },
        query: QUERY,
      }),
    })

    if (!res.ok) {
      console.error(`[ra-handler] API ${res.status} für ${date}`)
      break
    }

    const data = await res.json()
    if (data.errors) {
      console.error(`[ra-handler] GraphQL errors:`, data.errors[0]?.message)
      break
    }

    const result = data.data?.eventListings
    if (!result) break

    totalResults = result.totalResults ?? 0

    for (const listing of result.data ?? []) {
      const ev = listing.event
      if (!ev?.title || !ev?.startTime) continue
      // Nur Events am angefragten Datum
      if (!ev.startTime.startsWith(date)) continue

      listings.push({
        id:        String(ev.id),
        startTime: ev.startTime,
        title:     ev.title,
        raUrl:     ev.contentUrl ? `https://ra.co${ev.contentUrl}` : '',
        venueName: ev.venue?.name ?? '',
        imageUrl:  ev.images?.[0]?.filename ?? undefined,
      })
    }

    totalFetched += result.data?.length ?? 0
    if ((result.data?.length ?? 0) < PAGE_SIZE) break
    page++
  }

  console.log(`[ra-handler] Zürich-Bereich ${date}: ${listings.length} Listings geladen`)
  raCache.set(date, listings)
  return listings
}

// ─── Venue-Name Matching ──────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}

function venueMatches(raVenueName: string, venueName: string): boolean {
  const ra  = normalize(raVenueName)
  const our = normalize(venueName)
  if (ra === our) return true
  // Enthält der eine den anderen (min. 4 Zeichen)
  if (our.length >= 4 && ra.includes(our)) return true
  if (ra.length  >= 4 && our.includes(ra)) return true
  return false
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function handleRa(
  venue:  VenueWithSources,
  source: ScrapeSource,
  date:   string,
): Promise<NormalizedEvent[]> {
  const allListings = await fetchRaArea(date)
  const scrapedAt   = new Date().toISOString()

  const matched = allListings.filter((l) => venueMatches(l.venueName, venue.name))

  return matched.map((l): NormalizedEvent => {
    const timePart = l.startTime.split('T')[1]?.slice(0, 5) ?? undefined
    return {
      title:          l.title,
      venueId:        venue._id,
      venueName:      venue.name,
      city:           venue.city,
      startDate:      date,
      startTime:      timePart,
      imageUrl:       l.imageUrl,
      eventUrl:       l.raUrl || undefined,
      sourceType:     'ra',
      sourceUrl:      source.url,
      sourcePriority: source.priority,
      scrapedAt,
      rawId:          l.id,
    }
  })
}
