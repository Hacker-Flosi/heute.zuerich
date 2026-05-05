/**
 * scripts/diagnose-overmorgen.ts
 *
 * Zeigt wie Eventfrog-Events über Seiten verteilt sind.
 * Dokumentiert warum übermorgen-Events fehlen und wie viele Seiten benötigt werden.
 *
 * Run: npx ts-node -r tsconfig-paths/register scripts/diagnose-overmorgen.ts
 */

import { EventfrogService, EventfrogEventRequest } from 'eventfrog-api'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

function patchService() {
  const proto = (EventfrogService as any).prototype
  if (proto.__patched) return
  proto._get = async function (edge: string, request: any) {
    const params = new URLSearchParams()
    const opts = request.options
    for (const key of Object.keys(opts)) {
      const val = opts[key]
      if (Array.isArray(val)) {
        for (const v of val) { if (v != null) params.append(key, String(v)) }
      } else if (val !== null && val !== undefined && typeof val !== 'object') {
        params.append(key, String(val))
      }
    }
    params.append('apiKey', this._key)
    const url = `https://api.eventfrog.net/api/v1${edge}?${params.toString()}`
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(url)
      if (res.status === 429) {
        const wait = 30_000 * Math.pow(2, attempt)
        console.warn(`  [429] Warte ${wait / 1000}s...`)
        await new Promise(r => setTimeout(r, wait))
        continue
      }
      if (!res.ok) return Promise.reject('HTTP ' + res.status)
      return res.json()
    }
    return Promise.reject('429 nach 3 Versuchen')
  }
  const om = proto.mapLocations
  proto.mapLocations = async function (events: any[]) { if (events.length) return om.call(this, events) }
  const og = proto.mapGroups
  proto.mapGroups = async function (events: any[]) { if (events.length) return og.call(this, events) }
  proto.__patched = true
}

function toZurichDate(d: Date): string {
  const local = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Zurich' }))
  const y = local.getFullYear()
  const m = String(local.getMonth() + 1).padStart(2, '0')
  const day = String(local.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getZurichDate(offset: number): string {
  const base = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })
  const d = new Date(base)
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

async function diagnose() {
  patchService()

  const apiKey = process.env.EVENTFROG_API_KEY
  if (!apiKey) { console.error('EVENTFROG_API_KEY fehlt'); process.exit(1) }

  const heute      = getZurichDate(0)
  const morgen     = getZurichDate(1)
  const uebermorgen = getZurichDate(2)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  Eventfrog Seitenverteilung — ${new Date().toLocaleString('de-CH', { timeZone: 'Europe/Zurich' })}`)
  console.log(`  Heute:      ${heute}`)
  console.log(`  Morgen:     ${morgen}`)
  console.log(`  Übermorgen: ${uebermorgen}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const service = new EventfrogService(apiKey)

  const counts: Record<string, { heute: number; morgen: number; uebermorgen: number; other: number }> = {}

  let page = 1
  const MAX_PAGES = 40
  let heuteFirstPage: number | null = null
  let morgenFirstPage: number | null = null
  let uebermorgenFirstPage: number | null = null
  let uebermorgenLastPage: number | null = null
  let seenPastUebermorgen = false

  console.log('\n  Seite │ Heute │ Morgen │ Übermorgen │ Rest  │ Summe')
  console.log('  ──────┼───────┼────────┼────────────┼───────┼──────')

  while (page <= MAX_PAGES) {
    const request = new EventfrogEventRequest({ perPage: 100, page })
    const batch = await service.loadEvents(request) as any[]

    if (!batch.length) break

    const c = { heute: 0, morgen: 0, uebermorgen: 0, other: 0 }
    for (const event of batch) {
      const d = toZurichDate(event.startDate)
      if (d === heute)        c.heute++
      else if (d === morgen)  c.morgen++
      else if (d === uebermorgen) c.uebermorgen++
      else c.other++
      if (d > uebermorgen)    seenPastUebermorgen = true
    }

    counts[page] = c

    if (c.heute > 0 && heuteFirstPage === null)           heuteFirstPage = page
    if (c.morgen > 0 && morgenFirstPage === null)         morgenFirstPage = page
    if (c.uebermorgen > 0) {
      if (uebermorgenFirstPage === null) uebermorgenFirstPage = page
      uebermorgenLastPage = page
    }

    const tag = []
    if (page === heuteFirstPage)        tag.push('← heute start')
    if (page === morgenFirstPage)       tag.push('← morgen start')
    if (page === uebermorgenFirstPage)  tag.push('← ÜBERMORGEN START')
    if (seenPastUebermorgen && c.uebermorgen === 0 && uebermorgenLastPage !== null && page === uebermorgenLastPage + 1)
      tag.push('← übermorgen fertig')

    const sum = c.heute + c.morgen + c.uebermorgen + c.other
    console.log(
      `  ${String(page).padStart(5)} │ ${String(c.heute).padStart(5)} │ ${String(c.morgen).padStart(6)} │ ${String(c.uebermorgen).padStart(10)} │ ${String(c.other).padStart(5)} │ ${String(sum).padStart(5)}  ${tag.join(' ')}`
    )

    if (batch.length < 100) break
    if (seenPastUebermorgen && c.uebermorgen === 0 && uebermorgenLastPage !== null) break

    await new Promise(r => setTimeout(r, 250))
    page++
  }

  // ── Totale pro Tag
  const total = { heute: 0, morgen: 0, uebermorgen: 0 }
  for (const c of Object.values(counts)) {
    total.heute      += c.heute
    total.morgen     += c.morgen
    total.uebermorgen += c.uebermorgen
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  ERGEBNIS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  console.log(`  Heute      : ${total.heute} total | erste Seite: ${heuteFirstPage ?? '–'}`)
  console.log(`  Morgen     : ${total.morgen} total | erste Seite: ${morgenFirstPage ?? '–'}`)
  console.log(`  Übermorgen : ${total.uebermorgen} total | erste Seite: ${uebermorgenFirstPage ?? '–'} | letzte: ${uebermorgenLastPage ?? '–'}`)

  const neededPages = uebermorgenLastPage ? uebermorgenLastPage + 1 : null

  console.log('\n  AKTUELLER STATUS (Stadtconfig):')
  console.log(`  Zürich/Basel  5 Seiten  → enthält Übermorgen? ${neededPages && neededPages <= 5 ? 'JA ✓' : 'NEIN ✗ — braucht mind. Seite ' + neededPages}`)
  console.log(`  StGallen/Luzern 12 Seiten → enthält Übermorgen? ${neededPages && neededPages <= 12 ? 'JA ✓' : 'NEIN ✗ — braucht mind. Seite ' + neededPages}`)
  console.log(`  Winterthur 25 Seiten  → enthält Übermorgen? ${neededPages && neededPages <= 25 ? 'JA ✓' : 'NEIN ✗ — braucht mind. Seite ' + neededPages}`)

  console.log('\n  FIX: Adaptives Scraping stoppt automatisch nach Seite', neededPages ?? '?')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

diagnose().catch(console.error)
