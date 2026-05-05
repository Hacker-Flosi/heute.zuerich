// scripts/pipeline.ts
// waslauft.in Daily Pipeline
// Zürich: Two-Layer (venue-first + AI discovery)
// Other cities: Single-layer (AI curation of all events)

import { sendTelegramNotification, sendCrashAlert, sendFeaturedEventReminders } from './notify'
import type { FeaturedEventAlert } from './notify'
import { savePipelineSnapshot, updateVenueStats } from './stats'
import type { CityResult } from './notify'
import { scrapeEventfrog } from './scrapers/eventfrog'
import { scrapeCoucou } from './scrapers/coucou'
import { scrapeHellozurich } from './scrapers/hellozurich'
import { scrapeGangus } from './scrapers/gangus'
import { scrapeSaiten } from './scrapers/saiten'
import { scrapeStGallenVenues } from './scrapers/stgallen-venues'
import { scrapeBaselVenues } from './scrapers/basel-venues'
import { scrapeResidentAdvisor } from './scrapers/residentadvisor'
// import { scrapePetzi } from './scrapers/petzi'          // Bern: Coming Soon
// import { scrapeDampfzentrale } from './scrapers/dampfzentrale' // Bern: Coming Soon
import { deduplicateEvents } from './deduplicate'
import { curateEvents, curateDiscovery, curateRainReserve } from './curate'
import { getSanityClient, getSanityWriteClient } from '../src/lib/sanity'
import { lookupVenueUrl, isAggregatorUrl } from './venues'
import { lookupSpotifyUrl } from './spotify'
import { fetchWeather } from '../src/lib/weather'
import { inferEventTypeFromTitle, eventTypeFromVenueCategory, isNightlife } from './eventtype'
import type { RawEvent, SanityVenue } from './types'

// ─── Config ───────────────────────────────────────────────────────────────────

type ScraperFn = (date: string) => Promise<RawEvent[]>


const CITY_CONFIG: Record<string, { twoLayer: boolean; scrapers: ScraperFn[] }> = {
  zuerich:    { twoLayer: true, scrapers: [scrapeEventfrog, scrapeHellozurich, scrapeResidentAdvisor] },
  stgallen:   { twoLayer: true, scrapers: [scrapeEventfrog, scrapeSaiten, scrapeStGallenVenues] },
  luzern:     { twoLayer: true, scrapers: [scrapeGangus, scrapeEventfrog] },
  winterthur: { twoLayer: true, scrapers: [scrapeEventfrog, scrapeCoucou] },
  // Bern: Coming Soon — Scraper bereit (Petzi + Dampfzentrale), aber Stadt noch nicht aktiv
  // bern: { twoLayer: true, scrapers: [scrapePetzi, scrapeDampfzentrale] },
  basel:      { twoLayer: true, scrapers: [scrapeEventfrog, scrapeBaselVenues] },
}

// Zürich: blacklist approach (exclude surrounding cities)
const ZH_EXCLUDED = [
  'winterthur', 'baden', 'brugg', 'aarau', 'rapperswil', 'zug',
  'schaffhausen', 'frauenfeld', 'olten', 'solothurn', 'luzern',
  'bern', 'st. gallen',
]

// All other cities: whitelist approach (location must contain at least one term)
const CITY_INCLUSIONS: Record<string, string[]> = {
  basel:       ['basel', 'riehen'],
  bern:        ['bern', 'muri bei bern', 'köniz'],
  stgallen:    ['st. gallen', 'st gallen', 'st.gallen', 'saint-gallen'],
  luzern:      ['luzern', 'lucerne', 'kriens', 'horw', 'ebikon'],
  winterthur:  ['winterthur'],
}

// Cities excluded from whitelist even if they contain a matching term
const CITY_EXCLUSIONS: Record<string, string[]> = {
  basel:       ['liestal', 'aesch', 'muttenz', 'lörrach', 'weil am rhein'],
  bern:        ['thun', 'biel', 'burgdorf', 'langenthal'],
  stgallen:    ['rorschach', 'herisau', 'gossau', 'wil'],
  luzern:      ['sursee', 'emmen', 'zug'],
  winterthur:  [],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDate(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isSummerSeason(): boolean {
  const month = new Date().getMonth() + 1 // 1–12
  return month >= 5 && month <= 9
}

// ─── Commercial/Non-Event Filter ─────────────────────────────────────────────
// Filtert kommerzielle Aktionen, Shop-Events und Non-Events aus allen Scrapers

const COMMERCIAL_NAME_KEYWORDS = [
  // Shop-Aktionen / Gewinnspiele
  'giveaway', 'gewinnspiel', 'verlosung', 'rabatt', 'gutschein',
  'kostenlos testen', 'gewinne einen', 'gewinnen ',
  'shoppen', 'shopping', 'einkaufen',
  'infostand', 'info-stand', 'stand pick!',
  // Gesundheit/Körper-Tests im Laden
  'knochendichte', 'blutdruckmessung', 'gesundheitscheck', 'hörtest', 'sehtest',
  'sinne testen', 'sehen & hören', 'sehen und hören',
  // Religiöse Inhalte / Kirche
  'kirche', 'kirchliche', 'gottesdienst', 'messe ', 'heilige messe', 'vesper',
  'taufe', 'firmung', 'kommunion', 'beichte', 'predigt', 'gebet', 'andacht',
  'kloster', 'stiftskirche', 'münster', 'dom ', 'pfarrei', 'pfarrkirche',
  'bibelkurs', 'bibelstunde', 'glaubenskurs',
  // Kinder-Kurs / Kita
  'kindertreff', 'spielgruppe', 'kindertag',
  // Kurse die keine Abend-Events sind
  'anfängerkurs', 'aufbaukurs', 'sprachkurs', 'english intensive', 'english course',
  'yoga für alle', 'tango argentino',
  // Laden-Specials / Aktionen
  'frisch gebacken', 'frisch gebackene',
  'zu besuch bei', 'gesucht:', ' gesucht ',
  'atelier couture', 'offenes atelier',
  'gratis ballon', 'gratis für kinder',
  'gravur-aktion', 'gravur aktion', 'machen sie ihr',
  'glücksrad', 'glücksrad-aktion',
  'styling day', 'styling-day',
  'kleider und kaffee', 'kleider & kaffee',
  'sneaker probieren', 'gürtel designen',
  'genuss einkaufen', 'genuss-einkaufen',
  'düfte entdecken', 'düfte & farben', 'düfte und farben',
  'über finanzen erfahren', 'mehr über finanzen',
  'haar und mode', 'haar & mode',
  'gaumenfreude', 'reise-quiz', 'reiseberatung', 'fachkundige reise',
  'design your glasses', 'barfuss-schuhe', 'laufveloparcours',
  'gewürzwettbewerb',
  'dip-degustation', 'goba produkte', 'goba-produkte',
  'leder-accessoire', 'leder accessoire', 'motivationskärtli',
  'gestalte dein', 'gestalte deine',
  // Stadtdekorationen / Markt-Dekorationen (keine Events)
  'brunnenschmuck',
  // Brand-Promotionen
  'aperol piaggio', 'piaggio am klosterplatz', 'ap-rol piaggio',
  // Süsswaren / Confiserie
  'praliné', 'praline', 'pralinés',
  // Vintage Textile / Mode Shops
  'vintage textile', 'fizzenbag',
  // Shop-Typen in Eventnamen
  'schuhhaus', 'buchcaf', 'buchcafe', 'concept store', 'butikk',
  'lückerli', 'läckerli', 'lckerli', 'confiserie', 'goldschmiede', 'chronometrie',
  'papeterie', 'kosmetik ',
  'bücherwürmer', 'bucherwurmer', 'glücksmomente', 'glucksmomente',
  'genussmomente',
  'kultkosmetik', 'parfümdegustation', 'düftedegustation',
  // Läden explizit
  'torso mode', 'jeanswerk', 'stadtblumen', 'weber butikk', 'rituals cosmetics',
  // Weinbar / Tasting im Shop (nicht Bars)
  'pop-up weinbar', 'popup weinbar', 'weinbar von', 'tonicdegustation', 'wein-tonic',
  'pop up weinbar',
]

const COMMERCIAL_VENUE_KEYWORDS = [
  // Medizin / Gesundheit / Optik
  'drogerie', 'reformhaus', 'apotheke', 'optiker', 'optik&', 'optik ',
  // Transport / Infrastruktur
  'parkhaus', 'parkgarage', 'cityparking',
  // Mode / Schuhe
  'schuhgeschäft', 'schuhhaus',
  'modegeschäft', 'botty', 'torso mode', 'jeanswerk', 'mode weber',
  'weber butikk', 'zazou', 'concept store', 'butikk', 'boutique',
  'elisabeth berger', 'tiefenbacher schuhe', 'nisago',
  // Kaufhäuser / Supermärkte
  'manor ag', 'manor ', 'migros', 'coop',
  // Elektronik / Uhren
  'bang & olufsen', 'bang olufsen', 'chronometrie', 'goldschmiede', 'labhart',
  // Café / Konditorei ohne Veranstaltungscharakter
  'buchcaf', 'buchcafe', 'cafe gschwend', 'stadtbistro', 'buchcafé',
  // Blumen
  'stadtblumen gmbh', 'creativ floristik', 'flippy shop', 'ideenreich petra',
  // Papier / Büro
  'papeterie', 'zum schiff ag',
  // Kosmetik / Beauty / Düfte
  'rituals cosmetics', 'kosmetikstudio', 'iqos', 'opal18',
  // Süsswaren / Konfiserie / Pralinés
  'lückerli', 'läckerli', 'lckerli huus', 'konfiserie', 'praliné', 'praline scherrer',
  // Atelier / Nähkurs (kein Event)
  'lehratelier', 'nähstudio', 'couture lehratelier',
  // Buchhandlung
  'buchhandlung', 'buchcafé benedikt', 'benedikt',
  // Galerie nur mit Weinverkauf
  'glen fahrn',
  // Vintage Textil / Textil-Shops
  'vintage textile', 'fizzen', 'fizzenbag',
  // Weitere bekannte Läden / Shops
  'kaffee baumgartner', 'kleika', 'acrevis bank',
  'kuoni', 'hotelplan', 'dertour',
  'einstoffen', 'brand store',
  'schneider schuhe', 'schuhe ag', 'transa',
  'baettig', 'pro table',
  'atelier stella', 'univo', 'orell füssli', 'rösslitor',
  'lush', 'zollibolli', 'bonneheure', 'bean to bar', 'schokoladenmanufaktur',
  'focacceria', 'haus olé', 'haus ole',
  // Kirchen / Religiöse Locations
  'kirche ', 'kirchgemeinde', 'pfarrkirche', 'stiftskirche', 'kapuzinerkloster',
  'münster', 'kathedrale', 'kloster', 'pfarrei', 'heilsarmee',
  // Übrige bekannte Läden
  'weber-butikk',
]

function isCommercialEvent(event: RawEvent): boolean {
  const name = event.name.toLowerCase()
  const loc = event.location.toLowerCase()
  if (COMMERCIAL_NAME_KEYWORDS.some(kw => name.includes(kw))) return true
  if (COMMERCIAL_VENUE_KEYWORDS.some(kw => loc.includes(kw))) return true
  return false
}

function geoFilterZuerich(event: RawEvent): boolean {
  const loc = (event.location + ' ' + (event.locationCity ?? '')).toLowerCase()
  return !ZH_EXCLUDED.some((excl) => loc.includes(excl))
}

function geoFilterCity(event: RawEvent, city: string): boolean {
  const inclusions = CITY_INCLUSIONS[city]
  if (!inclusions) return true
  const loc = (event.location + ' ' + (event.locationCity ?? '')).toLowerCase()
  const excluded = CITY_EXCLUSIONS[city] ?? []
  if (excluded.some((excl) => loc.includes(excl))) return false
  return inclusions.some((incl) => loc.includes(incl))
}

// Generic words that appear in many unrelated location strings — never use for matching.
// Includes all city names used as suffixes in eventfrogName (e.g. "Grabenhalle St. Gallen")
const VENUE_STOPWORDS = new Set([
  // Zürich
  'zürich', 'zuerich', 'zurich',
  // St. Gallen — "st" is already <4 chars, but "gallen" must be excluded
  'gallen',
  // Luzern
  'luzern', 'lucerne',
  // Basel
  'basel', 'riehen',
  // Bern
  'bern', 'berne',
  // Winterthur
  'winterthur',
  // Generic venue-type words
  'club', 'bar', 'the', 'und', 'von', 'der', 'die', 'das', 'für',
  'garten', 'kirche', 'museum', 'theater', 'halle', 'haus',
  'zentrum', 'hof', 'platz', 'str', 'strasse', 'restaurant',
])

/** Strip trailing city suffix from venue names like "Grabenhalle St. Gallen" → "Grabenhalle" */
function stripCitySuffix(name: string): string {
  return name
    .replace(/\s+st\.?\s+gallen$/i, '')
    .replace(/\s+luzern$/i, '')
    .replace(/\s+z[uü]rich$/i, '')
    .replace(/\s+basel$/i, '')
    .replace(/\s+bern$/i, '')
    .replace(/\s+winterthur$/i, '')
    .trim()
}

/** Extract venue-specific tokens: ≥4 chars, not a stopword */
function venueTokens(s: string): string[] {
  return s.toLowerCase()
    .split(/[\s\-\/&,.()+]+/)
    .filter((t) => t.length >= 4 && !VENUE_STOPWORDS.has(t))
}

/** Match a venue against the event's location string.
 *  Pass 1: word-boundary match on name + stripped name + eventfrogName + stripped eventfrogName.
 *  Pass 2: token overlap using only the stripped name (no city suffix tokens). */
function matchVenue(event: RawEvent, venues: SanityVenue[], summer: boolean): SanityVenue | null {
  const loc = event.location.toLowerCase()
  const locTokens = venueTokens(loc)

  const sorted = summer
    ? [...venues].sort((a, b) => (b.summerBonus ? 1 : 0) - (a.summerBonus ? 1 : 0))
    : venues

  // Pass 1: word-boundary substring match (try full name AND city-stripped name)
  const exact = sorted.find((v) => {
    const names = [v.name, stripCitySuffix(v.name), v.eventfrogName, v.eventfrogName ? stripCitySuffix(v.eventfrogName) : undefined]
      .filter((n): n is string => !!n)
      .map((n) => n.toLowerCase())
    return names.some((n) => {
      const re = new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
      return re.test(loc)
    })
  })
  if (exact) return exact

  // Pass 2: token overlap — use ONLY stripped name (no city suffix) to avoid "gallen" matching everything
  return sorted.find((v) => {
    const vTok = venueTokens(stripCitySuffix(v.name))
    return vTok.length > 0 && vTok.some((t) => locTokens.includes(t))
  }) ?? null
}

const TARGET_EVENTS = 30
const MAX_EVENTS_PER_LOCATION = 3

/** Limit events per location to avoid one venue dominating the list. */
function enforceLocationLimit(events: RawEvent[]): RawEvent[] {
  const counts: Record<string, number> = {}
  return events.filter((e) => {
    const loc = e.location.toLowerCase()
    counts[loc] = (counts[loc] || 0) + 1
    return counts[loc] <= MAX_EVENTS_PER_LOCATION
  })
}

/** Enforce ≥60% nightlife ratio — only for Zürich AND only when pool > 30 events. */
function enforceNightlifeRatio(events: RawEvent[], city: string): RawEvent[] {
  if (events.length === 0) return events
  if (city !== 'zuerich') return events
  if (events.length <= TARGET_EVENTS) return events  // don't trim small pools
  const nightlife = events.filter((e) => isNightlife(e.eventType ?? 'special'))
  const other = events.filter((e) => !isNightlife(e.eventType ?? 'special'))
  if (nightlife.length === 0) return events
  const ratio = nightlife.length / events.length
  if (ratio >= 0.6) return events
  const maxOther = Math.floor(nightlife.length / 0.6 * 0.4)
  return [...nightlife, ...other.slice(0, maxOther)]
}

/** Fill up to TARGET_EVENTS using remaining discovery pool (not AI-chosen).
 *  Adds events sorted by eventType priority (nightlife first). */
function fillToTarget(chosen: RawEvent[], pool: RawEvent[]): RawEvent[] {
  if (chosen.length >= TARGET_EVENTS) return chosen
  const chosenIds = new Set(chosen.map((e) => e.name.toLowerCase()))
  const remaining = pool
    .filter((e) => !chosenIds.has(e.name.toLowerCase()))
    .sort((a, b) => {
      // nightlife events first when filling
      const aNl = isNightlife(a.eventType ?? 'special') ? 0 : 1
      const bNl = isNightlife(b.eventType ?? 'special') ? 0 : 1
      return aNl - bNl
    })
  const needed = TARGET_EVENTS - chosen.length
  return [...chosen, ...remaining.slice(0, needed)]
}

async function hasEventsForDate(city: string, date: string): Promise<boolean> {
  // Use write client (no CDN) so deletions are immediately visible
  const client = getSanityWriteClient()
  const [total, saitenOnly] = await Promise.all([
    client.fetch<number>(`count(*[_type == "event" && city == $city && date == $date])`, { city, date }),
    client.fetch<number>(`count(*[_type == "event" && city == $city && date == $date && source != "saiten"])`, { city, date }),
  ])
  // If all events are saiten-only, treat as incomplete — allow re-scraping
  if (total > 0 && saitenOnly === 0) {
    console.log(`  [Skip] Nur saiten-Events (${total}) — wird neu gescrapt`)
    return false
  }
  return total > 0
}


// Retry once (after 60s) if all scrapers return empty — covers transient API failures.
// Re-checks hasEventsForDate before the retry so a concurrent run that already
// wrote events during the wait window will abort the retry rather than overwrite.
async function runScrapers(
  scrapers: ScraperFn[],
  date: string,
  city: string,
): Promise<{ raw: RawEvent[]; scraperErrors: number; skip?: true }> {
  for (let attempt = 0; attempt <= 1; attempt++) {
    if (attempt > 0) {
      console.warn(`  [Retry] Scraping leer — 60s warten und erneut versuchen...`)
      await new Promise((r) => setTimeout(r, 60_000))
      if (await hasEventsForDate(city, date)) {
        console.log(`  [Retry] Abgebrochen — Events inzwischen von anderem Run geschrieben`)
        return { raw: [], scraperErrors: 0, skip: true }
      }
    }
    const results = await Promise.allSettled(scrapers.map((fn) => fn(date)))
    let scraperErrors = 0
    const raw: RawEvent[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') raw.push(...r.value)
      else { console.error('  Scraper Fehler:', r.reason); scraperErrors++ }
    }
    if (raw.length > 0) return { raw, scraperErrors }
    console.warn(`  [Scraping] Versuch ${attempt + 1}/2: 0 Events gefunden`)
  }
  console.error(`  [FEHLER] Beide Scraping-Versuche leer für ${date}`)
  return { raw: [], scraperErrors: 0 }
}

async function loadActiveVenues(city: string): Promise<SanityVenue[]> {
  const client = getSanityClient()
  return client.fetch<SanityVenue[]>(
    `*[_type == "venue" && city == $city && active == true] | order(tier asc, name asc)`,
    { city }
  )
}

async function writeToSanity(
  events: RawEvent[],
  date: string,
  city: string,
  curatedIds: Set<string>,
  rainReserveIds: Set<string> = new Set(),
) {
  const client = getSanityWriteClient()

  // Delete stale docs for this city+date
  const existingIds: string[] = await client.fetch(
    `*[_type == "event" && city == $city && date == $date]._id`,
    { city, date }
  )
  if (existingIds.length > 0) {
    const del = client.transaction()
    for (const id of existingIds) del.delete(id)
    await del.commit()
  }

  const tx = client.transaction()
  for (let i = 0; i < events.length; i++) {
    const e = events[i]
    const isCurated = curatedIds.has(e.name)
    const isRainReserve = rainReserveIds.has(e.name)
    const slug = `${e.name}-${e.location}-${e.time}`
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)
    const docId = `event-${city}-${date}-${slug}`

    tx.createOrReplace({
      _type: 'event',
      _id: docId,
      city,
      name: e.name,
      rawName: e.rawName,
      location: e.location,
      date,
      time: e.time,
      url: e.url,
      source: e.source,
      eventType: e.eventType ?? null,
      layer: e.layer ?? 'discovery',
      curated: isCurated,
      rainReserve: isRainReserve,
      sponsored: false,
      colorIndex: i % 12,
    })
  }

  await tx.commit()
  console.log(`  [Sanity] ${events.length} Events geschrieben für ${city}/${date}`)

  // Spotify-URLs für Music-Events nachträglich einpflegen
  if (process.env.SPOTIFY_CLIENT_ID) {
    const musicEvents = events.filter(e => ['konzert', 'dj_club', 'special'].includes(e.eventType ?? ''))
    let spotifyCount = 0
    for (const e of musicEvents) {
      const slug = `${e.name}-${e.location}-${e.time}`
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)
      const docId = `event-${city}-${date}-${slug}`
      const spotifyUrl = await lookupSpotifyUrl(e.name, e.eventType, e.location, e.source)
      if (spotifyUrl) {
        await client.patch(docId).set({ spotifyUrl }).commit()
        spotifyCount++
      }
    }
    if (spotifyCount > 0) console.log(`  [Spotify] ${spotifyCount} Artist-Links eingetragen`)
  }
}

// ─── Two-Layer Pipeline (Zürich) ──────────────────────────────────────────────

async function runTwoLayer(city: string, scrapers: ScraperFn[]): Promise<CityResult> {
  const result: CityResult = { city, counts: [0, 0, 0], skipped: [false, false, false], errors: [] }
  const venues = await loadActiveVenues(city)
  console.log(`  [Venues] ${venues.length} aktive Venues geladen`)
  const summer = isSummerSeason()

  for (const [offsetIdx, offset] of ([0, 1, 2] as const).entries()) {
    if (offsetIdx > 0) await new Promise((r) => setTimeout(r, 5_000))
    const date = getDate(offset)
    const label = ['Heute', 'Morgen', 'Übermorgen'][offset]
    console.log(`\n  ── ${label} (${date}) ──`)

    if (await hasEventsForDate(city, date)) {
      console.log('  [Skip] Bereits kuratiert — übersprungen')
      result.skipped[offset] = true
      continue
    }

    // ── Scraping (mit Retry)
    console.log('  [1/5] Scraping...')
    const { raw, scraperErrors, skip } = await runScrapers(scrapers, date, city)
    if (skip) { result.skipped[offsetIdx] = true; continue }

    // ── Geo-filter (Zürich uses blacklist; all other cities use whitelist)
    const geoFilter = city === 'zuerich' ? geoFilterZuerich : (e: RawEvent) => geoFilterCity(e, city)
    const geoFiltered = raw.filter(geoFilter)
    const geoExcluded = raw.length - geoFiltered.length
    if (geoExcluded > 0)
      console.log(`  [Geo] ${geoExcluded} Events ausgeschlossen`)

    // ── Commercial filter (Shop-Aktionen, Läden, Non-Events)
    const cleanFiltered = geoFiltered.filter(e => !isCommercialEvent(e))
    const commercialExcluded = geoFiltered.length - cleanFiltered.length
    if (commercialExcluded > 0)
      console.log(`  [Commercial] ${commercialExcluded} Shop/Non-Events ausgeschlossen`)

    // ── Venue URL enrichment
    for (const e of cleanFiltered) {
      if (!e.url || isAggregatorUrl(e.url)) {
        const v = lookupVenueUrl(e.location, city)
        if (v) e.url = v
      }
    }

    // ── Split: Layer 1 (venue match) vs remainder
    console.log('  [2/5] Layer 1 — Venue Matching...')
    const layer1: RawEvent[] = []
    const remainder: RawEvent[] = []

    for (const e of cleanFiltered) {
      const venue = matchVenue(e, venues, summer)
      if (venue) {
        e.layer = 'venue'
        e.venueId = `venue-${city}-${venue.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        // Venue website always wins — overrides any scraper URL
        if (venue.website) e.url = venue.website
        // Title inference takes priority for specific types (workshop, markt, kunst, open_air)
        // Venue category is used as fallback for generic titles
        const titleType = inferEventTypeFromTitle(e.name)
        const venueType = eventTypeFromVenueCategory(venue.category)
        const specificTypes = new Set(['kunst', 'markt', 'open_air', 'special', 'dj_club', 'kultur'])
        e.eventType = specificTypes.has(titleType) ? titleType : venueType
        layer1.push(e)
      } else {
        remainder.push(e)
      }
    }
    console.log(`  [Layer 1] ${layer1.length} Venue-Events`)

    // ── Deduplicate Layer 1 itself (same event at same venue from multiple scrapers)
    const dedupL1 = deduplicateEvents(layer1)
    const dedupL1Removed = layer1.length - dedupL1.length

    // ── Layer 2: infer types, filter, deduplicate against Layer 1
    console.log('  [3/5] Layer 2 — Discovery...')
    for (const e of remainder) {
      e.layer = 'discovery'
      e.eventType = inferEventTypeFromTitle(e.name)
    }

    const combined = deduplicateEvents([...dedupL1, ...remainder])
    const combinedDedupRemoved = (dedupL1.length + remainder.length) - combined.length
    const duplicatesRemoved = dedupL1Removed + combinedDedupRemoved
    const discoveryPool = combined.filter((e) => e.layer === 'discovery')
    console.log(`  [Layer 2] ${discoveryPool.length} Discovery-Events im Pool`)

    if (dedupL1.length === 0 && discoveryPool.length === 0) {
      console.warn('  [WARNUNG] Keine Events gefunden!')
      continue
    }

    // ── AI curation of discovery pool only
    console.log('  [4/5] AI-Kuratierung (Discovery)...')
    let chosenDiscovery: RawEvent[] = []
    try {
      if (discoveryPool.length > 0) {
        const picks = await curateDiscovery(discoveryPool, city)
        const pickNames = new Set(picks.map((p) => p.name.toLowerCase()))
        chosenDiscovery = discoveryPool.filter((e) =>
          pickNames.has(e.name.toLowerCase()) ||
          picks.some((p) =>
            e.name.toLowerCase().includes(p.name.toLowerCase()) ||
            p.name.toLowerCase().includes(e.name.toLowerCase())
          )
        )
        for (const e of chosenDiscovery) {
          const pick = picks.find((p) =>
            e.name.toLowerCase().includes(p.name.toLowerCase()) ||
            p.name.toLowerCase().includes(e.name.toLowerCase())
          )
          if (pick?.eventType) e.eventType = pick.eventType as import('./types').EventType
        }
        console.log(`  [Discovery] ${chosenDiscovery.length} von ${discoveryPool.length} ausgewählt`)
      }
    } catch (err) {
      console.error('  [AI] Kuratierung fehlgeschlagen, Discovery wird übersprungen:', err)
    }

    // ── Post-processing: fill to 30, then apply nightlife ratio
    const aiChosen = [...dedupL1, ...chosenDiscovery]
    const filled = fillToTarget(aiChosen, discoveryPool)
    const ratioEnforced = enforceNightlifeRatio(filled, city)
    const final = enforceLocationLimit(ratioEnforced)
    final.sort((a, b) => a.time.localeCompare(b.time))

    const nightlifeCount = final.filter((e) => isNightlife(e.eventType ?? 'special')).length
    console.log(`  [5/5] ${final.length} Events total (${nightlifeCount} Nightlife, ${final.length - nightlifeCount} Kultur/Sonstige)`)

    // ── Rain Reserve (if rainy today)
    const curatedIds = new Set(final.map((e) => e.name))
    let rainReserveIds = new Set<string>()

    const weather = await fetchWeather(city)
    if (weather?.isRainy) {
      console.log(`  [Rain] ${weather.description} — kuratiere Rain Reserve...`)
      const unusedPool = cleanFiltered.filter((e) => !curatedIds.has(e.name))
      try {
        const rainPicks = await curateRainReserve(unusedPool, city)
        for (const pick of rainPicks) {
          const match = unusedPool.find((e) =>
            e.name.toLowerCase().includes(pick.name.toLowerCase()) ||
            pick.name.toLowerCase().includes(e.name.toLowerCase())
          )
          if (match) {
            match.name = pick.name
            match.location = pick.location
            if (pick.eventType) match.eventType = pick.eventType as import('./types').EventType
            rainReserveIds.add(match.name)
            final.push(match)
          }
        }
        console.log(`  [Rain] ${rainReserveIds.size} Rain-Reserve Events hinzugefügt`)
      } catch (err) {
        console.error('  [Rain] Kuratierung fehlgeschlagen:', err)
      }
    }

    await writeToSanity(final, date, city, curatedIds, rainReserveIds)
    result.counts[offset] = final.length

    // ── Stats
    const venueCounts: Record<string, number> = {}
    for (const e of final) {
      if (e.location) venueCounts[e.location] = (venueCounts[e.location] || 0) + 1
    }
    const sourceCounts = { eventfrog: 0, hellozurich: 0, gangus: 0, ra: 0 }
    for (const e of raw) {
      if (e.source && e.source in sourceCounts) sourceCounts[e.source as keyof typeof sourceCounts]++
    }
    const typeCounts: Record<string, number> = {}
    for (const e of final) {
      if (e.eventType) typeCounts[e.eventType] = (typeCounts[e.eventType] || 0) + 1
    }
    const topVenues = Object.entries(venueCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    const eveningEvents = final.filter((e) => e.time >= '18:00' && e.time !== '00:00').length
    const allDayEvents  = final.filter((e) => e.time === '00:00').length
    const daytimeEvents = final.length - eveningEvents - allDayEvents

    try {
      await savePipelineSnapshot({
        date, city,
        totalEvents: final.length,
        layer1Events: final.filter((e) => e.layer === 'venue').length,
        layer2Events: final.filter((e) => e.layer === 'discovery').length,
        scraperHealth: {
          rawTotal: raw.length,
          geoExcluded,
          duplicatesRemoved,
          scraperErrors,
        },
        sources: sourceCounts,
        curationQuality: {
          discoveryPoolSize: discoveryPool.length,
          discoverySelected: chosenDiscovery.length,
          discoverySelectionPct: discoveryPool.length > 0
            ? Math.round((chosenDiscovery.length / discoveryPool.length) * 100) : 0,
          rainReserveAdded: rainReserveIds.size,
          nightlifeCount,
          nightlifePct: final.length > 0 ? Math.round((nightlifeCount / final.length) * 100) : 0,
        },
        timing: { eveningEvents, daytimeEvents, allDayEvents },
        eventTypes: typeCounts,
        topVenues,
        weatherRain: weather?.isRainy ?? false,
      })
      await updateVenueStats(city, date, venueCounts)
    } catch (err) {
      console.error('  [Stats] Fehler:', err)
    }
  }
  return result
}

// ─── Single-Layer Pipeline (Luzern, St. Gallen, …) ───────────────────────────

async function runSingleLayer(city: string, scrapers: ScraperFn[]): Promise<CityResult> {
  const result: CityResult = { city, counts: [0, 0, 0], skipped: [false, false, false], errors: [] }
  for (const offset of [0, 1, 2]) {
    const date = getDate(offset)
    const label = ['Heute', 'Morgen', 'Übermorgen'][offset]
    console.log(`\n  ── ${label} (${date}) ──`)

    if (await hasEventsForDate(city, date)) {
      console.log('  [Skip] Bereits kuratiert — übersprungen')
      result.skipped[offset] = true
      continue
    }

    const { raw, scraperErrors, skip } = await runScrapers(scrapers, date, city)
    if (skip) { result.skipped[offset] = true; continue }

    // Venue URL enrichment
    for (const e of raw) {
      if (!e.url || isAggregatorUrl(e.url)) {
        const v = lookupVenueUrl(e.location, city)
        if (v) e.url = v
      }
    }

    const geoFiltered = raw.filter((e) => geoFilterCity(e, city))
    const geoExcluded = raw.length - geoFiltered.length
    if (geoExcluded > 0)
      console.log(`  [Geo] ${geoExcluded} Events ausgeschlossen`)

    if (geoFiltered.length === 0) {
      console.warn(`  [WARNUNG] Keine Events für ${city}/${date}`)
      continue
    }

    const uniqueBefore = geoFiltered.length
    const unique = deduplicateEvents(geoFiltered)
    const duplicatesRemoved = uniqueBefore - unique.length

    console.log(`  [AI] Kuratierung (${unique.length} Events)...`)
    try {
      const curated = await curateEvents(unique, city)
      console.log(`  [AI] ${curated.length} von ${unique.length} ausgewählt`)

      for (const e of unique) {
        const match = curated.find((c) =>
          e.name.toLowerCase().includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(e.name.toLowerCase())
        )
        if (match) {
          e.name = match.name
          e.location = match.location
          if (match.eventType) e.eventType = match.eventType as import('./types').EventType
        }
      }

      const curatedNames = new Set(curated.map((c) => c.name))
      let rainReserveIds = new Set<string>()

      const weather = await fetchWeather(city)
      if (weather?.isRainy) {
        console.log(`  [Rain] ${weather.description} — kuratiere Rain Reserve...`)
        const unusedPool = unique.filter((e) => !curatedNames.has(e.name))
        try {
          const rainPicks = await curateRainReserve(unusedPool, city)
          for (const pick of rainPicks) {
            const match = unusedPool.find((e) =>
              e.name.toLowerCase().includes(pick.name.toLowerCase()) ||
              pick.name.toLowerCase().includes(e.name.toLowerCase())
            )
            if (match) {
              match.name = pick.name
              match.location = pick.location
              if (pick.eventType) match.eventType = pick.eventType as import('./types').EventType
              rainReserveIds.add(match.name)
              unique.push(match)
            }
          }
          console.log(`  [Rain] ${rainReserveIds.size} Rain-Reserve Events hinzugefügt`)
        } catch (err) {
          console.error('  [Rain] Kuratierung fehlgeschlagen:', err)
        }
      }

      const locationLimited = enforceLocationLimit(unique)
      await writeToSanity(locationLimited, date, city, curatedNames, rainReserveIds)
      result.counts[offset] = locationLimited.length

      // ── Stats
      const venueCounts: Record<string, number> = {}
      for (const e of locationLimited) {
        if (e.location) venueCounts[e.location] = (venueCounts[e.location] || 0) + 1
      }
      const sourceCounts = { eventfrog: 0, hellozurich: 0, gangus: 0, ra: 0 }
      for (const e of raw) {
        if (e.source && e.source in sourceCounts) sourceCounts[e.source as keyof typeof sourceCounts]++
      }
      const typeCounts: Record<string, number> = {}
      for (const e of locationLimited) {
        if (e.eventType) typeCounts[e.eventType] = (typeCounts[e.eventType] || 0) + 1
      }
      const topVenues = Object.entries(venueCounts)
        .sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([name, count]) => ({ name, count }))

      const nightlifeCount = locationLimited.filter((e) => isNightlife(e.eventType ?? 'special')).length
      const eveningEvents  = locationLimited.filter((e) => e.time >= '18:00' && e.time !== '00:00').length
      const allDayEvents   = locationLimited.filter((e) => e.time === '00:00').length
      const daytimeEvents  = locationLimited.length - eveningEvents - allDayEvents

      try {
        await savePipelineSnapshot({
          date, city,
          totalEvents: locationLimited.length,
          layer1Events: 0,
          layer2Events: locationLimited.length,
          scraperHealth: {
            rawTotal: raw.length,
            geoExcluded,
            duplicatesRemoved,
            scraperErrors,
          },
          sources: sourceCounts,
          curationQuality: {
            discoveryPoolSize: unique.length,
            discoverySelected: curated.length,
            discoverySelectionPct: unique.length > 0
              ? Math.round((curated.length / unique.length) * 100) : 0,
            rainReserveAdded: rainReserveIds.size,
            nightlifeCount,
            nightlifePct: locationLimited.length > 0
              ? Math.round((nightlifeCount / locationLimited.length) * 100) : 0,
          },
          timing: { eveningEvents, daytimeEvents, allDayEvents },
          eventTypes: typeCounts,
          topVenues,
          weatherRain: weather?.isRainy ?? false,
        })
        await updateVenueStats(city, date, venueCounts)
      } catch (err) {
        console.error('  [Stats] Fehler:', err)
      }
    } catch (err) {
      console.error('  [FEHLER] Kuratierung fehlgeschlagen:', err)
      result.errors.push(`${['Heute','Morgen','Übermorgen'][offset]}: Kuratierung fehlgeschlagen`)
      await writeToSanity(unique, date, city, new Set())
    }
  }
  return result
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

async function deleteExpiredEvents() {
  const client = getSanityWriteClient()
  const today = getDate(0)
  const expired: string[] = await client.fetch(
    `*[_type == "event" && date < $today]._id`,
    { today }
  )
  if (expired.length === 0) {
    console.log('  [Cleanup] Keine abgelaufenen Events')
    return
  }
  const tx = client.transaction()
  for (const id of expired) tx.delete(id)
  await tx.commit()
  console.log(`  [Cleanup] ${expired.length} abgelaufene Events gelöscht`)
}

export async function runPipelineForCity(city: string) {
  const config = CITY_CONFIG[city]
  if (!config) throw new Error(`Unbekannte Stadt: ${city}`)
  console.log(`=== Pipeline für ${city.toUpperCase()} ===`)
  const result = config.twoLayer
    ? await runTwoLayer(city, config.scrapers)
    : await runSingleLayer(city, config.scrapers)
  console.log(`=== Fertig: ${result.counts} Events ===`)
  return result
}

export async function runPipeline() {
  const start = Date.now()
  console.log('=== waslauft.in Pipeline gestartet ===')
  console.log(`Zeitpunkt: ${new Date().toISOString()}`)

  try {
    await _runPipeline(start)
  } catch (err) {
    console.error('[FATAL] Pipeline abgebrochen:', err)
    await sendCrashAlert('Pipeline (fatal)', err)
    throw err
  }
}

async function _runPipeline(start: number) {
  console.log('\n── Cleanup abgelaufene Events ──')
  await deleteExpiredEvents()

  const cityResults: CityResult[] = []
  const pipelineErrors: string[] = []

  const cities = Object.entries(CITY_CONFIG)
  for (let i = 0; i < cities.length; i++) {
    const [city, config] = cities[i]
    console.log(`\n══ Stadt: ${city.toUpperCase()} ══`)
    try {
      const result = config.twoLayer
        ? await runTwoLayer(city, config.scrapers)
        : await runSingleLayer(city, config.scrapers)
      cityResults.push(result)
    } catch (err) {
      console.error(`[FEHLER] Pipeline für ${city} abgebrochen:`, err)
      pipelineErrors.push(`${city}: ${err instanceof Error ? err.message : String(err)}`)
      cityResults.push({ city, counts: [0, 0, 0], skipped: [false, false, false], errors: ['Pipeline abgebrochen'] })
    }
    // Pause between cities to avoid Eventfrog rate-limiting (429)
    if (i < cities.length - 1) {
      console.log('  [Rate-Limit] 30s Pause vor nächster Stadt...')
      await new Promise((resolve) => setTimeout(resolve, 30_000))
    }
  }

  const durationSeconds = (Date.now() - start) / 1000
  console.log(`\n=== Pipeline abgeschlossen in ${durationSeconds.toFixed(1)}s ===`)

  // Featured Event Reminders (3 Tage vor Start / 14 Tage für inaktive)
  console.log('\n── Featured Event Reminders ──')
  try {
    const client = getSanityClient()
    const today = getDate(0)
    const in14 = getDate(14)
    const upcoming: Array<{ name: string; city: string; dateFrom: string; dateTo: string; active: boolean }> =
      await client.fetch(
        `*[_type == "featuredEvent" && dateFrom >= $today && dateFrom <= $in14] | order(dateFrom asc) { name, city, dateFrom, dateTo, active }`,
        { today, in14 }
      )
    const alerts: FeaturedEventAlert[] = upcoming
      .filter((e) => {
        const days = Math.round((new Date(e.dateFrom + 'T12:00:00').getTime() - new Date(today + 'T12:00:00').getTime()) / 86_400_000)
        return e.active ? days <= 3 : days <= 14
      })
      .map((e) => ({
        ...e,
        daysUntilStart: Math.round((new Date(e.dateFrom + 'T12:00:00').getTime() - new Date(today + 'T12:00:00').getTime()) / 86_400_000),
      }))
    if (alerts.length > 0) {
      await sendFeaturedEventReminders(alerts)
    } else {
      console.log('  Keine anstehenden Featured Events')
    }
  } catch (err) {
    console.error('  [Featured] Fehler beim Check:', err)
  }

  // Telegram Notification (Instagram wird separat via /api/cron/instagram um 05:15 gepostet)
  console.log('\n── Telegram Notification ──')
  await sendTelegramNotification({ cityResults, instagramPosted: false, durationSeconds, errors: pipelineErrors })
}

if (process.argv[1]?.endsWith('pipeline.ts') || process.argv[1]?.endsWith('pipeline.js')) {
  runPipeline().catch((err) => { console.error('Fatal:', err); process.exit(1) })
}
