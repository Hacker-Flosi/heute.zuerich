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
    // Clubs / Nightlife
    { patterns: ['nordstern'], url: 'https://nordstern.com' },
    { patterns: ['elysia'], url: 'https://elysia.ch' },
    { patterns: ['viertel klub', 'das viertel', 'dasviertel'], url: 'https://dasviertel.ch' },
    { patterns: ['sommercasino'], url: 'https://sommercasino.ch' },
    { patterns: ['union'], url: 'https://clubunion.ch' },
    // Konzerte / Musik
    { patterns: ['kaserne'], url: 'https://kaserne-basel.ch' },
    { patterns: ['stadtcasino'], url: 'https://stadtcasinobasel.com' },
    { patterns: ["bird's eye", 'birdseye', 'birds eye'], url: 'https://birdseye.ch' },
    { patterns: ['jazzcampus'], url: 'https://jazzcampus.ch' },
    { patterns: ['atlantis'], url: 'https://atlantis-basel.ch' },
    { patterns: ['parterre'], url: 'https://parterre.net' },
    { patterns: ['gare du nord'], url: 'https://gare-du-nord.ch' },
    { patterns: ['roxy'], url: 'https://roxy.ch' },
    { patterns: ['musical theater', 'musicaltheater'], url: 'https://musicaltheater.ch' },
    // Kultur / Theater
    { patterns: ['theater basel', 'theaterbasel'], url: 'https://theater-basel.ch' },
    { patterns: ['volkshaus basel', 'volkshaus'], url: 'https://volkshaus-basel.ch' },
    { patterns: ['kunsthalle basel', 'kunsthalle'], url: 'https://kunsthallebasel.ch' },
    { patterns: ['fondation beyeler', 'beyeler'], url: 'https://fondationbeyeler.ch' },
    { patterns: ['kunstmuseum basel', 'kunstmuseum'], url: 'https://kunstmuseumbasel.ch' },
    { patterns: ['museum tinguely', 'tinguely'], url: 'https://tinguely.ch' },
    { patterns: ['theater fauteuil', 'fauteuil'], url: 'https://theater-fauteuil.ch' },
    { patterns: ['basler freilichtspiele', 'freilichtspiele'], url: 'https://freilichtspiele.ch' },
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
    // Clubs / Nightlife
    { patterns: ['grabenhalle'], url: 'https://grabenhalle.ch' },
    { patterns: ['kugl'], url: 'https://kugl.ch' },
    { patterns: ['palace'], url: 'https://palace.sg' },
    { patterns: ['øya', 'oya sg', 'oyasg'], url: 'https://oyasg.ch' },
    { patterns: ['tankstell', 'tankstelle'], url: 'https://tankstelle-sg.ch' },
    { patterns: ['trischli'], url: 'https://trischli.ch' },
    { patterns: ['propaganda'], url: 'https://propaganda.sg' },
    { patterns: ['club einstein', 'einstein'], url: 'https://clubeinstein.ch' },
    // Kultur / Theater
    { patterns: ['theaterhaus', 'theaterhaus'], url: 'https://theaterhaus.ch' },
    { patterns: ['stadttheater'], url: 'https://stadttheater.ch' },
    { patterns: ['tonhalle'], url: 'https://tonhalle.ch' },
    { patterns: ['kinok'], url: 'https://kinok.ch' },
    { patterns: ['lokremise'], url: 'https://lokremise.ch' },
    { patterns: ['kunst halle', 'kunsthalle'], url: 'https://k9000.ch' },
    { patterns: ['kunstmuseum'], url: 'https://kunstmuseumsg.ch' },
    { patterns: ['figurentheater'], url: 'https://figurentheater.ch' },
    { patterns: ['kellerbühne', 'kellerbuehne'], url: 'https://kellerbuehne.ch' },
    { patterns: ['spiegelhalle'], url: 'https://spiegelhalle.ch' },
    // Bars / Konzerte
    { patterns: ['mariaberg'], url: 'https://mariaberg.ch' },
    { patterns: ['horst'], url: 'https://horst.sg' },
    { patterns: ['walter'], url: 'https://walter.sg' },
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
