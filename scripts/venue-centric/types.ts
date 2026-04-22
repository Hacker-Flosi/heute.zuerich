// scripts/venue-centric/types.ts
// Typen für das venue-zentrische Scraping-System

export type SourceType =
  | 'website'
  | 'ra'
  | 'eventfrog'
  | 'ticketmaster'
  | 'ticketplus'
  | 'instagram'
  | 'facebook'
  | 'bandsintown'

export interface ScrapeSource {
  type:     SourceType
  url:      string
  priority: number
  active:   boolean
  notes?:   string
}

export interface VenueWithSources {
  _id:           string
  name:          string
  city:          string
  tier:          'S' | 'A' | 'B' | 'C'
  category:      string
  scrapeSources: ScrapeSource[]
}

export interface NormalizedEvent {
  // Pflichtfelder
  title:          string
  venueId:        string  // Sanity venue._id
  venueName:      string
  city:           string
  startDate:      string  // YYYY-MM-DD

  // Optional
  startTime?:     string  // HH:MM
  endDate?:       string
  description?:   string
  imageUrl?:      string
  ticketUrl?:     string
  eventUrl?:      string
  price?:         string

  // Metadaten
  sourceType:     SourceType
  sourceUrl:      string
  sourcePriority: number
  scrapedAt:      string  // ISO 8601
  rawId?:         string  // ID aus der Source-Plattform
}
