// scripts/pipeline.ts
// Tägliche Pipeline für waslauft.in
// Orchestriert: Scraping → Geo-Filter → Dedup → Kuratierung → Sanity

import { scrapeEventfrog } from './scrapers/eventfrog'
import { scrapeHellozurich } from './scrapers/hellozurich'
import { deduplicateEvents } from './deduplicate'
import { curateEvents } from './curate'
import { getSanityWriteClient } from '../src/lib/sanity'
import type { RawEvent } from './types'

// Geo-filter: exclude events from outside Zürich city limits
const EXCLUDED_CITIES = [
  'winterthur', 'baden', 'brugg', 'aarau', 'rapperswil',
  'zug', 'schaffhausen', 'frauenfeld', 'olten', 'solothurn',
  'luzern', 'bern', 'st. gallen', 'luzerne',
]

function isInZuerich(event: RawEvent): boolean {
  const loc = event.location.toLowerCase()
  return !EXCLUDED_CITIES.some((city) => loc.includes(city))
}

function getDate(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

async function writeToSanity(events: RawEvent[], date: string, city: string, curatedNames: Set<string>) {
  const transaction = getSanityWriteClient().transaction()

  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const isCurated = curatedNames.has(event.name)
    const docId = `event-${city}-${date}-${i}`.replace(/[^a-zA-Z0-9-]/g, '-')

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

export async function runPipeline() {
  const startTime = Date.now()
  console.log('=== waslauft.in Pipeline gestartet ===')
  console.log(`Zeitpunkt: ${new Date().toISOString()}`)

  const city = 'zuerich'

  for (const offset of [0, 1, 2]) {
    const date = getDate(offset)
    const dayLabel = ['Heute', 'Morgen', 'Übermorgen'][offset]
    console.log(`\n--- ${dayLabel} (${date}) ---`)

    // 1. SCRAPING
    console.log('[1/4] Scraping...')
    const [eventfrogEvents, hellozurichEvents] = await Promise.allSettled([
      scrapeEventfrog(date),
      scrapeHellozurich(date),
    ])

    if (eventfrogEvents.status === 'rejected')
      console.error('[Eventfrog] Fehler:', eventfrogEvents.reason)
    if (hellozurichEvents.status === 'rejected')
      console.error('[hellozurich] Fehler:', hellozurichEvents.reason)

    const rawEvents: RawEvent[] = [
      ...(eventfrogEvents.status === 'fulfilled' ? eventfrogEvents.value : []),
      ...(hellozurichEvents.status === 'fulfilled' ? hellozurichEvents.value : []),
    ]

    // 2. GEO-FILTER
    const allEvents = rawEvents.filter(isInZuerich)
    const filtered = rawEvents.length - allEvents.length
    if (filtered > 0) console.log(`[Geo] ${filtered} Events aus Umgebung ausgeschlossen`)

    if (allEvents.length === 0) {
      console.warn(`[WARNUNG] Keine Events gefunden für ${date}!`)
      continue
    }

    console.log(`[Scraping] Total nach Geo-Filter: ${allEvents.length} Events`)

    // 3. DEDUPLIZIERUNG
    console.log('[2/4] Deduplizierung...')
    const uniqueEvents = deduplicateEvents(allEvents)

    // 4. AI-KURATIERUNG
    console.log('[3/4] AI-Kuratierung...')
    try {
      const curated = await curateEvents(uniqueEvents, city)

      console.log(`[Kuratierung] ${curated.length} von ${uniqueEvents.length} Events ausgewählt`)

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

      // 5. IN SANITY SCHREIBEN
      console.log('[4/4] Sanity schreiben...')
      await writeToSanity(uniqueEvents, date, city, curatedNames)
    } catch (error) {
      console.error('[FEHLER] Kuratierung fehlgeschlagen:', error)
      console.log('[Fallback] Speichere alle Events ohne Kuratierung...')
      await writeToSanity(uniqueEvents, date, city, new Set())
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
