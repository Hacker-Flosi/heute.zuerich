// scripts/pipeline.ts
// Tägliche Pipeline für waslauft.in
// Orchestriert: Scraping → Venue URL → Dedup → Kuratierung → Sanity

import { scrapeEventfrog } from './scrapers/eventfrog'
import { scrapeHellozurich } from './scrapers/hellozurich'
import { scrapeGangus } from './scrapers/gangus'
import { scrapeSaiten } from './scrapers/saiten'
import { deduplicateEvents } from './deduplicate'
import { curateEvents } from './curate'
import { getSanityWriteClient } from '../src/lib/sanity'
import { lookupVenueUrl, isAggregatorUrl } from './venues'
import type { RawEvent } from './types'

function getDate(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

// Per-city scraper config
type ScraperFn = (date: string) => Promise<RawEvent[]>

const CITY_SCRAPERS: Record<string, ScraperFn[]> = {
  zuerich: [scrapeEventfrog, scrapeHellozurich],
  luzern: [scrapeGangus, scrapeEventfrog],
  stgallen: [scrapeSaiten, scrapeEventfrog],
}

// Per-city geo-exclusion: words in location that disqualify an event
const CITY_EXCLUSIONS: Record<string, string[]> = {
  zuerich: [
    'winterthur', 'baden', 'brugg', 'aarau', 'rapperswil',
    'zug', 'schaffhausen', 'frauenfeld', 'olten', 'solothurn',
    'luzern', 'bern', 'st. gallen',
  ],
}

// Per-city geo-inclusion: at least one word must match (for cities where eventfrog returns all CH)
const CITY_INCLUSIONS: Record<string, string[]> = {
  luzern: ['luzern', 'lucerne', 'emmen', 'kriens', 'horw', 'ebikon'],
  stgallen: ['st. gallen', 'st gallen', 'saint-gallen', 'gossau', 'rorschach'],
}

function geoFilter(event: RawEvent, city: string): boolean {
  const loc = event.location.toLowerCase()
  const exclusions = CITY_EXCLUSIONS[city]
  if (exclusions && exclusions.some((excl) => loc.includes(excl))) return false
  const inclusions = CITY_INCLUSIONS[city]
  if (inclusions) return inclusions.some((incl) => loc.includes(incl))
  return true
}

async function writeToSanity(events: RawEvent[], date: string, city: string, curatedNames: Set<string>) {
  const client = getSanityWriteClient()

  // Delete all existing events for this city+date to prevent stale duplicates
  const existingIds: string[] = await client.fetch(
    `*[_type == "event" && city == $city && date == $date]._id`,
    { city, date }
  )
  if (existingIds.length > 0) {
    const deleteTx = client.transaction()
    for (const id of existingIds) deleteTx.delete(id)
    await deleteTx.commit()
    console.log(`[Sanity] ${existingIds.length} alte Docs gelöscht für ${city}/${date}`)
  }

  const transaction = client.transaction()

  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const isCurated = curatedNames.has(event.name)
    const slug = `${event.name}-${event.location}-${event.time}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 80)
    const docId = `event-${city}-${date}-${slug}`

    transaction.createOrReplace({
      _type: 'event',
      _id: docId,
      city,
      name: event.name,
      rawName: event.rawName,
      location: event.location,
      date,
      time: event.time,
      url: event.url,
      source: event.source,
      curated: isCurated,
      sponsored: false,
      colorIndex: i % 12,
    })
  }

  await transaction.commit()
  console.log(`[Sanity] ${events.length} Events geschrieben für ${city}/${date}`)
}

async function runCity(city: string) {
  const scrapers = CITY_SCRAPERS[city]
  if (!scrapers) throw new Error(`Kein Scraper konfiguriert für: ${city}`)

  for (const offset of [0, 1, 2]) {
    const date = getDate(offset)
    const dayLabel = ['Heute', 'Morgen', 'Übermorgen'][offset]
    console.log(`\n  --- ${dayLabel} (${date}) ---`)

    // 1. SCRAPING
    console.log('  [1/4] Scraping...')
    const results = await Promise.allSettled(scrapers.map((fn) => fn(date)))
    const rawEvents: RawEvent[] = []
    for (const result of results) {
      if (result.status === 'fulfilled') rawEvents.push(...result.value)
      else console.error('  [Scraper] Fehler:', result.reason)
    }

    // 2. VENUE URL ENRICHMENT
    for (const event of rawEvents) {
      if (!event.url || isAggregatorUrl(event.url)) {
        const venueUrl = lookupVenueUrl(event.location, city)
        if (venueUrl) event.url = venueUrl
      }
    }

    // 3. GEO-FILTER
    const allEvents = rawEvents.filter((e) => geoFilter(e, city))
    const filtered = rawEvents.length - allEvents.length
    if (filtered > 0) console.log(`  [Geo] ${filtered} Events ausgeschlossen`)

    if (allEvents.length === 0) {
      console.warn(`  [WARNUNG] Keine Events für ${city}/${date}`)
      continue
    }
    console.log(`  [Scraping] ${allEvents.length} Events nach Geo-Filter`)

    // 4. DEDUPLIZIERUNG
    const uniqueEvents = deduplicateEvents(allEvents)

    // 5. AI-KURATIERUNG
    console.log('  [3/4] AI-Kuratierung...')
    try {
      const curated = await curateEvents(uniqueEvents, city)
      console.log(`  [Kuratierung] ${curated.length} von ${uniqueEvents.length} ausgewählt`)

      for (const event of uniqueEvents) {
        const match = curated.find((c) =>
          c.id === event.name ||
          event.name.toLowerCase().includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(event.name.toLowerCase())
        )
        if (match) {
          event.name = match.name
          event.location = match.location
        }
      }

      const curatedNames = new Set(curated.map((e) => e.name))
      console.log('  [4/4] Sanity schreiben...')
      await writeToSanity(uniqueEvents, date, city, curatedNames)
    } catch (error) {
      console.error('  [FEHLER] Kuratierung fehlgeschlagen:', error)
      console.log('  [Fallback] Speichere alle Events ohne Kuratierung...')
      await writeToSanity(uniqueEvents, date, city, new Set())
    }
  }
}

export async function runPipeline() {
  const startTime = Date.now()
  console.log('=== waslauft.in Pipeline gestartet ===')
  console.log(`Zeitpunkt: ${new Date().toISOString()}`)

  const cities = Object.keys(CITY_SCRAPERS)

  for (const city of cities) {
    console.log(`\n=== Stadt: ${city.toUpperCase()} ===`)
    try {
      await runCity(city)
    } catch (error) {
      console.error(`[FEHLER] Pipeline für ${city} abgebrochen:`, error)
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n=== Pipeline abgeschlossen in ${duration}s ===`)
}

if (process.argv[1]?.endsWith('pipeline.ts') || process.argv[1]?.endsWith('pipeline.js')) {
  runPipeline().catch((error) => {
    console.error('Pipeline fatal error:', error)
    process.exit(1)
  })
}
