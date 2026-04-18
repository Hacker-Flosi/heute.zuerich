// src/app/api/ig-image/route.ts
// Proxy endpoint: liefert Instagram-Bilder von Vercel Blob über waslauft.in aus.
// Meta Graph API kann blob.vercel-storage.com nicht zuverlässig fetchen —
// dieser Endpoint gibt Meta eine stabile URL auf unserer eigenen Domain.

import { NextRequest } from 'next/server'

const ALLOWED_HOST = 'blob.vercel-storage.com'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url || !url.includes(ALLOWED_HOST)) {
    return new Response('Not found', { status: 404 })
  }

  const res = await fetch(url)
  if (!res.ok) return new Response('Upstream error', { status: 502 })

  const buf = await res.arrayBuffer()
  return new Response(buf, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
