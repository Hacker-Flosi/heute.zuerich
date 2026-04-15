// scripts/eventtype.ts
// Maps event titles and venue categories to our 8 EventTypes.
// Used by both Layer 1 (via venue.category) and Layer 2 (keyword matching).

import type { EventType } from './types'

// ─── Keyword lists (lowercase) ────────────────────────────────────────────────

const DJ_CLUB: string[] = [
  // Genres
  'techno', 'house', 'trance', 'drum and bass', 'dnb', 'd&b',
  'hardstyle', 'minimal', 'dark disco', 'afro house', 'deep house',
  'bass music', 'gabber', 'jungle', 'breakbeat', 'dubstep',
  // Formate
  'dj set', 'dj-set', 'dj night', 'deejay', 'b2b', 'back2back',
  'back-to-back', 'warm-up', 'warmup', 'warm up', 'residency',
  'club night', 'clubnight', 'rave', 'afterhour', 'after hour',
  'electronic', 'live act',
]

const PARTY: string[] = [
  'party', 'themenparty', 'schaumparty', 'hip-hop', 'hip hop',
  'r&b', 'rnb', 'rap', 'trap', 'afrobeats', 'reggaeton', 'dancehall',
  'chart', 'charts night', 'ladies night', 'after party', 'afterparty',
  'karaoke', 'day drinking', 'apéro abend', 'apérobar',
]

const KONZERT: string[] = [
  // Explizit
  'konzert', 'concert', 'live concert', 'live-konzert', 'gig',
  'live musik', 'live music',
  // Genres mit Live-Kontext
  'jazz', 'blues', 'folk', 'singer-songwriter', 'acoustic',
  'metal', 'punk', 'indie', 'pop concert', 'rock concert',
  'classical', 'klassik', 'orchester', 'ensemble', 'sinfonie',
  'philharmonic', 'kammermusik', 'chor',
  // Formate
  'solo show', 'release show', 'album release', 'album launch',
  'headliner', 'support act',
]

const KUNST: string[] = [
  'vernissage', 'finissage', 'kunstausstellung', 'art opening',
  'ausstellung', 'exhibition', 'galerie', 'installation',
  'art show', 'gruppenausstellung',
]

const MARKT: string[] = [
  'flohmarkt', 'vintage markt', 'brocante', 'design markt', 'designmarkt',
  'food festival', 'foodfestival', 'streetfood', 'food market',
  'weihnachtsmarkt', 'wochenmarkt', 'night market', 'antikmarkt',
  'trödelmarkt', 'kunstmarkt',
]

const OPEN_AIR: string[] = [
  'open air', 'openair', 'open-air', 'outdoor festival',
  'rooftop', 'quartierfest', 'strassenfest', 'sommerfest',
  'gartenfest', 'seeufer', 'lakeside', 'beach party',
]

const KULTUR: string[] = [
  'theater', 'theatre', 'schauspiel', 'oper', 'ballet', 'ballett',
  'tanztheater', 'tanzperformance', 'tanz abend', 'tanznacht',
  'impro', 'improtheater', 'comedy', 'stand-up', 'standup', 'stand up',
  'kabarett', 'lesung', 'poetry slam', 'spoken word',
  'film screening', 'filmvorführung', 'kino abend', 'screening',
  'podium', 'panel', 'talk', 'vortrag', 'lecture',
  'führung', 'guided tour', 'circus', 'zirkus', 'magic show',
]

const SPECIAL: string[] = [
  'workshop', 'pop-up', 'popup', 'pop up',
  'after work', 'afterwork', 'after-work',
  'apéro', 'aperitif', 'apéro riche', 'special brunch', 'brunch',
  'networking', 'speed dating', 'dinner show', 'supper club',
  'pop-up dining', 'tasting', 'dégustation',
]

// ─── Venue-category → EventType ───────────────────────────────────────────────

const VENUE_CATEGORY_MAP: Record<string, EventType> = {
  electronic: 'dj_club',
  alternative: 'konzert',
  mainstream: 'party',
  kultur: 'kultur',
  bar: 'party',
  special: 'special',
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Infer EventType from event title via keyword matching.
 * Order: specific/unambiguous types first, broad/fallback types last.
 */
export function inferEventTypeFromTitle(title: string): EventType {
  const t = title.toLowerCase()

  if (KUNST.some((k) => t.includes(k)))    return 'kunst'
  if (MARKT.some((k) => t.includes(k)))    return 'markt'
  if (DJ_CLUB.some((k) => t.includes(k)))  return 'dj_club'
  if (KONZERT.some((k) => t.includes(k)))  return 'konzert'
  if (PARTY.some((k) => t.includes(k)))    return 'party'
  if (OPEN_AIR.some((k) => t.includes(k))) return 'open_air'
  if (KULTUR.some((k) => t.includes(k)))   return 'kultur'
  if (SPECIAL.some((k) => t.includes(k)))  return 'special'

  return 'special' // fallback
}

/**
 * Map a Sanity venue category to EventType.
 */
export function eventTypeFromVenueCategory(category: string): EventType {
  return VENUE_CATEGORY_MAP[category] ?? 'special'
}

/**
 * Nightlife types: konzert, dj_club, party
 */
export function isNightlife(type: EventType): boolean {
  return type === 'konzert' || type === 'dj_club' || type === 'party'
}

/**
 * Allowed EventTypes for the Layer 2 discovery pool.
 * Excludes pure business/wellness events — handled at scraper level.
 */
export const DISCOVERY_ALLOWED_TYPES: EventType[] = [
  'konzert', 'dj_club', 'party', 'kultur', 'kunst',
  'markt', 'open_air', 'special',
]
