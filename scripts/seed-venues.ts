// scripts/seed-venues.ts
// Seed-Script: schreibt alle Venues für alle 5 Städte in Sanity
// Run: npx tsx --env-file=.env.local scripts/seed-venues.ts

import { getSanityWriteClient } from '../src/lib/sanity'
import type { SanityVenue } from './types'

type VenueSeed = Omit<SanityVenue, '_id'>

// ─── ZÜRICH ───────────────────────────────────────────────────────────────────

const ZUERICH_VENUES: VenueSeed[] = [
  // Tier S
  { name: 'Hallenstadion', eventfrogName: 'Hallenstadion', city: 'zuerich', tier: 'S', category: 'kultur', active: true, summerBonus: false, website: 'https://hallenstadion.ch' },
  { name: 'The Hall', eventfrogName: 'The Hall Dübendorf', city: 'zuerich', tier: 'S', category: 'electronic', active: true, summerBonus: false, website: 'https://the-hall.ch' },
  { name: 'X-TRA', eventfrogName: 'X-TRA Zürich', city: 'zuerich', tier: 'S', category: 'alternative', active: true, summerBonus: false, website: 'https://x-tra.ch' },
  { name: 'Komplex 457', eventfrogName: 'Komplex 457', city: 'zuerich', tier: 'S', category: 'electronic', active: true, summerBonus: false, website: 'https://komplex457.ch' },
  { name: 'Kaufleuten', eventfrogName: 'Kaufleuten Zürich', city: 'zuerich', tier: 'S', category: 'mainstream', active: true, summerBonus: false, website: 'https://kaufleuten.ch' },
  { name: 'Volkshaus', eventfrogName: 'Volkshaus Zürich', city: 'zuerich', tier: 'S', category: 'alternative', active: true, summerBonus: false, website: 'https://www.volkshaus.ch' },
  { name: 'Maag Halle', eventfrogName: 'Maag Halle Zürich', city: 'zuerich', tier: 'S', category: 'kultur', active: true, summerBonus: false, website: 'https://www.maag-moments.ch' },
  { name: 'Mascotte', eventfrogName: 'Mascotte Zürich', city: 'zuerich', tier: 'S', category: 'mainstream', active: true, summerBonus: false, website: 'https://mascotte.ch' },
  // Tier A — Electronic
  { name: 'Hive', eventfrogName: 'Hive Club Zürich', city: 'zuerich', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://hive-club.ch' },
  { name: 'Supermarket', eventfrogName: 'Supermarket Zürich', city: 'zuerich', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://supermarket.li' },
  { name: "Frieda's Büxe", eventfrogName: "Frieda's Büxe", city: 'zuerich', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://ubwg.ch/location/friedas-buexe/' },
  { name: 'Zukunft', eventfrogName: 'Zukunft Zürich', city: 'zuerich', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://zukunft.cc' },
  { name: 'Kauz', eventfrogName: 'Kauz Zürich', city: 'zuerich', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://www.kauzig.ch' },
  { name: 'Exil', eventfrogName: 'Exil Zürich', city: 'zuerich', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://exil.ch' },
  { name: 'Mädchere', eventfrogName: 'Mädchere Zürich', city: 'zuerich', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://zukunft.cc' },
  { name: 'Klaus', eventfrogName: 'Klaus Zürich', city: 'zuerich', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://hausvonklaus.ch' },
  { name: "Frieda's Garten", eventfrogName: "Frieda's Garten Zürich", city: 'zuerich', tier: 'A', category: 'electronic', active: true, summerBonus: true, website: 'https://friedas.ch' },
  // Tier A — Alternative
  { name: 'Dynamo', eventfrogName: 'Dynamo Zürich', city: 'zuerich', tier: 'A', category: 'alternative', active: true, summerBonus: false, website: 'https://dynamo.ch' },
  { name: 'Rote Fabrik', eventfrogName: 'Rote Fabrik Zürich', city: 'zuerich', tier: 'A', category: 'alternative', active: true, summerBonus: true, website: 'https://rotefabrik.ch' },
  { name: 'Bogen F', eventfrogName: 'Bogen F Zürich', city: 'zuerich', tier: 'A', category: 'alternative', active: true, summerBonus: false, website: 'https://bogenf.ch' },
  { name: 'Moods', eventfrogName: 'Moods Zürich', city: 'zuerich', tier: 'A', category: 'kultur', active: true, summerBonus: false, website: 'https://moods.ch' },
  { name: 'Sender', eventfrogName: 'Sender Zürich', city: 'zuerich', tier: 'A', category: 'alternative', active: false, summerBonus: false, website: 'https://sender.club' },
  // Tier B — Mainstream
  { name: 'Plaza', eventfrogName: 'Plaza Club Zürich', city: 'zuerich', tier: 'B', category: 'mainstream', active: true, summerBonus: false, website: 'https://www.plaza-zurich.ch' },
  { name: 'Vior', eventfrogName: 'Vior Zürich', city: 'zuerich', tier: 'B', category: 'mainstream', active: true, summerBonus: false, website: 'https://www.vior.ch' },
  { name: 'Jade', eventfrogName: 'Jade Club Zürich', city: 'zuerich', tier: 'B', category: 'mainstream', active: true, summerBonus: false, website: 'https://jade.ch' },
  { name: 'Aura', eventfrogName: 'Aura Zürich', city: 'zuerich', tier: 'B', category: 'mainstream', active: true, summerBonus: false, website: 'https://www.aura-club.ch' },
  { name: 'Icon', eventfrogName: 'Icon Club Zürich', city: 'zuerich', tier: 'B', category: 'mainstream', active: true, summerBonus: false, website: 'https://www.icon-zurich.ch' },
  { name: 'Alice Choo', eventfrogName: 'Alice Choo Zürich', city: 'zuerich', tier: 'B', category: 'mainstream', active: true, summerBonus: false },
  // Tier B — Bars
  { name: 'Gonze', eventfrogName: 'Gonze Zürich', city: 'zuerich', tier: 'B', category: 'bar', active: true, summerBonus: false, website: 'https://www.gonzoclub.ch' },
  { name: 'Olé Olé Bar', eventfrogName: 'Olé Olé Bar Zürich', city: 'zuerich', tier: 'B', category: 'bar', active: true, summerBonus: false, website: 'https://oleolebar.ch' },
  { name: 'Kasheme', eventfrogName: 'Kasheme Zürich', city: 'zuerich', tier: 'B', category: 'bar', active: true, summerBonus: false, website: 'https://kasheme.com' },
  { name: 'Frau Gerolds Garten', eventfrogName: 'Frau Gerolds Garten Zürich', city: 'zuerich', tier: 'B', category: 'special', active: true, summerBonus: true, website: 'https://fraugerold.ch' },
  { name: 'Rimini Bar', eventfrogName: 'Rimini Bar Zürich', city: 'zuerich', tier: 'B', category: 'bar', active: true, summerBonus: true, website: 'https://www.rimini.ch' },
  { name: 'Barfussbar', eventfrogName: 'Barfussbar Zürich', city: 'zuerich', tier: 'B', category: 'bar', active: true, summerBonus: true, website: 'https://barfussbar.ch' },
  { name: 'Samigo Amusement', eventfrogName: 'Samigo Amusement Zürich', city: 'zuerich', tier: 'B', category: 'bar', active: true, summerBonus: false, website: 'https://www.samigo.ch' },
  // Tier B — Kultur
  { name: 'Schiffbau', eventfrogName: 'Schiffbau Zürich', city: 'zuerich', tier: 'B', category: 'kultur', active: true, summerBonus: false, website: 'https://www.schauspielhaus.ch' },
  { name: 'Labor Bar', eventfrogName: 'Labor Bar Zürich', city: 'zuerich', tier: 'B', category: 'bar', active: true, summerBonus: false, website: 'https://laborbar.ch' },
  { name: 'Papiersaal', eventfrogName: 'Papiersaal Zürich', city: 'zuerich', tier: 'B', category: 'kultur', active: true, summerBonus: false, website: 'https://papiersaal.ch' },
  { name: 'Folium', eventfrogName: 'Folium Zürich', city: 'zuerich', tier: 'B', category: 'kultur', active: true, summerBonus: false, website: 'https://www.folium.ch' },
  { name: 'Millers', eventfrogName: 'Millers Zürich', city: 'zuerich', tier: 'B', category: 'kultur', active: true, summerBonus: false, website: 'https://www.millers.ch' },
  { name: 'Kosmos', eventfrogName: 'Kosmos Zürich', city: 'zuerich', tier: 'B', category: 'kultur', active: true, summerBonus: false, website: 'https://kosmos.ch' },
  { name: 'Gessnerallee', eventfrogName: 'Gessnerallee Zürich', city: 'zuerich', tier: 'B', category: 'kultur', active: true, summerBonus: false, website: 'https://gessnerallee.ch' },
  { name: 'Kirche Neumünster', eventfrogName: 'Kirche Neumünster Zürich', city: 'zuerich', tier: 'B', category: 'kultur', active: true, summerBonus: false },
  // Tier C
  { name: 'Heile Welt', eventfrogName: 'Heile Welt Zürich', city: 'zuerich', tier: 'C', category: 'bar', active: true, summerBonus: false, website: 'https://www.h-w.club' },
  { name: 'Bagatelle', eventfrogName: 'Bagatelle Zürich', city: 'zuerich', tier: 'C', category: 'bar', active: true, summerBonus: false, website: 'https://www.bagatelleclub.ch' },
  { name: 'Sektor 11', eventfrogName: 'Sektor 11 Zürich', city: 'zuerich', tier: 'C', category: 'electronic', active: true, summerBonus: false, website: 'https://sektor11.ch' },
  { name: 'Hard One', eventfrogName: 'Hard One Zürich', city: 'zuerich', tier: 'C', category: 'electronic', active: true, summerBonus: false, website: 'https://www.hardone.ch' },
  { name: 'Garage', eventfrogName: 'Garage Zürich', city: 'zuerich', tier: 'C', category: 'alternative', active: true, summerBonus: false },
  { name: 'Space Monki', eventfrogName: 'Space Monki Zürich', city: 'zuerich', tier: 'C', category: 'bar', active: true, summerBonus: false },
]

// ─── BASEL ────────────────────────────────────────────────────────────────────

const BASEL_VENUES: VenueSeed[] = [
  // Tier S
  { name: 'St. Jakobshalle', eventfrogName: 'St. Jakobshalle Basel', city: 'basel', tier: 'S', category: 'kultur', active: true, summerBonus: false, website: 'https://st-jakobshalle.ch' },
  { name: 'Musical Theater Basel', eventfrogName: 'Musical Theater Basel', city: 'basel', tier: 'S', category: 'kultur', active: true, summerBonus: false, website: 'https://musicaltheater.ch' },
  { name: 'Kaserne Basel', eventfrogName: 'Kaserne Basel', city: 'basel', tier: 'S', category: 'alternative', active: true, summerBonus: false, website: 'https://kaserne-basel.ch' },
  // Tier A — Electronic/Club
  { name: 'Nordstern', eventfrogName: 'Nordstern Basel', city: 'basel', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://nordstern.bar' },
  { name: 'Viertel Klub', eventfrogName: 'Viertel Klub Basel', city: 'basel', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://www.dasviertel.ch' },
  { name: 'Elysia', eventfrogName: 'Elysia Basel', city: 'basel', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://elysia.ch' },
  { name: 'Balz Klub', eventfrogName: 'Balz Klub Basel', city: 'basel', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://www.balzklub.ch' },
  { name: 'Heimat Club', eventfrogName: 'Heimat Club Basel', city: 'basel', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://www.heimatclub.ch' },
  { name: 'Singer Klub', eventfrogName: 'Singer Klub Basel', city: 'basel', tier: 'A', category: 'mainstream', active: true, summerBonus: false, website: 'https://www.singerklub.ch' },
  // Tier A — Alternative/Kultur
  { name: "Bird's Eye Jazz Club", eventfrogName: "Bird's Eye Jazz Club Basel", city: 'basel', tier: 'A', category: 'kultur', active: true, summerBonus: false, website: 'https://birdseye.ch' },
  { name: 'Parterre One', eventfrogName: 'Parterre One Basel', city: 'basel', tier: 'A', category: 'alternative', active: true, summerBonus: false, website: 'https://parterre.net' },
  // Tier B — Mainstream/Bars
  { name: 'Bar Rouge', eventfrogName: 'Bar Rouge Basel', city: 'basel', tier: 'B', category: 'bar', active: true, summerBonus: false, website: 'https://barrouge.ch' },
  { name: 'Club 59', eventfrogName: 'Club 59 Basel', city: 'basel', tier: 'B', category: 'mainstream', active: true, summerBonus: false, website: 'https://www.club59.ch' },
  { name: 'Renée', eventfrogName: 'Renée Basel', city: 'basel', tier: 'B', category: 'bar', active: true, summerBonus: false, website: 'https://www.renee.ch' },
  { name: 'Basso', eventfrogName: 'Basso Basel', city: 'basel', tier: 'B', category: 'bar', active: true, summerBonus: false, website: 'https://www.bassoverse.space' },
  { name: 'Atlantis', eventfrogName: 'Atlantis Basel', city: 'basel', tier: 'B', category: 'alternative', active: true, summerBonus: false, website: 'https://atlantisbasel.ch' },
  { name: 'Sandoase', eventfrogName: 'Sandoase Basel', city: 'basel', tier: 'B', category: 'bar', active: true, summerBonus: true, website: 'https://www.sandoase.ch' },
  // Tier B — Kultur
  { name: 'Theater Basel', eventfrogName: 'Theater Basel', city: 'basel', tier: 'B', category: 'kultur', active: true, summerBonus: false, website: 'https://theater-basel.ch' },
  { name: 'Volkshaus Basel', eventfrogName: 'Volkshaus Basel', city: 'basel', tier: 'B', category: 'alternative', active: true, summerBonus: false, website: 'https://volkshaus-basel.ch' },
  { name: 'Kunsthalle Basel', eventfrogName: 'Kunsthalle Basel', city: 'basel', tier: 'B', category: 'kultur', active: true, summerBonus: false, website: 'https://kunsthallebasel.ch' },
  { name: 'Fondation Beyeler', eventfrogName: 'Fondation Beyeler', city: 'basel', tier: 'B', category: 'kultur', active: true, summerBonus: false, website: 'https://fondationbeyeler.ch' },
]

// ─── BERN ─────────────────────────────────────────────────────────────────────

const BERN_VENUES: VenueSeed[] = [
  // Tier S
  { name: 'Stade de Suisse', eventfrogName: 'Stade de Suisse Bern', city: 'bern', tier: 'S', category: 'kultur', active: true, summerBonus: false, website: 'https://stadedesuisse.ch' },
  { name: 'Bierhübeli', eventfrogName: 'Bierhübeli Bern', city: 'bern', tier: 'S', category: 'alternative', active: true, summerBonus: false, website: 'https://bierhuebeli.ch' },
  // Tier A — Electronic/Club
  { name: 'Dachstock', eventfrogName: 'Dachstock Bern', city: 'bern', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://reitschule.ch' },
  { name: 'ISC Club', eventfrogName: 'ISC Club Bern', city: 'bern', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://isc-club.ch' },
  { name: 'Kapitel Bollwerk', eventfrogName: 'Kapitel Bollwerk Bern', city: 'bern', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://kapitel.ch' },
  { name: 'Progr', eventfrogName: 'Progr Bern', city: 'bern', tier: 'A', category: 'kultur', active: true, summerBonus: false, website: 'https://progr.ch' },
  { name: 'Stellwerk', eventfrogName: 'Stellwerk Bern', city: 'bern', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://www.stellwerk.be' },
  // Tier A — Alternative/Kultur
  { name: 'Dampfzentrale', eventfrogName: 'Dampfzentrale Bern', city: 'bern', tier: 'A', category: 'alternative', active: true, summerBonus: true, website: 'https://dampfzentrale.ch' },
  { name: 'Mahogany Hall', eventfrogName: 'Mahogany Hall Bern', city: 'bern', tier: 'A', category: 'alternative', active: true, summerBonus: false, website: 'https://mahogany.ch' },
  { name: 'Turnhalle', eventfrogName: 'Turnhalle Bern', city: 'bern', tier: 'A', category: 'alternative', active: true, summerBonus: false, website: 'https://turnhalle.ch' },
  { name: 'Café Kairo', eventfrogName: 'Café Kairo Bern', city: 'bern', tier: 'A', category: 'bar', active: true, summerBonus: false, website: 'https://www.cafe-kairo.ch' },
  // Tier B — Mainstream/Bars
  { name: 'Maison', eventfrogName: 'Maison Bern', city: 'bern', tier: 'B', category: 'mainstream', active: true, summerBonus: false, website: 'https://maisonbern.ch' },
  { name: 'Huma Club', eventfrogName: 'Huma Club Bern', city: 'bern', tier: 'B', category: 'mainstream', active: true, summerBonus: false, website: 'https://humaclub.ch' },
  { name: "L'Ovestino", eventfrogName: "L'Ovestino Bern", city: 'bern', tier: 'B', category: 'bar', active: true, summerBonus: false, website: 'https://www.lovestino.ch' },
  { name: 'Cuba Bar', eventfrogName: 'Cuba Bar Bern', city: 'bern', tier: 'B', category: 'bar', active: true, summerBonus: false, website: 'https://cubabar.ch' },
  { name: 'Sous le Pont', eventfrogName: 'Sous le Pont Bern', city: 'bern', tier: 'B', category: 'bar', active: true, summerBonus: false, website: 'https://reitschule.ch' },
  // Tier B — Kultur
  { name: "Marian's Jazz Room", eventfrogName: "Marian's Jazz Room Bern", city: 'bern', tier: 'B', category: 'kultur', active: true, summerBonus: false, website: 'https://jazzroom-bern.ch' },
  { name: 'Kornhausforum', eventfrogName: 'Kornhausforum Bern', city: 'bern', tier: 'B', category: 'kultur', active: true, summerBonus: false, website: 'https://kornhausforum.ch' },
  { name: 'Grosse Halle', eventfrogName: 'Grosse Halle Bern', city: 'bern', tier: 'B', category: 'kultur', active: true, summerBonus: false, website: 'https://www.grossehalle.ch' },
  { name: 'Schlachthaus Theater', eventfrogName: 'Schlachthaus Theater Bern', city: 'bern', tier: 'B', category: 'kultur', active: true, summerBonus: false, website: 'https://schlachthaus.ch' },
  { name: 'Attika Bar', eventfrogName: 'Attika Bar Bern', city: 'bern', tier: 'B', category: 'bar', active: true, summerBonus: true, website: 'https://www.hotelbern.ch' },
]

// ─── ST. GALLEN ───────────────────────────────────────────────────────────────

const STGALLEN_VENUES: VenueSeed[] = [
  // Tier S
  { name: 'Olma Halle', eventfrogName: 'Olma Halle St. Gallen', city: 'stgallen', tier: 'S', category: 'kultur', active: true, summerBonus: false, website: 'https://olma-messen.ch' },
  // Tier A — Club/Konzerte
  { name: 'Grabenhalle', eventfrogName: 'Grabenhalle St. Gallen', city: 'stgallen', tier: 'A', category: 'alternative', active: true, summerBonus: false, website: 'https://grabenhalle.ch' },
  { name: 'Palace St. Gallen', eventfrogName: 'Palace St. Gallen', city: 'stgallen', tier: 'A', category: 'alternative', active: true, summerBonus: false, website: 'https://palace.sg' },
  { name: 'Kugl', eventfrogName: 'Kugl St. Gallen', city: 'stgallen', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://kugl.ch' },
  { name: 'Schwarzmatt Events', eventfrogName: 'Schwarzmatt St. Gallen', city: 'stgallen', tier: 'A', category: 'special', active: true, summerBonus: true, website: 'https://www.schwarzmattmusic.ch' },
  // Tier A — Kultur
  { name: 'Lokremise', eventfrogName: 'Lokremise St. Gallen', city: 'stgallen', tier: 'A', category: 'kultur', active: true, summerBonus: false, website: 'https://lokremise.ch' },
  { name: 'Stadttheater St. Gallen', eventfrogName: 'Stadttheater St. Gallen', city: 'stgallen', tier: 'A', category: 'kultur', active: true, summerBonus: false, website: 'https://theatersg.ch' },
  { name: 'Kunstmuseum St. Gallen', eventfrogName: 'Kunstmuseum St. Gallen', city: 'stgallen', tier: 'A', category: 'kultur', active: true, summerBonus: false, website: 'https://kunstmuseumsg.ch' },
  // Tier B
  { name: 'Gallus Pub', eventfrogName: 'Gallus Pub St. Gallen', city: 'stgallen', tier: 'B', category: 'bar', active: true, summerBonus: false, website: 'https://www.gallus-pub.ch' },
  { name: 'Trischli Club', eventfrogName: 'Trischli Club St. Gallen', city: 'stgallen', tier: 'B', category: 'electronic', active: true, summerBonus: false, website: 'https://trischli.ch' },
  { name: 'Elephant Club', eventfrogName: 'Elephant Club St. Gallen', city: 'stgallen', tier: 'B', category: 'mainstream', active: true, summerBonus: false },
  { name: 'Point Jaune Museum', eventfrogName: 'Point Jaune Museum St. Gallen', city: 'stgallen', tier: 'B', category: 'kultur', active: true, summerBonus: false, website: 'https://postpost.ch' },
  { name: 'Militärkantine', eventfrogName: 'Militärkantine St. Gallen', city: 'stgallen', tier: 'B', category: 'alternative', active: true, summerBonus: false, website: 'https://www.militaerkantine.ch' },
]

// ─── LUZERN ───────────────────────────────────────────────────────────────────

const LUZERN_VENUES: VenueSeed[] = [
  // Tier S
  { name: 'KKL Luzern', eventfrogName: 'KKL Luzern', city: 'luzern', tier: 'S', category: 'kultur', active: true, summerBonus: false, website: 'https://kkl-luzern.ch' },
  { name: 'Messe Luzern', eventfrogName: 'Messe Luzern', city: 'luzern', tier: 'S', category: 'kultur', active: true, summerBonus: false, website: 'https://messe-luzern.ch' },
  // Tier A — Club/Konzerte
  { name: 'Schüür', eventfrogName: 'Schüür Luzern', city: 'luzern', tier: 'A', category: 'alternative', active: true, summerBonus: false, website: 'https://schuur.ch' },
  { name: 'Südpol', eventfrogName: 'Südpol Luzern', city: 'luzern', tier: 'A', category: 'alternative', active: true, summerBonus: false, website: 'https://sudpol.ch' },
  { name: 'Treibhaus', eventfrogName: 'Treibhaus Luzern', city: 'luzern', tier: 'A', category: 'alternative', active: true, summerBonus: false, website: 'https://treibhaus.ch' },
  { name: 'Rok', eventfrogName: 'Rok Luzern', city: 'luzern', tier: 'A', category: 'electronic', active: true, summerBonus: false, website: 'https://www.rokklub.ch' },
  // Tier A — Kultur
  { name: 'Luzerner Theater', eventfrogName: 'Luzerner Theater', city: 'luzern', tier: 'A', category: 'kultur', active: true, summerBonus: false, website: 'https://luzernertheater.ch' },
  { name: 'Kleintheater Luzern', eventfrogName: 'Kleintheater Luzern', city: 'luzern', tier: 'A', category: 'kultur', active: true, summerBonus: false, website: 'https://kleintheater.ch' },
  { name: 'Kunstmuseum Luzern', eventfrogName: 'Kunstmuseum Luzern', city: 'luzern', tier: 'A', category: 'kultur', active: true, summerBonus: false, website: 'https://kunstmuseumluzern.ch' },
  { name: 'Bourbaki', eventfrogName: 'Bourbaki Luzern', city: 'luzern', tier: 'A', category: 'kultur', active: true, summerBonus: false, website: 'https://bourbaki.ch' },
  // Tier B
  { name: 'Pravda', eventfrogName: 'Pravda Luzern', city: 'luzern', tier: 'B', category: 'electronic', active: true, summerBonus: false },
  { name: 'Volière', eventfrogName: 'Volière Luzern', city: 'luzern', tier: 'B', category: 'bar', active: true, summerBonus: false, website: 'https://3fach.ch/voliere' },
  { name: 'Bar 59', eventfrogName: 'Bar 59 Luzern', city: 'luzern', tier: 'B', category: 'bar', active: true, summerBonus: false, website: 'https://www.bar59.ch' },
  { name: 'Casineum', eventfrogName: 'Casineum Luzern', city: 'luzern', tier: 'B', category: 'special', active: true, summerBonus: false, website: 'https://www.casineum.ch' },
  { name: 'Alpineum', eventfrogName: 'Alpineum Luzern', city: 'luzern', tier: 'B', category: 'alternative', active: true, summerBonus: false, website: 'https://www.alpineum.ch' },
  { name: 'Inseli', eventfrogName: 'Inseli Luzern', city: 'luzern', tier: 'B', category: 'special', active: true, summerBonus: true },
]

// ─── WINTERTHUR ───────────────────────────────────────────────────────────────

const WINTERTHUR_VENUES: VenueSeed[] = [
  // Tier S
  { name: 'Casinotheater', eventfrogName: 'Casinotheater Winterthur', city: 'winterthur', tier: 'S', category: 'kultur', active: true, summerBonus: false, website: 'https://casinotheater.ch' },
  { name: 'Stadthalle Winterthur', eventfrogName: 'Stadthalle Winterthur', city: 'winterthur', tier: 'S', category: 'kultur', active: true, summerBonus: false, website: 'https://stadthalle.ch' },
  // Tier A — Konzerte / Musik
  { name: 'Albani', eventfrogName: 'Albani Winterthur', city: 'winterthur', tier: 'A', category: 'alternative', active: true, summerBonus: false, website: 'https://albani.ch' },
  { name: 'Salzhaus', eventfrogName: 'Salzhaus Winterthur', city: 'winterthur', tier: 'A', category: 'alternative', active: true, summerBonus: false, website: 'https://salzhaus.ch' },
  { name: 'Kraftfeld', eventfrogName: 'Kraftfeld Winterthur', city: 'winterthur', tier: 'A', category: 'alternative', active: true, summerBonus: false, website: 'https://kraftfeld.ch' },
  { name: 'Portier', eventfrogName: 'Portier Winterthur', city: 'winterthur', tier: 'A', category: 'alternative', active: true, summerBonus: false, website: 'https://portier.ch' },
  { name: 'TapTab', eventfrogName: 'TapTab Winterthur', city: 'winterthur', tier: 'A', category: 'alternative', active: true, summerBonus: false, website: 'https://taptab.ch' },
  { name: 'Esse Musicbar', eventfrogName: 'Esse Musicbar Winterthur', city: 'winterthur', tier: 'A', category: 'alternative', active: true, summerBonus: false, website: 'https://essemusicbar.ch' },
  // Tier A — Kunst / Kultur
  { name: 'Oxyd Kunsträume', eventfrogName: 'Oxyd Winterthur', city: 'winterthur', tier: 'A', category: 'kultur', active: true, summerBonus: false, website: 'https://oxyd.ch' },
  { name: 'Coalmine', eventfrogName: 'Coalmine Winterthur', city: 'winterthur', tier: 'A', category: 'kultur', active: true, summerBonus: false, website: 'https://coalmine.ch' },
  { name: 'Kunst Museum Winterthur', eventfrogName: 'Kunst Museum Winterthur', city: 'winterthur', tier: 'A', category: 'kultur', active: true, summerBonus: false, website: 'https://kmw.ch' },
  { name: 'Gewerbemuseum Winterthur', eventfrogName: 'Gewerbemuseum Winterthur', city: 'winterthur', tier: 'A', category: 'kultur', active: true, summerBonus: false, website: 'https://gewerbemuseum.ch' },
  { name: 'Kellertheater Winterthur', eventfrogName: 'Kellertheater Winterthur', city: 'winterthur', tier: 'A', category: 'kultur', active: true, summerBonus: false, website: 'https://kellertheater-winterthur.ch' },
  // Tier B — Outdoor / Sommer
  { name: 'Gaswerk', eventfrogName: 'Gaswerk Winterthur', city: 'winterthur', tier: 'B', category: 'alternative', active: true, summerBonus: true, website: 'https://gaswerk.ch' },
  { name: 'Güterschuppen Winterthur', eventfrogName: 'Güterschuppen Winterthur', city: 'winterthur', tier: 'B', category: 'special', active: true, summerBonus: true, website: 'https://gueterschuppen.ch' },
  // Tier B — Kultur
  { name: 'Alte Kaserne', eventfrogName: 'Alte Kaserne Winterthur', city: 'winterthur', tier: 'B', category: 'kultur', active: true, summerBonus: false, website: 'https://altekaserne.ch' },
  { name: 'Stadthaus Winterthur', eventfrogName: 'Stadthaus Winterthur', city: 'winterthur', tier: 'B', category: 'kultur', active: true, summerBonus: false, website: 'https://stadthaus.winterthur.ch' },
  { name: 'Naturmuseum Winterthur', eventfrogName: 'Naturmuseum Winterthur', city: 'winterthur', tier: 'B', category: 'kultur', active: true, summerBonus: false, website: 'https://naturmuseum.ch' },
  { name: 'Kino Cameo', eventfrogName: 'Kino Cameo Winterthur', city: 'winterthur', tier: 'C', category: 'kultur', active: true, summerBonus: false, website: 'https://kinocameo.ch' },
  { name: 'Kino Nische', eventfrogName: 'Kino Nische Winterthur', city: 'winterthur', tier: 'C', category: 'kultur', active: true, summerBonus: false, website: 'https://kinonische.ch' },
]

// ─── Seed ─────────────────────────────────────────────────────────────────────

const ALL_VENUES: VenueSeed[] = [
  ...ZUERICH_VENUES,
  ...BASEL_VENUES,
  ...BERN_VENUES,
  ...STGALLEN_VENUES,
  ...LUZERN_VENUES,
  ...WINTERTHUR_VENUES,
]

async function seedVenues() {
  const client = getSanityWriteClient()

  console.log(`Seeding ${ALL_VENUES.length} venues across all cities...\n`)

  const transaction = client.transaction()

  for (const venue of ALL_VENUES) {
    const docId = `venue-${venue.city}-${venue.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}`

    transaction.createOrReplace({
      _type: 'venue',
      _id: docId,
      ...venue,
    })
  }

  await transaction.commit()

  // Summary by city and tier
  const cities = ['zuerich', 'basel', 'bern', 'stgallen', 'luzern', 'winterthur'] as const
  const cityLabels: Record<string, string> = {
    zuerich: 'Zürich', basel: 'Basel', bern: 'Bern', stgallen: 'St. Gallen', luzern: 'Luzern', winterthur: 'Winterthur',
  }

  for (const city of cities) {
    const cityVenues = ALL_VENUES.filter((v) => v.city === city)
    const tiers = ['S', 'A', 'B', 'C'] as const
    const tierCounts = tiers.map((t) => `${t}:${cityVenues.filter((v) => v.tier === t).length}`).join('  ')
    console.log(`${cityLabels[city].padEnd(12)} ${cityVenues.length} venues   ${tierCounts}`)
  }
  console.log(`\n✓ ${ALL_VENUES.length} venues total written to Sanity`)
}

seedVenues().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
