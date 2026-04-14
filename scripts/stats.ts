// scripts/stats.ts
// Speichert tägliche Pipeline-Snapshots und aktualisiert Venue-Stats in Sanity

import { getSanityWriteClient } from '../src/lib/sanity'

export interface SnapshotInput {
  date: string
  city: string
  totalEvents: number
  layer1Events: number
  layer2Events: number
  sources: { eventfrog: number; hellozurich: number; gangus: number; ra: number }
  eventTypes: Record<string, number>
  topVenues: { name: string; count: number }[]
  weatherRain: boolean
  instagramPosted?: boolean
  instagramEvents?: string[]
}

export async function savePipelineSnapshot(input: SnapshotInput): Promise<void> {
  const client = getSanityWriteClient()
  const docId = `snapshot-${input.city}-${input.date}`

  await client.createOrReplace({
    _type: 'pipelineSnapshot',
    _id: docId,
    ...input,
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

    // Bestehenden Eintrag laden
    const existing = await client.fetch<{
      totalAppearances?: number
      instagramAppearances?: number
      firstSeen?: string
      recentDates?: string[]
    } | null>(`*[_id == $id][0]`, { id: docId })

    const isInstagram = instagramVenues.includes(venueName)
    const prevTotal = existing?.totalAppearances ?? 0
    const prevIg    = existing?.instagramAppearances ?? 0
    const prevRecent = existing?.recentDates ?? []

    // recentDates: letzten 30 Einträge behalten
    const newRecent = [date, ...prevRecent.filter((d) => d !== date)].slice(0, 30)

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
