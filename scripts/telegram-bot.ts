// scripts/telegram-bot.ts
// Telegram Bot Webhook — antwortet auf /status mit aktuellem Event-Stand
// Deployment: als Vercel Function unter /api/telegram/webhook

import { getSanityClient } from '../src/lib/sanity'

const TELEGRAM_API = 'https://api.telegram.org'

function getDate(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  return `${days[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`
}

async function getStatus(): Promise<string> {
  const client = getSanityClient()
  const dates = [getDate(0), getDate(1), getDate(2)]

  const counts = await client.fetch<Record<string, number>>(`{
    'zh_0': count(*[_type=='event' && city=='zuerich' && date==$d0]),
    'zh_1': count(*[_type=='event' && city=='zuerich' && date==$d1]),
    'zh_2': count(*[_type=='event' && city=='zuerich' && date==$d2]),
    'sg_0': count(*[_type=='event' && city=='stgallen' && date==$d0]),
    'sg_1': count(*[_type=='event' && city=='stgallen' && date==$d1]),
    'sg_2': count(*[_type=='event' && city=='stgallen' && date==$d2]),
    'lz_0': count(*[_type=='event' && city=='luzern' && date==$d0]),
    'lz_1': count(*[_type=='event' && city=='luzern' && date==$d1]),
    'lz_2': count(*[_type=='event' && city=='luzern' && date==$d2])
  }`, { d0: dates[0], d1: dates[1], d2: dates[2] })

  const [d0, d1, d2] = dates.map(formatDate)

  const lines = [
    `📊 waslauft.in Status`,
    ``,
    `         ${d0}  ${d1}  ${d2}`,
    `Zürich     ${String(counts.zh_0).padStart(2)}      ${String(counts.zh_1).padStart(2)}      ${String(counts.zh_2).padStart(2)}`,
    `St.Gallen  ${String(counts.sg_0).padStart(2)}      ${String(counts.sg_1).padStart(2)}      ${String(counts.sg_2).padStart(2)}`,
    `Luzern     ${String(counts.lz_0).padStart(2)}      ${String(counts.lz_1).padStart(2)}      ${String(counts.lz_2).padStart(2)}`,
    ``,
    `🕐 ${new Date().toLocaleTimeString('de-CH', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit' })} Uhr`,
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
