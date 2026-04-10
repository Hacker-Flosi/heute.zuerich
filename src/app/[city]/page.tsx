// src/app/[city]/page.tsx — City page

import { notFound } from 'next/navigation'
import { getSanityClient } from '@/lib/sanity'
import { CURATED_EVENTS_QUERY, RAIN_RESERVE_QUERY, SITE_SETTINGS_QUERY } from '@/lib/queries'
import { getDateString, Event } from '@/lib/constants'
import { FEATURE_BADWEATHER } from '@/lib/features'
import { fetchWeather } from '@/lib/weather'
import EventList from '@/components/EventList'
import type { Metadata } from 'next'

export const revalidate = 3600

const CITY_LABELS: Record<string, string> = {
  zuerich:  'Zürich',
  basel:    'Basel',
  bern:     'Bern',
  stgallen: 'St.Gallen',
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
    title: `Was läuft heute in ${label}?`,
    description: `Die besten Events heute in ${label} — Konzerte, Clubs, Kultur und mehr. Täglich kuratiert, ohne Werbung.`,
    alternates: { canonical: `/${city}` },
    openGraph: {
      title: `Was läuft heute in ${label}? — waslauft.in`,
      description: `Die besten Events heute in ${label} — Konzerte, Clubs, Kultur und mehr.`,
      url: `https://waslauft.in/${city}`,
      images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    },
  }
}

async function getPageData(city: string) {
  const client = getSanityClient()
  const [today, tomorrow, dayAfter, rainToday, rainTomorrow, rainDayAfter, settings, weather] = await Promise.all([
    client.fetch<Event[]>(CURATED_EVENTS_QUERY, { date: getDateString(0), city }),
    client.fetch<Event[]>(CURATED_EVENTS_QUERY, { date: getDateString(1), city }),
    client.fetch<Event[]>(CURATED_EVENTS_QUERY, { date: getDateString(2), city }),
    FEATURE_BADWEATHER ? client.fetch<Event[]>(RAIN_RESERVE_QUERY, { date: getDateString(0), city }) : Promise.resolve([]),
    FEATURE_BADWEATHER ? client.fetch<Event[]>(RAIN_RESERVE_QUERY, { date: getDateString(1), city }) : Promise.resolve([]),
    FEATURE_BADWEATHER ? client.fetch<Event[]>(RAIN_RESERVE_QUERY, { date: getDateString(2), city }) : Promise.resolve([]),
    client.fetch<Record<string, { asset: { url: string } } | null>>(SITE_SETTINGS_QUERY),
    FEATURE_BADWEATHER ? fetchWeather(city) : Promise.resolve(null),
  ])

  const logoField = CITY_LOGO_FIELD[city]
  const logoUrl = settings?.[logoField]?.asset?.url ?? null

  return { today, tomorrow, dayAfter, rainToday, rainTomorrow, rainDayAfter, logoUrl, weather }
}

export default async function CityPage({ params }: PageProps) {
  const { city } = await params

  if (!CITY_LABELS[city]) notFound()

  const { today, tomorrow, dayAfter, rainToday, rainTomorrow, rainDayAfter, logoUrl, weather } = await getPageData(city)
  const label = CITY_LABELS[city]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EventSeries',
    name: `Was läuft heute in ${label}?`,
    url: `https://waslauft.in/${city}`,
    location: { '@type': 'City', name: label, addressCountry: 'CH' },
    organizer: { '@type': 'Organization', name: 'waslauft.in', url: 'https://waslauft.in' },
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EventList
        city={city}
        cityLabel={CITY_LABELS[city]}
        logoUrl={logoUrl}
        today={today}
        tomorrow={tomorrow}
        dayAfter={dayAfter}
        rainToday={rainToday}
        rainTomorrow={rainTomorrow}
        rainDayAfter={rainDayAfter}
        isRainy={weather?.isRainy ?? false}
      />
    </main>
  )
}
