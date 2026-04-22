// sanity/schemas/venue.ts
// Venue-Schema für waslauft.in — verwaltet die kuratierte Venue-Liste pro Stadt

import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'venue',
  title: 'Venue',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Anzeige-Name',
      type: 'string',
      description: 'Kurzer Display-Name (z.B. "Kaufleuten")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'eventfrogName',
      title: 'Eventfrog Suchbegriff',
      type: 'string',
      description: 'Vollständiger Name wie er auf Eventfrog steht (z.B. "Kaufleuten Zürich Event Location GmbH")',
    }),
    defineField({
      name: 'eventfrogId',
      title: 'Eventfrog Location ID',
      type: 'string',
      description: 'Optionale Eventfrog Location-ID für direkte Abfrage',
    }),
    defineField({
      name: 'city',
      title: 'Stadt',
      type: 'string',
      description: 'Stadt-Slug (z.B. "zuerich")',
      options: {
        list: [
          { title: 'Zürich', value: 'zuerich' },
          { title: 'Basel', value: 'basel' },
          { title: 'Bern', value: 'bern' },
          { title: 'Luzern', value: 'luzern' },
          { title: 'St.Gallen', value: 'stgallen' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tier',
      title: 'Tier',
      type: 'string',
      description: 'S = fast immer, A = bevorzugt, B = bei gutem Event, C = nur aussergewöhnlich',
      options: {
        list: [
          { title: 'S — Big Players', value: 'S' },
          { title: 'A — High Priority', value: 'A' },
          { title: 'B — Standard', value: 'B' },
          { title: 'C — Hidden Gems', value: 'C' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Kategorie',
      type: 'string',
      options: {
        list: [
          { title: 'Electronic / Techno / House', value: 'electronic' },
          { title: 'Alternative / Rock / Underground', value: 'alternative' },
          { title: 'Mainstream / Hip-Hop / Charts', value: 'mainstream' },
          { title: 'Kultur / Theater / Konzerte', value: 'kultur' },
          { title: 'Bar mit Dancefloor', value: 'bar' },
          { title: 'Special (Outdoor, Pop-up etc.)', value: 'special' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'active',
      title: 'Aktiv',
      type: 'boolean',
      description: 'Deaktivieren um Venue temporär auszublenden',
      initialValue: true,
    }),
    defineField({
      name: 'summerBonus',
      title: 'Sommer-Bonus',
      type: 'boolean',
      description: 'Erhält Mai–September höhere Priorität (Outdoor/Garten-Venues)',
      initialValue: false,
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
      description: 'Offizielle Venue-Website (für Event-Links)',
    }),
    defineField({
      name: 'scrapeSources',
      title: 'Scrape Sources',
      type: 'array',
      description: 'Von wo Events für diese Location gescrapt werden (venue-zentrisches System)',
      of: [
        {
          type: 'object',
          name: 'scrapeSource',
          fields: [
            defineField({
              name: 'type',
              title: 'Source-Typ',
              type: 'string',
              options: {
                list: [
                  { title: 'Website (Event-Listing)', value: 'website' },
                  { title: 'Resident Advisor',        value: 'ra' },
                  { title: 'Eventfrog',               value: 'eventfrog' },
                  { title: 'Ticketmaster',            value: 'ticketmaster' },
                  { title: 'Ticket Plus',             value: 'ticketplus' },
                  { title: 'Instagram',               value: 'instagram' },
                  { title: 'Facebook Events',         value: 'facebook' },
                  { title: 'Bandsintown',             value: 'bandsintown' },
                ],
                layout: 'dropdown',
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL / Handle / ID',
              type: 'string',
              description: 'Vollständige URL für Website/RA, @handle für Instagram, ID für Eventfrog',
            }),
            defineField({
              name: 'priority',
              title: 'Priorität',
              type: 'number',
              description: '1 = höchste (Venue-Website), 2 = RA, 3 = Ticketing, 5 = Aggregatoren',
              initialValue: 2,
            }),
            defineField({
              name: 'active',
              title: 'Aktiv',
              type: 'boolean',
              initialValue: true,
            }),
            defineField({
              name: 'notes',
              title: 'Notizen',
              type: 'string',
              description: 'Intern, z.B. "Nur Club-Events, keine Privatbuchungen"',
            }),
          ],
          preview: {
            select: { title: 'type', subtitle: 'url', active: 'active' },
            prepare({ title, subtitle, active }: Record<string, any>) {
              return {
                title: `${active ? '' : '⏸ '}${title ?? '—'}`,
                subtitle: subtitle ?? '—',
              }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      tier: 'tier',
      city: 'city',
      category: 'category',
      active: 'active',
    },
    prepare({ title, tier, city, category, active }) {
      return {
        title: `${active ? '' : '⏸ '}[${tier}] ${title}`,
        subtitle: `${city} · ${category}`,
      }
    },
  },
  orderings: [
    {
      title: 'Tier + Name',
      name: 'tierName',
      by: [
        { field: 'tier', direction: 'asc' },
        { field: 'name', direction: 'asc' },
      ],
    },
  ],
})
