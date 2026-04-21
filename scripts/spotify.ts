// scripts/spotify.ts
// Spotify Artist-Lookup für Music-Events
//
// konzert  → exact name match + top-tracks check (mindestens 1 CH-Track)
// dj_club  → nur via "pres."-Pattern (z.B. "Hive pres. Nina Chuba")
// party    → kein Lookup (zu viele Event-Titel, kein Künstlername)

const TOKEN_CACHE: { token: string; expiresAt: number } = { token: '', expiresAt: 0 }

async function getToken(): Promise<string> {
  if (TOKEN_CACHE.token && Date.now() < TOKEN_CACHE.expiresAt) return TOKEN_CACHE.token

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  TOKEN_CACHE.token = data.access_token
  TOKEN_CACHE.expiresAt = Date.now() + (data.expires_in - 60) * 1000
  return TOKEN_CACHE.token
}

// Keywords that indicate an event name, not an artist name
const EVENT_KEYWORDS = [
  'meets', 'festival', 'concert', 'show', 'nacht', 'night', 'party', 'open air', 'openair',
  'zürich', 'zuerich', 'luzern', 'basel', 'bern', 'st.gallen', 'stgallen', 'zurich',
  'winter', 'sommer', 'frühling', 'herbst', 'spring', 'summer',
  'tunes', 'klassik', 'klassiker', 'rockklassiker', 'jahreszeiten',
  'präsentiert', 'kapitel', 'chapter', 'edition', 'vol.', 'vol ',
  'release', 'presents', 'special', 'live set', 'dj set', 'b2b',
  'tour ', ' tour', 'tribute', 'cover', 'session', 'sessions',
  'feat.', 'featuring', ' feat ', ' ft ',
  'w/', ' vs ', ' vs. ', ' & ',
]

/** Returns true only if the name looks like an actual artist name */
function isPlausibleArtistName(name: string): boolean {
  if (name.length < 3 || name.length > 50) return false
  const lower = name.toLowerCase()
  if (EVENT_KEYWORDS.some((kw) => lower.includes(kw))) return false
  if (/\s[|\/\\+]\s/.test(name)) return false
  if (/\d{1,2}:\d{2}$/.test(name.trim())) return false
  if (name.trim().split(/\s+/).length > 4) return false
  return true
}

/** Extrahiert Artist-Namen via "pres."-Pattern */
function extractPresCandidate(eventName: string): string | null {
  const presMatch = eventName.match(/pres\.?\s+(.+)/i)
  if (!presMatch) return null
  const act = presMatch[1].trim()
  return isPlausibleArtistName(act) ? act : null
}

// Ensemble-Suffixe die nach dem Artist-Namen vorkommen können
const ENSEMBLE_SUFFIXES = /\s+(duo|trio|quartet|quartett|quintet|quintett|band|ensemble|orchester|orchestra|chor|choir|project|projekt|collective|experience|experience|system)\s*$/i

/** Extrahiert Artist-Namen für konzert: pres., Klammern, Ensemble-Suffixe, Original */
function extractKonzertCandidates(eventName: string): string[] {
  const candidates: string[] = []

  const pres = extractPresCandidate(eventName)
  if (pres) candidates.push(pres)

  // Klammern und eckige Klammern entfernen
  const cleaned = eventName.replace(/\s*\(.*?\)/g, '').replace(/\s*\[.*?\]/g, '').trim()
  if (cleaned !== eventName && isPlausibleArtistName(cleaned)) candidates.push(cleaned)

  // Ensemble-Suffix entfernen (z.B. "Elian Zeitel Duo" → "Elian Zeitel")
  const stripped = eventName.replace(ENSEMBLE_SUFFIXES, '').trim()
  if (stripped !== eventName && isPlausibleArtistName(stripped)) candidates.push(stripped)

  if (isPlausibleArtistName(eventName)) candidates.push(eventName)

  return [...new Set(candidates)]
}

/**
 * Sucht den Artist auf Spotify und gibt die URL zurück wenn ein exakter
 * Name-Match gefunden wird. Kein Top-Tracks-Check hier.
 */
async function searchExact(name: string, token: string): Promise<{ id: string; url: string } | null> {
  try {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const exact = (data.artists?.items ?? []).find(
      (a: any) => a.name.toLowerCase() === name.toLowerCase()
    )
    if (!exact) return null
    return { id: exact.id, url: exact.external_urls?.spotify }
  } catch {
    return null
  }
}

// Minimum number of releases an artist must have to be considered "known"
// Unknown local acts typically have 0–1 releases; real artists have many more.
const MIN_ALBUMS = 3

/**
 * Prüft ob ein Artist mindestens MIN_ALBUMS Releases auf Spotify hat.
 * Lokale/unbekannte Acts haben 0–1 Releases → false.
 */
async function isEstablishedArtist(artistId: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return false
    const data = await res.json()
    return (data.total ?? 0) >= MIN_ALBUMS
  } catch {
    return false
  }
}

/**
 * Sucht den Spotify Artist-Link für ein Event.
 *
 * konzert  → exact match + top-tracks check
 * dj_club  → nur pres.-Pattern + exact match (kein top-tracks check,
 *             da viele DJs wenige Streams haben aber trotzdem real sind)
 * party    → kein Lookup
 */
export async function lookupSpotifyUrl(eventName: string, eventType: string | undefined): Promise<string | null> {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) return null

  const token = await getToken()

  if (eventType === 'konzert') {
    const candidates = extractKonzertCandidates(eventName)
    for (const candidate of candidates) {
      const match = await searchExact(candidate, token)
      if (!match) continue
      const established = await isEstablishedArtist(match.id, token)
      if (established) return match.url
    }
    return null
  }

  if (eventType === 'dj_club') {
    // Nur via pres.-Pattern — zu riskant für den rohen DJ-Namen
    const pres = extractPresCandidate(eventName)
    if (!pres) return null
    const match = await searchExact(pres, token)
    return match?.url ?? null
  }

  return null
}
