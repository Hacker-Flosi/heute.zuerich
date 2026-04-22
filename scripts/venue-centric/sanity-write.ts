// scripts/venue-centric/sanity-write.ts
// Schreibt NormalizedEvents als eventVenueCentric-Dokumente in Sanity

import { getSanityWriteClient } from '../../src/lib/sanity'
import type { NormalizedEvent } from './types'

// ─── Stabile Dokument-ID aus Event-Daten ─────────────────────────────────────
// Format: evc-<venueId-kurz>-<datum>-<titel-slug>
// Gleiche Events aus verschiedenen Runs überschreiben sich (idempotent).

function makeDocId(event: NormalizedEvent): string {
  const venueShort = event.venueId.replace(/^drafts\./, '').slice(-8)
  const titleSlug  = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
  return `evc-${venueShort}-${event.startDate}-${titleSlug}`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export interface WriteResult {
  written: number
  errors:  number
}

export async function writeToCentricCollection(
  events: NormalizedEvent[],
): Promise<WriteResult> {
  const client = getSanityWriteClient()
  let written = 0
  let errors  = 0

  for (const event of events) {
    try {
      const docId = makeDocId(event)
      await client
        .transaction()
        .createOrReplace({
          _id:   docId,
          _type: 'eventVenueCentric',
          title:          event.title,
          venue:          { _type: 'reference', _ref: event.venueId },
          city:           event.city,
          startDate:      event.startDate,
          startTime:      event.startTime,
          endDate:        event.endDate,
          description:    event.description,
          imageUrl:       event.imageUrl,
          ticketUrl:      event.ticketUrl,
          eventUrl:       event.eventUrl,
          price:          event.price,
          sourceType:     event.sourceType,
          sourceUrl:      event.sourceUrl,
          sourcePriority: event.sourcePriority,
          rawId:          event.rawId,
          isDuplicate:    false,
          scrapedAt:      event.scrapedAt,
        })
        .commit()
      written++
    } catch (err) {
      console.error(`[sanity-write] Fehler bei "${event.title}":`, err)
      errors++
    }
  }

  return { written, errors }
}

// ─── Cleanup: abgelaufene eventVenueCentric-Dokumente löschen ─────────────────

export async function cleanupOldCentricEvents(beforeDate: string): Promise<number> {
  const client = getSanityWriteClient()
  const ids: string[] = await client.fetch(
    `*[_type == "eventVenueCentric" && startDate < $date]._id`,
    { date: beforeDate }
  )
  for (const id of ids) await client.delete(id)
  return ids.length
}
