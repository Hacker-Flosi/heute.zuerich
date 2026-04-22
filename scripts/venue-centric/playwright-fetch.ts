// scripts/venue-centric/playwright-fetch.ts
// Shared Playwright Browser-Instanz für den venue-zentrischen Scraper.
//
// Browser wird einmal pro Orchestrator-Run gestartet und am Ende geschlossen.
// Websites die normales fetch blocken (Cloudflare, JS-Rendering) können so
// trotzdem gescrapt werden.

import { chromium, type Browser, type BrowserContext } from 'playwright-core'

let browser: Browser | null = null
let context: BrowserContext | null = null

// ─── Browser-Lifecycle ────────────────────────────────────────────────────────

export async function startBrowser(): Promise<void> {
  if (browser) return
  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
  context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'de-CH',
    ignoreHTTPSErrors: true,  // selbstsignierte/abgelaufene Certs (Komplex 457, Zukunft, Maag)
    extraHTTPHeaders: {
      'Accept-Language': 'de-CH,de;q=0.9,en;q=0.8',
    },
  })
}

export async function closeBrowser(): Promise<void> {
  if (context) { await context.close(); context = null }
  if (browser) { await browser.close(); browser = null }
}

// ─── Fetch via Playwright ─────────────────────────────────────────────────────

export async function fetchHtmlPlaywright(url: string): Promise<string | null> {
  if (!context) {
    console.log('    [playwright] Browser nicht gestartet — startBrowser() vergessen?')
    return null
  }

  const page = await context.newPage()
  try {
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout:   20_000,
    })

    if (!response || !response.ok()) {
      console.log(`    [playwright] HTTP ${response?.status() ?? '?'} für ${url}`)
      return null
    }

    // Warten bis Netzwerk-Aktivität abgeklungen ist (JS-rendered Sites)
    try {
      await page.waitForLoadState('networkidle', { timeout: 8000 })
    } catch { /* Timeout ok — nehmen was da ist */ }

    return await page.content()
  } catch (err) {
    console.log(`    [playwright] Fehler für ${url}: ${err instanceof Error ? err.message : err}`)
    return null
  } finally {
    await page.close()
  }
}
