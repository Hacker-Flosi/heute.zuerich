// src/app/api/ig-image/[filename]/route.ts
// Proxy endpoint: liefert Instagram-Bilder von Vercel Blob über waslauft.in aus.
// URL-Format: /api/ig-image/feed-2026-04-18-1-xxxxx.png
// Meta Graph API kann blob.vercel-storage.com nicht zuverlässig fetchen —
// dieser Endpoint gibt Meta eine saubere URL auf unserer eigenen Domain.

import { NextRequest } from 'next/server'

// Store ID aus BLOB_READ_WRITE_TOKEN extrahieren:
// Format: vercel_blob_rw_<storeId>_<random>
function getBlobBaseUrl(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN ?? ''
  const storeId = token.split('_')[3]
  if (!storeId) throw new Error('BLOB_READ_WRITE_TOKEN nicht gesetzt oder ungültig')
  return `https://${storeId}.public.blob.vercel-storage.com`
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  if (!filename || !filename.endsWith('.png')) {
    return new Response('Not found', { status: 404 })
  }

  const blobUrl = `${getBlobBaseUrl()}/instagram/${filename}`
  const res = await fetch(blobUrl)
  if (!res.ok) return new Response('Upstream error', { status: 502 })

  const buf = await res.arrayBuffer()
  return new Response(buf, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
