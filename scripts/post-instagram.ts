// scripts/post-instagram.ts
// Publiziert täglich Instagram-Inhalte für alle aktiven Städte
// Feed: 1 kombinierter Karussell-Post (Title + je ein City-Slide)
// Stories: Pro Stadt — Title-Slide + Event-Slides (→ manuell zu Highlights)

import { getSanityClient } from '../src/lib/sanity'
import { CURATED_EVENTS_QUERY } from '../src/lib/queries'
import { formatDateShort, getDateString } from '../src/lib/constants'
import { getSanityWriteClient } from '../src/lib/sanity'
import { fetchCityWeather } from './weather'
import { pickInstagramEvents } from './curate'
import { savePipelineSnapshot, updateVenueStats } from './stats'
import { sendCrashAlert } from './notify'
import type { WeatherResult } from './weather'
import type { ImageEvent, CityEvents } from './generate-image-v2'
import {
  generateCombinedTitleSlide,
  generateCombinedCitySlide,
  generateStoryTitleSlide,
  generateStoryEventSlides,
  generateBadWeatherCitySlide,
  generateBadWeatherStoryTitleSlide,
  generateBadWeatherStoryEventSlides,
} from './generate-image-v2'

const GRAPH_BASE = 'https://graph.instagram.com/v21.0'

const CITY_SLUGS = ['zuerich', 'stgallen', 'luzern', 'winterthur', 'basel'] as const

// ─── Filter: ausverkaufte / abgesagte Events ──────────────────────────────────

const UNAVAILABLE_KEYWORDS = [
  'ausverkauft', 'sold out', 'soldout', 'sold-out',
  'abgesagt', 'cancelled', 'canceled', 'abgebrochen',
  'verschoben', 'postponed',
]

function isUnavailable(event: ImageEvent): boolean {
  const name = event.name.toLowerCase()
  return UNAVAILABLE_KEYWORDS.some((kw) => name.includes(kw))
}
type CitySlug = typeof CITY_SLUGS[number]

const CITY_LABELS: Record<CitySlug, string> = {
  zuerich:    'Zürich',
  stgallen:   'St.Gallen',
  luzern:     'Luzern',
  winterthur: 'Winterthur',
  basel:      'Basel',
}

// ─── Meta Graph API Helpers ───────────────────────────────────────────────────

// Note: Instagram Graph API does not support archiving feed posts programmatically.
// is_hidden=true returns {"success":true} but has no effect on CAROUSEL_ALBUM posts.
// Archiving must be done manually via the Instagram app.

async function createCarouselItem(imageUrl: string, igId: string, token: string): Promise<string> {
  const params = new URLSearchParams({
    image_url: imageUrl,
    is_carousel_item: 'true',
    media_type: 'IMAGE',
    access_token: token,
  })
  const res = await fetch(`${GRAPH_BASE}/${igId}/media?${params.toString()}`, { method: 'POST' })
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

async function createStoryContainer(imageUrl: string, igId: string, token: string): Promise<string> {
  const res = await fetch(`${GRAPH_BASE}/${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, media_type: 'STORIES', access_token: token }),
  })
  const data = await res.json()
  if (!res.ok || !data.id) throw new Error(`Story-Container-Fehler: ${JSON.stringify(data)}`)
  return data.id
}

async function waitForContainer(containerId: string, token: string): Promise<void> {
  // Sofort checken, dann mit 2s Intervall (war 5s initial wait → spart ~3s pro Slide)
  for (let i = 0; i < 20; i++) {
    const res = await fetch(`${GRAPH_BASE}/${containerId}?fields=status_code&access_token=${token}`)
    const data = await res.json()
    if (data.status_code === 'FINISHED') return
    if (data.status_code === 'ERROR') throw new Error(`Container fehlgeschlagen: ${JSON.stringify(data)}`)
    console.log(`[instagram] Container Status: ${data.status_code ?? 'IN_PROGRESS'} (${i + 1}/20)`)
    await new Promise((r) => setTimeout(r, 2000))
  }
  throw new Error('Container Timeout nach 40s')
}

async function publishContainer(containerId: string, igId: string, token: string): Promise<string> {
  await waitForContainer(containerId, token)
  await new Promise((r) => setTimeout(r, 2000)) // kurze Pause nach FINISHED
  const res = await fetch(`${GRAPH_BASE}/${igId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerId, access_token: token }),
  })
  const data = await res.json()
  if (!res.ok || !data.id) throw new Error(`Publish-Fehler: ${JSON.stringify(data)}`)
  return data.id
}

// ─── Blob Helpers ─────────────────────────────────────────────────────────────

async function uploadToSanity(buf: Buffer, filename: string): Promise<{ sanityUrl: string; sanityId: string }> {
  // Bilder über Sanity CDN hosten — Meta kann cdn.sanity.io zuverlässig fetchen
  const client = getSanityWriteClient()
  const asset = await client.assets.upload('image', buf, {
    filename,
    contentType: 'image/png',
  })
  return {
    sanityUrl: asset.url,
    sanityId: asset._id,
  }
}

async function deleteSanityAsset(assetId: string): Promise<void> {
  try {
    const client = getSanityWriteClient()
    await client.delete(assetId)
  } catch { /* non-critical */ }
}


// ─── Karussell posten ─────────────────────────────────────────────────────────

async function postCarousel(slides: Buffer[], caption: string, prefix: string, ts: number, igId: string, token: string): Promise<void> {
  const imageUrls: string[] = []
  const assetIds: string[] = []

  for (let i = 0; i < slides.length; i++) {
    const { sanityUrl, sanityId } = await uploadToSanity(slides[i], `${prefix}-${i + 1}-${ts}.png`)
    imageUrls.push(sanityUrl)
    assetIds.push(sanityId)
    console.log(`[instagram] Bild ${i + 1}/${slides.length} hochgeladen`)
  }

  if (imageUrls.length === 1) {
    const id = await createSingleContainer(imageUrls[0], caption, igId, token)
    const postId = await publishContainer(id, igId, token)
    console.log(`[instagram] ✅ Einzelbild publiziert: ${postId}`)
  } else {
    const childIds: string[] = []
    for (const url of imageUrls) {
      const itemId = await createCarouselItem(url, igId, token)
      await waitForContainer(itemId, token)
      childIds.push(itemId)
    }
    const carouselId = await createCarouselContainer(childIds, caption, igId, token)
    const postId = await publishContainer(carouselId, igId, token)
    console.log(`[instagram] ✅ Karussell publiziert: ${postId}`)
  }

  for (const id of assetIds) await deleteSanityAsset(id)
}

// ─── Stories posten ───────────────────────────────────────────────────────────

async function postStories(slides: Buffer[], prefix: string, ts: number, igId: string, token: string): Promise<void> {
  for (let i = 0; i < slides.length; i++) {
    const { sanityUrl, sanityId } = await uploadToSanity(slides[i], `${prefix}-story-${i + 1}-${ts}.png`)
    console.log(`[instagram] Story-Slide ${i + 1}/${slides.length} hochgeladen`)
    const containerId = await createStoryContainer(sanityUrl, igId, token)
    const postId = await publishContainer(containerId, igId, token)
    console.log(`[instagram] ✅ Story ${i + 1} publiziert: ${postId}`)
    await deleteSanityAsset(sanityId)
    // Kurze Pause zwischen Story-Slides
    if (i < slides.length - 1) await new Promise((r) => setTimeout(r, 2000))
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function postInstagram(): Promise<void> {
  const igId  = process.env.INSTAGRAM_ACCOUNT_ID
  const token = process.env.META_ACCESS_TOKEN
  if (!igId || !token) {
    console.error('[instagram] INSTAGRAM_ACCOUNT_ID oder META_ACCESS_TOKEN fehlt')
    process.exit(1)
  }

  const date      = getDateString(0)
  const dateShort = formatDateShort(0)
  const ts        = Date.now()
  const client    = getSanityClient()

  // ── Events aus Sanity laden
  console.log('[instagram] Lade Events aus Sanity...')
  const eventsByCity: Record<CitySlug, ImageEvent[]> = {
    zuerich:    [],
    stgallen:   [],
    luzern:     [],
    winterthur: [],
    basel:      [],
  }
  for (const slug of CITY_SLUGS) {
    const events = await client.fetch<ImageEvent[]>(CURATED_EVENTS_QUERY, { date, city: slug })
    const filtered = events.filter((e) => !isUnavailable(e))
    const removed = events.length - filtered.length
    eventsByCity[slug] = filtered
    if (removed > 0) console.log(`[instagram] ${CITY_LABELS[slug]}: ${removed} ausverkauft/abgesagt gefiltert`)
    console.log(`[instagram] ${CITY_LABELS[slug]}: ${filtered.length} Events`)
  }

  const totalEvents = Object.values(eventsByCity).reduce((s, e) => s + e.length, 0)
  if (totalEvents === 0) {
    console.warn('[instagram] Keine Events für heute — abgebrochen')
    return
  }

  // ── Wetter abrufen
  console.log('[instagram] Prüfe Wetter...')
  const weather = await fetchCityWeather()
  for (const slug of CITY_SLUGS) {
    const w = weather[slug]
    console.log(`[instagram] Wetter ${CITY_LABELS[slug]}: ${w.isRain ? `☔ ${w.description}` : '☀️ kein Regen'}`)
  }

  // ── Kombinierter Feed-Post ─────────────────────────────────────────────────
  if (process.env.SKIP_FEED === '1') {
    console.log('[instagram] SKIP_FEED=1 — Feed-Post übersprungen')
  } else {
  console.log('\n[instagram] ── Kombinierter Feed-Post ──')

  // Tägliche Farbe: Datum → gleichmässige Rotation durch alle 12 Farben
  const dayOfYear = Math.floor((new Date(date).getTime() - new Date(new Date(date).getFullYear(), 0, 0).getTime()) / 86400000)
  const firstColorIndex = dayOfYear % 12
  const feedSlides: Buffer[] = []

  // Slide 1: Titel
  console.log('[instagram] Generiere Titel-Slide...')
  feedSlides.push(await generateCombinedTitleSlide(dateShort, firstColorIndex))

  // Slides 2-4: Je eine Stadt — AI wählt die 5 besten Events
  for (const slug of CITY_SLUGS) {
    const allEvents = eventsByCity[slug]
    const w: WeatherResult = weather[slug]

    if (allEvents.length === 0) {
      console.log(`[instagram] ${CITY_LABELS[slug]}: keine Events — City-Slide übersprungen`)
      continue
    }

    console.log(`[instagram] ${CITY_LABELS[slug]}: AI wählt beste 5 aus ${allEvents.length} Events...`)
    const pickedNames = await pickInstagramEvents(allEvents, CITY_LABELS[slug])
    const pickedEvents = pickedNames
      .map((name) => allEvents.find((e) => e.name === name))
      .filter((e): e is ImageEvent => e !== undefined)
    // Fallback: falls AI-Namen nicht matchen, erste 5 nehmen
    const postEvents = pickedEvents.length >= 3 ? pickedEvents : allEvents.slice(0, 5)
    console.log(`[instagram] ${CITY_LABELS[slug]}: ${postEvents.map((e) => e.name).join(' · ')}`)

    const cityData: CityEvents = { label: CITY_LABELS[slug], events: postEvents }

    // Stats: Instagram-Events im Snapshot vermerken
    try {
      await savePipelineSnapshot({
        date, city: slug,
        totalEvents: allEvents.length,
        layer1Events: 0, layer2Events: 0,
        sources: { eventfrog: 0, hellozurich: 0, gangus: 0, ra: 0 },
        eventTypes: {},
        topVenues: [],
        weatherRain: w.isRain,
        instagramPosted: true,
        instagramEvents: postEvents.map((e) => e.name),
      })
      await updateVenueStats(slug, date, Object.fromEntries(postEvents.map((e) => [e.location, 1])), postEvents.map((e) => e.location))
    } catch { /* non-critical */ }

    console.log(`[instagram] Generiere City-Slide für ${CITY_LABELS[slug]}${w.isRain ? ` (${w.description})` : ''}...`)
    const slide = w.isRain
      ? await generateBadWeatherCitySlide(cityData, w.description)
      : await generateCombinedCitySlide(cityData)
    feedSlides.push(slide)
  }

  const feedCaption = [
    `Was läuft heute? ${dateShort}`,
    '',
    'Zürich · St.Gallen · Luzern · Winterthur',
    '',
    '→ waslauft.in',
    '',
    '#zürich #stgallen #luzern #winterthur #waslauft #schweiz #ausgehen #events #wasläuft',
  ].join('\n')

  await postCarousel(feedSlides, feedCaption, `feed-${date}`, ts, igId, token)
  } // end SKIP_FEED

  // ── Stories pro Stadt ──────────────────────────────────────────────────────
  if (process.env.SKIP_STORIES === '1') {
    console.log('[instagram] SKIP_STORIES=1 — Stories übersprungen')
    console.log('\n[instagram] ✅ Fertig')
    return
  }

  for (const slug of CITY_SLUGS) {
    if (eventsByCity[slug].length === 0) {
      console.log(`\n[instagram] ${CITY_LABELS[slug]}: keine Events — Stories übersprungen`)
      continue
    }

    console.log(`\n[instagram] ── Stories ${CITY_LABELS[slug]} ──`)
    const cityData: CityEvents = { label: CITY_LABELS[slug], events: eventsByCity[slug] }
    const w: WeatherResult = weather[slug]
    const storySlides: Buffer[] = []

    if (w.isRain) {
      console.log(`[instagram] ${CITY_LABELS[slug]}: Bad-Weather Stories (${w.description})`)
      storySlides.push(await generateBadWeatherStoryTitleSlide(cityData, dateShort, w.description))
      const eventSlides = await generateBadWeatherStoryEventSlides(cityData)
      storySlides.push(...eventSlides)
    } else {
      storySlides.push(await generateStoryTitleSlide(cityData, dateShort))
      const eventSlides = await generateStoryEventSlides(cityData)
      storySlides.push(...eventSlides)
    }

    console.log(`[instagram] ${CITY_LABELS[slug]}: ${storySlides.length} Story-Slides`)

    try {
      await postStories(storySlides, `${slug}-${date}`, ts, igId, token)
    } catch (err) {
      console.error(`[instagram] ❌ Stories ${CITY_LABELS[slug]} fehlgeschlagen:`, err)
      await sendCrashAlert(`Instagram Stories ${CITY_LABELS[slug]}`, err)
      // Weiter mit nächster Stadt
    }
  }

  console.log('\n[instagram] ✅ Fertig')
}

// Direkt ausführbar
if (require.main === module) {
  postInstagram().catch((err) => {
    console.error('[instagram] Fehler:', err)
    process.exit(1)
  })
}
