// scripts/telegram-bot.ts
// Telegram Bot Webhook — antwortet auf /status mit aktuellem Event-Stand

import { getSanityClient } from '../src/lib/sanity'
import { fetchCityWeather } from './weather'

const TELEGRAM_API = 'https://api.telegram.org'
const GRAPH_BASE = 'https://graph.instagram.com/v21.0'

// API-Ablaufdaten (hardcoded)
const API_EXPIRY = {
  Eventfrog: '01.04.2027',
}

// Nächste Cron-Ausführung berechnen (UTC-Zeit → Schweizer Zeit)
function nextCron(hourUTC: number, minuteUTC: number): string {
  const now = new Date()
  const next = new Date()
  next.setUTCHours(hourUTC, minuteUTC, 0, 0)
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1)
  return next.toLocaleString('de-CH', {
    timeZone: 'Europe/Zurich',
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }) + ' Uhr'
}

function getDate(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  return `${days[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`
}

async function getLastInstagramPost(): Promise<string> {
  const igId = process.env.INSTAGRAM_ACCOUNT_ID
  const token = process.env.META_ACCESS_TOKEN
  if (!igId || !token) return 'nicht konfiguriert'

  try {
    const res = await fetch(`${GRAPH_BASE}/${igId}/media?fields=timestamp&limit=1&access_token=${token}`)
    const data = await res.json() as { data?: { timestamp: string }[] }
    const ts = data?.data?.[0]?.timestamp
    if (!ts) return 'kein Post gefunden'
    const d = new Date(ts)
    return d.toLocaleString('de-CH', {
      timeZone: 'Europe/Zurich',
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }) + ' Uhr'
  } catch {
    return 'Fehler beim Abrufen'
  }
}

async function getStatus(): Promise<string> {
  const client = getSanityClient()
  const dates = [getDate(0), getDate(1), getDate(2)]

  // Alle Daten parallel laden
  const [counts, weather, lastPost] = await Promise.all([
    client.fetch<Record<string, number>>(`{
      'zh_0': count(*[_type=='event' && city=='zuerich'  && date==$d0]),
      'zh_1': count(*[_type=='event' && city=='zuerich'  && date==$d1]),
      'zh_2': count(*[_type=='event' && city=='zuerich'  && date==$d2]),
      'sg_0': count(*[_type=='event' && city=='stgallen' && date==$d0]),
      'sg_1': count(*[_type=='event' && city=='stgallen' && date==$d1]),
      'sg_2': count(*[_type=='event' && city=='stgallen' && date==$d2]),
      'lz_0': count(*[_type=='event' && city=='luzern'   && date==$d0]),
      'lz_1': count(*[_type=='event' && city=='luzern'   && date==$d1]),
      'lz_2': count(*[_type=='event' && city=='luzern'   && date==$d2]),
      'bs_0': count(*[_type=='event' && city=='basel'    && date==$d0]),
      'bs_1': count(*[_type=='event' && city=='basel'    && date==$d1]),
      'bs_2': count(*[_type=='event' && city=='basel'    && date==$d2])
    }`, { d0: dates[0], d1: dates[1], d2: dates[2] }),
    fetchCityWeather(),
    getLastInstagramPost(),
  ])

  const [d0, d1, d2] = dates.map(formatDate)

  // Warnungen: Städte ohne Events heute
  const warnings: string[] = []
  if (counts.zh_0 === 0) warnings.push('⚠️ Zürich: keine Events heute')
  if (counts.sg_0 === 0) warnings.push('⚠️ St.Gallen: keine Events heute')
  if (counts.lz_0 === 0) warnings.push('⚠️ Luzern: keine Events heute')
  if (counts.bs_0 === 0) warnings.push('⚠️ Basel: keine Events heute')

  // Wetter-Zeile
  const weatherLine = [
    weather.zuerich.isRain  ? '🌧 ZH' : '☀️ ZH',
    weather.stgallen.isRain ? '🌧 SG' : '☀️ SG',
    weather.luzern.isRain   ? '🌧 LZ' : '☀️ LZ',
    weather.basel.isRain    ? '🌧 BS' : '☀️ BS',
  ].join('  ')

  const now = new Date().toLocaleTimeString('de-CH', {
    timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit',
  })

  const lines = [
    `📊 <b>waslauft.in Status</b>`,
    ``,
    `<code>           ${d0}   ${d1}   ${d2}</code>`,
    `<code>Zürich      ${String(counts.zh_0).padStart(2)}      ${String(counts.zh_1).padStart(2)}      ${String(counts.zh_2).padStart(2)}</code>`,
    `<code>St.Gallen   ${String(counts.sg_0).padStart(2)}      ${String(counts.sg_1).padStart(2)}      ${String(counts.sg_2).padStart(2)}</code>`,
    `<code>Luzern      ${String(counts.lz_0).padStart(2)}      ${String(counts.lz_1).padStart(2)}      ${String(counts.lz_2).padStart(2)}</code>`,
    `<code>Basel       ${String(counts.bs_0).padStart(2)}      ${String(counts.bs_1).padStart(2)}      ${String(counts.bs_2).padStart(2)}</code>`,
    ``,
    `🌤 <b>Wetter heute</b>`,
    weatherLine,
    ``,
    `📸 <b>Letzter Instagram-Post</b>`,
    lastPost,
    ``,
    `⏰ <b>Nächste Ausführungen</b>`,
    `<code>Pipeline    ${nextCron(5, 0)}</code>`,
    `<code>Instagram   ${nextCron(5, 45)}</code>`,
    ``,
    `🔑 <b>API-Ablauf</b>`,
    `<code>Eventfrog   ${API_EXPIRY.Eventfrog}</code>`,
    ``,
    ...(warnings.length > 0 ? [...warnings, ``] : []),
    `🕐 ${now} Uhr`,
  ]

  return lines.join('\n')
}

async function sendMessage(chatId: string, text: string, token: string) {
  await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

export async function handleTelegramWebhook(body: Record<string, unknown>, token: string) {
  const message = body.message as Record<string, unknown> | undefined
  if (!message) return

  const chatId = String((message.chat as Record<string, unknown>)?.id ?? '')
  const text = (message.text as string ?? '').trim().toLowerCase()

  if (text === '/status' || text === '/start') {
    const status = await getStatus()
    await sendMessage(chatId, status, token)
  }
}
