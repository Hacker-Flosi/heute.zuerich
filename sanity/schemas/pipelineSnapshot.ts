// sanity/schemas/pipelineSnapshot.ts
// Täglich gespeicherter Snapshot pro Stadt — für Langzeit-Statistiken

import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'pipelineSnapshot',
  title: 'Pipeline Snapshot',
  type: 'document',
  fields: [
    defineField({ name: 'date',  title: 'Datum', type: 'date', validation: (R) => R.required() }),
    defineField({ name: 'city',  title: 'Stadt', type: 'string', validation: (R) => R.required() }),

    // Mengen
    defineField({ name: 'totalEvents',     title: 'Gesamt Events', type: 'number' }),
    defineField({ name: 'layer1Events',    title: 'Layer 1 Events', type: 'number' }),
    defineField({ name: 'layer2Events',    title: 'Layer 2 Events', type: 'number' }),

    // Quellen
    defineField({
      name: 'sources',
      title: 'Quellen',
      type: 'object',
      fields: [
        defineField({ name: 'eventfrog',   type: 'number', title: 'Eventfrog' }),
        defineField({ name: 'hellozurich', type: 'number', title: 'hellozurich' }),
        defineField({ name: 'gangus',      type: 'number', title: 'Gangus' }),
        defineField({ name: 'ra',          type: 'number', title: 'Resident Advisor' }),
      ],
    }),

    // Event-Typen
    defineField({
      name: 'eventTypes',
      title: 'Event-Typen',
      type: 'object',
      fields: [
        defineField({ name: 'konzert',  type: 'number', title: 'Konzert' }),
        defineField({ name: 'dj_club',  type: 'number', title: 'DJ / Club' }),
        defineField({ name: 'party',    type: 'number', title: 'Party' }),
        defineField({ name: 'kultur',   type: 'number', title: 'Kultur' }),
        defineField({ name: 'kunst',    type: 'number', title: 'Kunst' }),
        defineField({ name: 'markt',    type: 'number', title: 'Markt' }),
        defineField({ name: 'open_air', type: 'number', title: 'Open Air' }),
        defineField({ name: 'special',  type: 'number', title: 'Special' }),
      ],
    }),

    // Top Venues
    defineField({
      name: 'topVenues',
      title: 'Top Venues',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'name',  type: 'string', title: 'Venue' }),
          defineField({ name: 'count', type: 'number', title: 'Anzahl' }),
        ],
      }],
    }),

    // Instagram
    defineField({ name: 'instagramPosted',  title: 'Instagram gepostet', type: 'boolean', initialValue: false }),
    defineField({
      name: 'instagramEvents',
      title: 'Instagram Events (Post)',
      type: 'array',
      of: [{ type: 'string' }],
    }),

    // Wetter
    defineField({ name: 'weatherRain', title: 'Regen', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { date: 'date', city: 'city', total: 'totalEvents' },
    prepare({ date, city, total }) {
      return { title: `${city} · ${date}`, subtitle: `${total} Events` }
    },
  },
  orderings: [{
    title: 'Datum (neu → alt)',
    name: 'dateDesc',
    by: [{ field: 'date', direction: 'desc' }],
  }],
})
