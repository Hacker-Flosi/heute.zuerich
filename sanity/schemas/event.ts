// sanity/schemas/event.ts
// Schema für waslauft.in Events

import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    defineField({
      name: 'city',
      title: 'Stadt',
      type: 'string',
      description: 'Stadt-Slug (z.B. "zuerich", "bern", "basel")',
      validation: (Rule) => Rule.required(),
    }),
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
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'Venue-Name (kurz)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Datum',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'time',
      title: 'Uhrzeit',
      type: 'string',
      description: 'HH:MM',
      validation: (Rule) => Rule.required().regex(/^\d{2}:\d{2}$/, {
        name: 'time format',
        invert: false,
      }),
    }),
    defineField({
      name: 'url',
      title: 'Externer Link',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'source',
      title: 'Quelle',
      type: 'string',
      options: {
        list: [
          { title: 'Eventfrog', value: 'eventfrog' },
          { title: 'hellozurich', value: 'hellozurich' },
          { title: 'Manuell', value: 'manual' },
        ],
      },
    }),
    defineField({
      name: 'curated',
      title: 'Kuratiert',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'curatedReason',
      title: 'Kuratierungs-Begründung',
      type: 'string',
    }),
    defineField({
      name: 'sponsored',
      title: 'Gesponsert',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'colorIndex',
      title: 'Farb-Index',
      type: 'number',
      description: '0–11',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'location',
      date: 'date',
      time: 'time',
      curated: 'curated',
      city: 'city',
    },
    prepare({ title, subtitle, date, time, curated, city }) {
      return {
        title: `${curated ? '✅ ' : ''}${title}`,
        subtitle: `${city} · ${subtitle} · ${time} · ${date}`,
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
