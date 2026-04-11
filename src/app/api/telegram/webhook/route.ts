// src/app/api/telegram/webhook/route.ts
// Telegram Bot Webhook — empfängt Updates und antwortet auf /status

import { NextRequest, NextResponse } from 'next/server'
import { handleTelegramWebhook } from '../../../../../scripts/telegram-bot'

export async function POST(request: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  // Only respond to messages from your own chat
  const body = await request.json() as Record<string, unknown>
  const message = body.message as Record<string, unknown> | undefined
  const incomingChatId = String((message?.chat as Record<string, unknown>)?.id ?? '')

  if (incomingChatId !== chatId) {
    return NextResponse.json({ ok: true }) // ignore strangers
  }

  await handleTelegramWebhook(body, token)
  return NextResponse.json({ ok: true })
}
