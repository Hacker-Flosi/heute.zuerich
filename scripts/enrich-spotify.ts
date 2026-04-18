// scripts/enrich-spotify.ts
// Reichert bestehende Sanity-Events mit Spotify-URLs an (einmalig / manuell)

import { getSanityWriteClient } from '../src/lib/sanity'
import { lookupSpotifyUrl } from './spotify'

const MUSIC_TYPES = ['konzert', 'dj_club', 'party']

async function main() {
  const date = process.argv[2] ?? new Date().toISOString().split('T')[0]
  const client = getSanityWriteClient()

  const events = await client.fetch<Array<{ _id: string; name: string; eventType: string; spotifyUrl?: string }>>(
    `*[_type == "event" && date == $date && eventType in $types && !defined(spotifyUrl)] { _id, name, eventType }`,
    { date, types: MUSIC_TYPES }
  )

  console.log(`${events.length} Music-Events ohne Spotify-URL für ${date}\n`)
  if (events.length === 0) return

  let found = 0
  for (const e of events) {
    const url = await lookupSpotifyUrl(e.name, e.eventType)
    if (url) {
      await client.patch(e._id).set({ spotifyUrl: url }).commit()
      console.log(`✅ ${e.name}`)
      console.log(`   ${url}`)
      found++
    }
  }

  console.log(`\n${found} / ${events.length} Events mit Spotify-Link versehen`)
}

main().catch(console.error)
