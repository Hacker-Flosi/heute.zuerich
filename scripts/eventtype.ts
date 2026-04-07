// scripts/eventtype.ts
// Maps event titles and venue categories to our 8 EventTypes.
// Used by both Layer 1 (via venue.category) and Layer 2 (keyword matching).

import type { EventType } from './types'

// ─── Keyword lists (lowercase) ────────────────────────────────────────────────

const DJ_CLUB: string[] = [
  'techno', 'house', 'dj set', 'dj-set', 'club night', 'clubnight',
  'electronic', 'rave', 'trance', 'drum and bass', 'dnb', 'd&b',
  'hardstyle', 'minimal', 'dark disco', 'afro house', 'deep house',
  'ambient', 'experimental', 'bass music', 'deejay', 'dj night',
]

const PARTY: string[] = [
  'party', 'themenparty', 'schaumparty', 'chart', 'hip-hop', 'hip hop',
  'r&b', 'rnb', 'day drinking', 'apéro abend', 'apérobar',
  'karaoke', 'ladies night', 'after party', 'afrobeats', 'reggaeton',
]

const KONZERT: string[] = [
  'konzert', 'concert', 'live concert', 'live music', 'live-konzert',
  'band', 'solo concert', 'tour', 'orchester', 'ensemble', 'sinfonie',
  'philharmonic', 'jazz', 'blues', 'folk', 'singer-songwriter',
  'metal', 'punk', 'indie', 'pop concert', 'rock concert',
]

const KUNST: string[] = [
  'vernissage', 'finissage', 'opening', 'ausstellung', 'exhibition',
  'galerie', 'installation', 'art opening', 'kunstausstellung',
]

const MARKT: string[] = [
  'flohmarkt', 'vintage', 'brocante', 'design markt', 'designmarkt',
  'food festival', 'foodfestival', 'streetfood', 'food market',
  'weihnachtsmarkt', 'wochenmarkt', 'night market',
]

const OPEN_AIR: string[] = [
  'open air', 'openair', 'open-air', 'outdoor', 'badi',
  'rooftop', 'quartierfest', 'strassenfest', 'sommerfest',
  'gartenfest', 'seeufer', 'lakeside', 'beach',
]

const SPECIAL: string[] = [
  'workshop', 'pop-up', 'popup', 'pop up', 'special brunch',
  'after work', 'afterwork', 'after-work', 'apéro riche',
  'networking', 'speed dating', 'dinner', 'supper club', 'pop-up dining',
]

const KULTUR: string[] = [
  'theater', 'theatre', 'schauspiel', 'oper', 'ballet', 'ballett',
  'tanz', 'tanzperformance', 'performance', 'impro', 'comedy',
  'kabarett', 'lesung', 'poetry slam', 'spoken word', 'film',
  'kino', 'screening', 'podium', 'panel', 'talk', 'vortrag',
  'lecture', 'führung', 'guided tour', 'circus', 'zirkus',
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
 * Order matters: more specific types checked first.
 */
export function inferEventTypeFromTitle(title: string): EventType {
  const t = title.toLowerCase()

  if (KUNST.some((k) => t.includes(k)))    return 'kunst'
  if (MARKT.some((k) => t.includes(k)))    return 'markt'
  if (OPEN_AIR.some((k) => t.includes(k))) return 'open_air'
  if (SPECIAL.some((k) => t.includes(k)))  return 'special'
  if (DJ_CLUB.some((k) => t.includes(k)))  return 'dj_club'
  if (PARTY.some((k) => t.includes(k)))    return 'party'
  if (KONZERT.some((k) => t.includes(k)))  return 'konzert'
  if (KULTUR.some((k) => t.includes(k)))   return 'kultur'

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
