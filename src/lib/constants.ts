// src/lib/constants.ts
// Farben und Konstanten für heute.zürich

export const COLORS = [
  '#FF0000',  // Rot
  '#FF00FF',  // Magenta
  '#00E5FF',  // Cyan
  '#FFFFFF',  // Weiss
  '#FFB800',  // Orange/Gelb
  '#00E05A',  // Grün
  '#5B5BFF',  // Blau
  '#FF4D94',  // Pink
  '#C864FF',  // Violett
  '#FFE500',  // Gelb
  '#FF6B35',  // Deep Orange
  '#00FF94',  // Mint
] as const

export const getEventColor = (index: number): string => {
  return COLORS[index % COLORS.length]
}

/** WCAG-konformer Text-Kontrast: gibt '#000' oder '#fff' zurück je nach Hintergrundluminanz. */
export function getTextColor(hex: string): '#000000' | '#ffffff' {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const lin = (c: number) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  // Switch to white text when luminance < 0.179 (equal contrast breakpoint)
  return L < 0.179 ? '#ffffff' : '#000000'
}

// Datumshelfer
export const getDateString = (offset: number = 0): string => {
  // Use Swiss timezone so midnight–2 AM doesn't show yesterday's events
  const zurichDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Zurich' })
  const d = new Date(zurichDate)
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0] // YYYY-MM-DD
}

export const formatDateLabel = (offset: number): string => {
  const zurichDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Zurich' })
  const d = new Date(zurichDate)
  d.setDate(d.getDate() + offset)
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ]
  return `${days[d.getDay()]}, ${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`
}

export const formatDateShort = (offset: number): string => {
  const zurichDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Zurich' })
  const d = new Date(zurichDate)
  d.setDate(d.getDate() + offset)
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ]
  return `${days[d.getDay()]} ${d.getDate()}.${months[d.getMonth()]}`
}

export type EventType =
  | 'konzert' | 'dj_club' | 'party' | 'kultur'
  | 'kunst' | 'markt' | 'open_air' | 'special'

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  konzert:  'Konzert',
  dj_club:  'DJ / Club',
  party:    'Party',
  kultur:   'Kultur',
  kunst:    'Kunst',
  markt:    'Markt',
  open_air: 'Open Air',
  special:  'Special',
}

export const CITY_LABELS: Record<string, string> = {
  zuerich:     'Zürich',
  stgallen:    'St.Gallen',
  luzern:      'Luzern',
  winterthur:  'Winterthur',
  basel:       'Basel',
  bern:        'Bern',
  davos:       'Davos',
  wengen:      'Wengen',
  genf:        'Genf',
  biel:        'Biel',
  chur:        'Chur',
  frauenfeld:  'Frauenfeld',
  montreux:    'Montreux',
  nyon:        'Nyon',
  locarno:     'Locarno',
  stmoritz:    'St. Moritz',
}

export interface FeaturedEvent {
  _id: string
  name: string
  city: string      // host city slug
  dateFrom: string  // YYYY-MM-DD
  dateTo: string    // YYYY-MM-DD
  url: string
  teaser?: string
}

export interface Event {
  _id: string
  name: string
  location: string
  date: string
  time: string
  url: string
  sponsored: boolean
  colorIndex: number
  eventType?: EventType
  layer?: 'venue' | 'discovery'
  spotifyUrl?: string
}
