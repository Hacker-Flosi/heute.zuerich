import 'dotenv/config'
import { EventfrogService, EventfrogEventRequest } from 'eventfrog-api'

// Fix: package uses protocol-relative URL (//...) designed for browsers.
// Node.js fetch rejects it. We override _get on the prototype to hardcode https://.
// (Assigning EventfrogService._base directly doesn't work due to ESM/CJS interop.)
const proto = EventfrogService.prototype as any
proto._get = async function (edge: string, request: any) {
  const params = new URLSearchParams()
  const opts = request.options
  for (const key of Object.keys(opts)) {
    const val = opts[key]
    if (Array.isArray(val)) {
      for (const v of val) params.append(key, String(v))
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

const API_KEY = process.env.EVENTFROG_API_KEY
if (!API_KEY) { console.error('❌ EVENTFROG_API_KEY fehlt'); process.exit(1) }

async function run() {
  console.log('\n🔍 Teste Eventfrog via npm Package...\n')

  const service = new EventfrogService(API_KEY)
  const request = new EventfrogEventRequest({
    perPage: 5,
    city: 'Zürich',
  })

  try {
    const events = await service.loadEvents(request)
    console.log(`✅ ${events.length} Events gefunden!\n`)
    if (events.length > 0) {
      console.log('=== ERSTES EVENT ===')
      const e = events[0] as any
      console.log(JSON.stringify({
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        link: e.link,
        location: e.location ? { title: e.location.title, city: e.location.city, address: e.location.address } : null,
        group: e.group ? { title: (e.group as any).title } : null,
      }, null, 2))
    }
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

run()
