#!/usr/bin/env tsx
// scripts/seed-scrape-sources.ts
// ─────────────────────────────────────────────────────────────────────────────
// Befüllt scrapeSources für S/A-Tier Zürich Venues in Sanity.
// Venue-Website: aktiv, sofort nutzbar.
// RA-Sources:   active=false — im Sanity Studio prüfen + aktivieren.
// Instagram:    active=false — Handle im Sanity Studio verifizieren.
//
// Aufruf: npx tsx --env-file=.env.local scripts/seed-scrape-sources.ts
//         npx tsx --env-file=.env.local scripts/seed-scrape-sources.ts --dry-run
// ─────────────────────────────────────────────────────────────────────────────

import { getSanityWriteClient } from '../src/lib/sanity'

const DRY_RUN = process.argv.includes('--dry-run')

interface ScrapeSource {
  _type:    'scrapeSource'
  _key:     string
  type:     string
  url:      string
  priority: number
  active:   boolean
  notes?:   string
}

interface VenueConfig {
  name:    string  // Muss exakt mit Sanity-Dokument übereinstimmen
  sources: Omit<ScrapeSource, '_type' | '_key'>[]
}

// ─── Venue Source-Konfiguration ───────────────────────────────────────────────
// priority: 1=Venue-Website, 2=RA, 3=Ticketing, 4=Eventfrog, 5=Aggregatoren, 6=Instagram
// RA-Sources: active=false bis URL verifiziert (im Studio aktivieren)
// Instagram:  active=false bis Handle verifiziert (im Studio aktivieren)

const VENUE_SOURCES: VenueConfig[] = [
  // ── Tier S ──────────────────────────────────────────────────────────────────
  {
    name: 'Hallenstadion',
    sources: [
      { type: 'website',   url: 'https://www.hallenstadion.ch/de/events', priority: 1, active: true },
      { type: 'eventfrog', url: 'https://eventfrog.ch/de/p/konzerte/hallenstadion.html', priority: 4, active: false, notes: 'Eventfrog-URL verifizieren' },
      { type: 'instagram', url: '@hallenstadion_zuerich', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
  {
    name: 'The Hall',
    sources: [
      { type: 'website',   url: 'https://the-hall.ch/events', priority: 1, active: true },
      { type: 'ra',        url: 'https://ra.co/clubs/the-hall-dubendorf', priority: 2, active: false, notes: 'RA-URL verifizieren' },
      { type: 'instagram', url: '@thehall_ch', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
  {
    name: 'X-TRA',
    sources: [
      { type: 'website',   url: 'https://x-tra.ch/programm', priority: 1, active: true },
      { type: 'ra',        url: 'https://ra.co/clubs/x-tra-zurich', priority: 2, active: false, notes: 'RA-URL verifizieren' },
      { type: 'instagram', url: '@xtra_zurich', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
  {
    name: 'Komplex 457',
    sources: [
      { type: 'website',   url: 'https://komplex457.ch/veranstaltungen', priority: 1, active: true },
      { type: 'ra',        url: 'https://ra.co/clubs/komplex457', priority: 2, active: false, notes: 'RA-URL verifizieren' },
      { type: 'instagram', url: '@komplex457', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
  {
    name: 'Kaufleuten',
    sources: [
      { type: 'website',   url: 'https://kaufleuten.ch/events', priority: 1, active: true },
      { type: 'instagram', url: '@kaufleutenzuerich', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
  {
    name: 'Volkshaus',
    sources: [
      { type: 'website',   url: 'https://volkshaus-zuerich.ch/programm', priority: 1, active: true },
      { type: 'instagram', url: '@volkshauszzh', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
  {
    name: 'Maag Halle',
    sources: [
      { type: 'website',   url: 'https://www.maag.ch/veranstaltungen', priority: 1, active: true },
      { type: 'instagram', url: '@maag_zurich', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
  {
    name: 'Mascotte',
    sources: [
      { type: 'website',   url: 'https://www.mascotte.ch/events', priority: 1, active: true },
      { type: 'ra',        url: 'https://ra.co/clubs/mascotte-zurich', priority: 2, active: false, notes: 'RA-URL verifizieren' },
      { type: 'instagram', url: '@mascotte_zurich', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },

  // ── Tier A — Electronic ──────────────────────────────────────────────────────
  {
    name: 'Hive',
    sources: [
      { type: 'website',   url: 'https://hive-club.ch/events', priority: 1, active: true },
      { type: 'ra',        url: 'https://ra.co/clubs/hive-zurich', priority: 2, active: false, notes: 'RA-URL verifizieren' },
      { type: 'instagram', url: '@hive_zurich', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
  {
    name: 'Supermarket',
    sources: [
      { type: 'website',   url: 'https://supermarket.li', priority: 1, active: true },
      { type: 'ra',        url: 'https://ra.co/clubs/supermarket-zurich', priority: 2, active: false, notes: 'RA-URL verifizieren' },
      { type: 'instagram', url: '@supermarket_zurich', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
  {
    name: "Frieda's Büxe",
    sources: [
      { type: 'website',   url: 'https://friedas.ch/events', priority: 1, active: true },
      { type: 'ra',        url: 'https://ra.co/clubs/friedas-buxe', priority: 2, active: false, notes: 'RA-URL verifizieren' },
      { type: 'instagram', url: '@friedas_buxe', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
  {
    name: 'Zukunft',
    sources: [
      { type: 'website',   url: 'https://zukunft.cc', priority: 1, active: true },
      { type: 'ra',        url: 'https://ra.co/clubs/zukunft-zurich', priority: 2, active: false, notes: 'RA-URL verifizieren' },
      { type: 'instagram', url: '@zukunft_zuerich', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
  {
    name: 'Kauz',
    sources: [
      { type: 'website',   url: 'https://kauzu.ch', priority: 1, active: true },
      { type: 'ra',        url: 'https://ra.co/clubs/kauzu', priority: 2, active: false, notes: 'RA-URL verifizieren' },
      { type: 'instagram', url: '@kauzu_zh', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
  {
    name: 'Exil',
    sources: [
      { type: 'website',   url: 'https://exil.ch/programm', priority: 1, active: true },
      { type: 'ra',        url: 'https://ra.co/clubs/exil-zurich', priority: 2, active: false, notes: 'RA-URL verifizieren' },
      { type: 'instagram', url: '@exil_zurich', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
  {
    name: 'Klaus',
    sources: [
      { type: 'website',   url: 'https://hausvonklaus.ch/events', priority: 1, active: true },
      { type: 'ra',        url: 'https://ra.co/clubs/haus-von-klaus', priority: 2, active: false, notes: 'RA-URL verifizieren' },
      { type: 'instagram', url: '@hausvonklaus', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
  {
    name: 'Mädchere',
    sources: [
      { type: 'website',   url: 'https://zukunft.cc', priority: 1, active: true, notes: 'Events via Zukunft-Website' },
      { type: 'ra',        url: 'https://ra.co/clubs/madchere', priority: 2, active: false, notes: 'RA-URL verifizieren' },
      { type: 'instagram', url: '@madchere_zh', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },

  // ── Tier A — Alternative ─────────────────────────────────────────────────────
  {
    name: 'Dynamo',
    sources: [
      { type: 'website',   url: 'https://dynamo.ch/programm', priority: 1, active: true },
      { type: 'instagram', url: '@dynamo_zuerich', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
  {
    name: 'Rote Fabrik',
    sources: [
      { type: 'website',   url: 'https://rotefabrik.ch/veranstaltungen', priority: 1, active: true },
      { type: 'instagram', url: '@rotefabrik', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
  {
    name: 'Bogen F',
    sources: [
      { type: 'website',   url: 'https://bogenf.ch/events', priority: 1, active: true },
      { type: 'ra',        url: 'https://ra.co/clubs/bogen-f', priority: 2, active: false, notes: 'RA-URL verifizieren' },
      { type: 'instagram', url: '@bogenf_zurich', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
  {
    name: 'Moods',
    sources: [
      { type: 'website',   url: 'https://moods.ch/programm', priority: 1, active: true },
      { type: 'instagram', url: '@moodszurich', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
  {
    name: 'Sender',
    sources: [
      { type: 'website',   url: 'https://sender.club/events', priority: 1, active: true },
      { type: 'ra',        url: 'https://ra.co/clubs/sender-zurich', priority: 2, active: false, notes: 'RA-URL verifizieren' },
      { type: 'instagram', url: '@sender_club', priority: 6, active: false, notes: 'Handle verifizieren' },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeKey(type: string, index: number): string {
  return `${type}-${index}-${Math.random().toString(36).slice(2, 7)}`
}

function buildSources(sources: Omit<ScrapeSource, '_type' | '_key'>[]): ScrapeSource[] {
  return sources.map((s, i) => ({
    _type: 'scrapeSource',
    _key:  makeKey(s.type, i),
    ...s,
  }))
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`  Seed Scrape Sources${DRY_RUN ? ' [DRY-RUN]' : ''}`)
  console.log(`${'─'.repeat(60)}\n`)

  const client = getSanityWriteClient()

  // Alle Zürich-Venues aus Sanity laden
  const allVenues: Array<{ _id: string; name: string; tier: string }> = await client.fetch(
    `*[_type == "venue" && city == "zuerich"] { _id, name, tier }`
  )

  console.log(`${allVenues.length} Zürich-Venues in Sanity gefunden\n`)

  let updated = 0
  let skipped = 0
  let notFound = 0

  for (const config of VENUE_SOURCES) {
    const venue = allVenues.find((v) => v.name === config.name)

    if (!venue) {
      console.log(`  ⚠️  Nicht gefunden: "${config.name}"`)
      notFound++
      continue
    }

    const sources = buildSources(config.sources)
    const activeCount = sources.filter((s) => s.active).length

    if (DRY_RUN) {
      console.log(`  [dry-run] ${config.name} (${venue.tier}): ${sources.length} Sources (${activeCount} aktiv)`)
      sources.forEach((s) => {
        const status = s.active ? '✓' : '○'
        console.log(`    ${status} [${s.type}] ${s.url}${s.notes ? ` — ${s.notes}` : ''}`)
      })
      continue
    }

    await client.patch(venue._id).set({ scrapeSources: sources }).commit()
    console.log(`  ✅ ${config.name} (${venue.tier}): ${sources.length} Sources (${activeCount} aktiv sofort)`)
    updated++
  }

  console.log(`\n${'─'.repeat(60)}`)
  if (DRY_RUN) {
    console.log(`  DRY-RUN: keine Änderungen vorgenommen`)
  } else {
    console.log(`  ${updated} Venues aktualisiert, ${skipped} übersprungen, ${notFound} nicht gefunden`)
    console.log(`\n  Nächste Schritte im Sanity Studio (/studio):`)
    console.log(`  1. Venue öffnen → scrapeSources prüfen`)
    console.log(`  2. RA-URLs verifizieren (ra.co/clubs/...) → aktiv setzen`)
    console.log(`  3. Instagram-Handles verifizieren → aktiv setzen`)
    console.log(`  4. Website-URLs auf korrekte Event-Listing-Seite anpassen`)
  }
  console.log(`${'─'.repeat(60)}\n`)
}

main().catch((err) => {
  console.error('Seed fehlgeschlagen:', err)
  process.exit(1)
})
