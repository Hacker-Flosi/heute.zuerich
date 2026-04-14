// scripts/stats.ts
// Speichert tägliche Pipeline-Snapshots und aktualisiert Venue-Stats in Sanity

import { getSanityWriteClient } from '../src/lib/sanity'

export interface SnapshotInput {
  date: string
  city: string
  totalEvents: number
  layer1Events: number
  layer2Events: number

  // Scraper-Gesundheit
  scraperHealth?: {
    rawTotal: number
    geoExcluded: number
    duplicatesRemoved: number
    scraperErrors: number
  }

  // Quellen
  sources: { eventfrog: number; hellozurich: number; gangus: number; ra: number }

  // Kuration-Qualität
  curationQuality?: {
    discoveryPoolSize: number
    discoverySelected: number
    discoverySelectionPct: number
    rainReserveAdded: number
    nightlifeCount: number
    nightlifePct: number
  }

  // Zeitverteilung
  timing?: {
    eveningEvents: number
    daytimeEvents: number
    allDayEvents: number
  }

  // Event-Typen
  eventTypes: Record<string, number>

  // Top Venues
  topVenues: { name: string; count: number }[]

  // Instagram
  instagramPosted?: boolean
  instagramEvents?: string[]

  // Wetter
  weatherRain: boolean
}

export async function savePipelineSnapshot(input: SnapshotInput): Promise<void> {
  const client = getSanityWriteClient()
  const docId = `snapshot-${input.city}-${input.date}`

  // Instagram-Update: patch nur instagramPosted/instagramEvents wenn bereits vorhanden
  if (input.instagramPosted) {
    const existing = await client.fetch<{ _id: string } | null>(`*[_id == $id][0]{_id}`, { id: docId })
    if (existing) {
      await client.patch(docId).set({
        instagramPosted: true,
        instagramEvents: input.instagramEvents ?? [],
      }).commit()
      console.log(`  [Stats] Instagram-Events in Snapshot vermerkt: ${input.city}/${input.date}`)
      return
    }
  }

  await client.createOrReplace({
    _type: 'pipelineSnapshot',
    _id: docId,
    date: input.date,
    city: input.city,
    totalEvents: input.totalEvents,
    layer1Events: input.layer1Events,
    layer2Events: input.layer2Events,
    scraperHealth: input.scraperHealth,
    sources: input.sources,
    curationQuality: input.curationQuality,
    timing: input.timing,
    eventTypes: input.eventTypes,
    topVenues: input.topVenues,
    instagramPosted: input.instagramPosted ?? false,
    instagramEvents: input.instagramEvents ?? [],
    weatherRain: input.weatherRain,
  })

  console.log(`  [Stats] Snapshot gespeichert: ${input.city}/${input.date} (${input.totalEvents} Events)`)
}

export async function updateVenueStats(
  city: string,
  date: string,
  venueCounts: Record<string, number>,
  instagramVenues: string[] = []
): Promise<void> {
  const client = getSanityWriteClient()

  for (const [venueName, count] of Object.entries(venueCounts)) {
    if (count === 0) continue
    const docId = `venuestats-${city}-${venueName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 50)}`

    const existing = await client.fetch<{
      totalAppearances?: number
      instagramAppearances?: number
      firstSeen?: string
      recentDates?: string[]
    } | null>(`*[_id == $id][0]`, { id: docId })

    const isInstagram = instagramVenues.includes(venueName)
    const prevTotal  = existing?.totalAppearances ?? 0
    const prevIg     = existing?.instagramAppearances ?? 0
    const prevRecent = existing?.recentDates ?? []
    const newRecent  = [date, ...prevRecent.filter((d) => d !== date)].slice(0, 30)

    await client.createOrReplace({
      _type: 'venueStats',
      _id: docId,
      venueName,
      city,
      totalAppearances:     prevTotal + count,
      instagramAppearances: prevIg + (isInstagram ? 1 : 0),
      firstSeen: existing?.firstSeen ?? date,
      lastSeen:  date,
      recentDates: newRecent,
    })
  }

  console.log(`  [Stats] Venue-Stats aktualisiert: ${city} (${Object.keys(venueCounts).length} Venues)`)
}
