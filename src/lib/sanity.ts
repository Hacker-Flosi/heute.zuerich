// src/lib/sanity.ts
// Sanity Client Konfiguration für heute.zürich

import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-03-31',
  useCdn: true,
})

// Write client factory — call after env vars are loaded (scripts use dotenv, Next.js handles it natively)
export function getSanityWriteClient() {
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2026-03-31',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
  })
}
