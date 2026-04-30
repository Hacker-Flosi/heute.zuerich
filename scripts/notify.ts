// scripts/notify.ts — Telegram Notifications für Pipeline Status

const TELEGRAM_API = 'https://api.telegram.org'

export interface CityResult {
  city: string
  counts: number[]   // [heute, morgen, übermorgen]
  skipped: boolean[] // [heute, morgen, übermorgen]
  errors: string[]
}

export interface PipelineReport {
  cityResults: CityResult[]
  instagramPosted: boolean
  instagramError?: string
  durationSeconds: number
  errors: string[]
}

function cityLabel(slug: string): string {
  return { zuerich: 'Zürich', stgallen: 'St.Gallen', luzern: 'Luzern', winterthur: 'Winterthur', basel: 'Basel' }[slug] ?? slug
}

function buildMessage(report: PipelineReport, date: string): string {
  const hasErrors = report.errors.length > 0 || report.cityResults.some((c) => c.errors.length > 0)
  const allEmpty = report.cityResults.every((c) => c.counts.every((n) => n === 0))

  const statusIcon = hasErrors || allEmpty ? '❌' : '✅'
  const lines: string[] = [`${statusIcon} waslauft.in — ${date}`, '']

  for (const city of report.cityResults) {
    const label = cityLabel(city.city)
    const [heute, morgen, dayafter] = city.counts
    const [s0, s1, s2] = city.skipped

    if (city.errors.length > 0) {
      lines.push(`⚠️ ${label}`)
      for (const err of city.errors) lines.push(`   ${err}`)
    } else {
      const todayStr = s0 ? `heute: –` : `heute: ${heute}`
      const morgenStr = s1 ? `morgen: –` : `morgen: ${morgen}`
      const dayafterStr = s2 ? `übermorgen: –` : `übermorgen: ${dayafter}`
      lines.push(`${label}   ${todayStr} | ${morgenStr} | ${dayafterStr}`)
    }
  }

  lines.push('')

  if (report.instagramPosted) {
    lines.push('📸 Instagram gepostet ✓')
  } else if (report.instagramError) {
    lines.push(`📸 Instagram fehlgeschlagen: ${report.instagramError}`)
  } else {
    lines.push('📸 Instagram folgt um 11:00 Uhr')
  }

  if (report.errors.length > 0) {
    lines.push('')
    lines.push('Fehler:')
    for (const err of report.errors) lines.push(`  • ${err}`)
  }

  lines.push(`\n⏱ ${report.durationSeconds.toFixed(1)}s`)

  return lines.join('\n')
}

export interface FeaturedEventAlert {
  name: string
  city: string
  dateFrom: string
  dateTo: string
  daysUntilStart: number
  active: boolean
}

export async function sendFeaturedEventReminders(alerts: FeaturedEventAlert[]): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId || alerts.length === 0) return

  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  function fmtDate(d: string) {
    const dt = new Date(d + 'T12:00:00')
    return `${dt.getDate()}. ${months[dt.getMonth()]}`
  }

  const lines: string[] = ['📅 <b>Featured Events — Reminder</b>', '']
  for (const a of alerts) {
    const dateRange = a.dateFrom === a.dateTo
      ? fmtDate(a.dateFrom)
      : `${fmtDate(a.dateFrom)} – ${fmtDate(a.dateTo)}`
    const when = a.daysUntilStart === 0 ? 'startet heute'
      : a.daysUntilStart === 1 ? 'startet morgen'
      : `startet in ${a.daysUntilStart} Tagen`
    if (!a.active) {
      lines.push(`⚠️ <b>INAKTIV</b> — ${when}: <b>${a.name}</b> (${a.city}, ${dateRange})`)
      lines.push(`   → Bitte Datum prüfen &amp; in Sanity aktivieren`)
    } else {
      lines.push(`🔔 ${when}: <b>${a.name}</b> (${a.city}, ${dateRange})`)
    }
  }

  const text = lines.join('\n')
  try {
    await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
    console.log(`  [Telegram] Featured Event Reminders gesendet (${alerts.length})`)
  } catch (err) {
    console.error('  [Telegram] Fehler beim Senden der Reminders:', err)
  }
}

export async function sendCrashAlert(context: string, err: unknown): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const msg = err instanceof Error ? err.message : String(err)
  const text = `🔴 <b>waslauft.in — Fataler Fehler</b>\n\n<b>${context}</b>\n<code>${msg}</code>`

  try {
    await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
  } catch { /* noop — nichts mehr zu tun */ }
}

export async function sendTelegramNotification(report: PipelineReport): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    console.log('  [Telegram] TELEGRAM_BOT_TOKEN oder TELEGRAM_CHAT_ID nicht gesetzt — übersprungen')
    return
  }

  const today = new Date().toLocaleDateString('de-CH', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Zurich',
  })

  const text = buildMessage(report, today)

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
    const json = await res.json() as { ok: boolean; description?: string }
    if (!json.ok) throw new Error(json.description ?? 'Unbekannter Fehler')
    console.log('  [Telegram] Nachricht gesendet ✓')
  } catch (err) {
    console.error('  [Telegram] Fehler beim Senden:', err)
  }
}
