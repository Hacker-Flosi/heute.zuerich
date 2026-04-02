// src/lib/sanity.ts
// Sanity Client Konfiguration für heute.zürich

import { createClient } from '@sanity/client'

function makeClient(useCdn: boolean, token?: string) {
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2026-03-31',
    useCdn,
    ...(token ? { token } : {}),
  })
}

// Read client — factory so env vars are read at call time, not module load time.
// Next.js injects env vars before any module runs, so this is always safe there.
// Scripts that use dotenv must call dotenv.config() before calling getSanityClient().
export function getSanityClient() {
  return makeClient(true)
}

// Write client factory
export function getSanityWriteClient() {
  return makeClient(false, process.env.SANITY_API_TOKEN)
}

// Convenience export for Next.js pages (env vars already set at module load time)
export const sanityClient = makeClient(true)
