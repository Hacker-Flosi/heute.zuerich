// Repariert bestehende Sanity-Events mit hellozurich-Fallback-URLs
import { getSanityWriteClient } from '../src/lib/sanity'

const BASE_URL = 'https://www.hellozurich.ch'
const SKIP_DOMAINS = ['hellozurich.ch', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'youtube.com', 'google.']
const TICKET_DOMAINS = ['ticketcorner.ch', 'ticketmaster.', 'starticket.ch', 'eventfrog.ch', 'eventbrite.', 'reservix.de', 'petzi.ch']

async function findBetterUrl(hzUrl: string): Promise<string | null> {
  try {
    const { load } = await import('cheerio')
    const res = await fetch(hzUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) return null
    const $ = load(await res.text())
    let organizer: string | null = null
    let ticket: string | null = null
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || ''
      if (!href.startsWith('http')) return
      if (SKIP_DOMAINS.some(d => href.includes(d))) return
      if (!ticket && TICKET_DOMAINS.some(d => href.includes(d))) { ticket = href; return }
      if (!organizer) organizer = href
    })
    return organizer ?? ticket
  } catch { return null }
}

async function main() {
  const client = getSanityWriteClient()
  const events = await client.fetch(`*[_type == 'event' && url match '*hellozurich*'] { _id, name, url }`)
  console.log(`${events.length} Events mit hellozurich-URL\n`)

  for (const e of events) {
    const better = await findBetterUrl(e.url)
    if (better) {
      await client.patch(e._id).set({ url: better }).commit()
      console.log(`✅ ${e.name}\n   ${better}`)
    } else {
      await client.delete(e._id)
      console.log(`🗑  ${e.name} — gelöscht (keine URL gefunden)`)
    }
  }
}
main().catch(console.error)
