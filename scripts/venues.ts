// scripts/venues.ts
// Venue URL registry — maps known venue names to their official websites.
// Used as fallback when scrapers can't determine the organizer URL.

interface VenueEntry {
  patterns: string[]  // lowercase substrings to match against location field
  url: string
}

const VENUE_MAP: Record<string, VenueEntry[]> = {
  zuerich: [
    // Tier S
    { patterns: ['hallenstadion'], url: 'https://hallenstadion.ch' },
    { patterns: ['the hall'], url: 'https://the-hall.ch' },
    { patterns: ['x-tra'], url: 'https://x-tra.ch' },
    { patterns: ['komplex 457'], url: 'https://komplex457.ch' },
    { patterns: ['kaufleuten'], url: 'https://kaufleuten.ch' },
    { patterns: ['volkshaus'], url: 'https://volkshaus-zuerich.ch' },
    { patterns: ['maag halle', 'maag musik'], url: 'https://www.maag.ch' },
    { patterns: ['mascotte'], url: 'https://mascotte.ch' },
    // Tier A — Electronic
    { patterns: ['hive'], url: 'https://hive-club.ch' },
    { patterns: ['supermarket'], url: 'https://supermarket.li' },
    { patterns: ["frieda's büxe", 'friedas büxe', "frieda's buxe"], url: 'https://friedas.ch' },
    { patterns: ['zukunft'], url: 'https://zukunft.cc' },
    { patterns: ['kauzu'], url: 'https://kauzu.ch' },
    { patterns: ['exil'], url: 'https://exil.ch' },
    // Tier A — Alternative
    { patterns: ['dynamo'], url: 'https://dynamo.ch' },
    { patterns: ['rote fabrik'], url: 'https://rotefabrik.ch' },
    { patterns: ['bogen f'], url: 'https://bogenf.ch' },
    { patterns: ['moods'], url: 'https://moods.ch' },
    { patterns: ['sender'], url: 'https://sender.club' },
    // Tier B
    { patterns: ['gessnerallee'], url: 'https://gessnerallee.ch' },
    { patterns: ['kosmos'], url: 'https://kosmos.ch' },
    { patterns: ['papiersaal'], url: 'https://papiersaal.ch' },
  ],

  basel: [
    { patterns: ['nordstern'], url: 'https://nordstern.com' },
    { patterns: ['elysia'], url: 'https://elysia.ch' },
    { patterns: ['kaserne'], url: 'https://kaserne-basel.ch' },
    { patterns: ['viertel klub', 'das viertel', 'dasviertel'], url: 'https://dasviertel.ch' },
  ],

  bern: [
    { patterns: ['dachstock'], url: 'https://dachstock.is' },
    { patterns: ['bierhübeli', 'bierhuebeli'], url: 'https://bierhuebeli.ch' },
    { patterns: ['gaskessel'], url: 'https://gaskessel.ch' },
    { patterns: ['kapitel bollwerk', 'kapitel'], url: 'https://kapitel.ch' },
  ],

  luzern: [
    { patterns: ['kkl luzern', 'kkl'], url: 'https://kkl-luzern.ch' },
    { patterns: ['schüür', 'schuur'], url: 'https://schuur.ch' },
    { patterns: ['neubad'], url: 'https://neubad.org' },
    { patterns: ['südpol', 'sudpol'], url: 'https://sudpol.ch' },
  ],

  stgallen: [
    { patterns: ['grabenhalle'], url: 'https://grabenhalle.ch' },
    { patterns: ['kugl'], url: 'https://kugl.ch' },
    { patterns: ['palace'], url: 'https://palace.sg' },
    { patterns: ['øya', 'oya sg', 'oyasg'], url: 'https://oyasg.ch' },
  ],
}

// Portal domains that are NOT organizer URLs — replace if matched
const AGGREGATOR_DOMAINS = [
  'hellozurich.ch', 'saiten.ch', 'gangus.ch', 'null41.nodehive',
  'eventfrog.ch', 'eventbrite.', 'ticketcorner.ch', 'starticket.ch',
  'facebook.com', 'instagram.com', 'petzi.ch',
]

export function isAggregatorUrl(url: string): boolean {
  return AGGREGATOR_DOMAINS.some((d) => url.includes(d))
}

/**
 * Returns the official venue URL for a known venue, or null if not found.
 * Only use this as a fallback when the organizer URL is missing or an aggregator URL.
 */
export function lookupVenueUrl(location: string, city: string): string | null {
  const venues = VENUE_MAP[city] ?? []
  const loc = location.toLowerCase()
  const match = venues.find((v) => v.patterns.some((p) => loc.includes(p)))
  return match?.url ?? null
}
