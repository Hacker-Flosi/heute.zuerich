// scripts/test-spotify.ts
// Testet Spotify Artist-Suche mit der neuen Logik

import { lookupSpotifyUrl } from './spotify'

const TESTS: Array<{ name: string; type: string }> = [
  // Konzerte — sollten matchen
  { name: 'Nina Chuba', type: 'konzert' },
  { name: 'Brina Knauss', type: 'konzert' },
  { name: 'Apparat', type: 'konzert' },
  { name: 'Balthazar', type: 'konzert' },
  { name: 'Brina Knauss (Live)', type: 'konzert' },
  // Konzert — False-Positive-Kandidaten
  { name: 'D-Town', type: 'konzert' },
  { name: 'Bliss', type: 'konzert' },
  { name: 'Metalstorm over Luzern: Chapter V', type: 'konzert' },
  { name: 'Vivaldi meets Rock', type: 'konzert' },
  // DJ Club — nur via pres.
  { name: 'Objekt', type: 'dj_club' },
  { name: 'Hive pres. Objekt', type: 'dj_club' },
  { name: 'Franky Rizardo', type: 'dj_club' },
  // Party — kein Lookup
  { name: 'Party Night Zürich', type: 'party' },
]

async function main() {
  console.log('Testing Spotify lookup...\n')
  for (const t of TESTS) {
    const url = await lookupSpotifyUrl(t.name, t.type)
    console.log(`${url ? '✅' : '❌'} [${t.type}] ${t.name}${url ? '\n   ' + url : ''}`)
  }
}

main().catch(console.error)
