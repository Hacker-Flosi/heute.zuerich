// src/app/api/cron/pipeline/route.ts
// Vercel Cron Endpoint — triggert GitHub Actions Workflow via API
// Konfiguriert in vercel.json als Cron Job (täglich 05:00 UTC)

import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'GITHUB_TOKEN nicht gesetzt' }, { status: 500 })
  }

  const response = await fetch(
    'https://api.github.com/repos/Hacker-Flosi/heute.zuerich/actions/workflows/pipeline.yml/dispatches',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    }
  )

  if (!response.ok) {
    const text = await response.text()
    console.error(`[Trigger] GitHub API Fehler ${response.status}: ${text}`)
    return NextResponse.json({ error: `GitHub API: ${response.status}` }, { status: 500 })
  }

  console.log('[Trigger] GitHub Actions Workflow erfolgreich gestartet')
  return NextResponse.json({ success: true, timestamp: new Date().toISOString() })
}
