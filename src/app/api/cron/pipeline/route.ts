// src/app/api/cron/pipeline/route.ts
// Vercel Cron Endpoint — triggert die tägliche Pipeline
// Konfiguriert in vercel.json als Cron Job (täglich 05:00 UTC)

import { NextRequest, NextResponse } from 'next/server'
import { runPipeline } from '../../../../../scripts/pipeline'

// Vercel Cron sendet einen Authorization-Header mit CRON_SECRET
export async function GET(request: NextRequest) {
  // Sicherheits-Check: Nur Vercel Cron darf diesen Endpoint aufrufen
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Pipeline via Cron gestartet...')
    await runPipeline()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Pipeline erfolgreich durchgelaufen',
    })
  } catch (error) {
    console.error('Pipeline Cron error:', error)

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
