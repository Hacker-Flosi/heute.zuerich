// src/lib/features.ts
// Feature flags — set in .env.local only, NOT in Vercel production env

export const FEATURE_BADWEATHER = process.env.NEXT_PUBLIC_FEATURE_BADWEATHER === 'true'
