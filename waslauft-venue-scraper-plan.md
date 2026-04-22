# waslauft.in — Venue-Zentriertes Scraping System
### Planungsdokument · Test-Implementierung Zürich

---

## Ausgangslage

Das bestehende System läuft parallel weiter und wird **nicht angefasst**. Ziel dieses Dokuments ist die Implementierung einer neuen, separaten Test-Page für Zürich, die auf einem **venue-zentrischen Ansatz** basiert. Die Tier-Listen der Venues existieren bereits in Sanity und dienen als Fundament.

---

## Grundprinzip: Venue als Source of Truth

```
ALT (ticketing-zentriert):
  Eventfrog API + HelloZurich → Events → match mit Venue-Liste

NEU (venue-zentriert):
  Venue-Liste (Sanity) → pro Venue definierte Sources → Events
```

Jede Location in der Tier-Liste bekommt eine Konfiguration, die beschreibt, wo und wie ihre Events gescrapt werden sollen. Der Scraper iteriert über die Venues — nicht über Plattformen.

---

## Phase 1 — Sanity Schema erweitern

### 1.1 Bestehende Venue-Dokumente um Source-Konfiguration ergänzen

Füge jedem Venue-Dokument in Sanity ein neues Feld `scrapeSources` hinzu:

```javascript
// sanity/schemas/venue.js (Ergänzung)
{
  name: 'scrapeSources',
  title: 'Scrape Sources',
  type: 'array',
  of: [
    {
      type: 'object',
      name: 'scrapeSource',
      fields: [
        {
          name: 'type',
          type: 'string',
          options: {
            list: [
              { title: 'Website (Event-Listing)', value: 'website' },
              { title: 'Instagram', value: 'instagram' },
              { title: 'Resident Advisor', value: 'ra' },
              { title: 'Ticketmaster', value: 'ticketmaster' },
              { title: 'Ticket Plus', value: 'ticketplus' },
              { title: 'Eventfrog', value: 'eventfrog' },
              { title: 'Facebook Events', value: 'facebook' },
              { title: 'Bandsintown', value: 'bandsintown' },
            ]
          }
        },
        {
          name: 'url',
          title: 'URL / Handle / ID',
          type: 'string',
          description: 'URL für Website/RA/etc. oder @handle für Instagram'
        },
        {
          name: 'priority',
          title: 'Priorität (1 = höchste)',
          type: 'number',
        },
        {
          name: 'active',
          title: 'Aktiv',
          type: 'boolean',
          initialValue: true
        },
        {
          name: 'notes',
          title: 'Notizen (intern)',
          type: 'string',
          description: 'z.B. "Nur Club-Events, keine Privat-Buchungen"'
        }
      ],
      preview: {
        select: { title: 'type', subtitle: 'url' }
      }
    }
  ]
}
```

### 1.2 Venue-Daten manuell befüllen (Top-Venues zuerst)

**Priorität: S-Tier und A-Tier Venues**

Für jeden Venue in Sanity Studio eintragen:
- Alle bekannten Event-Sources mit URL
- Priorität setzen (Website des Venues = 1, RA = 2, Ticketing-Plattform = 3, etc.)
- Inaktive oder unsichere Sources mit `active: false` markieren

> **Ziel vor dem ersten Test-Run:** Mindestens 15–20 Venues vollständig konfiguriert.

---

## Phase 2 — Scraper-Architektur

### 2.1 Überblick

```
┌─────────────────────────────────────────────┐
│              Scraper Orchestrator            │
│   Liest Venues aus Sanity (mit Sources)      │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────▼────────────┐
    │    Source Router        │
    │  dispatcht pro Source   │
    │  zum richtigen Handler  │
    └──┬──┬──┬──┬──┬──┬──────┘
       │  │  │  │  │  │
  website  RA  IG  TP  EF  ...
  Handler  ...  ...  ...
       │
  ┌────▼───────────────┐
  │  Normalized Event  │  ← einheitliches Format
  └────────────────────┘
       │
  ┌────▼───────────────┐
  │  Deduplication     │
  └────────────────────┘
       │
  ┌────▼───────────────┐
  │  Sanity Write      │  → events collection (neue, separate)
  └────────────────────┘
```

### 2.2 Normalized Event Format

Alle Handler geben dasselbe Format zurück:

```typescript
interface NormalizedEvent {
  // Pflichtfelder
  title: string
  venue: string              // Sanity venue._id
  startDate: string          // ISO 8601
  
  // Optional aber erwünscht
  endDate?: string
  description?: string
  imageUrl?: string
  ticketUrl?: string
  price?: string
  tags?: string[]
  
  // Metadaten für Deduplication & Debugging
  sourceType: SourceType     // 'website' | 'ra' | 'instagram' | ...
  sourceUrl: string
  sourcePriority: number
  scrapedAt: string          // ISO 8601
  rawId?: string             // ID aus der Source-Plattform falls vorhanden
}
```

### 2.3 Source Handler — Implementierungsreihenfolge

**Etappe A: Gut strukturierte Sources (zuerst)**

1. **Resident Advisor Handler**
   - Undokumentierte aber stabile API: `ra.co/api/ra.getEvents`
   - GraphQL endpoint: `https://ra.co/graphql`
   - Venue-ID aus RA-URL extrahieren
   - Zuverlässigstes Format, kaum Maintenance

2. **Ticketmaster / Ticket Plus Handler**
   - Ticketmaster hat offizielle API (kostenloser Key)
   - Suche per `venueId` oder `keyword + city`
   - Ticket Plus: kein offizielles API → HTML-Scraping der Venue-Seite

3. **Eventfrog Handler** *(bereits vorhanden → adaptieren)*
   - Bestehende Logic nutzen, aber Venue-ID als Filter übergeben
   - Nicht mehr als globaler Sweep sondern gezielt pro Venue

**Etappe B: Website-Scraping**

4. **Generic Website Handler**
   - Nutzt Playwright (headless Chrome) für JS-gerenderete Seiten
   - Heuristischer Ansatz: suche nach `<article>`, `<event>`, `.event-item`, Schema.org `Event`-Markup
   - Fallback: Claude API für HTML-Parsing (strukturierte Extraktion)
   - Wichtig: Kein Custom-Code pro Venue in Phase 2 — generischer Handler zuerst testen

5. **Venue-Spezifische Handler** (nur wenn Generic Handler versagt)
   - Dedizierter Parser per Venue, dokumentiert mit "warum nötig"
   - Beispiele: Kaufleuten, Moods, Rote Fabrik falls besondere Struktur

**Etappe C: Social / Indirekte Sources**

6. **Instagram Handler** *(bereits in Planung)*
   - Bio-Link als Event-Source
   - Story-Links via Graph API
   - Caption-Parsing via Claude API

---

## Phase 3 — Deduplication

### 3.1 Event-Identity-Logik

Zwei Events gelten als identisch wenn:

```typescript
function isSameEvent(a: NormalizedEvent, b: NormalizedEvent): boolean {
  return (
    a.venue === b.venue &&
    isSameDay(a.startDate, b.startDate) &&
    titleSimilarity(a.title, b.title) > 0.75  // fuzzy match
  )
}
```

Empfohlene Library für Fuzzy Match: `fuse.js` oder `string-similarity`

### 3.2 Gewinner-Logik bei Duplikaten

```
Priority 1:  Venue-eigene Website
Priority 2:  Resident Advisor
Priority 3:  Ticketmaster / Ticket Plus
Priority 4:  Eventfrog
Priority 5:  HelloZurich / Aggregatoren
Priority 6:  Instagram
```

Bei Duplikaten: Daten des höher priorisierten Sources werden übernommen, aber **Ticket-URL aus dem Ticketing-System beibehalten** (auch wenn der Eintrag selbst von der Venue-Website kommt).

### 3.3 Sanity Event Collection (neu, getrennt)

Die neue Collection heisst `eventVenueCentric` (oder ähnlich) und wird **nicht** mit der bestehenden `event` Collection gemischt. So können beide Systeme parallel verglichen werden.

```javascript
// sanity/schemas/eventVenueCentric.js
{
  name: 'eventVenueCentric',
  title: 'Event (Venue-Centric)',
  fields: [
    // ... NormalizedEvent Felder
    { name: 'venue', type: 'reference', to: [{ type: 'venue' }] },
    { name: 'sourceType', type: 'string' },
    { name: 'sourceUrl', type: 'url' },
    { name: 'isDuplicate', type: 'boolean', initialValue: false },
    { name: 'mergedFrom', type: 'array', of: [{ type: 'string' }] }
  ]
}
```

---

## Phase 4 — Frontend Test-Page

### 4.1 Neue Route

```
/zuerich-v2
```

Parallel zur bestehenden `/zuerich` Page. Kein Link in der Navigation — nur für interne Tests erreichbar.

### 4.2 Unterschiede zur bestehenden Page

- Daten kommen aus `eventVenueCentric` statt `event`
- UI zeigt **Source-Badge** pro Event (klein, für Debug-Zwecke): z.B. `RA`, `Website`, `TP`
- Filter-Option: "Nur S-Tier Venues" / "Alle Tier"
- Ansicht: Identisch zur bestehenden Page (kein Redesign nötig für Test)

### 4.3 GROQ Query

```groq
*[_type == "eventVenueCentric" && !isDuplicate] {
  title,
  startDate,
  venue-> {
    name,
    tier,
    slug
  },
  sourceType,
  ticketUrl,
  imageUrl
} | order(startDate asc)
```

---

## Phase 5 — Qualitätskontrolle & Vergleich

Sobald beide Systeme parallel laufen:

### 5.1 Coverage-Check
Für jede S-Tier Location: wie viele Events findet das neue System vs. das alte?

### 5.2 Unique-Event-Rate
Wie viele Events im neuen System kommen **nicht** aus Eventfrog/HelloZurich? Das ist der Mehrwert-Indikator.

### 5.3 False-Positive-Rate
Manuelle Stichprobe: Sind die gescrapten Events korrekt? Stimmen Datum, Venue, Titel?

---

## Implementierungs-Reihenfolge (Empfehlung)

```
[ ] 1. Sanity Schema erweitern (scrapeSources Feld)
[ ] 2. Top 15 Venues in Sanity Studio manuell mit Sources befüllen
[ ] 3. Normalized Event Interface definieren (TypeScript)
[ ] 4. Scraper Orchestrator bauen (liest Venues aus Sanity)
[ ] 5. RA Handler implementieren & testen
[ ] 6. Ticketmaster Handler implementieren & testen
[ ] 7. Eventfrog Handler adaptieren (venue-gefiltert)
[ ] 8. Generic Website Handler mit Playwright
[ ] 9. Deduplication Layer
[ ] 10. Sanity Write (eventVenueCentric Collection)
[ ] 11. Frontend /zuerich-v2 Route mit Source-Badge
[ ] 12. Coverage-Vergleich alt vs. neu
```

---

## Offene Fragen / Entscheidungen

| Frage | Optionen | Empfehlung |
|---|---|---|
| Scraper-Runtime | Node.js Cron / Vercel Cron / separater Service | Vercel Cron (bereits in Infra) |
| Playwright Hosting | Vercel (limitiert) / eigener Container | Testen mit Vercel, sonst Railway |
| RA API Approach | Undokumentiertes GraphQL / HTML-Scraping | GraphQL (stabiler) |
| Claude API für HTML-Parsing | Kostenfaktor beachten | Nur als Fallback, nicht als Default |
| Scrape-Frequenz | Täglich / 2x täglich / stündlich | Täglich für Events > 3 Tage voraus, 2x täglich für kurzfristige |

---

*Dokument erstellt: April 2026 · waslauft.in internal*
