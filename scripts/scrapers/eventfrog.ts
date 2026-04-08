// scripts/scrapers/eventfrog.ts
// Eventfrog Scraper — used for both Layer 1 (venue matching) and Layer 2 (discovery)

import { EventfrogService, EventfrogEventRequest } from 'eventfrog-api'
import type { RawEvent } from '../types'
import { isAggregatorUrl } from '../venues'

const MAX_PAGES = 5

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
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) return Promise.reject('Request returned ' + response.status)
    return response.json()
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

export async function scrapeEventfrog(date: string): Promise<RawEvent[]> {
  patchEventfrogService()

  const apiKey = process.env.EVENTFROG_API_KEY
  if (!apiKey) throw new Error('EVENTFROG_API_KEY nicht gesetzt')

  const service = new EventfrogService(apiKey)
  const events: RawEvent[] = []
  let page = 1

  while (page <= MAX_PAGES) {
    const request = new EventfrogEventRequest({ perPage: 100, page })
    const batch = await service.loadEvents(request) as any[]

    for (const event of batch) {
      const startDate: Date = event.startDate
      if (toZurichDate(startDate) !== date) continue

      const time = startDate.toLocaleTimeString('de-CH', {
        hour: '2-digit', minute: '2-digit', hour12: false,
        timeZone: 'Europe/Zurich',
      })

      // Full location title (used for venue matching in Layer 1)
      const locationFullName: string = event.location?.title ?? ''
      const locationCity: string = event.location?.city ?? ''
      const locationName: string = locationFullName || locationCity || 'Zürich'

      const link = event.link?.trim() ?? ''
      const url: string =
        event.organizer?.website?.trim() ||
        (link && !isAggregatorUrl(link) ? link : '') ||
        `https://eventfrog.ch/de/veranstaltungen/${event.id}`

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
    page++
  }

  console.log(`[Eventfrog] ${events.length} Events gefunden für ${date}`)
  return events
}
