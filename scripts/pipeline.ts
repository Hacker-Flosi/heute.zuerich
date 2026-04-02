// scripts/pipeline.ts
// Tägliche Pipeline für heute.zürich
// Orchestriert: Scraping → Deduplizierung → AI-Kuratierung → Sanity
// Wird via Vercel Cron täglich um 05:00 ausgeführt

import { config } from 'dotenv'
config({ path: '.env.local' })
import { scrapeEventfrog } from './scrapers/eventfrog'
import { scrapeHellozurich } from './scrapers/hellozurich'
import { deduplicateEvents } from './deduplicate'
import { curateEvents } from './curate'
import { getSanityWriteClient } from '../src/lib/sanity'
import type { RawEvent } from './types'

/**
 * Gibt YYYY-MM-DD für heute + offset Tage zurück
 */
function getDate(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

/**
 * Schreibt kuratierte Events nach Sanity
 */
async function writeToSanity(events: RawEvent[], date: string, curatedIds: Set<string>) {
  const transaction = getSanityWriteClient().transaction()

  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const isCurated = curatedIds.has(event.name) // Match über bereinigten Namen
    const docId = `event-${date}-${i}`.replace(/[^a-zA-Z0-9-]/g, '-')

    transaction.createOrReplace({
      _type: 'event',
      _id: docId,
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
  console.log(`[Sanity] ${events.length} Events geschrieben für ${date}`)
}

/**
 * Hauptpipeline — wird täglich ausgeführt
 */
export async function runPipeline() {
  const startTime = Date.now()
  console.log('=== heute.zürich Pipeline gestartet ===')
  console.log(`Zeitpunkt: ${new Date().toISOString()}`)

  // Für 3 Tage ausführen: heute, morgen, übermorgen
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

    const allEvents: RawEvent[] = [
      ...(eventfrogEvents.status === 'fulfilled' ? eventfrogEvents.value : []),
      ...(hellozurichEvents.status === 'fulfilled' ? hellozurichEvents.value : []),
    ]

    if (allEvents.length === 0) {
      console.warn(`[WARNUNG] Keine Events gefunden für ${date}!`)
      continue
    }

    console.log(`[Scraping] Total: ${allEvents.length} Events`)

    // 2. DEDUPLIZIERUNG
    console.log('[2/4] Deduplizierung...')
    const uniqueEvents = deduplicateEvents(allEvents)

    // 3. AI-KURATIERUNG
    console.log('[3/4] AI-Kuratierung...')
    try {
      const curated = await curateEvents(uniqueEvents)

      console.log(`[Kuratierung] ${curated.length} von ${uniqueEvents.length} Events ausgewählt`)

      // c.id = original name; c.name = bereinigter Name von Claude
      // Wir matchen via originalem Namen (id) oder fuzzy über den bereinigten Namen
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

      // Nach dem Umbenennen: curated erkennen über aktualisierten Namen
      const curatedNames = new Set(curated.map((e) => e.name))

      // 4. IN SANITY SCHREIBEN
      console.log('[4/4] Sanity schreiben...')
      await writeToSanity(uniqueEvents, date, curatedNames)
    } catch (error) {
      console.error('[FEHLER] Kuratierung fehlgeschlagen:', error)
      // Fallback: Alle Events unkuratiert speichern
      console.log('[Fallback] Speichere alle Events ohne Kuratierung...')
      await writeToSanity(uniqueEvents, date, new Set())
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n=== Pipeline abgeschlossen in ${duration}s ===`)
}

// Direct execution
runPipeline().catch((error) => {
  console.error('Pipeline fatal error:', error)
  process.exit(1)
})
