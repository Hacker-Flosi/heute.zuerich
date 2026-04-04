// scripts/scrapers/saiten.ts
// saiten.ch Scraper für St. Gallen
// API gibt HTML in `content` zurück — wird mit Cheerio geparst

import * as cheerio from 'cheerio'
import type { RawEvent } from '../types'

const BASE_URL = 'https://www.saiten.ch'
const PAGE_SIZE = 100
const MAX_PAGES = 5  // cap at 500 events per day — geo-filter handles the rest

interface SaitenResponse {
  content: string
  totalCount: number
  totalPages: number
}

function parseTime(raw: string): string {
  if (!raw) return '00:00'
  // "19:00—22:00" or "19:00" → take start time
  const start = raw.split(/[—\-–]/)[0].trim()
  if (/^\d{1,2}:\d{2}$/.test(start)) {
    const [h, m] = start.split(':')
    return `${h.padStart(2, '0')}:${m}`
  }
  return '00:00'
}

export async function scrapeSaiten(date: string): Promise<RawEvent[]> {
  const events: RawEvent[] = []
  let offset = 0
  let page = 0

  while (page < MAX_PAGES) {
    const url = `${BASE_URL}/api/calendar-list.json?from=${date}&to=${date}&limit=${PAGE_SIZE}&offset=${offset}`

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; waslauft.in/1.0)',
      },
    })

    if (!res.ok) {
      console.error(`[saiten] API error: ${res.status}`)
      break
    }

    const data: SaitenResponse = await res.json()

    if (!data.content?.trim()) break

    const prevCount = events.length

    const $ = cheerio.load(data.content)

    $('a.a-calendar-item').each((_, el) => {
      const title = $(el).find('.a-calendar-item__title').text().trim()
      const place = $(el).find('.a-calendar-item__location__place').text().trim()
      const city  = $(el).find('.a-calendar-item__location__name').text().trim()
      const time  = $(el).find('.a-calendar-item__time').text().trim()
      const href  = $(el).attr('href') ?? ''

      if (!title || !place) return

      const eventUrl = href.startsWith('http')
        ? href
        : `${BASE_URL}/${href.replace(/^\//, '')}`

      events.push({
        name: title,
        rawName: title,
        location: `${place}${city ? ', ' + city : ''}`,
        date,
        time: parseTime(time),
        url: eventUrl,
        source: 'saiten',
      })
    })

    // If this page added no new events, stop
    if (events.length === prevCount) break

    offset += PAGE_SIZE
    page++
  }

  console.log(`[saiten] ${events.length} Events gefunden für ${date}`)
  return events
}
