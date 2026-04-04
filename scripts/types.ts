// scripts/types.ts
// Gemeinsame Typen für die Scraping-Pipeline

export interface RawEvent {
  name: string
  rawName: string
  location: string
  date: string       // YYYY-MM-DD
  time: string       // HH:MM
  url: string
  source: 'eventfrog' | 'hellozurich' | 'saiten' | 'gangus' | 'kulturzueri' | 'stadt-zuerich' | 'guidle' | 'manual'
}

export interface CuratedEvent extends RawEvent {
  curated: boolean
  curatedReason?: string
  colorIndex: number
  sponsored: boolean
}
