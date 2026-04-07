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

// Datumshelfer
export const getDateString = (offset: number = 0): string => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0] // YYYY-MM-DD
}

export const formatDateLabel = (offset: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ]
  return `${days[d.getDay()]}, ${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`
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
}
