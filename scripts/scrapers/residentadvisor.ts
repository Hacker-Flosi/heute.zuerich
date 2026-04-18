// scripts/scrapers/residentadvisor.ts
// Resident Advisor GraphQL scraper for Zürich electronic/club events
// API: https://ra.co/graphql — eventListings query, area 390 = Zürich

import type { RawEvent } from '../types'
import { lookupVenueUrl } from '../venues'

const RA_GRAPHQL = 'https://ra.co/graphql'
const ZURICH_AREA_ID = 390
const PAGE_SIZE = 50

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
          venue { id name address }
        }
      }
      totalResults
    }
  }
`

function parseLocalDateTime(iso: string): { date: string; time: string } {
  // startTime is LocalDateTime like "2026-04-11T23:00:00.000" — treat as Zürich local time
  const [datePart, timePart] = iso.split('T')
  const time = timePart ? timePart.slice(0, 5) : '00:00'
  return { date: datePart, time }
}

export async function scrapeResidentAdvisor(date: string): Promise<RawEvent[]> {
  const events: RawEvent[] = []
  let page = 1
  let totalFetched = 0
  let totalResults = Infinity

  while (totalFetched < totalResults) {
    const res = await fetch(RA_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; waslauft.in/1.0)',
        'Referer': 'https://ra.co',
        'Origin': 'https://ra.co',
      },
      body: JSON.stringify({
        operationName: 'GET_EVENT_LISTINGS',
        variables: {
          filters: {
            areas: { eq: ZURICH_AREA_ID },
            listingDate: { gte: date, lte: date },
          },
          pageSize: PAGE_SIZE,
          page,
        },
        query: QUERY,
      }),
    })

    if (!res.ok) {
      console.error(`[ra] API error: ${res.status}`)
      break
    }

    const data = await res.json()

    if (data.errors) {
      console.error(`[ra] GraphQL errors:`, JSON.stringify(data.errors))
      break
    }

    const listings = data.data?.eventListings
    if (!listings) break

    totalResults = listings.totalResults ?? 0

    for (const listing of listings.data ?? []) {
      const event = listing.event
      if (!event?.title) continue

      const { date: eventDate, time } = parseLocalDateTime(event.startTime ?? listing.listingDate)

      // Safety check — only include events on the requested date
      if (eventDate !== date) continue

      const venueName = event.venue?.name ?? ''
      const venueAddress = event.venue?.address ?? ''
      // Extract city from address (last comma-separated part often has city)
      const location = venueName || venueAddress.split(',')[0] || 'Zürich'

      // Venue-URL aus Registry bevorzugt, sonst RA-Event-URL als Fallback
      const raUrl = event.contentUrl ? `https://ra.co${event.contentUrl}` : ''
      const url = lookupVenueUrl(venueName, 'zuerich') ?? raUrl

      events.push({
        name: event.title,
        rawName: event.title,
        location,
        date: eventDate,
        time,
        url,
        source: 'residentadvisor',
        eventType: 'dj_club',
        locationCity: 'zuerich',
      })
    }

    totalFetched += listings.data?.length ?? 0
    if ((listings.data?.length ?? 0) < PAGE_SIZE) break
    page++
  }

  console.log(`[ra] ${events.length} Events gefunden für ${date}`)
  return events
}
