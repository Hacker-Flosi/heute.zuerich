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

  // Location match: exact, substring, or word-overlap (≥50% of shorter name's words)
  const locationMatch =
    normalizedLocationA === normalizedLocationB ||
    normalizedLocationA.includes(normalizedLocationB) ||
    normalizedLocationB.includes(normalizedLocationA) ||
    locationWordOverlap(normalizedLocationA, normalizedLocationB) >= 0.5

  if (!locationMatch) return false

  const timeDiff = timeDiffMinutes(a.time, b.time)
  if (timeDiff > 30) return false

  // Name-Ähnlichkeit prüfen
  const nameA = normalize(a.name)
  const nameB = normalize(b.name)

  // Exakter Name-Match
  if (nameA === nameB) return true

  // Einer enthält den anderen
  if (nameA.includes(nameB) || nameB.includes(nameA)) return true

  // Fuzzy-Match: Levenshtein-Distanz relativ zur Länge
  const maxLen = Math.max(nameA.length, nameB.length)
  if (maxLen === 0) return false

  const distance = levenshtein(nameA, nameB)
  const similarity = 1 - distance / maxLen

  return similarity > 0.65 // 65% Ähnlichkeit = wahrscheinlich gleich
}

// Quelle-Priorität: Veranstalter-Website > Eventfrog > Aggregator
const SOURCE_PRIORITY: Record<string, number> = {
  'manual': 0,
  'eventfrog': 1,
  'hellozurich': 2,
  'kulturzueri': 3,
  'stadt-zuerich': 4,
  'guidle': 5,
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
