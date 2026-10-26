// src/app/api/cron/pipeline/route.ts
// Vercel Cron Endpoint — Backup-Trigger für den GitHub-Actions-Workflow.
// pipeline.yml hat einen eigenen nativen `schedule`-Trigger (05:00 UTC) und läuft
// damit primär unabhängig von Vercel. Dieser Endpunkt läuft absichtlich später
// (05:40 UTC, siehe vercel.json) und löst nur aus, falls der native Trigger aus
// irgendeinem Grund heute noch nicht gefeuert hat — sonst würde die Pipeline
// (und die Eventfrog-API) doppelt belastet.

import { NextRequest, NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanity'
import { CITY_CONFIG, getDateString } from '@/lib/constants'
import { sendWarning } from '../../../../../scripts/notify'

export const maxDuration = 30

const REPO = 'Hacker-Flosi/heute.zuerich'
const TOKEN_WARN_DAYS = 14

// GitHub deaktiviert geplante Workflows nach 60 Tagen ohne Commit (so am 24.10.2026
// passiert). Darum hier täglich wieder aktivieren — idempotent, kostet nichts.
async function ensureWorkflowEnabled(token: string): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/pipeline.yml/enable`,
    {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' },
    }
  )
  if (!res.ok) return `GitHub-Workflow konnte nicht aktiviert werden (HTTP ${res.status})`

  const expiry = res.headers.get('github-authentication-token-expiration')
  if (expiry) {
    const daysLeft = Math.floor((new Date(expiry).getTime() - Date.now()) / 86_400_000)
    if (daysLeft <= TOKEN_WARN_DAYS) return `GITHUB_TOKEN läuft in ${daysLeft} Tagen ab (${expiry}) — in Vercel erneuern`
  }
  return null
}

// Morgen-Events schreibt der gestrige Run (als "Übermorgen") — fehlen sie, ist gestern etwas schiefgelaufen
async function findCitiesWithoutTomorrow(): Promise<string[]> {
  const client = getSanityWriteClient()
  const date = getDateString(1)
  const counts = await Promise.all(
    CITY_CONFIG.map((c) =>
      client.fetch<number>(`count(*[_type == "event" && city == $city && date == $date])`, { city: c.slug, date })
    )
  )
  return CITY_CONFIG.filter((_, i) => counts[i] === 0).map((c) => `${c.label}: keine Events für morgen (${date})`)
}

async function hasRunToday(token: string): Promise<boolean> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/pipeline.yml/runs?per_page=5`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
      },
    }
  )
  if (!res.ok) {
    // Bei Unsicherheit lieber auslösen als eine ausgefallene Pipeline riskieren
    console.error(`[Trigger] Konnte Run-Historie nicht laden (${res.status}) — löse sicherheitshalber aus`)
    return false
  }
  const data = await res.json()
  const todayUtc = new Date().toISOString().split('T')[0]
  return (data.workflow_runs ?? []).some((run: { created_at: string }) =>
    run.created_at.startsWith(todayUtc)
  )
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'GITHUB_TOKEN nicht gesetzt' }, { status: 500 })
  }

  // Watchdog: Probleme melden, bevor sie auf der Seite auffallen
  const problems: string[] = []
  try {
    const workflowProblem = await ensureWorkflowEnabled(token)
    if (workflowProblem) problems.push(workflowProblem)
    problems.push(...await findCitiesWithoutTomorrow())
  } catch (err) {
    problems.push(`Watchdog-Check fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`)
  }
  await sendWarning('Watchdog', problems)

  if (await hasRunToday(token)) {
    console.log('[Trigger] Pipeline ist heute bereits gelaufen (nativer Schedule) — überspringe Backup-Trigger')
    return NextResponse.json({ success: true, skipped: true, timestamp: new Date().toISOString() })
  }

  const response = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/pipeline.yml/dispatches`,
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

  console.log('[Trigger] Nativer Schedule ist heute nicht gelaufen — Backup-Trigger hat GitHub Actions gestartet')
  return NextResponse.json({ success: true, skipped: false, timestamp: new Date().toISOString() })
}
