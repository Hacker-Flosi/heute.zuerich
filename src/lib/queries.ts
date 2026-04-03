// src/lib/queries.ts
// GROQ Queries für waslauft.in

export const CURATED_EVENTS_QUERY = `
  *[_type == "event" && date == $date && city == $city && curated == true] | order(time asc) {
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

export const ALL_EVENTS_QUERY = `
  *[_type == "event" && date == $date && city == $city] | order(time asc) {
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
