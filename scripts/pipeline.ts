// scripts/pipeline.ts
// waslauft.in Daily Pipeline
// Zürich: Two-Layer (venue-first + AI discovery)
// Other cities: Single-layer (AI curation of all events)

import { scrapeEventfrog } from './scrapers/eventfrog'
import { scrapeHellozurich } from './scrapers/hellozurich'
import { scrapeGangus } from './scrapers/gangus'
import { scrapeSaiten } from './scrapers/saiten'
import { deduplicateEvents } from './deduplicate'
import { curateEvents, curateDiscovery } from './curate'
import { getSanityClient, getSanityWriteClient } from '../src/lib/sanity'
import { lookupVenueUrl, isAggregatorUrl } from './venues'
import { inferEventTypeFromTitle, eventTypeFromVenueCategory, isNightlife } from './eventtype'
import type { RawEvent, SanityVenue } from './types'

// ─── Config ───────────────────────────────────────────────────────────────────

type ScraperFn = (date: string) => Promise<RawEvent[]>

const CITY_CONFIG: Record<string, { twoLayer: boolean; scrapers: ScraperFn[] }> = {
  zuerich:  { twoLayer: true,  scrapers: [scrapeEventfrog, scrapeHellozurich] },
  luzern:   { twoLayer: false, scrapers: [scrapeGangus, scrapeEventfrog] },
  stgallen: { twoLayer: false, scrapers: [scrapeSaiten, scrapeEventfrog] },
}

// Excluded cities for Zürich geo-filter
const ZH_EXCLUDED = [
  'winterthur', 'baden', 'brugg', 'aarau', 'rapperswil', 'zug',
  'schaffhausen', 'frauenfeld', 'olten', 'solothurn', 'luzern',
  'bern', 'st. gallen',
]

// Inclusion lists for other cities (location must contain at least one term)
const CITY_INCLUSIONS: Record<string, string[]> = {
  luzern:   ['luzern', 'lucerne', 'emmen', 'kriens', 'horw', 'ebikon'],
  stgallen: ['st. gallen', 'st gallen', 'saint-gallen', 'gossau', 'rorschach'],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDate(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isSummerSeason(): boolean {
  const month = new Date().getMonth() + 1 // 1–12
  return month >= 5 && month <= 9
}

function geoFilterZuerich(event: RawEvent): boolean {
  const loc = (event.location + ' ' + (event.locationCity ?? '')).toLowerCase()
  return !ZH_EXCLUDED.some((excl) => loc.includes(excl))
}

function geoFilterCity(event: RawEvent, city: string): boolean {
  const inclusions = CITY_INCLUSIONS[city]
  if (!inclusions) return true
  const loc = (event.location + ' ' + (event.locationCity ?? '')).toLowerCase()
  return inclusions.some((incl) => loc.includes(incl))
}

/** Match a venue's eventfrogName against the event's location string */
function matchVenue(event: RawEvent, venues: SanityVenue[], summer: boolean): SanityVenue | null {
  const loc = event.location.toLowerCase()
  // Summer: prioritise summerBonus venues
  const sorted = summer
    ? [...venues].sort((a, b) => (b.summerBonus ? 1 : 0) - (a.summerBonus ? 1 : 0))
    : venues
  return sorted.find((v) => {
    const search = (v.eventfrogName ?? v.name).toLowerCase()
    return loc.includes(search) || search.includes(loc) ||
      // also match on display name alone (e.g. "Hive" in "Hive Club Zürich")
      loc.includes(v.name.toLowerCase())
  }) ?? null
}

/** Enforce ≥60% nightlife ratio. Trims non-nightlife events from the end if needed. */
function enforceNightlifeRatio(events: RawEvent[]): RawEvent[] {
  const nightlife = events.filter((e) => isNightlife(e.eventType ?? 'special'))
  const other = events.filter((e) => !isNightlife(e.eventType ?? 'special'))
  const ratio = nightlife.length / events.length
  if (ratio >= 0.6 || events.length === 0) return events

  // Calculate max non-nightlife to keep
  const maxOther = Math.floor(nightlife.length / 0.6 * 0.4)
  return [...nightlife, ...other.slice(0, maxOther)]
}

async function loadActiveVenues(city: string): Promise<SanityVenue[]> {
  const client = getSanityClient()
  return client.fetch<SanityVenue[]>(
    `*[_type == "venue" && city == $city && active == true] | order(tier asc, name asc)`,
    { city }
  )
}

async function writeToSanity(events: RawEvent[], date: string, city: string, curatedIds: Set<string>) {
  const client = getSanityWriteClient()

  // Delete stale docs for this city+date
  const existingIds: string[] = await client.fetch(
    `*[_type == "event" && city == $city && date == $date]._id`,
    { city, date }
  )
  if (existingIds.length > 0) {
    const del = client.transaction()
    for (const id of existingIds) del.delete(id)
    await del.commit()
  }

  const tx = client.transaction()
  for (let i = 0; i < events.length; i++) {
    const e = events[i]
    const isCurated = curatedIds.has(e.name)
    const slug = `${e.name}-${e.location}-${e.time}`
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)
    const docId = `event-${city}-${date}-${slug}`

    tx.createOrReplace({
      _type: 'event',
      _id: docId,
      city,
      name: e.name,
      rawName: e.rawName,
      location: e.location,
      date,
      time: e.time,
      url: e.url,
      source: e.source,
      eventType: e.eventType ?? null,
      layer: e.layer ?? 'discovery',
      curated: isCurated,
      sponsored: false,
      colorIndex: i % 12,
    })
  }

  await tx.commit()
  console.log(`  [Sanity] ${events.length} Events geschrieben für ${city}/${date}`)
}

// ─── Two-Layer Pipeline (Zürich) ──────────────────────────────────────────────

async function runTwoLayer(city: string, scrapers: ScraperFn[]) {
  const venues = await loadActiveVenues(city)
  console.log(`  [Venues] ${venues.length} aktive Venues geladen`)
  const summer = isSummerSeason()

  for (const offset of [0, 1, 2]) {
    const date = getDate(offset)
    const label = ['Heute', 'Morgen', 'Übermorgen'][offset]
    console.log(`\n  ── ${label} (${date}) ──`)

    // ── Scraping
    console.log('  [1/5] Scraping...')
    const results = await Promise.allSettled(scrapers.map((fn) => fn(date)))
    const raw: RawEvent[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') raw.push(...r.value)
      else console.error('  Scraper Fehler:', r.reason)
    }

    // ── Geo-filter
    const geoFiltered = raw.filter(geoFilterZuerich)
    if (raw.length - geoFiltered.length > 0)
      console.log(`  [Geo] ${raw.length - geoFiltered.length} Events ausgeschlossen`)

    // ── Venue URL enrichment
    for (const e of geoFiltered) {
      if (!e.url || isAggregatorUrl(e.url)) {
        const v = lookupVenueUrl(e.location, city)
        if (v) e.url = v
      }
    }

    // ── Split: Layer 1 (venue match) vs remainder
    console.log('  [2/5] Layer 1 — Venue Matching...')
    const layer1: RawEvent[] = []
    const remainder: RawEvent[] = []

    for (const e of geoFiltered) {
      const venue = matchVenue(e, venues, summer)
      if (venue) {
        e.layer = 'venue'
        e.venueId = `venue-${city}-${venue.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        e.eventType = eventTypeFromVenueCategory(venue.category)
        layer1.push(e)
      } else {
        remainder.push(e)
      }
    }
    console.log(`  [Layer 1] ${layer1.length} Venue-Events`)

    // ── Deduplicate Layer 1 itself (same event at same venue from multiple scrapers)
    const dedupL1 = deduplicateEvents(layer1)

    // ── Layer 2: infer types, filter, deduplicate against Layer 1
    console.log('  [3/5] Layer 2 — Discovery...')
    for (const e of remainder) {
      e.layer = 'discovery'
      e.eventType = inferEventTypeFromTitle(e.name)
    }

    const combined = deduplicateEvents([...dedupL1, ...remainder])
    const discoveryPool = combined.filter((e) => e.layer === 'discovery')
    console.log(`  [Layer 2] ${discoveryPool.length} Discovery-Events im Pool`)

    if (dedupL1.length === 0 && discoveryPool.length === 0) {
      console.warn('  [WARNUNG] Keine Events gefunden!')
      continue
    }

    // ── AI curation of discovery pool only
    console.log('  [4/5] AI-Kuratierung (Discovery)...')
    let chosenDiscovery: RawEvent[] = []
    try {
      if (discoveryPool.length > 0) {
        const picks = await curateDiscovery(discoveryPool, city)
        const pickNames = new Set(picks.map((p) => p.name.toLowerCase()))
        chosenDiscovery = discoveryPool.filter((e) =>
          pickNames.has(e.name.toLowerCase()) ||
          picks.some((p: { name: string }) =>
            e.name.toLowerCase().includes(p.name.toLowerCase()) ||
            p.name.toLowerCase().includes(e.name.toLowerCase())
          )
        )
        console.log(`  [Discovery] ${chosenDiscovery.length} von ${discoveryPool.length} ausgewählt`)
      }
    } catch (err) {
      console.error('  [AI] Kuratierung fehlgeschlagen, Discovery wird übersprungen:', err)
    }

    // ── Post-processing
    const allEvents = [...dedupL1, ...chosenDiscovery]
    const final = enforceNightlifeRatio(allEvents)
    final.sort((a, b) => a.time.localeCompare(b.time))

    const nightlifeCount = final.filter((e) => isNightlife(e.eventType ?? 'special')).length
    console.log(`  [5/5] ${final.length} Events total (${nightlifeCount} Nightlife, ${final.length - nightlifeCount} Kultur/Sonstige)`)

    // Mark all as curated
    const curatedIds = new Set(final.map((e) => e.name))
    await writeToSanity(final, date, city, curatedIds)
  }
}

// ─── Single-Layer Pipeline (Luzern, St. Gallen, …) ───────────────────────────

async function runSingleLayer(city: string, scrapers: ScraperFn[]) {
  for (const offset of [0, 1, 2]) {
    const date = getDate(offset)
    const label = ['Heute', 'Morgen', 'Übermorgen'][offset]
    console.log(`\n  ── ${label} (${date}) ──`)

    const results = await Promise.allSettled(scrapers.map((fn) => fn(date)))
    const raw: RawEvent[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') raw.push(...r.value)
      else console.error('  Scraper Fehler:', r.reason)
    }

    // Venue URL enrichment
    for (const e of raw) {
      if (!e.url || isAggregatorUrl(e.url)) {
        const v = lookupVenueUrl(e.location, city)
        if (v) e.url = v
      }
    }

    const geoFiltered = raw.filter((e) => geoFilterCity(e, city))
    if (raw.length - geoFiltered.length > 0)
      console.log(`  [Geo] ${raw.length - geoFiltered.length} Events ausgeschlossen`)

    if (geoFiltered.length === 0) {
      console.warn(`  [WARNUNG] Keine Events für ${city}/${date}`)
      continue
    }

    const unique = deduplicateEvents(geoFiltered)
    for (const e of unique) e.eventType = inferEventTypeFromTitle(e.name)

    console.log(`  [AI] Kuratierung (${unique.length} Events)...`)
    try {
      const curated = await curateEvents(unique, city)
      console.log(`  [AI] ${curated.length} von ${unique.length} ausgewählt`)

      for (const e of unique) {
        const match = curated.find((c) =>
          e.name.toLowerCase().includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(e.name.toLowerCase())
        )
        if (match) { e.name = match.name; e.location = match.location }
      }

      const curatedNames = new Set(curated.map((c) => c.name))
      await writeToSanity(unique, date, city, curatedNames)
    } catch (err) {
      console.error('  [FEHLER] Kuratierung fehlgeschlagen:', err)
      await writeToSanity(unique, date, city, new Set())
    }
  }
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export async function runPipeline() {
  const start = Date.now()
  console.log('=== waslauft.in Pipeline gestartet ===')
  console.log(`Zeitpunkt: ${new Date().toISOString()}`)

  for (const [city, config] of Object.entries(CITY_CONFIG)) {
    console.log(`\n══ Stadt: ${city.toUpperCase()} ══`)
    try {
      if (config.twoLayer) {
        await runTwoLayer(city, config.scrapers)
      } else {
        await runSingleLayer(city, config.scrapers)
      }
    } catch (err) {
      console.error(`[FEHLER] Pipeline für ${city} abgebrochen:`, err)
    }
  }

  console.log(`\n=== Pipeline abgeschlossen in ${((Date.now() - start) / 1000).toFixed(1)}s ===`)
}

if (process.argv[1]?.endsWith('pipeline.ts') || process.argv[1]?.endsWith('pipeline.js')) {
  runPipeline().catch((err) => { console.error('Fatal:', err); process.exit(1) })
}
