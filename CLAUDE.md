# CLAUDE.md — waslauft.in

> Vollständiger Projektkontext für Claude Code. Vor jeder Arbeit lesen.

## Was ist das?

**waslauft.in** — minimale Multi-City Eventplattform. Beantwortet: "Was läuft heute in [Stadt]?"

- Landing page: waslauft.in → Stadtauswahl
- Stadtseiten: waslauft.in/zuerich, /stgallen, /luzern, /winterthur
- AI-kuratiert, bis zu 30 Events pro Stadt pro Tag
- Kein Login, keine Filter, keine Kategorien
- Eine chronologische Liste, Klick → externe URL

---

## Aktive Städte

| Stadt | Slug | Status | Scraper |
|---|---|---|---|
| Zürich | `zuerich` | ✅ Aktiv | Eventfrog + hellozurich + Resident Advisor |
| St. Gallen | `stgallen` | ✅ Aktiv | Eventfrog |
| Luzern | `luzern` | ✅ Aktiv | Gangus + Eventfrog |
| Winterthur | `winterthur` | ✅ Aktiv | Eventfrog (Extended, 25 Seiten + Early-Exit) |
| Basel | `basel` | 🔜 Coming Soon | — |
| Bern | `bern` | 🔜 Coming Soon | — |

Basel + Bern sind im Frontend deaktiviert (`active: false` in `src/app/page.tsx`) und werden **nicht** in der Pipeline gescrapt.

---

## Tech Stack

| Komponente | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| CMS | Sanity v5 (Free Tier) |
| Hosting | Vercel |
| AI | Anthropic API — Claude Sonnet 4.6 |
| Scheduling | Vercel Cron Jobs (Pipeline 05:00 UTC, Instagram 09:00 UTC) |
| Scraping | eventfrog-api npm + Cheerio + RA GraphQL + Drupal JSON:API |
| Image Gen | Satori (JSX→SVG) + sharp (SVG→PNG) |
| Instagram | Meta Graph API v21.0 (Feed Karussell + Stories) |
| Weather | Open-Meteo API (kostenlos, kein Key) |
| Monitoring | Telegram Bot (Webhook) |
| Studio | Sanity Studio eingebettet unter `/studio` |

---

## Routing

```
/                          → Landing page (Stadtauswahl)
/[city]                    → Stadtseite (zuerich / stgallen / luzern)
/about                     → About-Seite
/impressum                 → Impressum
/datenschutz               → Datenschutz
/studio/[[...tool]]        → Sanity Studio (embedded, ssr: false)
/api/cron/pipeline         → Vercel Cron Endpoint (05:00 UTC)
/api/cron/instagram        → Vercel Cron Endpoint (09:00 UTC)
/api/telegram/webhook      → Telegram Bot Webhook (/status Command)
```

---

## Projektstruktur

```
├── scripts/
│   ├── pipeline.ts              # Haupt-Orchestrator (täglich via Cron)
│   ├── types.ts                 # RawEvent, CuratedEvent, SanityVenue
│   ├── curate.ts                # Claude AI Kuration + pickInstagramEvents()
│   ├── deduplicate.ts           # Levenshtein Fuzzy Dedup
│   ├── eventtype.ts             # Event-Typ Inferenz
│   ├── venues.ts                # Venue-URL Registry (Fallback-URLs)
│   ├── notify.ts                # Telegram Notifications (Pipeline-Report + Crash-Alert)
│   ├── stats.ts                 # Langzeit-Statistiken (savePipelineSnapshot, updateVenueStats)
│   ├── weather.ts               # Open-Meteo Wetter pro Stadt (fetchCityWeather)
│   ├── post-instagram.ts        # Instagram Feed + Stories (täglich via Cron)
│   ├── generate-image-v2.ts     # Satori Image Generation (Feed + Story Slides)
│   ├── telegram-bot.ts          # /status Command Handler
│   ├── check-status.ts          # Manueller Status-Check (CLI)
│   ├── seed-venues.ts           # Einmalig: Venues in Sanity seeden
│   └── scrapers/
│       ├── eventfrog.ts         # Eventfrog API (alle aktiven Städte)
│       ├── hellozurich.ts       # hellozurich.ch HTML-Scraper (Zürich)
│       ├── gangus.ts            # gangus.ch / null41.nodehive API (Luzern)
│       └── residentadvisor.ts   # RA GraphQL API (Zürich Nightlife)
│
├── src/
│   ├── app/
│   │   ├── page.tsx             # Landing page (Stadtauswahl)
│   │   ├── [city]/page.tsx      # Stadtseite (dynamische Route)
│   │   ├── about/page.tsx       # About-Seite
│   │   ├── impressum/page.tsx   # Impressum
│   │   ├── datenschutz/page.tsx # Datenschutz
│   │   ├── studio/[[...tool]]/
│   │   │   ├── page.tsx         # Thin wrapper (dynamic import, ssr: false)
│   │   │   └── Studio.tsx       # NextStudio Komponente
│   │   └── api/
│   │       ├── cron/pipeline/route.ts
│   │       ├── cron/instagram/route.ts
│   │       └── telegram/webhook/route.ts
│   ├── components/
│   │   ├── EventBlock.tsx        # Einzelner farbiger Event-Block
│   │   ├── EventList.tsx         # Liste + Header + Tabs + Footer
│   │   ├── SiteHeader.tsx        # Gemeinsamer Header (Logo + Seitenname)
│   │   └── SiteFooter.tsx        # Gemeinsamer Footer (Instagram, About, Datenschutz, Impressum)
│   └── lib/
│       ├── constants.ts          # 12 Farben, Event-Typ, Datums-Helpers
│       ├── queries.ts            # GROQ-Queries
│       └── sanity.ts             # Read + Write Clients
│
├── sanity/schemas/
│   ├── event.ts
│   ├── venue.ts
│   ├── pipelineSnapshot.ts      # Tägliche Pipeline-Statistiken
│   └── venueStats.ts            # Kumulierte Venue-Auftritts-Stats
├── sanity.config.ts              # Studio: Venues + Events + Stats pro Stadt
├── vercel.json                   # Cron: Pipeline 05:00 UTC, Instagram 09:00 UTC
└── CLAUDE.md                     # Diese Datei
```

---

## npm Scripts

```bash
npm run dev           # Next.js Dev Server
npm run build         # Production Build
npm run pipeline      # Pipeline manuell starten
npm run seed-venues   # Venues in Sanity seeden (einmalig)
```

---

## Pipeline-Logik

### Ablauf täglich 05:00 UTC

```
1. Cleanup         → Abgelaufene Events aus Sanity löschen (date < heute)
2. Pro Stadt (Zürich, St. Gallen, Luzern):
   a. Skip-Check   → Hat diese Stadt/dieses Datum bereits Events? → überspringen
   b. Scraping     → Alle Scraper parallel für dieses Datum
   c. Geo-Filter   → Zürich: Blacklist | andere Städte: Whitelist
   d. Layer 1      → Venue-Matching (kein AI, direkte Zuweisung)
   e. Layer 2      → AI-Discovery (Claude kuratiert Discovery-Pool)
   f. Fill         → Auf 30 Events auffüllen aus Discovery-Pool
   g. Nightlife    → ≥60% Nightlife-Ratio (nur Zürich, nur wenn >30 Events)
   h. Sanity Write → Events schreiben
   i. Stats        → savePipelineSnapshot + updateVenueStats
3. Telegram        → Pipeline-Report mit Event-Counts pro Stadt
```

### Instagram täglich 09:00 UTC (= 11:00 Schweizer Zeit)

```
1. Events aus Sanity laden (alle 3 Städte)
2. Wetter pro Stadt (Open-Meteo)
3. Feed-Post: Titel-Slide + je ein City-Slide (AI wählt 5 beste Events)
4. Stories: Pro Stadt — Titel-Slide + Event-Slides
5. Wetter-Switch: isRain → Navy-Design mit Regentropfen
```

### Skip-Logik (Ressourcen-Optimierung)
Jeder Run verarbeitet Heute/Morgen/Übermorgen, überspringt aber Daten die bereits Events haben. Im Normalfall verarbeitet jeder Run nur **1 neuen Tag** pro Stadt = **3 Eventfrog-Calls total**, kein Rate-Limiting.

### Venue Matching (Layer 1)
```
Pass 1: Word-Boundary Regex auf name + stripCitySuffix(name) + eventfrogName
        "Palace St. Gallen" → testet auch "Palace" (Strip)
        "Exil" matcht "Exil Club" aber nicht "Textil"

Pass 2: Token-Overlap — min. 4 Zeichen, VENUE_STOPWORDS ausgeschlossen
        Nur stripped name (kein eventfrogName) → verhindert "gallen"-False-Positives
        Stopwords: stadtname-tokens (gallen, luzern, zürich, basel, bern)
                   + generische Wörter (club, bar, halle, haus, restaurant…)
```

### Geo-Filter
- **Zürich**: Blacklist — schließt aus: Winterthur, Baden, Luzern, Bern, St. Gallen etc.
- **Andere Städte**: Whitelist — Location muss Stadtname enthalten
  - stgallen: `st. gallen`, `st gallen`, `st.gallen`, `saint-gallen`
  - luzern: `luzern`, `lucerne`, `kriens`, `horw`, `ebikon`

---

## Scraper-Details

### Eventfrog (`scripts/scrapers/eventfrog.ts`)
- npm Package `eventfrog-api` — enthält einen Prototype-Patch für Node.js
- Das Package nutzt protocol-relative URLs (`//api.eventfrog.net`), die Node.js ablehnt
- Patch überschreibt `_get` auf dem Prototype um `https://` zu erzwingen
- Rate Limit: 429 bei schnellen Folge-Requests → 30s Pause zwischen Städten

### Resident Advisor (`scripts/scrapers/residentadvisor.ts`)
- GraphQL: `https://ra.co/graphql`
- Zürich Area ID: **390**
- Query: `eventListings` mit `filters: { areas: { eq: 390 } }`
- `IntFilterInputDtoInput` erwartet `{ eq: 390 }` (Int), nicht `{ id: "390" }` (String)
- Liefert primär Wochenend-Events (Clubs) — Montag–Donnerstag oft 0 Events

### Gangus (`scripts/scrapers/gangus.ts`)
- Drupal JSON:API: `https://null41.nodehive.app/jsonapi/node/event`
- Deckt Zentralschweiz ab — `locationCity` defaults zu `luzern` wenn leer
- `field_ticket_link` kann String oder Objekt `{ uri: string }` sein — Type Guard nötig

### hellozurich (`scripts/scrapers/hellozurich.ts`)
- HTML-Scraper mit Cheerio
- Kulturkalender (Museen, Theater, Konzerte) — kein Nightlife
- Dient als Discovery-Pool für Layer 2

### Nicht mehr verwendet
- ~~saiten.ch~~ — gibt 250 identische Dauerausstellungen jeden Tag zurück, nutzlos für tagesgenaue Events

---

## Sanity Schema

### Event
Felder: `city`, `name`, `rawName`, `location`, `date` (YYYY-MM-DD), `time` (HH:MM), `url`, `source`, `eventType`, `layer`, `curated`, `sponsored`, `colorIndex`

**Wichtig:** ALLE GROQ-Queries müssen `city == $city` filtern.

### Venue
Felder: `name`, `eventfrogName`, `city`, `tier` (S/A/B/C), `category`, `active`, `summerBonus`, `website`

~120 Venues über alle 5 Städte. Seed: `npm run seed-venues`.

### PipelineSnapshot
Täglich pro Stadt gespeichert. Felder: `date`, `city`, `totalEvents`, `layer1Events`, `layer2Events`, `scraperHealth` (rawTotal, geoExcluded, duplicatesRemoved, scraperErrors), `sources` (eventfrog, hellozurich, gangus, ra), `curationQuality` (discoveryPoolSize, discoverySelected, discoverySelectionPct, rainReserveAdded, nightlifeCount, nightlifePct), `timing` (eveningEvents, daytimeEvents, allDayEvents), `eventTypes`, `topVenues`, `instagramPosted`, `instagramEvents`, `weatherRain`

### VenueStats
Kumuliert über alle Tage. Felder: `venueName`, `city`, `totalAppearances`, `instagramAppearances`, `firstSeen`, `lastSeen`, `recentDates` (letzte 30 Daten)

---

## Sanity Studio
Eingebettet unter `/studio`. Zwei-Datei-Lösung wegen Next.js SSR:
- `page.tsx` — thin wrapper mit `dynamic(..., { ssr: false })`
- `Studio.tsx` — enthält den eigentlichen `<NextStudio>` Call

Grund: `useEffectEvent` fehlt in Next.js canary React — SSR muss deaktiviert sein.

---

## Instagram Image Generation

### Slides (`scripts/generate-image-v2.ts`)
- Satori rendert JSX → SVG, sharp konvertiert → PNG
- Schriften: Instrument Sans (700) + JetBrains Mono (400/700) lokal geladen
- **Feed**: 1080×1080px — `generateCombinedTitleSlide` + `generateCombinedCitySlide`
- **Stories**: 1080×1920px — `generateStoryTitleSlide` + `generateStoryEventSlides`
- **Bad Weather**: Navy-Design (#0D1A2D bg, #ffffff fg) + Regentropfen-Overlay
  - `generateBadWeatherCitySlide`, `generateBadWeatherStoryTitleSlide`, `generateBadWeatherStoryEventSlides`

### Titel-Farb-Rotation
Jeden Tag andere Farbe: `dayOfYear % 12` → Index in 12er Farb-Array

### AI Event-Selektion (`curate.ts → pickInstagramEvents`)
Claude wählt die 5 besten Events pro Stadt für den Instagram-Post. Kriterien: bekannte Artists, Einmalevents, Top-Venues, Abend-Präferenz, Genre-Mix.

### Wetter (`scripts/weather.ts`)
Open-Meteo WMO-Codes — `isRain: true` bei Codes 51–99 (Niederschlag). Pro Stadt unabhängig.

---

## Design System

### Farben (12er Rotation für Event-Blocks)
```
#FF0000  #FF00FF  #00E5FF  #FFFFFF  #FFB800  #00E05A
#5B5BFF  #FF4D94  #C864FF  #FFE500  #FF6B35  #00FF94
```

### Instagram Bad-Weather Palette
```
NAVY=#0D1A2D  NAVY_FG=#ffffff  NAVY_BORDER=#1E3A58  NAVY_LEGEND=#152236
```

### Typografie (Web)
- Event-Name: Instrument Sans, 700, uppercase, 1.4–1.9rem
- Location/Zeit: JetBrains Mono, 0.62rem, uppercase
- Logo/Nav: Instrument Sans / JetBrains Mono

### Layout pro Event-Block
- Volle Breite, kein border-radius, 1px schwarze Trennlinie
- Oben links: Location | Oben rechts: Zeit
- Unten: Event-Name (gross, bold, uppercase)
- Ganzer Block klickbar → externe URL

### Footer
Links: **Instagram**, **About**, **Datenschutz**, **Impressum** — kein AI-Branding, kein "Event melden"
Mobile: vertikal gestapelt, kein border-top, `padding-bottom: 3rem`

---

## Monitoring

### Telegram Bot
- Webhook unter `/api/telegram/webhook`
- `/status` Command: Wetter pro Stadt, Event-Counts (heute/morgen/übermorgen), letzter IG-Post, API-Ablaufdaten, nächste Cron-Zeiten (Schweizer Zeit)

### Error Alerting
- **Crash-Alert** (`notify.ts → sendCrashAlert`): bei fatalen Fehlern in Pipeline oder Instagram Cron → sofortiger Telegram-Alert mit Kontext + Fehlermeldung
- **Pipeline-Report** (`notify.ts → sendTelegramNotification`): nach jedem erfolgreichen Lauf mit Event-Counts pro Stadt

---

## Kritische Regeln

1. **Kein AI-Branding im UI** — "AI-kuratiert" darf nirgendwo erscheinen
2. **city-Feld Pflicht** — jedes Sanity-Event/Venue braucht `city`
3. **GROQ immer mit city filtern** — `*[_type == "event" && city == $city && ...]`
4. **Basel + Bern nicht in CITY_CONFIG** bis sie aktiv gehen
5. **saiten.ch nicht verwenden** — Dauerausstellungen, tagesunspezifisch
6. **curate.ts JSON-Parse** — immer via Regex `match(/\{[\s\S]*\}/)` extrahieren, nie direkt `JSON.parse()` auf Claude-Output

---

## Environment Variables

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=   # sanity.io/manage
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=                # Write-Token
EVENTFROG_API_KEY=               # ✅ gesetzt, gültig bis 1.4.2027
ANTHROPIC_API_KEY=               # console.anthropic.com
CRON_SECRET=                     # Vercel Dashboard
META_ACCESS_TOKEN=               # Meta Graph API (Instagram)
INSTAGRAM_ACCOUNT_ID=            # Instagram Business Account ID
TELEGRAM_BOT_TOKEN=              # BotFather
TELEGRAM_CHAT_ID=                # Chat-ID für Pipeline-Notifications
BLOB_READ_WRITE_TOKEN=           # Vercel Blob (temporäre Instagram-Bilder)
```

---

## Zürich Venue-Tiers (für AI-Kuration)

### Tier S — fast immer auswählen
Hallenstadion, The Hall (Dübendorf), X-TRA, Komplex 457, Kaufleuten, Volkshaus, Maag Halle, Mascotte

### Tier A — Electronic / Techno
Hive, Supermarket, Frieda's Büxe, Zukunft/Zukki, Kauzu, Exil, Klaus, Mädchere

### Tier A — Alternative / Rock
Dynamo, Rote Fabrik, Bogen F, Moods, Sender

### Tier B — Mainstream / Bars
Plaza, Vior, Jade, Aura, Gonze, Olé Olé Bar, Kasheme, Frau Gerolds Garten

### Tier B — Kultur
Schiffbau, Papiersaal, Folium, Kosmos, Gessnerallee, Kirche Neumünster

---

## Nächste Schritte (optional)

- [ ] Basel + Bern aktivieren (Scraper evaluieren)
- [ ] Venue-Frequenz in Kuration nutzen (überrepräsentierte Venues dämpfen)
- [ ] Event-Dedup über Tage (gleiches Mehrtages-Event nicht täglich neu zeigen)
- [ ] Meta Access Token Rotation automatisieren

---

## Owner
Florin Grunder — Senior UI/UX Designer, Zürich
