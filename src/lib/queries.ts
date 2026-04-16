// src/lib/queries.ts
// GROQ Queries für waslauft.in

export const CURATED_EVENTS_QUERY = `
  *[_type == "event" && date == $date && city == $city && curated == true && rainReserve != true] | order(time asc) {
    _id,
    name,
    location,
    date,
    time,
    url,
    sponsored,
    colorIndex,
    eventType,
    layer
  }
`

export const RAIN_RESERVE_QUERY = `
  *[_type == "event" && date == $date && city == $city && rainReserve == true] | order(time asc) {
    _id,
    name,
    location,
    date,
    time,
    url,
    sponsored,
    colorIndex,
    eventType,
    layer
  }
`

export const SITE_SETTINGS_QUERY = `
  *[_type == "siteSettings" && _id == "siteSettings"][0] {
    homeLogo { asset->{ url } },
    zuerichLogo { asset->{ url } },
    stgallenLogo { asset->{ url } },
    luzernLogo { asset->{ url } },
    baselLogo { asset->{ url } },
    bernLogo { asset->{ url } }
  }
`

export const FEATURED_EVENTS_QUERY = `
  *[
    _type == "featuredEvent"
    && active == true
    && city != $city
    && dateFrom <= $windowEnd
    && dateTo >= $windowStart
  ] | order(dateFrom asc) {
    _id,
    name,
    city,
    dateFrom,
    dateTo,
    url,
    teaser
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
