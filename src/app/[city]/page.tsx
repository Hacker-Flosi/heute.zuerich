// src/app/[city]/page.tsx — City page

import { notFound } from 'next/navigation'
import { getSanityClient } from '@/lib/sanity'
import { CURATED_EVENTS_QUERY, SITE_SETTINGS_QUERY } from '@/lib/queries'
import { getDateString, Event } from '@/lib/constants'
import EventList from '@/components/EventList'
import type { Metadata } from 'next'

export const revalidate = 3600

const CITY_LABELS: Record<string, string> = {
  zuerich:  'Zürich',
  basel:    'Basel',
  bern:     'Bern',
  stgallen: 'St. Gallen',
  luzern:   'Luzern',
}

const CITY_LOGO_FIELD: Record<string, string> = {
  zuerich:  'zuerichLogo',
  stgallen: 'stgallenLogo',
  luzern:   'luzernLogo',
  basel:    'baselLogo',
  bern:     'bernLogo',
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
    description: `Kuratierte Events in ${label}. Täglich die besten Veranstaltungen.`,
  }
}

async function getPageData(city: string) {
  const client = getSanityClient()
  const [today, tomorrow, dayAfter, settings] = await Promise.all([
    client.fetch<Event[]>(CURATED_EVENTS_QUERY, { date: getDateString(0), city }),
    client.fetch<Event[]>(CURATED_EVENTS_QUERY, { date: getDateString(1), city }),
    client.fetch<Event[]>(CURATED_EVENTS_QUERY, { date: getDateString(2), city }),
    client.fetch<Record<string, { asset: { url: string } } | null>>(SITE_SETTINGS_QUERY),
  ])

  const logoField = CITY_LOGO_FIELD[city]
  const logoUrl = settings?.[logoField]?.asset?.url ?? null

  return { today, tomorrow, dayAfter, logoUrl }
}

export default async function CityPage({ params }: PageProps) {
  const { city } = await params

  if (!CITY_LABELS[city]) notFound()

  const { today, tomorrow, dayAfter, logoUrl } = await getPageData(city)

  return (
    <main>
      <EventList
        city={city}
        cityLabel={CITY_LABELS[city]}
        logoUrl={logoUrl}
        today={today}
        tomorrow={tomorrow}
        dayAfter={dayAfter}
      />
    </main>
  )
}
