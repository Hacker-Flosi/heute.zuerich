// scripts/scrapers/eventfrog.ts
// Eventfrog Scraper — used for both Layer 1 (venue matching) and Layer 2 (discovery)

import { EventfrogService, EventfrogEventRequest } from 'eventfrog-api'
import type { RawEvent } from '../types'
import { isAggregatorUrl } from '../venues'

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
          if (v != null) params.append(key, String(v))
        }
      } else if (val !== null && val !== undefined && typeof val !== 'object') {
        params.append(key, String(val))
      }
    }
    params.append('apiKey', this._key)
    const url = `https://api.eventfrog.net/api/v1${edge}?${params.toString()}`
    // Throttle all sub-requests (events + locations + groups) to avoid 429s
    await new Promise((r) => setTimeout(r, 400))
    // Retry up to 3× on 429 with exponential backoff (30s, 60s, 120s)
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(url, { method: 'GET' })
      if (response.status === 429) {
        const waitMs = 30_000 * Math.pow(2, attempt)
        console.warn(`[Eventfrog] 429 — warte ${waitMs / 1000}s (Versuch ${attempt + 1}/3)`)
        await new Promise((r) => setTimeout(r, waitMs))
        continue
      }
      if (!response.ok) return Promise.reject('Request returned ' + response.status)
      return response.json()
    }
    return Promise.reject('Request returned 429 (nach 3 Versuchen)')
  }

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

/** Returns YYYY-MM-DD in Europe/Zurich timezone, zero-padded. */
function toZurichDate(d: Date): string {
  const local = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Zurich' }))
  const y = local.getFullYear()
  const m = String(local.getMonth() + 1).padStart(2, '0')
  const day = String(local.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Mittelpunkt + Radius pro Stadt. Eventfrog filtert serverseitig nach Datum und Ort —
// ohne Filter wären es ~2'500 Events pro Tag für die ganze Schweiz (Stand Okt. 2026).
const CITY_GEO: Record<string, { lat: number; lng: number; r: number }> = {
  zuerich:    { lat: 47.3769, lng: 8.5417, r: 12 },
  basel:      { lat: 47.5596, lng: 7.5886, r: 8 },
  stgallen:   { lat: 47.4245, lng: 9.3767, r: 8 },
  luzern:     { lat: 47.0502, lng: 8.3093, r: 8 },
  winterthur: { lat: 47.4988, lng: 8.7237, r: 6 },
}

export async function scrapeEventfrog(
  date: string,
  city: string,
  maxPages = 10,
  pageDelayMs = 1000,
): Promise<RawEvent[]> {
  patchEventfrogService()

  const apiKey = process.env.EVENTFROG_API_KEY
  if (!apiKey) throw new Error('EVENTFROG_API_KEY nicht gesetzt')
  const geo = CITY_GEO[city]
  if (!geo) throw new Error(`Eventfrog: keine Koordinaten für Stadt "${city}"`)

  const service = new EventfrogService(apiKey)
  const events: RawEvent[] = []
  let page = 1

  while (page <= maxPages) {
    const request = new EventfrogEventRequest({ perPage: 100, page, from: date, to: date, ...geo })
    const batch = await service.loadEvents(request) as any[]

    if (!batch.length) break

    for (const event of batch) {
      const startDate: Date = event.startDate
      // from/to liefert auch mehrtägige Events, die an diesem Tag laufen — nur Starts am Tag behalten
      if (toZurichDate(startDate) !== date) continue

      const time = startDate.toLocaleTimeString('de-CH', {
        hour: '2-digit', minute: '2-digit', hour12: false,
        timeZone: 'Europe/Zurich',
      })

      const locationFullName: string = event.location?.title ?? ''
      const locationCity: string = event.location?.city ?? ''
      const locationName: string = locationFullName || locationCity || 'Zürich'

      const rawLink: string = event.link ?? ''
      const url: string =
        event.organizer?.website?.trim() ||
        (!isAggregatorUrl(rawLink) ? rawLink : '') ||
        ''

      events.push({
        name: event.title ?? 'Unbekanntes Event',
        rawName: event.title ?? 'Unbekanntes Event',
        location: locationName,
        date,
        time,
        url,
        source: 'eventfrog',
        locationCity: locationCity || undefined,
      })
    }

    if (batch.length < 100) break
    if (pageDelayMs > 0) await new Promise((r) => setTimeout(r, pageDelayMs))
    page++
  }

  console.log(`[Eventfrog] ${events.length} Events für ${city} ${date} (${page} Seiten)`)
  return events
}

/** Scraper-Funktion für CITY_CONFIG — bindet die Stadt, Name bleibt für Fehler-Logs lesbar. */
export function eventfrogFor(city: string): (date: string) => Promise<RawEvent[]> {
  const fn = (date: string) => scrapeEventfrog(date, city)
  Object.defineProperty(fn, 'name', { value: 'scrapeEventfrog' })
  return fn
}
