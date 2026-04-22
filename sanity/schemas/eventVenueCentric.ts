// sanity/schemas/eventVenueCentric.ts
// Event-Schema für das venue-zentrische System (parallel zu "event", nicht gemischt)

import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'eventVenueCentric',
  title: 'Event (Venue-Centric)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'venue',
      title: 'Venue',
      type: 'reference',
      to: [{ type: 'venue' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'city',
      title: 'Stadt',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startDate',
      title: 'Datum',
      type: 'string',
      description: 'YYYY-MM-DD',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startTime',
      title: 'Uhrzeit',
      type: 'string',
      description: 'HH:MM',
    }),
    defineField({
      name: 'endDate',
      title: 'End-Datum',
      type: 'string',
      description: 'YYYY-MM-DD (falls mehrtägig)',
    }),
    defineField({
      name: 'description',
      title: 'Beschreibung',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'imageUrl',
      title: 'Bild-URL',
      type: 'url',
    }),
    defineField({
      name: 'ticketUrl',
      title: 'Ticket-URL',
      type: 'url',
    }),
    defineField({
      name: 'eventUrl',
      title: 'Event-URL',
      type: 'url',
    }),
    defineField({
      name: 'price',
      title: 'Preis',
      type: 'string',
    }),
    defineField({
      name: 'sourceType',
      title: 'Source-Typ',
      type: 'string',
      options: {
        list: [
          { title: 'Website', value: 'website' },
          { title: 'Resident Advisor', value: 'ra' },
          { title: 'Eventfrog', value: 'eventfrog' },
          { title: 'Ticketmaster', value: 'ticketmaster' },
          { title: 'Instagram', value: 'instagram' },
          { title: 'Facebook', value: 'facebook' },
          { title: 'Bandsintown', value: 'bandsintown' },
        ],
      },
    }),
    defineField({
      name: 'sourceUrl',
      title: 'Source-URL',
      type: 'url',
    }),
    defineField({
      name: 'sourcePriority',
      title: 'Source-Priorität',
      type: 'number',
    }),
    defineField({
      name: 'rawId',
      title: 'Raw ID (Source)',
      type: 'string',
      description: 'ID aus der Source-Plattform (z.B. RA Event-ID)',
    }),
    defineField({
      name: 'isDuplicate',
      title: 'Duplikat',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'mergedFrom',
      title: 'Zusammengeführt aus',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'IDs von Duplikaten die in diesen Eintrag gemergt wurden',
    }),
    defineField({
      name: 'scrapedAt',
      title: 'Gescrapt am',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title:  'title',
      date:   'startDate',
      source: 'sourceType',
      isDup:  'isDuplicate',
      venue:  'venue.name',
    },
    prepare({ title, date, source, isDup, venue }) {
      return {
        title:    `${isDup ? '⚠️ ' : ''}${title ?? '—'}`,
        subtitle: `${date ?? '?'} · ${venue ?? '?'} · ${source ?? '?'}`,
      }
    },
  },
  orderings: [
    {
      title: 'Datum aufsteigend',
      name: 'dateAsc',
      by: [{ field: 'startDate', direction: 'asc' }],
    },
  ],
})
