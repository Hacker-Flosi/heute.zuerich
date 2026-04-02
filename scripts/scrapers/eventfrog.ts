// scripts/scrapers/eventfrog.ts
// Eventfrog Scraper für heute.zürich
// Nutzt das eventfrog-api npm Package: https://github.com/poljpocket/eventfrog-api

import { EventfrogService, EventfrogEventRequest } from 'eventfrog-api'
import type { RawEvent } from '../types'

// Fix: package uses protocol-relative URL (//...) designed for browsers.
// Node.js fetch rejects it. We override _get to hardcode https://.
// Also guard mapLocations/mapGroups against empty ID arrays (causes 404).
function patchEventfrogService() {
  const proto = EventfrogService.prototype as any
  if (proto.__patched) return

  proto._get = async function (edge: string, request: any) {
    const params = new URLSearchParams()
    const opts = request.options
    for (const key of Object.keys(opts)) {
      const val = opts[key]
      if (Array.isArray(val)) {
        for (const v of val) {
          if (v != null) params.append(key, String(v)) // skip null locationIds
        }
      } else if (val !== null && val !== undefined && typeof val !== 'object') {
        params.append(key, String(val))
      }
    }
    params.append('apiKey', this._key)
    const url = `https://api.eventfrog.net/api/v1${edge}?${params.toString()}`
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) return Promise.reject('Request returned ' + response.status)
    return response.json()
  }

  // Guard: skip location/group lookups when there are no events (avoids 404 on empty id=[])
  const origMapLocations = proto.mapLocations
  proto.mapLocations = async function (events: any[]) {
    if (!events.length) return
    return origMapLocations.call(this, events)
  }

  const origMapGroups = proto.mapGroups
  proto.mapGroups = async function (events: any[]) {
    if (!events.length) return
    return origMapGroups.call(this, events)
  }

  proto.__patched = true
}

/**
 * Holt Events von Eventfrog für ein bestimmtes Datum in Zürich
 *
 * Note: The API key scope is limited — city/date filter params are ignored by the API.
 * We fetch all available events and filter client-side by startDate.
 *
 * @param date - Datum im Format YYYY-MM-DD
 * @returns Array von normalisierten RawEvents
 */
export async function scrapeEventfrog(date: string): Promise<RawEvent[]> {
  patchEventfrogService()

  const apiKey = process.env.EVENTFROG_API_KEY
  if (!apiKey) throw new Error('EVENTFROG_API_KEY nicht gesetzt')

  const service = new EventfrogService(apiKey)
  const events: RawEvent[] = []
  let page = 1

  while (true) {
    const request = new EventfrogEventRequest({ perPage: 100, page })
    const batch = await service.loadEvents(request) as any[]

    for (const event of batch) {
      const startDate: Date = event.startDate
      // Filter client-side: only events that start on the target date (Europe/Zurich)
      const eventDateStr = startDate.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })
      if (eventDateStr !== date) continue

      const time = startDate.toLocaleTimeString('de-CH', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Europe/Zurich',
      })

      const locationName: string =
        event.location?.title ?? event.location?.city ?? 'Zürich'

      // Prefer organizer website; fall back to eventfrog event page
      const url: string =
        event.organizer?.website
        ?? event.link
        ?? `https://eventfrog.ch/de/events/${event.id}`

      events.push({
        name: event.title ?? 'Unbekanntes Event',
        rawName: event.title ?? 'Unbekanntes Event',
        location: locationName,
        date,
        time,
        url,
        source: 'eventfrog',
      })
    }

    if (batch.length < 100) break
    page++
  }

  console.log(`[Eventfrog] ${events.length} Events gefunden für ${date}`)
  return events
}
