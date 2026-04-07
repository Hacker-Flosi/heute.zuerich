// scripts/post-instagram.ts
// Publiziert einen Instagram Karussell-Post für Zürich
// Ablauf: Sanity Events holen → Bilder generieren → imgbb Upload → Meta Graph API

import { getSanityClient } from '../src/lib/sanity'
import { CURATED_EVENTS_QUERY } from '../src/lib/queries'
import { formatDateLabel, getDateString } from '../src/lib/constants'
import { generatePostImage } from './generate-image'
import type { ImageEvent } from './generate-image'

const IG_ACCOUNT_ID  = process.env.INSTAGRAM_ACCOUNT_ID!
const ACCESS_TOKEN   = process.env.META_ACCESS_TOKEN!
const GRAPH_BASE     = 'https://graph.instagram.com/v21.0'
const EVENTS_PER_PAGE = 8
const MAX_CAROUSEL    = 10  // Meta API Limit

if (!IG_ACCOUNT_ID || !ACCESS_TOKEN) {
  console.error('INSTAGRAM_ACCOUNT_ID oder META_ACCESS_TOKEN fehlt')
  process.exit(1)
}

// ─── Meta Graph API Helpers ───────────────────────────────────────────────────

async function createCarouselItem(imageUrl: string): Promise<string> {
  const res = await fetch(`${GRAPH_BASE}/${IG_ACCOUNT_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      is_carousel_item: true,
      access_token: ACCESS_TOKEN,
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.id) throw new Error(`Carousel-Item-Fehler: ${JSON.stringify(data)}`)
  return data.id
}

async function createSingleContainer(imageUrl: string, caption: string): Promise<string> {
  const res = await fetch(`${GRAPH_BASE}/${IG_ACCOUNT_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: ACCESS_TOKEN,
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.id) throw new Error(`Container-Fehler: ${JSON.stringify(data)}`)
  return data.id
}

async function createCarouselContainer(childIds: string[], caption: string): Promise<string> {
  const res = await fetch(`${GRAPH_BASE}/${IG_ACCOUNT_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      children: childIds.join(','),
      caption,
      access_token: ACCESS_TOKEN,
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.id) throw new Error(`Carousel-Container-Fehler: ${JSON.stringify(data)}`)
  return data.id
}

async function publishContainer(containerId: string): Promise<string> {
  const res = await fetch(`${GRAPH_BASE}/${IG_ACCOUNT_ID}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: ACCESS_TOKEN,
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.id) throw new Error(`Publish-Fehler: ${JSON.stringify(data)}`)
  return data.id
}

// ─── Image Upload via imgbb ───────────────────────────────────────────────────

async function uploadToImgbb(imageBuffer: Buffer): Promise<string> {
  const IMGBB_KEY = process.env.IMGBB_API_KEY
  if (!IMGBB_KEY) throw new Error('IMGBB_API_KEY fehlt — Bild-Upload nicht möglich')

  const form = new FormData()
  form.append('image', imageBuffer.toString('base64'))

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
    method: 'POST',
    body: form,
  })
  const data = await res.json()
  if (!data.success) throw new Error(`imgbb Upload-Fehler: ${JSON.stringify(data)}`)
  return data.data.url as string
}

// ─── Caption Builder ──────────────────────────────────────────────────────────

function buildCaption(dateLabel: string): string {
  return [
    `Was läuft heute in Zürich?`,
    `${dateLabel} — alle Events auf waslauft.in/zuerich`,
    '',
    '#zürich #zuerich #ausgang #today #nightlife #events',
  ].join('\n')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function postInstagram(): Promise<void> {
  const date = getDateString(0)
  const dateLabel = formatDateLabel(0)

  console.log(`[instagram] Post für Zürich / ${date}`)

  // 1. Events aus Sanity holen
  const client = getSanityClient()
  const events = await client.fetch<ImageEvent[]>(CURATED_EVENTS_QUERY, { date, city: 'zuerich' })

  if (events.length === 0) {
    console.warn('[instagram] Keine Events — Post übersprungen')
    return
  }

  // 2. Events in Seiten aufteilen (max 10 Bilder für Carousel)
  const chunks: ImageEvent[][] = []
  for (let i = 0; i < events.length; i += EVENTS_PER_PAGE) {
    chunks.push(events.slice(i, i + EVENTS_PER_PAGE))
  }
  const pages = chunks.slice(0, MAX_CAROUSEL)
  console.log(`[instagram] ${events.length} Events → ${pages.length} Bild(er)`)

  // 3. Bilder generieren + hochladen
  const imageUrls: string[] = []
  for (let i = 0; i < pages.length; i++) {
    console.log(`[instagram] Generiere Bild ${i + 1}/${pages.length} (${pages[i].length} Events)...`)
    const buf = await generatePostImage('Zürich', dateLabel, pages[i], i + 1, pages.length)
    console.log(`[instagram] Bild ${i + 1} generiert (${(buf.length / 1024).toFixed(0)} KB)`)

    console.log(`[instagram] Lade Bild ${i + 1} hoch...`)
    const url = await uploadToImgbb(buf)
    console.log(`[instagram] Bild ${i + 1} URL: ${url}`)
    imageUrls.push(url)
  }

  const caption = buildCaption(dateLabel)

  // 4a. Einzelbild-Post (nur 1 Seite)
  if (pages.length === 1) {
    const containerId = await createSingleContainer(imageUrls[0], caption)
    console.log(`[instagram] Container erstellt: ${containerId}`)
    const postId = await publishContainer(containerId)
    console.log(`[instagram] ✅ Post publiziert: ${postId}`)
    return
  }

  // 4b. Karussell-Post (mehrere Seiten)
  console.log('[instagram] Erstelle Karussell-Items...')
  const childIds: string[] = []
  for (const url of imageUrls) {
    const itemId = await createCarouselItem(url)
    childIds.push(itemId)
    console.log(`[instagram] Carousel-Item: ${itemId}`)
  }

  const carouselId = await createCarouselContainer(childIds, caption)
  console.log(`[instagram] Carousel-Container: ${carouselId}`)

  const postId = await publishContainer(carouselId)
  console.log(`[instagram] ✅ Karussell-Post publiziert: ${postId}`)
}

// Direkt ausführbar
if (require.main === module) {
  postInstagram().catch((err) => {
    console.error('[instagram] Fehler:', err)
    process.exit(1)
  })
}
