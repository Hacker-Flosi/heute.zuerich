// scripts/types.ts
// Gemeinsame Typen für die Scraping-Pipeline

export type EventType =
  | 'konzert'
  | 'dj_club'
  | 'party'
  | 'kultur'
  | 'kunst'
  | 'markt'
  | 'open_air'
  | 'special'

export type PipelineLayer = 'venue' | 'discovery'

export interface RawEvent {
  name: string
  rawName: string
  location: string
  date: string       // YYYY-MM-DD
  time: string       // HH:MM
  url: string
  source: 'eventfrog' | 'hellozurich' | 'saiten' | 'gangus' | 'kulturzueri' | 'stadt-zuerich' | 'guidle' | 'manual'
  eventType?: EventType
  layer?: PipelineLayer
  venueId?: string   // Sanity venue document _id (Layer 1 only)
}

export interface CuratedEvent extends RawEvent {
  curated: boolean
  curatedReason?: string
  colorIndex: number
  sponsored: boolean
}

// Venue as stored in Sanity
export interface SanityVenue {
  _id: string
  name: string
  eventfrogName?: string
  eventfrogId?: string
  city: string
  tier: 'S' | 'A' | 'B' | 'C'
  category: 'electronic' | 'alternative' | 'mainstream' | 'kultur' | 'bar' | 'special'
  active: boolean
  summerBonus: boolean
  website?: string
}
