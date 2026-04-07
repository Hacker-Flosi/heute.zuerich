// scripts/seed-venues.ts
// Seed-Script: schreibt alle Zürich-Venues in Sanity
// Run: npx tsx --env-file=.env.local scripts/seed-venues.ts

import { getSanityWriteClient } from '../src/lib/sanity'
import type { SanityVenue } from './types'

type VenueSeed = Omit<SanityVenue, '_id'>

const ZUERICH_VENUES: VenueSeed[] = [
  // ─── TIER S ───────────────────────────────────────────────────────────────
  {
    name: 'Hallenstadion',
    eventfrogName: 'Hallenstadion',
    city: 'zuerich',
    tier: 'S',
    category: 'kultur',
    active: true,
    summerBonus: false,
    website: 'https://hallenstadion.ch',
  },
  {
    name: 'The Hall',
    eventfrogName: 'The Hall Dübendorf',
    city: 'zuerich',
    tier: 'S',
    category: 'electronic',
    active: true,
    summerBonus: false,
    website: 'https://the-hall.ch',
  },
  {
    name: 'X-TRA',
    eventfrogName: 'X-TRA Zürich',
    city: 'zuerich',
    tier: 'S',
    category: 'alternative',
    active: true,
    summerBonus: false,
    website: 'https://x-tra.ch',
  },
  {
    name: 'Komplex 457',
    eventfrogName: 'Komplex 457',
    city: 'zuerich',
    tier: 'S',
    category: 'electronic',
    active: true,
    summerBonus: false,
    website: 'https://komplex457.ch',
  },
  {
    name: 'Kaufleuten',
    eventfrogName: 'Kaufleuten Zürich',
    city: 'zuerich',
    tier: 'S',
    category: 'mainstream',
    active: true,
    summerBonus: false,
    website: 'https://kaufleuten.ch',
  },
  {
    name: 'Volkshaus',
    eventfrogName: 'Volkshaus Zürich',
    city: 'zuerich',
    tier: 'S',
    category: 'alternative',
    active: true,
    summerBonus: false,
    website: 'https://volkshaus-zuerich.ch',
  },
  {
    name: 'Maag Halle',
    eventfrogName: 'Maag Halle Zürich',
    city: 'zuerich',
    tier: 'S',
    category: 'kultur',
    active: true,
    summerBonus: false,
    website: 'https://www.maag.ch',
  },
  {
    name: 'Mascotte',
    eventfrogName: 'Mascotte Zürich',
    city: 'zuerich',
    tier: 'S',
    category: 'mainstream',
    active: true,
    summerBonus: false,
    website: 'https://mascotte.ch',
  },

  // ─── TIER A — ELECTRONIC / TECHNO / HOUSE ─────────────────────────────────
  {
    name: 'Hive',
    eventfrogName: 'Hive Club Zürich',
    city: 'zuerich',
    tier: 'A',
    category: 'electronic',
    active: true,
    summerBonus: false,
    website: 'https://hive-club.ch',
  },
  {
    name: 'Supermarket',
    eventfrogName: 'Supermarket Zürich',
    city: 'zuerich',
    tier: 'A',
    category: 'electronic',
    active: true,
    summerBonus: false,
    website: 'https://supermarket.li',
  },
  {
    name: "Frieda's Büxe",
    eventfrogName: "Frieda's Büxe",
    city: 'zuerich',
    tier: 'A',
    category: 'electronic',
    active: true,
    summerBonus: false,
    website: 'https://friedas.ch',
  },
  {
    name: 'Zukunft',
    eventfrogName: 'Zukunft Zürich',
    city: 'zuerich',
    tier: 'A',
    category: 'electronic',
    active: true,
    summerBonus: false,
    website: 'https://zukunft.cc',
  },
  {
    name: 'Kauzu',
    eventfrogName: 'Kauzu Zürich',
    city: 'zuerich',
    tier: 'A',
    category: 'electronic',
    active: true,
    summerBonus: false,
    website: 'https://kauzu.ch',
  },
  {
    name: 'Exil',
    eventfrogName: 'Exil Zürich',
    city: 'zuerich',
    tier: 'A',
    category: 'electronic',
    active: true,
    summerBonus: false,
    website: 'https://exil.ch',
  },
  {
    name: 'Mädchere',
    eventfrogName: 'Mädchere Zürich',
    city: 'zuerich',
    tier: 'A',
    category: 'electronic',
    active: true,
    summerBonus: false,
  },
  {
    name: 'Klaus',
    eventfrogName: 'Klaus Zürich',
    city: 'zuerich',
    tier: 'A',
    category: 'electronic',
    active: true,
    summerBonus: false,
  },
  {
    name: "Frieda's Garten",
    eventfrogName: "Frieda's Garten Zürich",
    city: 'zuerich',
    tier: 'A',
    category: 'electronic',
    active: true,
    summerBonus: true,
    website: 'https://friedas.ch',
  },

  // ─── TIER A — ALTERNATIVE / ROCK / UNDERGROUND ────────────────────────────
  {
    name: 'Dynamo',
    eventfrogName: 'Dynamo Zürich',
    city: 'zuerich',
    tier: 'A',
    category: 'alternative',
    active: true,
    summerBonus: false,
    website: 'https://dynamo.ch',
  },
  {
    name: 'Rote Fabrik',
    eventfrogName: 'Rote Fabrik Zürich',
    city: 'zuerich',
    tier: 'A',
    category: 'alternative',
    active: true,
    summerBonus: true,
    website: 'https://rotefabrik.ch',
  },
  {
    name: 'Bogen F',
    eventfrogName: 'Bogen F Zürich',
    city: 'zuerich',
    tier: 'A',
    category: 'alternative',
    active: true,
    summerBonus: false,
    website: 'https://bogenf.ch',
  },
  {
    name: 'Moods',
    eventfrogName: 'Moods Zürich',
    city: 'zuerich',
    tier: 'A',
    category: 'kultur',
    active: true,
    summerBonus: false,
    website: 'https://moods.ch',
  },
  {
    name: 'Sender',
    eventfrogName: 'Sender Zürich',
    city: 'zuerich',
    tier: 'A',
    category: 'alternative',
    active: true,
    summerBonus: false,
    website: 'https://sender.club',
  },

  // ─── TIER B — MAINSTREAM / HIP-HOP ────────────────────────────────────────
  {
    name: 'Plaza',
    eventfrogName: 'Plaza Club Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'mainstream',
    active: true,
    summerBonus: false,
  },
  {
    name: 'Vior',
    eventfrogName: 'Vior Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'mainstream',
    active: true,
    summerBonus: false,
  },
  {
    name: 'Jade',
    eventfrogName: 'Jade Club Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'mainstream',
    active: true,
    summerBonus: false,
  },
  {
    name: 'Aura',
    eventfrogName: 'Aura Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'mainstream',
    active: true,
    summerBonus: false,
  },
  {
    name: 'Icon',
    eventfrogName: 'Icon Club Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'mainstream',
    active: true,
    summerBonus: false,
  },
  {
    name: 'Alice Choo',
    eventfrogName: 'Alice Choo Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'mainstream',
    active: true,
    summerBonus: false,
  },

  // ─── TIER B — BARS MIT DANCEFLOOR ─────────────────────────────────────────
  {
    name: 'Gonze',
    eventfrogName: 'Gonze Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'bar',
    active: true,
    summerBonus: false,
  },
  {
    name: 'Olé Olé Bar',
    eventfrogName: 'Olé Olé Bar Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'bar',
    active: true,
    summerBonus: false,
  },
  {
    name: 'Kasheme',
    eventfrogName: 'Kasheme Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'bar',
    active: true,
    summerBonus: false,
  },
  {
    name: 'Frau Gerolds Garten',
    eventfrogName: 'Frau Gerolds Garten Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'special',
    active: true,
    summerBonus: true,
    website: 'https://fraugerold.ch',
  },
  {
    name: 'Rimini Bar',
    eventfrogName: 'Rimini Bar Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'bar',
    active: true,
    summerBonus: true,
  },
  {
    name: 'Barfussbar',
    eventfrogName: 'Barfussbar Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'bar',
    active: true,
    summerBonus: true,
  },
  {
    name: 'Samigo Amusement',
    eventfrogName: 'Samigo Amusement Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'bar',
    active: true,
    summerBonus: false,
  },

  // ─── TIER B — KULTUR & EVENT-LOCATIONS ────────────────────────────────────
  {
    name: 'Schiffbau',
    eventfrogName: 'Schiffbau Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'kultur',
    active: true,
    summerBonus: false,
  },
  {
    name: 'Labor Bar',
    eventfrogName: 'Labor Bar Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'bar',
    active: true,
    summerBonus: false,
  },
  {
    name: 'Papiersaal',
    eventfrogName: 'Papiersaal Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'kultur',
    active: true,
    summerBonus: false,
    website: 'https://papiersaal.ch',
  },
  {
    name: 'Folium',
    eventfrogName: 'Folium Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'kultur',
    active: true,
    summerBonus: false,
  },
  {
    name: 'Millers',
    eventfrogName: 'Millers Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'kultur',
    active: true,
    summerBonus: false,
  },
  {
    name: 'Kosmos',
    eventfrogName: 'Kosmos Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'kultur',
    active: true,
    summerBonus: false,
    website: 'https://kosmos.ch',
  },
  {
    name: 'Gessnerallee',
    eventfrogName: 'Gessnerallee Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'kultur',
    active: true,
    summerBonus: false,
    website: 'https://gessnerallee.ch',
  },
  {
    name: 'Kirche Neumünster',
    eventfrogName: 'Kirche Neumünster Zürich',
    city: 'zuerich',
    tier: 'B',
    category: 'kultur',
    active: true,
    summerBonus: false,
  },

  // ─── TIER C — HIDDEN GEMS ─────────────────────────────────────────────────
  {
    name: 'Heile Welt',
    eventfrogName: 'Heile Welt Zürich',
    city: 'zuerich',
    tier: 'C',
    category: 'bar',
    active: true,
    summerBonus: false,
  },
  {
    name: 'Bagatelle',
    eventfrogName: 'Bagatelle Zürich',
    city: 'zuerich',
    tier: 'C',
    category: 'bar',
    active: true,
    summerBonus: false,
  },
  {
    name: 'Sektor 11',
    eventfrogName: 'Sektor 11 Zürich',
    city: 'zuerich',
    tier: 'C',
    category: 'electronic',
    active: true,
    summerBonus: false,
  },
  {
    name: 'Hard One',
    eventfrogName: 'Hard One Zürich',
    city: 'zuerich',
    tier: 'C',
    category: 'electronic',
    active: true,
    summerBonus: false,
  },
  {
    name: 'Garage',
    eventfrogName: 'Garage Zürich',
    city: 'zuerich',
    tier: 'C',
    category: 'alternative',
    active: true,
    summerBonus: false,
  },
  {
    name: 'Space Monki',
    eventfrogName: 'Space Monki Zürich',
    city: 'zuerich',
    tier: 'C',
    category: 'bar',
    active: true,
    summerBonus: false,
  },
]

async function seedVenues() {
  const client = getSanityWriteClient()

  console.log(`Seeding ${ZUERICH_VENUES.length} Zürich venues...`)

  const transaction = client.transaction()

  for (const venue of ZUERICH_VENUES) {
    const docId = `venue-zuerich-${venue.name
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
  console.log(`✓ ${ZUERICH_VENUES.length} venues written to Sanity`)

  // Print summary by tier
  const tiers = ['S', 'A', 'B', 'C'] as const
  for (const tier of tiers) {
    const count = ZUERICH_VENUES.filter((v) => v.tier === tier).length
    console.log(`  Tier ${tier}: ${count} venues`)
  }
}

seedVenues().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
