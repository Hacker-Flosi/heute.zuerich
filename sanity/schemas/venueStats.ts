// sanity/schemas/venueStats.ts
// Kumulative Venue-Statistiken — wird täglich von der Pipeline aktualisiert

import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'venueStats',
  title: 'Venue Stats',
  type: 'document',
  fields: [
    defineField({ name: 'venueName', title: 'Venue Name', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'city',      title: 'Stadt',      type: 'string', validation: (R) => R.required() }),

    defineField({ name: 'totalAppearances',     title: 'Gesamt Auftritte',     type: 'number', initialValue: 0 }),
    defineField({ name: 'instagramAppearances', title: 'Instagram Auftritte',  type: 'number', initialValue: 0 }),

    defineField({ name: 'firstSeen', title: 'Erstes Auftreten', type: 'date' }),
    defineField({ name: 'lastSeen',  title: 'Letztes Auftreten', type: 'date' }),

    // Letzte 30 Tage für Häufigkeits-Berechnung
    defineField({
      name: 'recentDates',
      title: 'Letzte 30 Auftrittsdaten',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'ISO-Daten der letzten Auftritte (max 30)',
    }),
  ],
  preview: {
    select: { name: 'venueName', city: 'city', total: 'totalAppearances', ig: 'instagramAppearances' },
    prepare({ name, city, total, ig }) {
      return { title: name, subtitle: `${city} · ${total}× total · ${ig}× Instagram` }
    },
  },
  orderings: [{
    title: 'Häufigste zuerst',
    name: 'totalDesc',
    by: [{ field: 'totalAppearances', direction: 'desc' }],
  }],
})
