// src/app/api/cron/instagram/route.ts
// Vercel Cron Endpoint — postet täglich den Instagram Karussell-Post
// Konfiguriert in vercel.json (täglich 09:00 UTC = 11:00 Schweizer Zeit)

import { NextRequest, NextResponse } from 'next/server'
import { postInstagram } from '../../../../../scripts/post-instagram'
import { sendCrashAlert } from '../../../../../scripts/notify'

export const maxDuration = 300

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Instagram Post via Cron gestartet...')
    await postInstagram()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Instagram Post erfolgreich publiziert',
    })
  } catch (error) {
    console.error('Instagram Cron error:', error)
    await sendCrashAlert('Instagram Cron', error)

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
