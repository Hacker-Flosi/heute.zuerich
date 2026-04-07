// sanity/schemas/siteSettings.ts
// Singleton-Dokument für globale Site-Einstellungen (Logos etc.)

import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site-Einstellungen',
  type: 'document',
  fields: [
    defineField({
      name: 'homeLogo',
      title: 'Logo — Startseite',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'zuerichLogo',
      title: 'Logo — Zürich',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'stgallenLogo',
      title: 'Logo — St. Gallen',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'luzernLogo',
      title: 'Logo — Luzern',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'baselLogo',
      title: 'Logo — Basel',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'bernLogo',
      title: 'Logo — Bern',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Site-Einstellungen' }),
  },
})
