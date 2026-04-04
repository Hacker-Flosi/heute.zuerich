// src/app/[city]/page.tsx — City page

import { notFound } from 'next/navigation'
import { getSanityClient } from '@/lib/sanity'
import { CURATED_EVENTS_QUERY } from '@/lib/queries'
import { getDateString, Event } from '@/lib/constants'
import EventList from '@/components/EventList'
import type { Metadata } from 'next'

export const revalidate = 3600

const CITY_LABELS: Record<string, string> = {
  zuerich: 'Zürich',
  luzern: 'Luzern',
  stgallen: 'St. Gallen',
}

interface PageProps {
  params: Promise<{ city: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params
  const label = CITY_LABELS[city]
  if (!label) return {}
  return {
    title: `waslauft.in/${city} — Was läuft heute in ${label}?`,
    description: `Kuratierte Events in ${label}. Täglich die besten 10–15 Veranstaltungen.`,
  }
}

async function getEventsForDays(city: string) {
  const client = getSanityClient()
  const [today, tomorrow, dayAfter] = await Promise.all([
    client.fetch<Event[]>(CURATED_EVENTS_QUERY, { date: getDateString(0), city }),
    client.fetch<Event[]>(CURATED_EVENTS_QUERY, { date: getDateString(1), city }),
    client.fetch<Event[]>(CURATED_EVENTS_QUERY, { date: getDateString(2), city }),
  ])
  return { today, tomorrow, dayAfter }
}

export default async function CityPage({ params }: PageProps) {
  const { city } = await params

  if (!CITY_LABELS[city]) notFound()

  const { today, tomorrow, dayAfter } = await getEventsForDays(city)

  return (
    <main>
      <EventList
        city={city}
        cityLabel={CITY_LABELS[city]}
        today={today}
        tomorrow={tomorrow}
        dayAfter={dayAfter}
      />
    </main>
  )
}
