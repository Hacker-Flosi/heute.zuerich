// scripts/pipeline.ts
// waslauft.in Daily Pipeline
// Zürich: Two-Layer (venue-first + AI discovery)
// Other cities: Single-layer (AI curation of all events)

import { postInstagram } from './post-instagram'
import { scrapeEventfrog } from './scrapers/eventfrog'
import { scrapeHellozurich } from './scrapers/hellozurich'
import { scrapeGangus } from './scrapers/gangus'
import { scrapeResidentAdvisor } from './scrapers/residentadvisor'
import { deduplicateEvents } from './deduplicate'
import { curateEvents, curateDiscovery, curateRainReserve } from './curate'
import { getSanityClient, getSanityWriteClient } from '../src/lib/sanity'
import { lookupVenueUrl, isAggregatorUrl } from './venues'
import { fetchWeather } from '../src/lib/weather'
import { inferEventTypeFromTitle, eventTypeFromVenueCategory, isNightlife } from './eventtype'
import type { RawEvent, SanityVenue } from './types'

// ─── Config ───────────────────────────────────────────────────────────────────

type ScraperFn = (date: string) => Promise<RawEvent[]>

const CITY_CONFIG: Record<string, { twoLayer: boolean; scrapers: ScraperFn[] }> = {
  zuerich:  { twoLayer: true, scrapers: [scrapeEventfrog, scrapeHellozurich, scrapeResidentAdvisor] },
  stgallen: { twoLayer: true, scrapers: [scrapeEventfrog] },
  luzern:   { twoLayer: true, scrapers: [scrapeGangus, scrapeEventfrog] },
  // Basel + Bern: Coming Soon — not scraped until active
}

// Zürich: blacklist approach (exclude surrounding cities)
const ZH_EXCLUDED = [
  'winterthur', 'baden', 'brugg', 'aarau', 'rapperswil', 'zug',
  'schaffhausen', 'frauenfeld', 'olten', 'solothurn', 'luzern',
  'bern', 'st. gallen',
]

// All other cities: whitelist approach (location must contain at least one term)
const CITY_INCLUSIONS: Record<string, string[]> = {
  basel:    ['basel', 'riehen'],
  bern:     ['bern', 'muri bei bern', 'köniz'],
  stgallen: ['st. gallen', 'st gallen', 'st.gallen', 'saint-gallen'],
  luzern:   ['luzern', 'lucerne', 'kriens', 'horw', 'ebikon'],
}

// Cities excluded from whitelist even if they contain a matching term
const CITY_EXCLUSIONS: Record<string, string[]> = {
  basel:    ['liestal', 'aesch', 'muttenz', 'lörrach', 'weil am rhein'],
  bern:     ['thun', 'biel', 'burgdorf', 'langenthal'],
  stgallen: ['rorschach', 'herisau', 'gossau', 'wil'],
  luzern:   ['sursee', 'emmen', 'zug'],
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
  const excluded = CITY_EXCLUSIONS[city] ?? []
  if (excluded.some((excl) => loc.includes(excl))) return false
  return inclusions.some((incl) => loc.includes(incl))
}

// Generic words that appear in many unrelated location strings — never use for matching.
// Includes all city names used as suffixes in eventfrogName (e.g. "Grabenhalle St. Gallen")
const VENUE_STOPWORDS = new Set([
  // Zürich
  'zürich', 'zuerich', 'zurich',
  // St. Gallen — "st" is already <4 chars, but "gallen" must be excluded
  'gallen',
  // Luzern
  'luzern', 'lucerne',
  // Basel
  'basel', 'riehen',
  // Bern
  'bern', 'berne',
  // Generic venue-type words
  'club', 'bar', 'the', 'und', 'von', 'der', 'die', 'das', 'für',
  'garten', 'kirche', 'museum', 'theater', 'halle', 'haus',
  'zentrum', 'hof', 'platz', 'str', 'strasse', 'restaurant',
])

/** Strip trailing city suffix from venue names like "Grabenhalle St. Gallen" → "Grabenhalle" */
function stripCitySuffix(name: string): string {
  return name
    .replace(/\s+st\.?\s+gallen$/i, '')
    .replace(/\s+luzern$/i, '')
    .replace(/\s+z[uü]rich$/i, '')
    .replace(/\s+basel$/i, '')
    .replace(/\s+bern$/i, '')
    .trim()
}

/** Extract venue-specific tokens: ≥4 chars, not a stopword */
function venueTokens(s: string): string[] {
  return s.toLowerCase()
    .split(/[\s\-\/&,.()+]+/)
    .filter((t) => t.length >= 4 && !VENUE_STOPWORDS.has(t))
}

/** Match a venue against the event's location string.
 *  Pass 1: word-boundary match on name + stripped name + eventfrogName + stripped eventfrogName.
 *  Pass 2: token overlap using only the stripped name (no city suffix tokens). */
function matchVenue(event: RawEvent, venues: SanityVenue[], summer: boolean): SanityVenue | null {
  const loc = event.location.toLowerCase()
  const locTokens = venueTokens(loc)

  const sorted = summer
    ? [...venues].sort((a, b) => (b.summerBonus ? 1 : 0) - (a.summerBonus ? 1 : 0))
    : venues

  // Pass 1: word-boundary substring match (try full name AND city-stripped name)
  const exact = sorted.find((v) => {
    const names = [v.name, stripCitySuffix(v.name), v.eventfrogName, v.eventfrogName ? stripCitySuffix(v.eventfrogName) : undefined]
      .filter((n): n is string => !!n)
      .map((n) => n.toLowerCase())
    return names.some((n) => {
      const re = new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
      return re.test(loc)
    })
  })
  if (exact) return exact

  // Pass 2: token overlap — use ONLY stripped name (no city suffix) to avoid "gallen" matching everything
  return sorted.find((v) => {
    const vTok = venueTokens(stripCitySuffix(v.name))
    return vTok.length > 0 && vTok.some((t) => locTokens.includes(t))
  }) ?? null
}

const TARGET_EVENTS = 30

/** Enforce ≥60% nightlife ratio — only for Zürich AND only when pool > 30 events. */
function enforceNightlifeRatio(events: RawEvent[], city: string): RawEvent[] {
  if (events.length === 0) return events
  if (city !== 'zuerich') return events
  if (events.length <= TARGET_EVENTS) return events  // don't trim small pools
  const nightlife = events.filter((e) => isNightlife(e.eventType ?? 'special'))
  const other = events.filter((e) => !isNightlife(e.eventType ?? 'special'))
  if (nightlife.length === 0) return events
  const ratio = nightlife.length / events.length
  if (ratio >= 0.6) return events
  const maxOther = Math.floor(nightlife.length / 0.6 * 0.4)
  return [...nightlife, ...other.slice(0, maxOther)]
}

/** Fill up to TARGET_EVENTS using remaining discovery pool (not AI-chosen).
 *  Adds events sorted by eventType priority (nightlife first). */
function fillToTarget(chosen: RawEvent[], pool: RawEvent[]): RawEvent[] {
  if (chosen.length >= TARGET_EVENTS) return chosen
  const chosenIds = new Set(chosen.map((e) => e.name.toLowerCase()))
  const remaining = pool
    .filter((e) => !chosenIds.has(e.name.toLowerCase()))
    .sort((a, b) => {
      // nightlife events first when filling
      const aNl = isNightlife(a.eventType ?? 'special') ? 0 : 1
      const bNl = isNightlife(b.eventType ?? 'special') ? 0 : 1
      return aNl - bNl
    })
  const needed = TARGET_EVENTS - chosen.length
  return [...chosen, ...remaining.slice(0, needed)]
}

async function hasEventsForDate(city: string, date: string): Promise<boolean> {
  const client = getSanityClient()
  const count = await client.fetch<number>(
    `count(*[_type == "event" && city == $city && date == $date])`,
    { city, date }
  )
  return count > 0
}

async function loadActiveVenues(city: string): Promise<SanityVenue[]> {
  const client = getSanityClient()
  return client.fetch<SanityVenue[]>(
    `*[_type == "venue" && city == $city && active == true] | order(tier asc, name asc)`,
    { city }
  )
}

async function writeToSanity(
  events: RawEvent[],
  date: string,
  city: string,
  curatedIds: Set<string>,
  rainReserveIds: Set<string> = new Set(),
) {
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
    const isRainReserve = rainReserveIds.has(e.name)
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
      rainReserve: isRainReserve,
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

  for (const [offsetIdx, offset] of ([0, 1, 2] as const).entries()) {
    if (offsetIdx > 0) await new Promise((r) => setTimeout(r, 5_000))
    const date = getDate(offset)
    const label = ['Heute', 'Morgen', 'Übermorgen'][offset]
    console.log(`\n  ── ${label} (${date}) ──`)

    if (await hasEventsForDate(city, date)) {
      console.log('  [Skip] Bereits kuratiert — übersprungen')
      continue
    }

    // ── Scraping
    console.log('  [1/5] Scraping...')
    const results = await Promise.allSettled(scrapers.map((fn) => fn(date)))
    const raw: RawEvent[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') raw.push(...r.value)
      else console.error('  Scraper Fehler:', r.reason)
    }

    // ── Geo-filter (Zürich uses blacklist; all other cities use whitelist)
    const geoFilter = city === 'zuerich' ? geoFilterZuerich : (e: RawEvent) => geoFilterCity(e, city)
    const geoFiltered = raw.filter(geoFilter)
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
        // Title inference takes priority for specific types (workshop, markt, kunst, open_air)
        // Venue category is used as fallback for generic titles
        const titleType = inferEventTypeFromTitle(e.name)
        const venueType = eventTypeFromVenueCategory(venue.category)
        const specificTypes = new Set(['kunst', 'markt', 'open_air', 'special', 'dj_club', 'kultur'])
        e.eventType = specificTypes.has(titleType) ? titleType : venueType
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
          picks.some((p) =>
            e.name.toLowerCase().includes(p.name.toLowerCase()) ||
            p.name.toLowerCase().includes(e.name.toLowerCase())
          )
        )
        // Apply AI-provided eventType
        for (const e of chosenDiscovery) {
          const pick = picks.find((p) =>
            e.name.toLowerCase().includes(p.name.toLowerCase()) ||
            p.name.toLowerCase().includes(e.name.toLowerCase())
          )
          if (pick?.eventType) e.eventType = pick.eventType as import('./types').EventType
        }
        console.log(`  [Discovery] ${chosenDiscovery.length} von ${discoveryPool.length} ausgewählt`)
      }
    } catch (err) {
      console.error('  [AI] Kuratierung fehlgeschlagen, Discovery wird übersprungen:', err)
    }

    // ── Post-processing: fill to 30, then apply nightlife ratio
    const aiChosen = [...dedupL1, ...chosenDiscovery]
    const filled = fillToTarget(aiChosen, discoveryPool)
    const final = enforceNightlifeRatio(filled, city)
    final.sort((a, b) => a.time.localeCompare(b.time))

    const nightlifeCount = final.filter((e) => isNightlife(e.eventType ?? 'special')).length
    console.log(`  [5/5] ${final.length} Events total (${nightlifeCount} Nightlife, ${final.length - nightlifeCount} Kultur/Sonstige)`)

    // ── Rain Reserve (if rainy today)
    const curatedIds = new Set(final.map((e) => e.name))
    let rainReserveIds = new Set<string>()

    const weather = await fetchWeather(city)
    if (weather?.isRainy) {
      console.log(`  [Rain] ${weather.description} — kuratiere Rain Reserve...`)
      const unusedPool = geoFiltered.filter((e) => !curatedIds.has(e.name))
      try {
        const rainPicks = await curateRainReserve(unusedPool, city)
        for (const pick of rainPicks) {
          const match = unusedPool.find((e) =>
            e.name.toLowerCase().includes(pick.name.toLowerCase()) ||
            pick.name.toLowerCase().includes(e.name.toLowerCase())
          )
          if (match) {
            match.name = pick.name
            match.location = pick.location
            if (pick.eventType) match.eventType = pick.eventType as import('./types').EventType
            rainReserveIds.add(match.name)
            final.push(match)
          }
        }
        console.log(`  [Rain] ${rainReserveIds.size} Rain-Reserve Events hinzugefügt`)
      } catch (err) {
        console.error('  [Rain] Kuratierung fehlgeschlagen:', err)
      }
    }

    await writeToSanity(final, date, city, curatedIds, rainReserveIds)
  }
}

// ─── Single-Layer Pipeline (Luzern, St. Gallen, …) ───────────────────────────

async function runSingleLayer(city: string, scrapers: ScraperFn[]) {
  for (const offset of [0, 1, 2]) {
    const date = getDate(offset)
    const label = ['Heute', 'Morgen', 'Übermorgen'][offset]
    console.log(`\n  ── ${label} (${date}) ──`)

    if (await hasEventsForDate(city, date)) {
      console.log('  [Skip] Bereits kuratiert — übersprungen')
      continue
    }

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

    console.log(`  [AI] Kuratierung (${unique.length} Events)...`)
    try {
      const curated = await curateEvents(unique, city)
      console.log(`  [AI] ${curated.length} von ${unique.length} ausgewählt`)

      for (const e of unique) {
        const match = curated.find((c) =>
          e.name.toLowerCase().includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(e.name.toLowerCase())
        )
        if (match) {
          e.name = match.name
          e.location = match.location
          if (match.eventType) e.eventType = match.eventType as import('./types').EventType
        }
      }

      const curatedNames = new Set(curated.map((c) => c.name))
      let rainReserveIds = new Set<string>()

      const weather = await fetchWeather(city)
      if (weather?.isRainy) {
        console.log(`  [Rain] ${weather.description} — kuratiere Rain Reserve...`)
        const unusedPool = unique.filter((e) => !curatedNames.has(e.name))
        try {
          const rainPicks = await curateRainReserve(unusedPool, city)
          for (const pick of rainPicks) {
            const match = unusedPool.find((e) =>
              e.name.toLowerCase().includes(pick.name.toLowerCase()) ||
              pick.name.toLowerCase().includes(e.name.toLowerCase())
            )
            if (match) {
              match.name = pick.name
              match.location = pick.location
              if (pick.eventType) match.eventType = pick.eventType as import('./types').EventType
              rainReserveIds.add(match.name)
              unique.push(match)
            }
          }
          console.log(`  [Rain] ${rainReserveIds.size} Rain-Reserve Events hinzugefügt`)
        } catch (err) {
          console.error('  [Rain] Kuratierung fehlgeschlagen:', err)
        }
      }

      await writeToSanity(unique, date, city, curatedNames, rainReserveIds)
    } catch (err) {
      console.error('  [FEHLER] Kuratierung fehlgeschlagen:', err)
      await writeToSanity(unique, date, city, new Set())
    }
  }
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

async function deleteExpiredEvents() {
  const client = getSanityWriteClient()
  const today = getDate(0)
  const expired: string[] = await client.fetch(
    `*[_type == "event" && date < $today]._id`,
    { today }
  )
  if (expired.length === 0) {
    console.log('  [Cleanup] Keine abgelaufenen Events')
    return
  }
  const tx = client.transaction()
  for (const id of expired) tx.delete(id)
  await tx.commit()
  console.log(`  [Cleanup] ${expired.length} abgelaufene Events gelöscht`)
}

export async function runPipeline() {
  const start = Date.now()
  console.log('=== waslauft.in Pipeline gestartet ===')
  console.log(`Zeitpunkt: ${new Date().toISOString()}`)

  console.log('\n── Cleanup abgelaufene Events ──')
  await deleteExpiredEvents()

  const cities = Object.entries(CITY_CONFIG)
  for (let i = 0; i < cities.length; i++) {
    const [city, config] = cities[i]
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
    // Pause between cities to avoid Eventfrog rate-limiting (429)
    if (i < cities.length - 1) {
      console.log('  [Rate-Limit] 30s Pause vor nächster Stadt...')
      await new Promise((resolve) => setTimeout(resolve, 30_000))
    }
  }

  console.log(`\n=== Pipeline abgeschlossen in ${((Date.now() - start) / 1000).toFixed(1)}s ===`)

  // Instagram Post für Zürich (nur wenn INSTAGRAM_ACCOUNT_ID gesetzt)
  if (process.env.INSTAGRAM_ACCOUNT_ID && process.env.META_ACCESS_TOKEN) {
    console.log('\n── Instagram Post ──')
    try {
      await postInstagram()
    } catch (err) {
      console.error('[instagram] Post fehlgeschlagen:', err)
    }
  }
}

if (process.argv[1]?.endsWith('pipeline.ts') || process.argv[1]?.endsWith('pipeline.js')) {
  runPipeline().catch((err) => { console.error('Fatal:', err); process.exit(1) })
}
