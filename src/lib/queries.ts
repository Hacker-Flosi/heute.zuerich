// src/lib/queries.ts
// GROQ Queries für heute.zürich

// Kuratierte Events für ein bestimmtes Datum
export const CURATED_EVENTS_QUERY = `
  *[_type == "event" && date == $date && curated == true] | order(time asc) {
    _id,
    name,
    location,
    date,
    time,
    url,
    sponsored,
    colorIndex
  }
`

// Alle Events für ein Datum (für Debugging/Admin)
export const ALL_EVENTS_QUERY = `
  *[_type == "event" && date == $date] | order(time asc) {
    _id,
    name,
    rawName,
    location,
    date,
    time,
    url,
    source,
    curated,
    curatedReason,
    sponsored,
    colorIndex
  }
`

// Events für 3 Tage (heute, morgen, übermorgen)
export const THREE_DAYS_EVENTS_QUERY = `
  *[_type == "event" && date >= $today && date <= $dayAfterTomorrow && curated == true] | order(date asc, time asc) {
    _id,
    name,
    location,
    date,
    time,
    url,
    sponsored,
    colorIndex
  }
`
