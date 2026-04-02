// sanity/schemas/event.ts
// Schema für heute.zürich Events
// Dieses Schema definiert die Struktur jedes Events in Sanity

import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Event Name',
      type: 'string',
      description: 'Bereinigter, prägnanter Event-Name',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'rawName',
      title: 'Original Name',
      type: 'string',
      description: 'Unbereinigter Name aus der Quelle',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'Venue-Name (kurz, z.B. "Kaufleuten" statt "Kaufleuten Zürich Event GmbH")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Datum',
      type: 'date',
      description: 'Event-Datum (YYYY-MM-DD)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'time',
      title: 'Uhrzeit',
      type: 'string',
      description: 'Startzeit im Format HH:MM',
      validation: (Rule) => Rule.required().regex(/^\d{2}:\d{2}$/, {
        name: 'time format',
        invert: false,
      }),
    }),
    defineField({
      name: 'url',
      title: 'Externer Link',
      type: 'url',
      description: 'Link zum Veranstalter oder Ticketing',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'source',
      title: 'Quelle',
      type: 'string',
      description: 'Scraping-Quelle',
      options: {
        list: [
          { title: 'Eventfrog', value: 'eventfrog' },
          { title: 'hellozurich', value: 'hellozurich' },
          { title: 'kulturzueri', value: 'kulturzueri' },
          { title: 'Stadt Zürich', value: 'stadt-zuerich' },
          { title: 'Guidle', value: 'guidle' },
          { title: 'Manuell', value: 'manual' },
        ],
      },
    }),
    defineField({
      name: 'curated',
      title: 'Kuratiert',
      type: 'boolean',
      description: 'Von AI als relevant ausgewählt',
      initialValue: false,
    }),
    defineField({
      name: 'curatedReason',
      title: 'Kuratierungs-Begründung',
      type: 'string',
      description: 'AI-Begründung warum dieser Event ausgewählt wurde',
    }),
    defineField({
      name: 'sponsored',
      title: 'Gesponsert',
      type: 'boolean',
      description: 'Ist dies ein gesponserter Eintrag?',
      initialValue: false,
    }),
    defineField({
      name: 'colorIndex',
      title: 'Farb-Index',
      type: 'number',
      description: 'Index für die Farbrotation (0-11)',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'location',
      date: 'date',
      time: 'time',
      curated: 'curated',
    },
    prepare({ title, subtitle, date, time, curated }) {
      return {
        title: `${curated ? '✅ ' : ''}${title}`,
        subtitle: `${subtitle} · ${time} · ${date}`,
      }
    },
  },
  orderings: [
    {
      title: 'Datum + Uhrzeit',
      name: 'dateTimeAsc',
      by: [
        { field: 'date', direction: 'asc' },
        { field: 'time', direction: 'asc' },
      ],
    },
  ],
})
