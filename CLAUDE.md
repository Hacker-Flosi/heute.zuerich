# CLAUDE.md — waslauft.in

> Vollständiger Projektkontext für Claude Code. Vor jeder Arbeit lesen.

## Was ist das?

**waslauft.in** — minimale Multi-City Eventplattform. Beantwortet: "Was läuft heute in [Stadt]?"

- Landing page: waslauft.in → Stadtauswahl
- Stadtseiten: waslauft.in/zuerich, /stgallen, /luzern
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
| Scheduling | Vercel Cron Jobs (täglich 05:00 UTC) |
| Scraping | eventfrog-api npm + Cheerio + RA GraphQL |
| Studio | Sanity Studio eingebettet unter `/studio` |

---

## Routing

```
/                          → Landing page (Stadtauswahl)
/[city]                    → Stadtseite (zuerich / stgallen / luzern)
/about                     → About-Seite
/studio/[[...tool]]        → Sanity Studio (embedded, ssr: false)
/api/cron/pipeline         → Vercel Cron Endpoint (gesichert mit CRON_SECRET)
```

---

## Projektstruktur

```
├── scripts/
│   ├── pipeline.ts              # Haupt-Orchestrator (täglich via Cron)
│   ├── types.ts                 # RawEvent, CuratedEvent, SanityVenue
│   ├── curate.ts                # Claude AI Kuration
│   ├── deduplicate.ts           # Levenshtein Fuzzy Dedup
│   ├── eventtype.ts             # Event-Typ Inferenz
│   ├── venues.ts                # Venue-URL Registry (Fallback-URLs)
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
│   │   ├── studio/[[...tool]]/
│   │   │   ├── page.tsx         # Thin wrapper (dynamic import, ssr: false)
│   │   │   └── Studio.tsx       # NextStudio Komponente
│   │   └── api/cron/pipeline/route.ts
│   ├── components/
│   │   ├── EventBlock.tsx        # Einzelner farbiger Event-Block
│   │   └── EventList.tsx         # Liste + Header + Tabs + Footer
│   └── lib/
│       ├── constants.ts          # 12 Farben, Event-Typ, Datums-Helpers
│       ├── queries.ts            # GROQ-Queries
│       └── sanity.ts             # Read + Write Clients
│
├── sanity/schemas/
│   ├── event.ts
│   └── venue.ts
├── sanity.config.ts              # Studio: Venues + Events pro Stadt
├── vercel.json                   # Cron: täglich 05:00 UTC
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

---

## Sanity Studio
Eingebettet unter `/studio`. Zwei-Datei-Lösung wegen Next.js SSR:
- `page.tsx` — thin wrapper mit `dynamic(..., { ssr: false })`
- `Studio.tsx` — enthält den eigentlichen `<NextStudio>` Call

Grund: `useEffectEvent` fehlt in Next.js canary React — SSR muss deaktiviert sein.

---

## Design System

### Farben (12er Rotation für Event-Blocks)
```
#FF0000  #FF00FF  #00E5FF  #FFFFFF  #FFB800  #00E05A
#5B5BFF  #FF4D94  #C864FF  #FFE500  #FF6B35  #00FF94
```

### Typografie
- Event-Name: Instrument Sans, 700, uppercase, 1.4–1.9rem
- Location/Zeit: JetBrains Mono, 0.62rem, uppercase
- Logo/Nav: Instrument Sans / JetBrains Mono

### Layout pro Event-Block
- Volle Breite, kein border-radius, 1px schwarze Trennlinie
- Oben links: Location | Oben rechts: Zeit
- Unten: Event-Name (gross, bold, uppercase)
- Ganzer Block klickbar → externe URL

### Footer
Nur: **Instagram** + **About** — kein AI-Branding, kein "Event melden"

---

## Kritische Regeln

1. **Kein AI-Branding im UI** — "AI-kuratiert" darf nirgendwo erscheinen
2. **city-Feld Pflicht** — jedes Sanity-Event/Venue braucht `city`
3. **GROQ immer mit city filtern** — `*[_type == "event" && city == $city && ...]`
4. **Basel + Bern nicht in CITY_CONFIG** bis sie aktiv gehen
5. **saiten.ch nicht verwenden** — Dauerausstellungen, tagesunspezifisch

---

## Environment Variables

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=   # sanity.io/manage
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=                # Write-Token
EVENTFROG_API_KEY=               # ✅ gesetzt, gültig bis 1.4.2027
ANTHROPIC_API_KEY=               # console.anthropic.com
CRON_SECRET=                     # Vercel Dashboard
# Phase 2 (noch nicht gebaut):
META_ACCESS_TOKEN=
INSTAGRAM_ACCOUNT_ID=
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

## Nächste Schritte

- [ ] Vercel Deploy (Domain + CRON_SECRET bereits konfiguriert — nur deployen)
- [ ] Instagram-Automation (Satori Image Gen + Meta Graph API)
- [ ] Basel + Bern aktivieren (Scraper evaluieren)
- [ ] Error-Monitoring für Pipeline (Alert bei Fehler)

---

## Owner
Florin Grunder — Senior UI/UX Designer, Zürich
