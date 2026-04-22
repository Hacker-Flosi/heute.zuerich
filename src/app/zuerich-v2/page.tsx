// src/app/zuerich-v2/page.tsx
// Test-Page für das venue-zentrische System — gleiche UI wie /zuerich
// Kein Nav-Link, kein Index

import { getSanityClient } from '@/lib/sanity'
import { getDateString } from '@/lib/constants'
import type { Event } from '@/lib/constants'
import EventList from '@/components/EventList'
import type { Metadata } from 'next'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Zürich V2 (intern)',
  robots: { index: false, follow: false },
}

interface RawCentricEvent {
  _id:        string
  title:      string
  startDate:  string
  startTime?: string
  eventUrl?:  string
  ticketUrl?: string
  sourceType: string
  venueName:  string
  venueTier:  string
}

const QUERY = `
  *[
    _type == "eventVenueCentric"
    && city == "zuerich"
    && startDate >= $today
    && startDate <= $end
    && isDuplicate != true
  ] | order(startDate asc, startTime asc) {
    _id,
    title,
    startDate,
    startTime,
    eventUrl,
    ticketUrl,
    sourceType,
    "venueName": venue->name,
    "venueTier": venue->tier,
  }
`

function toEvent(e: RawCentricEvent, index: number): Event {
  return {
    _id:        e._id,
    name:       e.title,
    location:   e.venueName ?? '',
    date:       e.startDate,
    time:       e.startTime ?? '00:00',
    url:        e.eventUrl ?? e.ticketUrl ?? '',
    sponsored:  false,
    colorIndex: index,
  }
}

export default async function ZuerichV2Page() {
  const client   = getSanityClient()
  const today    = getDateString(0)
  const tomorrow = getDateString(1)
  const dayAfter = getDateString(2)
  const end      = getDateString(7)

  const raw = await client.fetch<RawCentricEvent[]>(QUERY, { today, end })

  // Nach Datum aufteilen
  const todayEvents    = raw.filter(e => e.startDate === today).map(toEvent)
  const tomorrowEvents = raw.filter(e => e.startDate === tomorrow).map(toEvent)
  const dayAfterEvents = raw.filter(e => e.startDate === dayAfter).map(toEvent)

  return (
    <main>
      <EventList
        city="zuerich"
        cityLabel="Zürich V2"
        logoUrl={null}
        today={todayEvents}
        tomorrow={tomorrowEvents}
        dayAfter={dayAfterEvents}
      />
    </main>
  )
}
