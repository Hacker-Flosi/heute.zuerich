// scripts/seed-featured-events.ts
// Seed: Grosse jährlich wiederkehrende Schweizer Events als Featured Events
// Run: npx tsx --env-file=.env.local scripts/seed-featured-events.ts
// Idempotent — bestehende Einträge werden überschrieben.
//
// Hinweis zu Städten ausserhalb der aktiven 4 (ZH/BS/SG/LZ):
// Events mit city='davos', 'genf', 'biel' etc. erscheinen auf ALLEN 4 Stadtseiten,
// da die GROQ-Query filtert: city != $city (kein Match → immer anzeigen).

import { getSanityWriteClient } from '../src/lib/sanity'

interface FeaturedEventSeed {
  _id: string
  name: string
  city: string
  dateFrom: string
  dateTo: string
  url: string
  teaser: string
  active: boolean
}

const EVENTS: FeaturedEventSeed[] = [

  // ── Januar ────────────────────────────────────────────────────────────────────

  {
    _id: 'featured-lauberhorn-2026',
    name: 'Lauberhornrennen',
    city: 'wengen',
    dateFrom: '2026-01-16',
    dateTo: '2026-01-18',
    url: 'https://www.lauberhorn.ch',
    teaser: 'Die längste und bekannteste Abfahrt der Welt — Weltcup-Ski live in den Berner Alpen.',
    active: true,
  },
  {
    _id: 'featured-wef-2026',
    name: 'World Economic Forum',
    city: 'davos',
    dateFrom: '2026-01-19',
    dateTo: '2026-01-23',
    url: 'https://www.weforum.org',
    teaser: 'Das wichtigste Wirtschaftsforum der Welt — Davos im Januar im Fokus der Weltöffentlichkeit.',
    active: true,
  },

  // ── Februar ───────────────────────────────────────────────────────────────────

  {
    _id: 'featured-luzerner-fasnacht-2026',
    name: 'Luzerner Fasnacht',
    city: 'luzern',
    dateFrom: '2026-02-12',
    dateTo: '2026-02-17',
    url: 'https://luzerner-fasnacht.ch',
    teaser: 'Einer der grössten Karnevale der Schweiz — 5 Tage Guggenmusik, Umzüge und schräge Kostüme.',
    active: true,
  },
  {
    _id: 'featured-basler-fasnacht-2026',
    name: 'Basler Fasnacht',
    city: 'basel',
    dateFrom: '2026-02-23',
    dateTo: '2026-02-25',
    url: 'https://www.fasnachts-comite.ch',
    teaser: 'UNESCO-Weltkulturerbe: 72 Stunden Morgestraich, Cortège und Cliquen durch die Altstadt.',
    active: true,
  },

  // ── März ──────────────────────────────────────────────────────────────────────

  {
    _id: 'featured-engadin-skimarathon-2026',
    name: 'Engadin Skimarathon',
    city: 'stmoritz',
    dateFrom: '2026-03-08',
    dateTo: '2026-03-08',
    url: 'https://www.engadin-skimarathon.ch',
    teaser: 'Einer der grössten Volksläufe der Welt — 42 km Langlauf von Maloja nach S-chanf im Engadin.',
    active: true,
  },
  {
    _id: 'featured-lucerne-festival-ostern-2026',
    name: 'Lucerne Festival Ostern',
    city: 'luzern',
    dateFrom: '2026-03-27',
    dateTo: '2026-03-29',
    url: 'https://www.lucernefestival.ch',
    teaser: 'Kammermusik auf höchstem Niveau im KKL — das Oster-Wochenende in Luzern mit Weltklasse-Ensembles.',
    active: true,
  },

  // ── April ─────────────────────────────────────────────────────────────────────

  {
    _id: 'featured-watches-and-wonders-2026',
    name: 'Watches and Wonders',
    city: 'genf',
    dateFrom: '2026-04-14',
    dateTo: '2026-04-20',
    url: 'https://www.watchesandwonders.com',
    teaser: 'Die wichtigste Uhrenmesse der Welt — Rolex, Patek Philippe und Co. präsentieren ihre Neuheiten.',
    active: true,
  },
  {
    _id: 'featured-zuerich-marathon-2026',
    name: 'Zürich Marathon',
    city: 'zuerich',
    dateFrom: '2026-04-26',
    dateTo: '2026-04-26',
    url: 'https://www.zurichmarathon.ch',
    teaser: 'Der grösste Stadtlauf der Schweiz — durch Zürichs Quartiere und entlang des Zürichsees.',
    active: true,
  },
  {
    _id: 'featured-sechselaeuten-2026',
    name: 'Sechseläuten',
    city: 'zuerich',
    dateFrom: '2026-04-17',
    dateTo: '2026-04-20',
    url: 'https://www.sechselaeuten.ch',
    teaser: 'Zürcher Frühlingsfest: Guildenumzug, Kinderfest und der Böögg-Brand auf dem Sechseläutenplatz.',
    active: true,
  },
  {
    _id: 'featured-bea-bern-2026',
    name: 'BEA Bern',
    city: 'bern',
    dateFrom: '2026-04-24',
    dateTo: '2026-05-03',
    url: 'https://www.beapuls.ch',
    teaser: 'Bernische Ausstellung — 10 Tage Volksfest, Messe und Unterhaltung für die ganze Familie.',
    active: true,
  },

  // ── Mai ───────────────────────────────────────────────────────────────────────

  {
    _id: 'featured-fantasy-basel-2026',
    name: 'Fantasy Basel',
    city: 'basel',
    dateFrom: '2026-05-14',
    dateTo: '2026-05-16',
    url: 'https://www.fantasybasel.ch',
    teaser: 'Grösste Popkultur-Messe der Schweiz — Comics, Anime, Gaming und Cosplay im MCH Basel.',
    active: true,
  },
  {
    _id: 'featured-musikfest-biel-2026',
    name: 'Eidg. Musikfest',
    city: 'biel',
    dateFrom: '2026-05-14',
    dateTo: '2026-05-17',
    url: 'https://www.musikfest2026.ch',
    teaser: 'Das eidgenössische Musikfest in Biel — Tausende Musikantinnen aus der ganzen Schweiz.',
    active: true,
  },
  {
    _id: 'featured-iihf-wm-2026',
    name: 'Eishockey-WM',
    city: 'zuerich',
    dateFrom: '2026-05-15',
    dateTo: '2026-05-31',
    url: 'https://www.iihf.com',
    teaser: 'IIHF Weltmeisterschaft in Zürich und Freiburg — die besten Eishockey-Nationen live in der Schweiz.',
    active: true,
  },

  // ── Juni ──────────────────────────────────────────────────────────────────────

  {
    _id: 'featured-schuetzenfest-chur-2026',
    name: 'Eidg. Schützenfest',
    city: 'chur',
    dateFrom: '2026-06-05',
    dateTo: '2026-07-05',
    url: 'https://www.gr2026.ch',
    teaser: 'Das grösste Schützenfest der Welt — ein Monat Schweizer Brauchtum und Wettkampf in Chur.',
    active: true,
  },
  {
    _id: 'featured-art-basel-2026',
    name: 'Art Basel',
    city: 'basel',
    dateFrom: '2026-06-18',
    dateTo: '2026-06-21',
    url: 'https://www.artbasel.com/basel',
    teaser: 'Die wichtigste Kunstmesse der Welt — 290 Galerien, 4000 Künstler, 4 Tage im Herz von Basel.',
    active: true,
  },
  {
    _id: 'featured-zurich-pride-2026',
    name: 'Zürich Pride',
    city: 'zuerich',
    dateFrom: '2026-06-19',
    dateTo: '2026-06-20',
    url: 'https://zurichpridefestival.ch',
    teaser: 'Die grösste Pride-Demonstration der Schweiz — Farbe, Musik und politisches Zeichen setzen.',
    active: true,
  },
  {
    _id: 'featured-openair-stgallen-2026',
    name: 'OpenAir St. Gallen',
    city: 'stgallen',
    dateFrom: '2026-06-25',
    dateTo: '2026-06-28',
    url: 'https://www.openairsg.ch',
    teaser: 'Eines der ältesten Rockfestivals der Schweiz — 4 Tage Open Air auf dem Sittertobel.',
    active: true,
  },
  {
    _id: 'featured-jodlerfest-basel-2026',
    name: 'Eidg. Jodlerfest',
    city: 'basel',
    dateFrom: '2026-06-26',
    dateTo: '2026-06-28',
    url: 'https://www.jodlerfestbasel.ch',
    teaser: 'Das eidgenössische Jodlerfest in Basel — Schweizer Volkskultur vom Feinsten, alle 3 Jahre.',
    active: true,
  },

  // ── Juli ──────────────────────────────────────────────────────────────────────

  {
    _id: 'featured-zuerifaescht-2026',
    name: 'Züri Fäscht',
    city: 'zuerich',
    dateFrom: '2026-07-03',
    dateTo: '2026-07-05',
    url: 'https://www.zuerifaescht.ch',
    teaser: 'Das grösste Volksfest der Schweiz — alle 3 Jahre verwandelt sich Zürich in eine riesige Partymeile.',
    active: true,
  },
  {
    _id: 'featured-montreux-jazz-2026',
    name: 'Montreux Jazz Festival',
    city: 'montreux',
    dateFrom: '2026-07-03',
    dateTo: '2026-07-18',
    url: 'https://www.montreuxjazzfestival.com',
    teaser: 'Eines der bekanntesten Musikfestivals der Welt — Jazz, Rock und Pop direkt am Genfersee.',
    active: true,
  },
  {
    _id: 'featured-openair-frauenfeld-2026',
    name: 'Openair Frauenfeld',
    city: 'frauenfeld',
    dateFrom: '2026-07-09',
    dateTo: '2026-07-11',
    url: 'https://www.openair-frauenfeld.ch',
    teaser: 'Europas grösstes Hip-Hop-Festival — 3 Tage, 60\'000 Besucher pro Tag, direkt vor den Toren der Schweiz.',
    active: true,
  },
  {
    _id: 'featured-paleo-nyon-2026',
    name: 'Paléo Festival Nyon',
    city: 'nyon',
    dateFrom: '2026-07-21',
    dateTo: '2026-07-26',
    url: 'https://www.paleo.ch',
    teaser: 'Eines der grössten Open-Air-Festivals Europas — 6 Tage Weltmusik und Rock am Genfersee.',
    active: true,
  },

  {
    _id: 'featured-gurten-festival-2026',
    name: 'Gurten Festival',
    city: 'bern',
    dateFrom: '2026-07-16',
    dateTo: '2026-07-19',
    url: 'https://www.gurtenfestival.ch',
    teaser: 'Berns Open-Air auf dem Hausberg — 4 Tage Indie, Pop und Rock mit Blick über die ganze Stadt.',
    active: true,
  },

  // ── August ────────────────────────────────────────────────────────────────────

  {
    _id: 'featured-locarno-film-festival-2026',
    name: 'Locarno Film Festival',
    city: 'locarno',
    dateFrom: '2026-08-05',
    dateTo: '2026-08-15',
    url: 'https://www.locarnofestival.ch',
    teaser: 'Eines der ältesten Filmfestivals der Welt — 11 Tage Kino unter dem Sternenhimmel auf der Piazza Grande.',
    active: true,
  },
  {
    _id: 'featured-theater-spektakel-2026',
    name: 'Theater Spektakel',
    city: 'zuerich',
    dateFrom: '2026-08-20',
    dateTo: '2026-09-06',
    url: 'https://www.theaterspektakel.ch',
    teaser: 'Eines der bedeutendsten Festivals für zeitgenössisches Theater — 18 Tage am Zürichseeufer.',
    active: true,
  },
  {
    _id: 'featured-street-parade-2026',
    name: 'Street Parade',
    city: 'zuerich',
    dateFrom: '2026-08-08',
    dateTo: '2026-08-08',
    url: 'https://www.streetparade.com',
    teaser: 'Europas grösste Techno-Parade: 1 Million Menschen, 30 Love Mobiles, 2.4 km am Zürichsee.',
    active: true,
  },
  {
    _id: 'featured-lucerne-festival-sommer-2026',
    name: 'Lucerne Festival',
    city: 'luzern',
    dateFrom: '2026-08-13',
    dateTo: '2026-09-13',
    url: 'https://www.lucernefestival.ch',
    teaser: 'Weltklasse-Klassik am Vierwaldstättersee — ein Monat Orchesterkonzerte im KKL Luzern.',
    active: true,
  },
  {
    _id: 'featured-weltklasse-zuerich-2026',
    name: 'Weltklasse Zürich',
    city: 'zuerich',
    dateFrom: '2026-08-27',
    dateTo: '2026-08-27',
    url: 'https://www.weltklassezuerich.ch',
    teaser: 'Das schnellste Leichtathletik-Meeting der Welt — Weltrekorde und Stars live im Letzigrund.',
    active: true,
  },

  // ── September ─────────────────────────────────────────────────────────────────

  {
    _id: 'featured-knabenschiessen-2026',
    name: 'Knabenschiessen',
    city: 'zuerich',
    dateFrom: '2026-09-12',
    dateTo: '2026-09-14',
    url: 'https://www.knabenschiessen.ch',
    teaser: 'Zürcher Herbstvolksfest mit Chilbi, Fahrgeschäften und dem traditionsreichen Schiesswettkampf.',
    active: true,
  },
  {
    _id: 'featured-zff-2026',
    name: 'Zürich Film Festival',
    city: 'zuerich',
    dateFrom: '2026-09-24',
    dateTo: '2026-10-04',
    url: 'https://zff.com',
    teaser: 'Die wichtigste Filmplattform der Schweiz — 11 Tage Weltpremieren, Stars und Indie-Entdeckungen.',
    active: true,
  },

  // ── Oktober ───────────────────────────────────────────────────────────────────

  {
    _id: 'featured-olma-2026',
    name: 'Olma',
    city: 'stgallen',
    dateFrom: '2026-10-08',
    dateTo: '2026-10-18',
    url: 'https://olma.ch',
    teaser: 'Schweizer Messe für Landwirtschaft und Ernährung — 11 Tage Bratwurst, Tiere und Brauchtum.',
    active: true,
  },
  {
    _id: 'featured-basler-herbstmesse-2026',
    name: 'Basler Herbstmesse',
    city: 'basel',
    dateFrom: '2026-10-17',
    dateTo: '2026-11-01',
    url: 'https://www.herbstmesse.ch',
    teaser: 'Ältestes Volksfest der Schweiz seit 1471 — Fahrgeschäfte, Mandelbrönner und Herbststimmung in Basel.',
    active: true,
  },
  {
    _id: 'featured-swiss-indoors-2026',
    name: 'Swiss Indoors Basel',
    city: 'basel',
    dateFrom: '2026-10-24',
    dateTo: '2026-11-01',
    url: 'https://www.swissindoorsbasel.ch',
    teaser: 'ATP 500 Tennisturnier in Basel — Weltklasse-Tennis in der St. Jakobshalle.',
    active: true,
  },

  // ── Oktober / November ────────────────────────────────────────────────────────

  {
    _id: 'featured-expovina-2026',
    name: 'Expovina Weinschiffe',
    city: 'zuerich',
    dateFrom: '2026-10-29',
    dateTo: '2026-11-12',
    url: 'https://expovina.ch',
    teaser: 'Über 4000 Weine auf Schiffen am Bürkliplatz — die grösste Weinausstellung der Schweiz.',
    active: true,
  },

  // ── November ──────────────────────────────────────────────────────────────────

  {
    _id: 'featured-zibelemaerit-bern-2026',
    name: 'Zibelemärit',
    city: 'bern',
    dateFrom: '2026-11-23',
    dateTo: '2026-11-23',
    url: 'https://www.bern.com/de/detail/zibelemaerit',
    teaser: 'Berner Traditionsmarkt am vierten Montag im November — 50 Tonnen Zwiebeln und Fasnachtsauftakt.',
    active: true,
  },

  // ── November / Dezember — Weihnachtsmärkte ────────────────────────────────────
  // Daten approximativ — offizielle 2026-Daten noch nicht publiziert (Stand April 2026)

  {
    _id: 'featured-weihnachtsmarkt-basel-2026',
    name: 'Basler Weihnachtsmarkt',
    city: 'basel',
    dateFrom: '2026-11-26',
    dateTo: '2026-12-23',
    url: 'https://www.basel.com/de/weihnachten',
    teaser: 'Einer der schönsten Weihnachtsmärkte Europas — Barfüsserplatz und Münsterplatz im Advent.',
    active: false, // Daten approximativ — vor Aktivierung prüfen
  },
  {
    _id: 'featured-weihnachtsmarkt-zuerich-2026',
    name: 'Zürcher Weihnachtsmarkt',
    city: 'zuerich',
    dateFrom: '2026-11-26',
    dateTo: '2026-12-24',
    url: 'https://www.zuerich.com/de/weihnachtsmarkt',
    teaser: 'Europas grösster überdachter Weihnachtsmarkt im Hauptbahnhof und der Christkindlimarkt Bellevue.',
    active: false, // Daten approximativ — vor Aktivierung prüfen
  },

  // ── Dezember ──────────────────────────────────────────────────────────────────

  {
    _id: 'featured-spengler-cup-2026',
    name: 'Spengler Cup',
    city: 'davos',
    dateFrom: '2026-12-26',
    dateTo: '2026-12-31',
    url: 'https://www.spenglercup.ch',
    teaser: 'Ältestes Eishockey-Einladungsturnier der Welt — zwischen den Jahren in Davos.',
    active: true,
  },
]

// ─── Write to Sanity ──────────────────────────────────────────────────────────

async function main() {
  const client = getSanityWriteClient()

  console.log(`\nSeeding ${EVENTS.length} Featured Events...\n`)

  const tx = client.transaction()
  for (const event of EVENTS) {
    tx.createOrReplace({ _type: 'featuredEvent', ...event })
  }
  await tx.commit()

  const active   = EVENTS.filter((e) => e.active)
  const inactive = EVENTS.filter((e) => !e.active)

  console.log(`✅ ${EVENTS.length} Events geschrieben (${active.length} aktiv, ${inactive.length} inaktiv)\n`)

  const byMonth: Record<string, FeaturedEventSeed[]> = {}
  for (const e of EVENTS) {
    const month = e.dateFrom.slice(0, 7)
    if (!byMonth[month]) byMonth[month] = []
    byMonth[month].push(e)
  }

  for (const [month, events] of Object.entries(byMonth).sort()) {
    const label = new Date(month + '-15').toLocaleString('de-CH', { month: 'long', year: 'numeric' })
    console.log(`${label}:`)
    for (const e of events) {
      const status = e.active ? '✅' : '⏸ '
      console.log(`  ${status} ${e.dateFrom.slice(5)} – ${e.dateTo.slice(5)}  ${e.name} (${e.city})`)
    }
  }

  if (inactive.length > 0) {
    console.log(`\n⚠️  ${inactive.length} inaktive Events — Daten approximativ, vor Aktivierung prüfen:`)
    inactive.forEach((e) => console.log(`   • ${e.name}`))
  }
}

main().catch((err) => {
  console.error('Fehler:', err)
  process.exit(1)
})
