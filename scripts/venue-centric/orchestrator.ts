#!/usr/bin/env tsx
// scripts/venue-centric/orchestrator.ts
// ─────────────────────────────────────────────────────────────────────────────
// Venue-zentrischer Scraper-Orchestrator (Test-System, Zürich)
//
// Liest alle aktiven Zürich-Venues mit scrapeSources aus Sanity,
// dispatcht pro Source zum richtigen Handler, dedupliziert,
// schreibt in eventVenueCentric Collection.
//
// Aufruf:
//   npx tsx --env-file=.env.local scripts/venue-centric/orchestrator.ts
//   npx tsx --env-file=.env.local scripts/venue-centric/orchestrator.ts --date 2026-04-25
//   npx tsx --env-file=.env.local scripts/venue-centric/orchestrator.ts --dry-run
// ─────────────────────────────────────────────────────────────────────────────

import { getSanityClient } from '../../src/lib/sanity'
import { handleRa } from './handlers/ra'
import { handleWebsite } from './handlers/website'
import { deduplicate } from './dedup'
import { writeToCentricCollection, cleanupOldCentricEvents } from './sanity-write'
import type { VenueWithSources, NormalizedEvent, ScrapeSource } from './types'

const DRY_RUN = process.argv.includes('--dry-run')

// Datum aus --date Argument oder heute
function getTargetDate(): string {
  const idx = process.argv.indexOf('--date')
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1]
  return new Date().toISOString().slice(0, 10)
}

// ─── Source Dispatcher ────────────────────────────────────────────────────────

async function runSource(
  venue:  VenueWithSources,
  source: ScrapeSource,
  date:   string,
): Promise<NormalizedEvent[]> {
  try {
    switch (source.type) {
      case 'ra':
        return await handleRa(venue, source, date)

      case 'website':
        return await handleWebsite(venue, source, date)

      case 'eventfrog':
        // Phase 2: Eventfrog-Adapter noch nicht implementiert (bestehender läuft separat)
        return []

      default:
        return []
    }
  } catch (err) {
    console.error(`  [${source.type}] ${venue.name}: Fehler —`, err instanceof Error ? err.message : err)
    return []
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const date   = getTargetDate()
  const client = getSanityClient()

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`  Venue-Centric Scraper${DRY_RUN ? ' [DRY-RUN]' : ''} · ${date}`)
  console.log(`${'─'.repeat(60)}\n`)

  // ── Venues aus Sanity laden ─────────────────────────────────────────────────
  const venues: VenueWithSources[] = await client.fetch(`
    *[_type == "venue" && city == "zuerich" && active == true && count(scrapeSources) > 0] {
      _id, name, city, tier, category,
      "scrapeSources": scrapeSources[active == true]
    }
  `)

  const activeVenues = venues.filter((v) => v.scrapeSources?.length > 0)
  console.log(`${activeVenues.length} Venues mit aktiven scrapeSources geladen\n`)

  // ── Pro Venue scrapen ───────────────────────────────────────────────────────
  const allEvents: NormalizedEvent[] = []

  for (const venue of activeVenues) {
    const venueSources = venue.scrapeSources ?? []
    const results: NormalizedEvent[] = []

    for (const source of venueSources) {
      const events = await runSource(venue, source, date)
      results.push(...events)
    }

    console.log(`  [${venue.tier}] ${venue.name}: ${results.length} Events`)
    allEvents.push(...results)
  }

  // ── Deduplication ───────────────────────────────────────────────────────────
  console.log(`\nTotal roh: ${allEvents.length} Events`)
  const { events: deduped, removed } = deduplicate(allEvents)
  console.log(`Nach Dedup: ${deduped.length} Events (${removed} Duplikate entfernt)`)

  if (DRY_RUN) {
    console.log('\n── Dry-Run Ergebnis ──')
    for (const e of deduped) {
      console.log(`  [${e.sourceType}] ${e.venueName}: ${e.title} (${e.startTime ?? '?'})`)
    }
    console.log(`\n${'─'.repeat(60)}`)
    console.log('  DRY-RUN: keine Änderungen in Sanity')
    console.log(`${'─'.repeat(60)}\n`)
    return
  }

  // ── Cleanup abgelaufene Events ──────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10)
  const cleaned = await cleanupOldCentricEvents(today)
  if (cleaned > 0) console.log(`Cleanup: ${cleaned} abgelaufene eventVenueCentric gelöscht`)

  // ── Sanity schreiben ────────────────────────────────────────────────────────
  console.log(`Schreibe ${deduped.length} Events in Sanity...`)
  const { written, errors } = await writeToCentricCollection(deduped)

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`  Fertig: ${written} geschrieben, ${errors} Fehler`)
  console.log(`${'─'.repeat(60)}\n`)
}

main().catch((err) => {
  console.error('Orchestrator fehlgeschlagen:', err)
  process.exit(1)
})
