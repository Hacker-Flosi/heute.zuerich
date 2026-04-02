// src/app/page.tsx
// heute.zürich — Hauptseite

import { sanityClient } from '@/lib/sanity'
import { CURATED_EVENTS_QUERY } from '@/lib/queries'
import { getDateString, Event } from '@/lib/constants'
import EventList from '@/components/EventList'

// Revalidate every hour (events change once per day, but we check hourly)
export const revalidate = 3600

async function getEventsForDays(): Promise<{
  today: Event[]
  tomorrow: Event[]
  dayAfter: Event[]
}> {
  const [today, tomorrow, dayAfter] = await Promise.all([
    sanityClient.fetch<Event[]>(CURATED_EVENTS_QUERY, {
      date: getDateString(0),
    }),
    sanityClient.fetch<Event[]>(CURATED_EVENTS_QUERY, {
      date: getDateString(1),
    }),
    sanityClient.fetch<Event[]>(CURATED_EVENTS_QUERY, {
      date: getDateString(2),
    }),
  ])

  return { today, tomorrow, dayAfter }
}

export default async function Home() {
  const { today, tomorrow, dayAfter } = await getEventsForDays()

  return (
    <main>
      <EventList
        today={today}
        tomorrow={tomorrow}
        dayAfter={dayAfter}
      />
    </main>
  )
}
