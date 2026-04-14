// sanity/schemas/pipelineSnapshot.ts
// Täglich gespeicherter Snapshot pro Stadt — für Langzeit-Statistiken

import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'pipelineSnapshot',
  title: 'Pipeline Snapshot',
  type: 'document',
  fields: [
    defineField({ name: 'date', title: 'Datum', type: 'date', validation: (R) => R.required() }),
    defineField({ name: 'city', title: 'Stadt', type: 'string', validation: (R) => R.required() }),

    // ── Mengen
    defineField({ name: 'totalEvents',  title: 'Gesamt Events (final)', type: 'number' }),
    defineField({ name: 'layer1Events', title: 'Layer 1 Events',        type: 'number' }),
    defineField({ name: 'layer2Events', title: 'Layer 2 Events',        type: 'number' }),

    // ── Scraper-Gesundheit
    defineField({
      name: 'scraperHealth',
      title: 'Scraper-Gesundheit',
      type: 'object',
      fields: [
        defineField({ name: 'rawTotal',       type: 'number', title: 'Total roh (vor Filter)' }),
        defineField({ name: 'geoExcluded',    type: 'number', title: 'Geo-Filter ausgeschlossen' }),
        defineField({ name: 'duplicatesRemoved', type: 'number', title: 'Duplikate entfernt' }),
        defineField({ name: 'scraperErrors',  type: 'number', title: 'Scraper-Fehler' }),
      ],
    }),

    // ── Quellen (Events gefunden pro Scraper)
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

    // ── Kuration-Qualität
    defineField({
      name: 'curationQuality',
      title: 'Kuration-Qualität',
      type: 'object',
      fields: [
        defineField({ name: 'discoveryPoolSize',    type: 'number', title: 'Discovery-Pool Grösse' }),
        defineField({ name: 'discoverySelected',    type: 'number', title: 'Discovery ausgewählt' }),
        defineField({ name: 'discoverySelectionPct', type: 'number', title: 'Discovery-Rate (%)' }),
        defineField({ name: 'rainReserveAdded',     type: 'number', title: 'Rain-Reserve hinzugefügt' }),
        defineField({ name: 'nightlifeCount',       type: 'number', title: 'Nightlife-Events' }),
        defineField({ name: 'nightlifePct',         type: 'number', title: 'Nightlife-Ratio (%)' }),
      ],
    }),

    // ── Zeitverteilung
    defineField({
      name: 'timing',
      title: 'Zeitverteilung',
      type: 'object',
      fields: [
        defineField({ name: 'eveningEvents', type: 'number', title: 'Abend-Events (ab 18:00)' }),
        defineField({ name: 'daytimeEvents', type: 'number', title: 'Tages-Events (vor 18:00)' }),
        defineField({ name: 'allDayEvents',  type: 'number', title: 'Ganztägig (00:00)' }),
      ],
    }),

    // ── Event-Typen
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

    // ── Top Venues
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

    // ── Instagram
    defineField({ name: 'instagramPosted', title: 'Instagram gepostet', type: 'boolean', initialValue: false }),
    defineField({ name: 'instagramEvents', title: 'Instagram Events (Post)', type: 'array', of: [{ type: 'string' }] }),

    // ── Wetter
    defineField({ name: 'weatherRain', title: 'Regen', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { date: 'date', city: 'city', total: 'totalEvents' },
    prepare({ date, city, total }) {
      return { title: `${city} · ${date}`, subtitle: `${total ?? '?'} Events` }
    },
  },
  orderings: [{
    title: 'Datum (neu → alt)',
    name: 'dateDesc',
    by: [{ field: 'date', direction: 'desc' }],
  }],
})
