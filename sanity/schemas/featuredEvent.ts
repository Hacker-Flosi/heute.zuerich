// sanity/schemas/featuredEvent.ts
// Stadtübergreifende Highlight-Events (manuell kuratiert)
// z.B. Art Basel, Openair St. Gallen, Street Parade — erscheinen auf allen anderen Stadtseiten

import { defineField, defineType } from 'sanity'

const CITY_OPTIONS = [
  // Aktive App-Städte (Event erscheint auf allen ANDEREN Stadtseiten)
  { title: 'Zürich',     value: 'zuerich' },
  { title: 'Basel',      value: 'basel' },
  { title: 'St. Gallen', value: 'stgallen' },
  { title: 'Luzern',     value: 'luzern' },
  // Weitere Schweizer Städte (Event erscheint auf ALLEN 4 Stadtseiten)
  { title: 'Bern',       value: 'bern' },
  { title: 'Davos',      value: 'davos' },
  { title: 'Wengen',     value: 'wengen' },
  { title: 'Genf',       value: 'genf' },
  { title: 'Biel',       value: 'biel' },
  { title: 'Chur',       value: 'chur' },
  { title: 'Frauenfeld', value: 'frauenfeld' },
  { title: 'Montreux',   value: 'montreux' },
  { title: 'Nyon',       value: 'nyon' },
  { title: 'Locarno',    value: 'locarno' },
  { title: 'St. Moritz', value: 'stmoritz' },
]

export default defineType({
  name: 'featuredEvent',
  title: 'Featured Event (stadtübergreifend)',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Event Name',
      type: 'string',
      description: 'z.B. "Art Basel", "Openair St. Gallen", "Street Parade"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'city',
      title: 'Gastgeberstadt',
      type: 'string',
      description: 'In welcher Stadt findet das Event statt? Auf dieser Seite wird der Callout NICHT angezeigt.',
      options: { list: CITY_OPTIONS, layout: 'radio' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'dateFrom',
      title: 'Von (erster Tag)',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'dateTo',
      title: 'Bis (letzter Tag)',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'Website',
      type: 'url',
      description: 'Offizielle Event-URL',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'teaser',
      title: 'Teaser',
      type: 'text',
      description: 'Kurze Beschreibung (1–2 Sätze, max. 200 Zeichen)',
      rows: 2,
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'active',
      title: 'Aktiv',
      type: 'boolean',
      description: 'Nur aktive Einträge werden angezeigt',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      city: 'city',
      dateFrom: 'dateFrom',
      dateTo: 'dateTo',
      active: 'active',
    },
    prepare({ title, city, dateFrom, dateTo, active }) {
      const cityMap: Record<string, string> = {
        zuerich: 'ZH', stgallen: 'SG', luzern: 'LZ', basel: 'BS', bern: 'BE',
      }
      const cityCode = cityMap[city] ?? city
      const status = active ? '' : ' 🔴'
      return {
        title: `${title}${status}`,
        subtitle: `${cityCode} · ${dateFrom ?? '?'} → ${dateTo ?? '?'}`,
      }
    },
  },
  orderings: [
    {
      title: 'Datum (neueste zuerst)',
      name: 'dateFromDesc',
      by: [{ field: 'dateFrom', direction: 'desc' }],
    },
  ],
})
