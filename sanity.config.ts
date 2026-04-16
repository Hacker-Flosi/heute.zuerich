// sanity.config.ts
// Sanity Studio configuration for waslauft.in

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import venueSchema from './sanity/schemas/venue'
import eventSchema from './sanity/schemas/event'
import siteSettingsSchema from './sanity/schemas/siteSettings'
import pipelineSnapshotSchema from './sanity/schemas/pipelineSnapshot'
import venueStatsSchema from './sanity/schemas/venueStats'
import featuredEventSchema from './sanity/schemas/featuredEvent'

export default defineConfig({
  name: 'waslauft-in',
  title: 'waslauft.in CMS',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Inhalte')
          .items([
            S.listItem()
              .title('Venues — Zürich')
              .child(
                S.documentTypeList('venue')
                  .title('Venues Zürich')
                  .filter('_type == "venue" && city == "zuerich"')
                  .defaultOrdering([
                    { field: 'tier', direction: 'asc' },
                    { field: 'name', direction: 'asc' },
                  ])
              ),
            S.listItem()
              .title('Venues — Luzern')
              .child(
                S.documentTypeList('venue')
                  .title('Venues Luzern')
                  .filter('_type == "venue" && city == "luzern"')
                  .defaultOrdering([
                    { field: 'tier', direction: 'asc' },
                    { field: 'name', direction: 'asc' },
                  ])
              ),
            S.listItem()
              .title('Venues — Basel')
              .child(
                S.documentTypeList('venue')
                  .title('Venues Basel')
                  .filter('_type == "venue" && city == "basel"')
                  .defaultOrdering([
                    { field: 'tier', direction: 'asc' },
                    { field: 'name', direction: 'asc' },
                  ])
              ),
            S.listItem()
              .title('Venues — Bern')
              .child(
                S.documentTypeList('venue')
                  .title('Venues Bern')
                  .filter('_type == "venue" && city == "bern"')
                  .defaultOrdering([
                    { field: 'tier', direction: 'asc' },
                    { field: 'name', direction: 'asc' },
                  ])
              ),
            S.listItem()
              .title('Venues — St. Gallen')
              .child(
                S.documentTypeList('venue')
                  .title('Venues St. Gallen')
                  .filter('_type == "venue" && city == "stgallen"')
                  .defaultOrdering([
                    { field: 'tier', direction: 'asc' },
                    { field: 'name', direction: 'asc' },
                  ])
              ),
            S.divider(),
            S.listItem()
              .title('Events — Zürich')
              .child(
                S.documentTypeList('event')
                  .title('Events Zürich')
                  .filter('_type == "event" && city == "zuerich"')
                  .defaultOrdering([
                    { field: 'date', direction: 'desc' },
                    { field: 'time', direction: 'asc' },
                  ])
              ),
            S.listItem()
              .title('Events — Basel')
              .child(
                S.documentTypeList('event')
                  .title('Events Basel')
                  .filter('_type == "event" && city == "basel"')
                  .defaultOrdering([{ field: 'date', direction: 'desc' }])
              ),
            S.listItem()
              .title('Events — Bern')
              .child(
                S.documentTypeList('event')
                  .title('Events Bern')
                  .filter('_type == "event" && city == "bern"')
                  .defaultOrdering([{ field: 'date', direction: 'desc' }])
              ),
            S.listItem()
              .title('Events — St. Gallen')
              .child(
                S.documentTypeList('event')
                  .title('Events St. Gallen')
                  .filter('_type == "event" && city == "stgallen"')
                  .defaultOrdering([{ field: 'date', direction: 'desc' }])
              ),
            S.listItem()
              .title('Events — Luzern')
              .child(
                S.documentTypeList('event')
                  .title('Events Luzern')
                  .filter('_type == "event" && city == "luzern"')
                  .defaultOrdering([{ field: 'date', direction: 'desc' }])
              ),
            S.divider(),
            S.listItem()
              .title('Featured Events (stadtübergreifend)')
              .child(
                S.documentTypeList('featuredEvent')
                  .title('Featured Events')
                  .defaultOrdering([{ field: 'dateFrom', direction: 'desc' }])
              ),
            S.divider(),
            S.listItem()
              .title('Pipeline Snapshots')
              .child(
                S.documentTypeList('pipelineSnapshot')
                  .title('Pipeline Snapshots')
                  .defaultOrdering([{ field: 'date', direction: 'desc' }])
              ),
            S.listItem()
              .title('Venue Stats')
              .child(
                S.documentTypeList('venueStats')
                  .title('Venue Stats')
                  .defaultOrdering([{ field: 'totalAppearances', direction: 'desc' }])
              ),
            S.divider(),
            S.listItem()
              .title('Site-Einstellungen')
              .child(
                S.document()
                  .schemaType('siteSettings')
                  .documentId('siteSettings')
              ),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: [venueSchema, eventSchema, siteSettingsSchema, pipelineSnapshotSchema, venueStatsSchema, featuredEventSchema],
  },
})
