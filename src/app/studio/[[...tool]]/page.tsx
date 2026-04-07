'use client'

// src/app/studio/[[...tool]]/page.tsx
// Embedded Sanity Studio at /studio

import dynamic from 'next/dynamic'

const Studio = dynamic(() => import('./Studio'), { ssr: false })

export default function StudioPage() {
  return <Studio />
}
