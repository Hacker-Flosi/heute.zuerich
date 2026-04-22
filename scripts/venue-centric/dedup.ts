// scripts/venue-centric/dedup.ts
// Deduplication für venue-zentrische Events
//
// Zwei Events gelten als identisch wenn:
//   - gleiche venue + gleicher Tag
//   - Titelähnlichkeit > 70% (Levenshtein normalisiert)
//
// Gewinner-Priorität: niedrigere sourcePriority-Zahl gewinnt.
// Bei Prioritätsgleichheit: mehr Felder (imageUrl, description) gewinnt.

import type { NormalizedEvent } from './types'

// ─── String-Similarity ────────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function similarity(a: string, b: string): number {
  const an = a.toLowerCase().trim()
  const bn = b.toLowerCase().trim()
  if (an === bn) return 1
  const maxLen = Math.max(an.length, bn.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(an, bn) / maxLen
}

// ─── Identity Check ───────────────────────────────────────────────────────────

function isSameEvent(a: NormalizedEvent, b: NormalizedEvent): boolean {
  if (a.venueId !== b.venueId) return false
  if (a.startDate !== b.startDate) return false
  return similarity(a.title, b.title) > 0.70
}

// ─── Merge zwei Events ────────────────────────────────────────────────────────
// Gewinner hat niedrigere sourcePriority (= höhere Qualität).
// Ticket-URL aus Ticketing-Source beibehalten auch wenn Gewinner Website ist.

function mergeEvents(winner: NormalizedEvent, loser: NormalizedEvent): NormalizedEvent {
  return {
    ...winner,
    // Fehlende Felder des Winners aus Loser ergänzen
    description: winner.description ?? loser.description,
    imageUrl:    winner.imageUrl    ?? loser.imageUrl,
    ticketUrl:   winner.ticketUrl   ?? loser.ticketUrl,
    eventUrl:    winner.eventUrl    ?? loser.eventUrl,
    price:       winner.price       ?? loser.price,
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export interface DeduplicatedResult {
  events:  NormalizedEvent[]
  removed: number
}

export function deduplicate(events: NormalizedEvent[]): DeduplicatedResult {
  // Sortieren: niedrigste Priority zuerst (bestes Event zuerst)
  const sorted = [...events].sort((a, b) => a.sourcePriority - b.sourcePriority)

  const winners: NormalizedEvent[] = []
  let removed = 0

  for (const candidate of sorted) {
    const existingIdx = winners.findIndex((w) => isSameEvent(w, candidate))
    if (existingIdx === -1) {
      winners.push(candidate)
    } else {
      // Besseres Event (niedrigere Priority) ist bereits drin — nur ergänzen
      winners[existingIdx] = mergeEvents(winners[existingIdx], candidate)
      removed++
    }
  }

  return { events: winners, removed }
}
