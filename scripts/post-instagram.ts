// scripts/post-instagram.ts
// Publiziert täglich Instagram Karussell-Posts für alle aktiven Städte
// Ablauf: Sanity Events holen → Bilder generieren → Vercel Blob → Meta Graph API

import { getSanityClient } from '../src/lib/sanity'
import { CURATED_EVENTS_QUERY } from '../src/lib/queries'
import { formatDateLabel, formatDateShort, getDateString } from '../src/lib/constants'
import { put, del } from '@vercel/blob'
import { generatePostImage, generateTitleImage } from './generate-image'
import type { ImageEvent } from './generate-image'

const GRAPH_BASE      = 'https://graph.instagram.com/v21.0'
const EVENTS_PER_PAGE = 8
const MAX_CAROUSEL    = 10

// ─── City Config ─────────────────────────────────────────────────────────────

interface CityConfig {
  slug: string
  label: string
  caption: (dateLabel: string) => string
}

const CITIES: CityConfig[] = [
  {
    slug: 'zuerich',
    label: 'Zürich',
    caption: (dateLabel) => [
      `Du suchst Events in Zürich für heute? Wir zeigen dir, was im Zürcher Ausgang läuft — von Techno Partys bis Kultur-Events. ${dateLabel}`,
      '',
      '→ Alle Veranstaltungen auf waslauft.in/zuerich',
      '',
      '#zürichgehtaus #ausgangzürich #zürichbynight #waslauft #waslauftzh',
    ].join('\n'),
  },
  {
    slug: 'stgallen',
    label: 'St.Gallen',
    caption: (dateLabel) => [
      `Du suchst Events in St.Gallen für heute? Wir zeigen dir, was läuft — von Konzerten bis Kultur-Events. ${dateLabel}`,
      '',
      '→ Alle Veranstaltungen auf waslauft.in/stgallen',
      '',
      '#stgallen #stgallengehtaus #waslauft #waslauftstgallen #ostschweiz',
    ].join('\n'),
  },
  {
    slug: 'luzern',
    label: 'Luzern',
    caption: (dateLabel) => [
      `Du suchst Events in Luzern für heute? Wir zeigen dir, was läuft — von Konzerten bis Kultur-Events. ${dateLabel}`,
      '',
      '→ Alle Veranstaltungen auf waslauft.in/luzern',
      '',
      '#luzern #luzerngehtaus #waslauft #waslauftluzern #zentralschweiz',
    ].join('\n'),
  },
]

// ─── Meta Graph API Helpers ───────────────────────────────────────────────────

async function createCarouselItem(imageUrl: string, igId: string, token: string): Promise<string> {
  const params = new URLSearchParams({
    image_url: imageUrl,
    is_carousel_item: 'true',
    media_type: 'IMAGE',
    access_token: token,
  })
  const res = await fetch(`${GRAPH_BASE}/${igId}/media?${params.toString()}`, {
    method: 'POST',
  })
  const data = await res.json()
  if (!res.ok || !data.id) throw new Error(`Carousel-Item-Fehler: ${JSON.stringify(data)}`)
  return data.id
}

async function createSingleContainer(imageUrl: string, caption: string, igId: string, token: string): Promise<string> {
  const res = await fetch(`${GRAPH_BASE}/${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
  })
  const data = await res.json()
  if (!res.ok || !data.id) throw new Error(`Container-Fehler: ${JSON.stringify(data)}`)
  return data.id
}

async function createCarouselContainer(childIds: string[], caption: string, igId: string, token: string): Promise<string> {
  const res = await fetch(`${GRAPH_BASE}/${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ media_type: 'CAROUSEL', children: childIds.join(','), caption, access_token: token }),
  })
  const data = await res.json()
  if (!res.ok || !data.id) throw new Error(`Carousel-Container-Fehler: ${JSON.stringify(data)}`)
  return data.id
}

async function waitForContainer(containerId: string, token: string): Promise<void> {
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 5000))
    const res = await fetch(`${GRAPH_BASE}/${containerId}?fields=status_code&access_token=${token}`)
    const data = await res.json()
    if (data.status_code === 'FINISHED') return
    if (data.status_code === 'ERROR') throw new Error(`Container fehlgeschlagen: ${JSON.stringify(data)}`)
    console.log(`[instagram] Container Status: ${data.status_code ?? 'IN_PROGRESS'} (${i + 1}/12)`)
  }
  throw new Error('Container Timeout nach 60s')
}

async function publishContainer(containerId: string, igId: string, token: string): Promise<string> {
  await waitForContainer(containerId, token)
  const res = await fetch(`${GRAPH_BASE}/${igId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerId, access_token: token }),
  })
  const data = await res.json()
  if (!res.ok || !data.id) throw new Error(`Publish-Fehler: ${JSON.stringify(data)}`)
  return data.id
}

// ─── Image Upload via Vercel Blob ─────────────────────────────────────────────

async function uploadToBlob(imageBuffer: Buffer, filename: string): Promise<string> {
  const blob = await put(`instagram/${filename}`, imageBuffer, {
    access: 'public',
    contentType: 'image/png',
    allowOverwrite: true,
  })
  return blob.url
}

async function deleteBlob(url: string): Promise<void> {
  try {
    await del(url)
  } catch {
    // Non-critical — blob will expire anyway
  }
}

// ─── Post für eine Stadt ──────────────────────────────────────────────────────

async function postInstagramForCity(city: CityConfig, date: string, dateLabel: string, igId: string, token: string): Promise<void> {
  console.log(`[instagram] Post für ${city.label} / ${date}`)

  const client = getSanityClient()
  const events = await client.fetch<ImageEvent[]>(CURATED_EVENTS_QUERY, { date, city: city.slug })

  if (events.length === 0) {
    console.warn(`[instagram] ${city.label}: Keine Events — Post übersprungen`)
    return
  }

  // Events in Seiten aufteilen
  const chunks: ImageEvent[][] = []
  for (let i = 0; i < events.length; i += EVENTS_PER_PAGE) {
    chunks.push(events.slice(i, i + EVENTS_PER_PAGE))
  }
  const pages = chunks.slice(0, MAX_CAROUSEL - 1)
  console.log(`[instagram] ${city.label}: ${events.length} Events → 1 Titel + ${pages.length} Event-Slide(s)`)

  // Bilder generieren + hochladen
  const imageUrls: string[] = []
  const ts = Date.now()

  console.log(`[instagram] ${city.label}: Generiere Titel-Slide...`)
  const titleBuf = await generateTitleImage(city.label, formatDateShort(0), pages[0])
  console.log(`[instagram] ${city.label}: Titel-Slide generiert (${(titleBuf.length / 1024).toFixed(0)} KB)`)
  const titleUrl = await uploadToBlob(titleBuf, `title-${city.slug}-${date}-${ts}.png`)
  imageUrls.push(titleUrl)

  for (let i = 0; i < pages.length; i++) {
    console.log(`[instagram] ${city.label}: Generiere Event-Slide ${i + 1}/${pages.length}...`)
    const buf = await generatePostImage(city.label, dateLabel, pages[i])
    const url = await uploadToBlob(buf, `events-${city.slug}-${date}-${i + 1}-${ts}.png`)
    imageUrls.push(url)
  }

  const caption = city.caption(dateLabel)

  // Einzelbild-Post
  if (imageUrls.length === 1) {
    const containerId = await createSingleContainer(imageUrls[0], caption, igId, token)
    const postId = await publishContainer(containerId, igId, token)
    console.log(`[instagram] ✅ ${city.label}: Post publiziert: ${postId}`)
    for (const url of imageUrls) await deleteBlob(url)
    return
  }

  // Karussell-Post
  console.log(`[instagram] ${city.label}: Erstelle Karussell-Items...`)
  const childIds: string[] = []
  for (const url of imageUrls) {
    const itemId = await createCarouselItem(url, igId, token)
    await waitForContainer(itemId, token)
    childIds.push(itemId)
    console.log(`[instagram] ${city.label}: Carousel-Item bereit: ${itemId}`)
  }

  const carouselId = await createCarouselContainer(childIds, caption, igId, token)
  const postId = await publishContainer(carouselId, igId, token)
  console.log(`[instagram] ✅ ${city.label}: Karussell-Post publiziert: ${postId}`)

  for (const url of imageUrls) await deleteBlob(url)
  console.log(`[instagram] ${city.label}: Blobs gelöscht`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function postInstagram(): Promise<void> {
  const igId  = process.env.INSTAGRAM_ACCOUNT_ID
  const token = process.env.META_ACCESS_TOKEN
  if (!igId || !token) {
    console.error('INSTAGRAM_ACCOUNT_ID oder META_ACCESS_TOKEN fehlt')
    process.exit(1)
  }

  const date = getDateString(0)
  const dateLabel = formatDateLabel(0)

  for (const city of CITIES) {
    try {
      await postInstagramForCity(city, date, dateLabel, igId, token)
    } catch (err) {
      console.error(`[instagram] ❌ ${city.label} fehlgeschlagen:`, err)
      // Weiter mit nächster Stadt
    }
  }
}

// Direkt ausführbar
if (require.main === module) {
  postInstagram().catch((err) => {
    console.error('[instagram] Fehler:', err)
    process.exit(1)
  })
}
