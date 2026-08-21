// scripts/deduplicate.ts
// Deduplizierungs-Logik für heute.zürich
// Erkennt identische Events über mehrere Quellen hinweg

import type { RawEvent } from './types'

/**
 * Berechnet die Levenshtein-Distanz zwischen zwei Strings
 * Wird für Fuzzy-Matching auf Event-Namen verwendet
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // Substitution
          matrix[i][j - 1] + 1,     // Insertion
          matrix[i - 1][j] + 1      // Deletion
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

/**
 * Normalisiert einen String für den Vergleich
 * Entfernt Sonderzeichen, Emojis, extra Whitespace
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s\u00e4\u00f6\u00fc\u00e9\u00e8\u00ea\u00e0\u00e2]/g, '') // Umlaute behalten
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Fraction of the shorter location's words that appear in the other location.
 * e.g. "Moods" vs "Moods Schiffbau" → 1/1 = 1.0
 *      "Moods Jazz Club" vs "Moods Schiffbau" → 1/2 = 0.5
 */
function locationWordOverlap(a: string, b: string): number {
  const wordsA = a.split(/\s+/).filter(Boolean)
  const wordsB = b.split(/\s+/).filter(Boolean)
  if (!wordsA.length || !wordsB.length) return 0
  const [shorter, longer] = wordsA.length <= wordsB.length ? [wordsA, wordsB] : [wordsB, wordsA]
  const longerSet = new Set(longer)
  const overlap = shorter.filter((w) => longerSet.has(w)).length
  return overlap / shorter.length
}

/**
 * Fraction of the shorter name's significant words (≥5 Zeichen) that appear in the other name.
 * Fängt Fälle wie "WAAGHAUS WAGT „Sturz in die Sonne“ Matthias Peter/R.Hufenus" vs.
 * "Ramuz – Sturz in die Sonne" — derselbe Kern-Titel, nur mit Venue-Branding/Autor ummantelt,
 * wo weder Substring-Check noch Gesamt-Levenshtein-Ähnlichkeit greifen.
 */
// Generische Institutions-/Themenwörter — reichen allein nicht als Duplikat-Signal
// (z.B. "Kunst Museum" oder "Schweiz" tauchen in vielen unterschiedlichen Ausstellungstiteln auf)
const NAME_OVERLAP_STOPWORDS = new Set([
  'kunst', 'museum', 'galerie', 'zentrum', 'ausstellung', 'sammlung',
  'schweiz', 'stadt', 'gallen', 'zürich', 'luzern', 'basel', 'winterthur', 'bern',
])

function nameWordOverlap(a: string, b: string): { ratio: number; count: number } {
  const wordsA = a.split(/\s+/).filter((w) => w.length >= 5 && !NAME_OVERLAP_STOPWORDS.has(w))
  const wordsB = b.split(/\s+/).filter((w) => w.length >= 5 && !NAME_OVERLAP_STOPWORDS.has(w))
  if (!wordsA.length || !wordsB.length) return { ratio: 0, count: 0 }
  const [shorter, longer] = wordsA.length <= wordsB.length ? [wordsA, wordsB] : [wordsB, wordsA]
  const longerSet = new Set(longer)
  const overlap = shorter.filter((w) => longerSet.has(w)).length
  return { ratio: overlap / shorter.length, count: overlap }
}

/**
 * Berechnet die Zeitdifferenz in Minuten zwischen zwei Uhrzeiten
 */
function timeDiffMinutes(time1: string, time2: string): number {
  const [h1, m1] = time1.split(':').map(Number)
  const [h2, m2] = time2.split(':').map(Number)
  return Math.abs((h1 * 60 + m1) - (h2 * 60 + m2))
}

/**
 * Prüft ob zwei Events wahrscheinlich identisch sind
 */
function isSameEvent(a: RawEvent, b: RawEvent): boolean {
  // Gleiches Datum ist Voraussetzung
  if (a.date !== b.date) return false

  const normalizedLocationA = normalize(a.location)
  const normalizedLocationB = normalize(b.location)

  // Condensed (spaces removed): "Club 04" → "club04", "CLUB04" → "club04"
  const condensedA = normalizedLocationA.replace(/\s+/g, '')
  const condensedB = normalizedLocationB.replace(/\s+/g, '')

  // Strong location match: exact, substring, or condensed — no fuzzy word-overlap.
  // Used to gate the name-word-overlap check below, where a loose location match
  // (e.g. "Kunst Museum Beim Stadthaus" ~ "Kunst Museum Reinhart am Stadtgarten" — two
  // distinct wings of the same institution) would compound with generic shared name
  // words ("Kunst", "Museum") into false positives.
  const strongLocationMatch =
    normalizedLocationA === normalizedLocationB ||
    normalizedLocationA.includes(normalizedLocationB) ||
    normalizedLocationB.includes(normalizedLocationA) ||
    condensedA === condensedB ||
    condensedA.includes(condensedB) ||
    condensedB.includes(condensedA)

  // Location match: strong match, or word-overlap (≥50% of shorter name's words)
  const locationMatch =
    strongLocationMatch ||
    locationWordOverlap(normalizedLocationA, normalizedLocationB) >= 0.5

  if (!locationMatch) return false

  // Name-Ähnlichkeit prüfen
  const nameA = normalize(a.name)
  const nameB = normalize(b.name)

  // Exakter Name-Match oder einer enthält den anderen → gleicher Event, Zeit egal
  // (z.B. mehrere Vorstellungszeiten desselben Events)
  if (nameA === nameB) return true
  if (nameA.includes(nameB) || nameB.includes(nameA)) return true

  // Fuzzy-Match: Zeitdifferenz als zusätzlicher Filter
  const timeDiff = timeDiffMinutes(a.time, b.time)
  if (timeDiff > 30) return false

  // Wort-Overlap: gleicher Kern-Titel, aber von einer Quelle mit Venue-Branding/Zusatzinfo ummantelt.
  // Nur bei starkem Location-Match (nicht bloss Fuzzy-Overlap) — sonst können zwei
  // unterschiedliche Flügel/Abteilungen derselben Institution fälschlich zusammenfallen.
  // Mind. 2 gemeinsame markante Wörter nötig, ausser es ist das EINZIGE markante Wort
  // im kürzeren Titel (z.B. ein Artist-Name wie "Scenarios").
  if (strongLocationMatch) {
    const overlap = nameWordOverlap(nameA, nameB)
    if (overlap.count >= 2 || (overlap.count === 1 && overlap.ratio === 1)) return true
  }

  const maxLen = Math.max(nameA.length, nameB.length)
  if (maxLen === 0) return false

  const distance = levenshtein(nameA, nameB)
  const similarity = 1 - distance / maxLen

  return similarity > 0.65 // 65% Ähnlichkeit = wahrscheinlich gleich
}

// Quelle-Priorität: Veranstalter-Website > Eventfrog > Aggregator
const SOURCE_PRIORITY: Record<string, number> = {
  'manual': 0,
  'residentadvisor': 1,
  'eventfrog': 2,
  'hellozurich': 3,
  'kulturzueri': 4,
  'stadt-zuerich': 5,
  'guidle': 6,
}

/**
 * Wählt den besten Event aus einer Gruppe von Duplikaten
 * Bevorzugt: Längster Name (mehr Info), beste Quelle
 */
function pickBestEvent(duplicates: RawEvent[]): RawEvent {
  return duplicates.sort((a, b) => {
    // Priorität: Eventfrog hat strukturiertere Daten
    const priorityDiff = (SOURCE_PRIORITY[a.source] ?? 99) - (SOURCE_PRIORITY[b.source] ?? 99)
    if (priorityDiff !== 0) return priorityDiff

    // Bei gleicher Quelle: Längerer Name (mehr Info)
    return b.name.length - a.name.length
  })[0]
}

/**
 * Dedupliziert eine Liste von Events aus mehreren Quellen
 * @param events - Unsortierte Liste aller gescrapten Events
 * @returns Deduplizierte Liste
 */
export function deduplicateEvents(events: RawEvent[]): RawEvent[] {
  const groups: RawEvent[][] = []
  const assigned = new Set<number>()

  for (let i = 0; i < events.length; i++) {
    if (assigned.has(i)) continue

    const group: RawEvent[] = [events[i]]
    assigned.add(i)

    for (let j = i + 1; j < events.length; j++) {
      if (assigned.has(j)) continue

      if (isSameEvent(events[i], events[j])) {
        group.push(events[j])
        assigned.add(j)
      }
    }

    groups.push(group)
  }

  const deduplicated = groups.map(pickBestEvent)

  const duplicateCount = events.length - deduplicated.length
  if (duplicateCount > 0) {
    console.log(`[Dedup] ${duplicateCount} Duplikate entfernt (${events.length} → ${deduplicated.length})`)
  }

  return deduplicated
}
