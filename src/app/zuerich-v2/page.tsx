// src/app/zuerich-v2/page.tsx
// Test-Page für das venue-zentrische System — kein Index, kein Nav-Link

import { getSanityClient } from '@/lib/sanity'
import { getDateString } from '@/lib/constants'
import type { Event } from '@/lib/constants'
import EventBlock from '@/components/EventBlock'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

import styles from '@/components/EventList.module.css'
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
  venueName:  string
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
    "venueName": venue->name,
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
  const client = getSanityClient()
  const today  = getDateString(0)
  const end    = getDateString(7)

  const raw    = await client.fetch<RawCentricEvent[]>(QUERY, { today, end })
  const events = raw.map(toEvent)

  return (
    <main>
      <SiteHeader current="Zürich V2" />
      <ul className={styles.list}>
        {events.length > 0
          ? events.map((event, i) => (
              <EventBlock key={event._id} event={event} index={i} />
            ))
          : <li className={styles.empty}>Keine Events.</li>
        }
      </ul>
      <SiteFooter />
    </main>
  )
}
