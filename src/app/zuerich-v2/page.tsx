// src/app/zuerich-v2/page.tsx
// Test-Page für das venue-zentrische System — nur intern zugänglich
// Kein Link in der Navigation, kein Indexing

import { getSanityClient } from '@/lib/sanity'
import { getDateString } from '@/lib/constants'
import type { Metadata } from 'next'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Zürich V2 (intern)',
  robots: { index: false, follow: false },
}

interface VenueCentricEvent {
  _id:        string
  title:      string
  startDate:  string
  startTime?: string
  eventUrl?:  string
  ticketUrl?: string
  imageUrl?:  string
  sourceType: string
  venueName:  string
  venueTier:  string
}

const QUERY = `
  *[
    _type == "eventVenueCentric"
    && city == "zuerich"
    && startDate >= $today
    && startDate <= $dayAfter
    && isDuplicate != true
  ] | order(startDate asc, startTime asc) {
    _id,
    title,
    startDate,
    startTime,
    eventUrl,
    ticketUrl,
    imageUrl,
    sourceType,
    "venueName": venue->name,
    "venueTier": venue->tier,
  }
`

const SOURCE_BADGE: Record<string, string> = {
  ra:          'RA',
  website:     'Web',
  eventfrog:   'EF',
  ticketmaster:'TM',
  instagram:   'IG',
  facebook:    'FB',
  bandsintown: 'BIT',
}

const TIER_COLOR: Record<string, string> = {
  S: '#FF0000',
  A: '#FF00FF',
  B: '#00E5FF',
  C: '#FFFFFF',
}

function formatDate(d: string): string {
  const date = new Date(d + 'T12:00:00')
  return date.toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default async function ZuerichV2Page() {
  const client   = getSanityClient()
  const today    = getDateString(0)
  const dayAfter = getDateString(2)

  const events = await client.fetch<VenueCentricEvent[]>(QUERY, { today, dayAfter })

  // Nach Datum gruppieren
  const byDate = new Map<string, VenueCentricEvent[]>()
  for (const e of events) {
    const list = byDate.get(e.startDate) ?? []
    list.push(e)
    byDate.set(e.startDate, list)
  }

  const dates = [...byDate.keys()].sort()

  return (
    <main style={{ fontFamily: 'monospace', padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
          ZÜRICH V2 — venue-centric test
        </h1>
        <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>
          {events.length} Events · {today} bis {dayAfter} · intern, kein Index
        </p>
      </div>

      {events.length === 0 && (
        <p style={{ fontSize: '0.875rem', color: '#888' }}>
          Keine Events. Scraper noch nicht gelaufen?<br />
          <code style={{ fontSize: '0.75rem' }}>
            npx tsx --env-file=.env.local scripts/venue-centric/orchestrator.ts
          </code>
        </p>
      )}

      {dates.map((date) => (
        <section key={date} style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '0.75rem',
            fontWeight: 'bold',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            borderBottom: '1px solid #ccc',
            paddingBottom: '0.25rem',
            marginBottom: '0.5rem',
            color: '#444',
          }}>
            {formatDate(date)}
          </h2>

          {(byDate.get(date) ?? []).map((e) => {
            const url = e.eventUrl ?? e.ticketUrl ?? '#'
            return (
              <a
                key={e._id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3rem 2rem 1fr 2.5rem',
                  gap: '0.5rem',
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #eee',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                {/* Zeit */}
                <span style={{ fontSize: '0.75rem', color: '#888' }}>
                  {e.startTime ?? '—'}
                </span>

                {/* Tier-Badge */}
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  color: TIER_COLOR[e.venueTier] ?? '#ccc',
                  background: '#111',
                  padding: '1px 4px',
                  borderRadius: 2,
                  textAlign: 'center',
                }}>
                  {e.venueTier ?? '?'}
                </span>

                {/* Titel + Venue */}
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 'bold', lineHeight: 1.2 }}>
                    {e.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#888', marginTop: 2 }}>
                    {e.venueName}
                  </div>
                </div>

                {/* Source-Badge */}
                <span style={{
                  fontSize: '0.65rem',
                  color: '#888',
                  background: '#f0f0f0',
                  padding: '1px 5px',
                  borderRadius: 2,
                  textAlign: 'center',
                }}>
                  {SOURCE_BADGE[e.sourceType] ?? e.sourceType}
                </span>
              </a>
            )
          })}
        </section>
      ))}
    </main>
  )
}
