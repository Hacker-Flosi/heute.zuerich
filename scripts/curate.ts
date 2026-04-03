// scripts/curate.ts
// AI-Kuratierungs-Script für waslauft.in

import Anthropic from '@anthropic-ai/sdk'

const VENUE_TIERS = `
## Venue-Tiers Zürich

### Tier S — Fast immer auswählen
Hallenstadion, The Hall (Dübendorf), X-TRA, Komplex 457, Kaufleuten, Volkshaus, Maag Halle, Mascotte

### Tier A — Electronic / Techno / House
Hive, Supermarket, Frieda's Büxe, Zukunft, Kauzu, Exil, Klaus, Mädchere

### Tier A — Alternative / Rock / Kultur
Dynamo, Rote Fabrik, Bogen F, Moods, Sender, Schauspielhaus, Kunsthaus, Gessnerallee, Rote Fabrik

### Tier B — Mainstream / Bars mit Dancefloor / Kulturorte
Plaza, Vior, Jade, Aura, Icon, Gonze, Kasheme, Frau Gerolds Garten, Papiersaal, Kosmos, Millers

### Tier C — Hidden Gems
Heile Welt, Bagatelle, Sektor 11, Hard One, Space Monki
`

function buildSystemPrompt(city: string): string {
  const cityLabel = city === 'zuerich' ? 'Zürich' : city
  return `Du kuratierst für waslauft.in — eine radikal minimalistische Event-Seite für ${cityLabel}.

Deine Aufgabe: Aus einer Rohliste aller Events des Tages die besten 25–30 auswählen.
Dein Publikum: ${cityLabel}er:innen zwischen 20–45, die abends spontan etwas unternehmen wollen.

WICHTIG: Wähle NUR Events innerhalb der Stadtgrenzen von ${cityLabel} aus.
Schliesse Events in Winterthur, Baden, Rapperswil, Zug und anderen Umgebungsgemeinden aus.

${VENUE_TIERS}

## Auswahlkriterien

### 1. Nachtleben-Quote (Pflicht)
Mindestens 2/3 (66%) der ausgewählten Events MÜSSEN Nachtleben sein:
- Partys, DJ-Sets, Club-Events
- Konzerte (alle Genres)
- Live-Musik in Bars und Clubs
- Electronic, Techno, House, Hip-Hop, Jazz, Rock etc.

### 2. Uhrzeit-Gewichtung
- Events ab 20:00 Uhr: Stark bevorzugen
- Events 17:00–19:59 Uhr: Nur bei sehr gutem Event
- Events vor 17:00 Uhr: Maximal 3 auswählen, nur bei aussergewöhnlicher Qualität

### 3. Venue-Reputation (30%)
Tier S fast immer auswählen. Tier A bevorzugen. Tier B bei gutem Event. Tier C nur aussergewöhnlich.

### 4. Event-Qualität & Einzigartigkeit (25%)
- Einmalige Events > wiederkehrende Serien
- Bekannte Acts > No-Names
- Spezifische Events > generische Titel

### 5. Diversität (15%)
- Max 6 Events desselben Sub-Genres
- Mix Stadtteile
- Restliche Events (max. 1/3): Kultur, Theater, Ausstellungen

### 6. Breite Relevanz (10%)
- Allgemeines, kulturinteressiertes Publikum
- Business-Events, Networking, Kurse ausschliessen

## Ausschluss
- Yoga, Pilates, Sprachkurse
- Reine Kinder-Events
- Escape Rooms, Touristenführungen
- Events ausserhalb ${cityLabel}
- Events ohne klare Uhrzeit (00:00)

## Output
Antworte AUSSCHLIESSLICH in JSON. Kein anderer Text.

{
  "curated_events": [
    {
      "id": "original name aus dem Input (exakt)",
      "name": "Bereinigter, prägnanter Event-Name",
      "location": "Venue-Name (kurz)",
      "reason": "1 Satz warum"
    }
  ]
}

Sortiere chronologisch. Keine Emojis. Kein Marketing. Strikt 25–30 Events.
Mindestens 2/3 davon müssen Nachtleben (Partys, Konzerte, DJs) sein.`
}

interface RawEvent {
  name: string
  rawName: string
  location: string
  date: string
  time: string
  url: string
  source: string
}

interface CuratedResult {
  id: string
  name: string
  location: string
  reason: string
}

export async function curateEvents(rawEvents: RawEvent[], city: string): Promise<CuratedResult[]> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const cityLabel = city === 'zuerich' ? 'Zürich' : city

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: buildSystemPrompt(city),
    messages: [
      {
        role: 'user',
        content: `Hier sind alle Events für heute in ${cityLabel}. Wähle die besten 25–30 aus. Mindestens 2/3 davon müssen Nachtleben sein (Partys, Konzerte, DJs). Events vor 17:00 Uhr maximal 3 auswählen.\n\n${JSON.stringify(rawEvents, null, 2)}`,
      },
    ],
  })

  const text = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')

  const clean = text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(clean)

  return parsed.curated_events || []
}
