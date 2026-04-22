// scripts/test-spotify-events.ts
// Testet Spotify-Suche auf echten Events aus Sanity

import { getSanityClient } from '../src/lib/sanity'

async function getSpotifyToken(): Promise<string> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

async function searchArtist(name: string, token: string): Promise<string | null> {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=5`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  const exact = (data.artists?.items ?? []).find(
    (a: any) => a.name.toLowerCase() === name.toLowerCase()
  )
  return exact?.external_urls?.spotify ?? null
}

// Versucht aus dem Event-Namen den Act zu extrahieren
// "Atarashi pres. Franky Rizardo" → ["Franky Rizardo", "Atarashi pres. Franky Rizardo"]
function extractSearchTerms(eventName: string): string[] {
  const terms = [eventName]

  // "pres." / "presents" Pattern
  const presMatch = eventName.match(/pres\.?\s+(.+)/i)
  if (presMatch) terms.unshift(presMatch[1].trim())

  // ":" trennt oft Venue von Act: "Hive: Objekt" → "Objekt"
  const colonMatch = eventName.match(/:\s*(.+)/)
  if (colonMatch) terms.unshift(colonMatch[1].trim())

  // Klammern entfernen: "Brina Knauss (Live)" → "Brina Knauss"
  terms.unshift(eventName.replace(/\s*\(.*?\)/g, '').trim())

  return [...new Set(terms)] // Duplikate entfernen
}

async function main() {
  const date = '2026-04-18'
  const client = getSanityClient()
  const events = await client.fetch<Array<{ name: string; location: string; time: string; eventType: string }>>(
    `*[_type == "event" && city == "zuerich" && date == $date] | order(time asc) { name, location, time, eventType }`,
    { date }
  )

  console.log(`${events.length} Events geladen\n`)

  const token = await getSpotifyToken()
  console.log('Spotify Token ✅\n')

  let found = 0
  for (const event of events) {
    const terms = extractSearchTerms(event.name)
    let url: string | null = null

    for (const term of terms) {
      url = await searchArtist(term, token)
      if (url) break
    }

    if (url) {
      found++
      console.log(`✅ ${event.time} | ${event.name}`)
      console.log(`   ${url}\n`)
    }
  }

  console.log(`\n─────────────────────────`)
  console.log(`${found} / ${events.length} Events mit Spotify-Link`)
}

main().catch(console.error)
