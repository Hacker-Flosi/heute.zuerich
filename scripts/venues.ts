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
    { patterns: ["frieda's büxe", 'friedas büxe', "frieda's buxe", "frieda's garten", 'friedas garten'], url: 'https://friedas.ch' },
    { patterns: ['zukunft'], url: 'https://zukunft.cc' },
    { patterns: ['kauzu'], url: 'https://kauzu.ch' },
    { patterns: ['exil'], url: 'https://exil.ch' },
    { patterns: ['mädchere', 'maedchere'], url: 'https://zukunft.cc' },
    { patterns: ['klaus'], url: 'https://hausvonklaus.ch' },
    { patterns: ['sektor 11'], url: 'https://sektor11.ch' },
    { patterns: ['hard one'], url: 'https://www.hardone.ch' },
    // Tier A — Alternative
    { patterns: ['dynamo'], url: 'https://dynamo.ch' },
    { patterns: ['rote fabrik'], url: 'https://rotefabrik.ch' },
    { patterns: ['bogen f'], url: 'https://bogenf.ch' },
    { patterns: ['moods'], url: 'https://moods.ch' },
    { patterns: ['sender'], url: 'https://sender.club' },
    // Tier B — Mainstream/Clubs
    { patterns: ['plaza'], url: 'https://www.plaza-zurich.ch' },
    { patterns: ['vior'], url: 'https://www.vior.ch' },
    { patterns: ['jade'], url: 'https://jade.ch' },
    { patterns: ['aura'], url: 'https://www.aura-club.ch' },
    { patterns: ['icon'], url: 'https://www.icon-zurich.ch' },
    // Tier B — Bars
    { patterns: ['gonze', 'gonzo'], url: 'https://www.gonzoclub.ch' },
    { patterns: ['olé olé', 'ole ole'], url: 'https://oleolebar.ch' },
    { patterns: ['kasheme'], url: 'https://kasheme.com' },
    { patterns: ['frau gerold'], url: 'https://fraugerold.ch' },
    { patterns: ['rimini'], url: 'https://www.rimini.ch' },
    { patterns: ['barfussbar', 'barfüssbar'], url: 'https://barfussbar.ch' },
    { patterns: ['samigo'], url: 'https://www.samigo.ch' },
    { patterns: ['labor bar'], url: 'https://laborbar.ch' },
    { patterns: ['heile welt'], url: 'https://www.h-w.club' },
    { patterns: ['bagatelle'], url: 'https://www.bagatelleclub.ch' },
    // Tier B — Kultur
    { patterns: ['schiffbau'], url: 'https://www.schauspielhaus.ch' },
    { patterns: ['folium'], url: 'https://www.folium.ch' },
    { patterns: ['millers'], url: 'https://www.millers.ch' },
    { patterns: ['gessnerallee'], url: 'https://gessnerallee.ch' },
    { patterns: ['kosmos'], url: 'https://kosmos.ch' },
    { patterns: ['papiersaal'], url: 'https://papiersaal.ch' },
    { patterns: ['kongresshaus'], url: 'https://kongresshaus.ch' },
    { patterns: ['halle 622', 'halle622'], url: 'https://www.halle622.ch' },
    { patterns: ['stadtgärtnerei', 'stadtgärtnerei zürich'], url: 'https://www.stadt-zuerich.ch/stadtgaertnerei' },
    { patterns: ['kirche neumünster', 'neumünster'], url: 'https://www.kirche-neumuenster.ch' },
    { patterns: ['theater neumarkt', 'neumarkt'], url: 'https://theaterneumarkt.ch' },
    { patterns: ['sogar theater', 'sogar'], url: 'https://sogar.ch' },
  ],

  basel: [
    // Clubs / Nightlife
    { patterns: ['nordstern'], url: 'https://www.nordstern.com' },
    { patterns: ['elysia'], url: 'https://elysia.ch' },
    { patterns: ['viertel klub', 'das viertel', 'dasviertel'], url: 'https://www.dasviertel.ch' },
    { patterns: ['sommercasino'], url: 'https://sommercasino.ch' },
    { patterns: ['union'], url: 'https://clubunion.ch' },
    { patterns: ['balz klub', 'balzklub'], url: 'https://www.balzklub.ch' },
    { patterns: ['heimat club', 'heimatclub'], url: 'https://www.heimatclub.ch' },
    { patterns: ['singer klub', 'singerklub'], url: 'https://www.singerklub.ch' },
    { patterns: ['club 59'], url: 'https://www.club59.ch' },
    { patterns: ['basso'], url: 'https://www.bassoverse.space' },
    { patterns: ['renée', 'renee'], url: 'https://www.renee.ch' },
    { patterns: ['sandoase'], url: 'https://www.sandoase.ch' },
    // Konzerte / Musik
    { patterns: ['kaserne'], url: 'https://kaserne-basel.ch' },
    { patterns: ['stadtcasino'], url: 'https://stadtcasinobasel.com' },
    { patterns: ["bird's eye", 'birdseye', 'birds eye'], url: 'https://birdseye.ch' },
    { patterns: ['jazzcampus'], url: 'https://jazzcampus.ch' },
    { patterns: ['atlantis'], url: 'https://atlantisbasel.ch' },
    { patterns: ['parterre'], url: 'https://parterre.net' },
    { patterns: ['gare du nord'], url: 'https://gare-du-nord.ch' },
    { patterns: ['roxy'], url: 'https://roxy.ch' },
    { patterns: ['musical theater', 'musicaltheater'], url: 'https://musicaltheater.ch' },
    { patterns: ['bar rouge'], url: 'https://barrouge.ch' },
    // Kultur / Theater
    { patterns: ['theater basel', 'theaterbasel'], url: 'https://theater-basel.ch' },
    { patterns: ['volkshaus basel', 'volkshaus'], url: 'https://volkshaus-basel.ch' },
    { patterns: ['kunsthalle basel', 'kunsthalle'], url: 'https://kunsthallebasel.ch' },
    { patterns: ['fondation beyeler', 'beyeler'], url: 'https://fondationbeyeler.ch' },
    { patterns: ['kunstmuseum basel', 'kunstmuseum'], url: 'https://kunstmuseumbasel.ch' },
    { patterns: ['museum tinguely', 'tinguely'], url: 'https://tinguely.ch' },
    { patterns: ['theater fauteuil', 'fauteuil'], url: 'https://theater-fauteuil.ch' },
    { patterns: ['basler freilichtspiele', 'freilichtspiele'], url: 'https://freilichtspiele.ch' },
    { patterns: ['literaturhaus'], url: 'https://literaturhaus-basel.ch' },
    { patterns: ['universitätsbibliothek', 'unibibliothek', 'ub basel'], url: 'https://ub.unibas.ch' },
    { patterns: ['museum der kulturen', 'kulturen'], url: 'https://mkb.ch' },
    { patterns: ['historisches museum', 'historisches museum basel'], url: 'https://hmb.ch' },
    { patterns: ['naturhistorisches museum'], url: 'https://nmbs.ch' },
    { patterns: ['burghof lörrach', 'burghof'], url: 'https://burghof.com' },
    { patterns: ['markthalle'], url: 'https://markthalle-basel.ch' },
    { patterns: ['halle 7', 'halle7'], url: 'https://halle7.ch' },
    { patterns: ['kaschemme'], url: 'https://kaschemme.ch' },
    { patterns: ['teufelhof'], url: 'https://teufelhof.com' },
    { patterns: ['steinenberg', 'stadtcasino steinenberg'], url: 'https://stadtcasinobasel.com' },
  ],

  bern: [
    // Clubs / Konzerte
    { patterns: ['dachstock'], url: 'https://dachstock.is' },
    { patterns: ['gaskessel'], url: 'https://gaskessel.ch' },
    { patterns: ['isc bern', 'isc club', 'isc -', 'isc'], url: 'https://isc-club.ch' },
    { patterns: ['kuppel'], url: 'https://kuppel.ch' },
    { patterns: ['rössli bar', 'rossli bar', 'rösslibar', 'sous le pont'], url: 'https://rosslibern.ch' },
    { patterns: ['dampfzentrale'], url: 'https://dampfzentrale.ch' },
    { patterns: ['turnhalle bern', 'turnhalle'], url: 'https://turnhalle.ch' },
    { patterns: ['bierhübeli', 'bierhuebeli'], url: 'https://bierhuebeli.ch' },
    { patterns: ['heitere fahne'], url: 'https://heiterefahne.ch' },
    { patterns: ['stellwerk'], url: 'https://www.stellwerk.be' },
    { patterns: ['mahogany'], url: 'https://mahogany.ch' },
    { patterns: ['café kairo', 'cafe kairo'], url: 'https://www.cafe-kairo.ch' },
    { patterns: ['maison'], url: 'https://maisonbern.ch' },
    { patterns: ['huma club', 'humaclub'], url: 'https://humaclub.ch' },
    { patterns: ['cuba bar'], url: 'https://cubabar.ch' },
    { patterns: ['grosse halle'], url: 'https://www.grossehalle.ch' },
    { patterns: ['progr'], url: 'https://progr.ch' },
    // Kultur / Theater
    { patterns: ['kapitel bollwerk', 'kapitel'], url: 'https://kapitel.ch' },
    { patterns: ['theater bern', 'konzert theater bern', 'konzerttheater'], url: 'https://konzerttheaterbern.ch' },
    { patterns: ['reitschule'], url: 'https://reitschule.ch' },
    { patterns: ['schlachthaus'], url: 'https://schlachthaus.ch' },
    { patterns: ['kunsthalle bern'], url: 'https://kunsthalle-bern.ch' },
    { patterns: ['zentrum paul klee', 'paul klee'], url: 'https://zpk.org' },
    { patterns: ['kultur casino', 'kulturcasino'], url: 'https://konzerttheaterbern.ch' },
    { patterns: ['kornhausforum'], url: 'https://kornhausforum.ch' },
    { patterns: ["marian's jazz", 'jazzroom'], url: 'https://jazzroom-bern.ch' },
  ],

  luzern: [
    { patterns: ['kkl luzern', 'kkl'], url: 'https://kkl-luzern.ch' },
    { patterns: ['schüür', 'schuur'], url: 'https://schuur.ch' },
    { patterns: ['neubad'], url: 'https://neubad.org' },
    { patterns: ['südpol', 'sudpol'], url: 'https://sudpol.ch' },
    { patterns: ['treibhaus'], url: 'https://treibhaus.ch' },
    { patterns: ['luzerner theater'], url: 'https://luzernertheater.ch' },
    { patterns: ['kleintheater'], url: 'https://kleintheater.ch' },
    { patterns: ['kunstmuseum luzern'], url: 'https://kunstmuseumluzern.ch' },
    { patterns: ['bourbaki'], url: 'https://bourbaki.ch' },
    { patterns: ['rok'], url: 'https://www.rokklub.ch' },
    { patterns: ['volière', 'voliere'], url: 'https://3fach.ch/voliere' },
    { patterns: ['bar 59'], url: 'https://www.bar59.ch' },
    { patterns: ['casineum'], url: 'https://www.casineum.ch' },
    { patterns: ['alpineum'], url: 'https://www.alpineum.ch' },
    { patterns: ['messe luzern'], url: 'https://messe-luzern.ch' },
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
    { patterns: ['gallus pub', 'galluspub'], url: 'https://www.gallus-pub.ch' },
    { patterns: ['militärkantine', 'militaerkantine'], url: 'https://www.militaerkantine.ch' },
    { patterns: ['schwarzmatt'], url: 'https://www.schwarzmattmusic.ch' },
    // Kultur / Theater
    { patterns: ['theaterhaus'], url: 'https://theaterhaus.ch' },
    { patterns: ['stadttheater'], url: 'https://theatersg.ch' },
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
    // Weitere Kulturorte
    { patterns: ['square hsg', 'hsg square', 'hsg-square'], url: 'https://www.hsg-square.ch' },
    { patterns: ['pfalzkeller'], url: 'https://stiftsbezirk.ch' },
    { patterns: ['stiftsbibliothek'], url: 'https://stiftsbibliothek.ch' },
    { patterns: ['musikzentrum'], url: 'https://www.musikzentrum-sg.ch' },
    { patterns: ['universität st.gallen', 'unisg', 'universität st. gallen'], url: 'https://unisg.ch' },
    { patterns: ['bibliothek hauptpost', 'bibliothek'], url: 'https://www.bibliosg.ch' },
    { patterns: ['tirumpel'], url: 'https://www.tirumpel.ch' },
  ],

  winterthur: [
    { patterns: ['casinotheater'], url: 'https://casinotheater.ch' },
    { patterns: ['stadthalle winterthur', 'stadthalle'], url: 'https://stadthalle.ch' },
    { patterns: ['albani'], url: 'https://albani.ch' },
    { patterns: ['salzhaus'], url: 'https://salzhaus.ch' },
    { patterns: ['kraftfeld'], url: 'https://kraftfeld.ch' },
    { patterns: ['portier'], url: 'https://portier.ch' },
    { patterns: ['taptab'], url: 'https://taptab.ch' },
    { patterns: ['esse musicbar', 'esse'], url: 'https://essemusicbar.ch' },
    { patterns: ['oxyd'], url: 'https://oxyd.ch' },
    { patterns: ['coalmine'], url: 'https://coalmine.ch' },
    { patterns: ['kunst museum winterthur', 'reinhart am stadtgarten'], url: 'https://kmw.ch' },
    { patterns: ['gewerbemuseum'], url: 'https://gewerbemuseum.ch' },
    { patterns: ['kellertheater'], url: 'https://kellertheater-winterthur.ch' },
    { patterns: ['gaswerk'], url: 'https://gaswerk.ch' },
    { patterns: ['güterschuppen', 'guterschuppen'], url: 'https://gueterschuppen.ch' },
    { patterns: ['alte kaserne'], url: 'https://altekaserne.ch' },
    { patterns: ['stadthaus winterthur', 'stadthaus'], url: 'https://stadthaus.winterthur.ch' },
    { patterns: ['naturmuseum'], url: 'https://naturmuseum.ch' },
    { patterns: ['kino cameo', 'cameo'], url: 'https://kinocameo.ch' },
    { patterns: ['kino nische', 'nische'], url: 'https://kinonische.ch' },
  ],
}

// Portal domains that are NOT organizer URLs — replace if matched
const AGGREGATOR_DOMAINS = [
  'hellozurich.ch', 'saiten.ch', 'gangus.ch', 'null41.nodehive',
  'eventfrog.ch', 'eventbrite.', 'ticketcorner.ch', 'starticket.ch',
  'facebook.com', 'instagram.com', 'petzi.ch', 'ra.co',
  'thurgaukultur.ch',
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
