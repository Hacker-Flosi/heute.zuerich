// scripts/generate-static-posts.ts
// Generiert die zwei statischen "Pinned Posts" als PNG-Dateien
// Output: /tmp/waslauft-static-posts/

import satori from 'satori'
import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

const FEED_W = 1080
const FEED_H = 1350

function loadFont(fontPath: string): ArrayBuffer {
  const buf = fs.readFileSync(fontPath)
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

async function render(jsx: object, fontRegular: ArrayBuffer, fontBold: ArrayBuffer): Promise<Buffer> {
  const svg = await satori(jsx as any, {
    width: FEED_W, height: FEED_H,
    fonts: [
      { name: 'JetBrains Mono', data: fontRegular, weight: 400, style: 'normal' },
      { name: 'JetBrains Mono', data: fontBold,    weight: 700, style: 'normal' },
    ],
  })
  return sharp(Buffer.from(svg)).png().toBuffer()
}

function slide(children: object[], bg = '#000000'): object {
  return {
    type: 'div',
    props: {
      style: {
        width: FEED_W, height: FEED_H,
        background: bg,
        display: 'flex',
        flexDirection: 'column',
        padding: '80px',
        position: 'relative',
        fontFamily: 'JetBrains Mono',
      },
      children,
    },
  }
}

function text(content: string, opts: {
  size?: number, weight?: number, color?: string,
  uppercase?: boolean, opacity?: number, lineHeight?: number,
} = {}): object {
  return {
    type: 'div',
    props: {
      style: {
        fontSize: opts.size ?? 48,
        fontWeight: opts.weight ?? 400,
        color: opts.color ?? '#ffffff',
        textTransform: opts.uppercase ? 'uppercase' : 'none',
        opacity: opts.opacity ?? 1,
        lineHeight: opts.lineHeight ?? 1.2,
        letterSpacing: opts.uppercase ? '0.05em' : '0',
      },
      children: content,
    },
  }
}

function divider(color = 'rgba(255,255,255,0.2)'): object {
  return {
    type: 'div',
    props: {
      style: { width: 80, height: 2, background: color, margin: '48px 0' },
      children: '',
    },
  }
}

function spacer(flex = 1): object {
  return { type: 'div', props: { style: { flex }, children: '' } }
}

// ─── Post 1: Was ist das hier? ────────────────────────────────────────────────

async function generatePost1(fontRegular: ArrayBuffer, fontBold: ArrayBuffer): Promise<Buffer> {
  const jsx = slide([
    spacer(),
    text('WAS LÄUFT', { size: 120, weight: 700, uppercase: true }),
    text('HEUTE?', { size: 120, weight: 700, uppercase: true }),
    divider(),
    text('Konzerte, Clubs, Kultur —', { size: 36, weight: 400, lineHeight: 1.5 }),
    text('täglich zusammengestellt', { size: 36, weight: 400, lineHeight: 1.5 }),
    text('für die Deutschschweiz.', { size: 36, weight: 400, lineHeight: 1.5 }),
    spacer(2),
    text('waslauft.in', { size: 28, weight: 400, opacity: 0.5, uppercase: true }),
  ])
  return render(jsx, fontRegular, fontBold)
}

// ─── Post 2: Wie funktioniert's? — 3 Slides ──────────────────────────────────

async function generatePost2Slide1(fontRegular: ArrayBuffer, fontBold: ArrayBuffer): Promise<Buffer> {
  const jsx = slide([
    spacer(),
    text('JEDEN', { size: 100, weight: 700, uppercase: true }),
    text('MORGEN', { size: 100, weight: 700, uppercase: true }),
    text('UM 07:00.', { size: 100, weight: 700, uppercase: true }),
    divider(),
    text('Hunderte Events.', { size: 36, weight: 400, lineHeight: 1.5 }),
    text('Die Deutschschweiz.', { size: 36, weight: 400, lineHeight: 1.5 }),
    text('Eine Liste.', { size: 36, weight: 400, lineHeight: 1.5 }),
    spacer(2),
    text('waslauft.in', { size: 28, weight: 400, opacity: 0.5, uppercase: true }),
  ])
  return render(jsx, fontRegular, fontBold)
}

async function generatePost2Slide2(fontRegular: ArrayBuffer, fontBold: ArrayBuffer): Promise<Buffer> {
  // Fake-Events wie im täglichen Feed
  const events = [
    { venue: 'HIVE',        time: '23:00', name: 'POLYGON LIVE',    color: '#FF0000' },
    { venue: 'KAUFLEUTEN',  time: '20:00', name: 'NINA CHUBA',       color: '#FFB800' },
    { venue: 'VOLKSHAUS',   time: '20:30', name: 'BALTHAZAR',        color: '#00E5FF' },
    { venue: 'ZUKUNFT',     time: '22:00', name: 'RADIO SLAVE',      color: '#FF00FF' },
    { venue: 'ROTE FABRIK', time: '19:00', name: 'OPEN AIR KINO',    color: '#00E05A' },
  ]

  const rows = events.map((e, i) => ({
    type: 'div',
    props: {
      style: {
        flex: 1,
        background: e.color,
        borderBottom: i < events.length - 1 ? '1px solid #000' : 'none',
        padding: '0 60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 8,
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', justifyContent: 'space-between' },
            children: [
              { type: 'div', props: { style: { fontSize: 20, fontWeight: 400, fontFamily: 'JetBrains Mono', color: '#000', textTransform: 'uppercase', letterSpacing: '0.05em' }, children: e.venue } },
              { type: 'div', props: { style: { fontSize: 20, fontWeight: 400, fontFamily: 'JetBrains Mono', color: '#000', letterSpacing: '0.05em' }, children: e.time } },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: { fontSize: 44, fontWeight: 700, fontFamily: 'JetBrains Mono', color: '#000', textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.1 },
            children: e.name,
          },
        },
      ],
    },
  }))

  const jsx = {
    type: 'div',
    props: {
      style: { width: FEED_W, height: FEED_H, display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono', background: '#000' },
      children: rows,
    },
  }
  return render(jsx, fontRegular, fontBold)
}

async function generatePost2Slide3(fontRegular: ArrayBuffer, fontBold: ArrayBuffer): Promise<Buffer> {
  const jsx = slide([
    spacer(),
    text('UM 09:00', { size: 100, weight: 700, uppercase: true }),
    text('SIEHST DU', { size: 100, weight: 700, uppercase: true }),
    text('SIE HIER.', { size: 100, weight: 700, uppercase: true }),
    divider(),
    text('Folg uns damit du', { size: 36, weight: 400, lineHeight: 1.5 }),
    text('nichts verpasst.', { size: 36, weight: 400, lineHeight: 1.5 }),
    spacer(2),
    text('waslauft.in', { size: 28, weight: 400, opacity: 0.5, uppercase: true }),
  ])
  return render(jsx, fontRegular, fontBold)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const NAVY = '#0D1A2D'
const NAVY_FG = '#ffffff'
const NAVY_BORDER = '#1E3A58'

async function generateRainEventSlide(fontRegular: ArrayBuffer, fontBold: ArrayBuffer): Promise<Buffer> {
  const events = [
    { venue: 'DYNAMO',     time: '18:00', name: 'TÖPFERKURS FÜR ERWACHSENE' },
    { venue: 'KAUFLEUTEN', time: '20:00', name: 'BILDERBUCH' },
    { venue: 'NEUBAD',     time: '19:30', name: 'FILMNACHT: PARIS TEXAS' },
  ]

  const drops = [
    [0.05,0.02],[0.12,0.15],[0.22,0.05],[0.35,0.20],[0.48,0.08],[0.60,0.25],[0.72,0.03],[0.85,0.18],[0.93,0.10],
    [0.08,0.35],[0.18,0.42],[0.30,0.30],[0.42,0.48],[0.55,0.38],[0.68,0.45],[0.78,0.32],[0.90,0.50],
    [0.03,0.62],[0.15,0.70],[0.27,0.58],[0.40,0.75],[0.52,0.65],[0.65,0.72],[0.75,0.60],[0.88,0.78],
    [0.10,0.88],[0.23,0.82],[0.38,0.92],[0.50,0.85],[0.62,0.90],[0.80,0.83],[0.95,0.88],
  ].map(([xr, yr]) => ({
    type: 'div',
    props: {
      style: { position: 'absolute', left: Math.round(xr * FEED_W), top: Math.round(yr * FEED_H), width: 2, height: 40, background: 'rgba(255,255,255,0.07)', borderRadius: 2, transform: 'rotate(15deg)' },
      children: '',
    },
  }))

  const rows = events.map((e, i) => ({
    type: 'div',
    props: {
      style: {
        flex: 1,
        background: NAVY,
        borderBottom: i < events.length - 1 ? `1px solid ${NAVY_BORDER}` : 'none',
        padding: '0 60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 10,
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', justifyContent: 'space-between' },
            children: [
              { type: 'div', props: { style: { fontSize: 22, fontWeight: 400, fontFamily: 'JetBrains Mono', color: NAVY_FG, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }, children: e.venue } },
              { type: 'div', props: { style: { fontSize: 22, fontWeight: 400, fontFamily: 'JetBrains Mono', color: NAVY_FG, opacity: 0.6 }, children: e.time } },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: { fontSize: 44, fontWeight: 700, fontFamily: 'JetBrains Mono', color: NAVY_FG, textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.1 },
            children: e.name,
          },
        },
      ],
    },
  }))

  const jsx = {
    type: 'div',
    props: {
      style: { width: FEED_W, height: FEED_H, background: NAVY, position: 'relative', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono' },
      children: [...drops, ...rows],
    },
  }
  return render(jsx, fontRegular, fontBold)
}

async function generateRainBackground(fontRegular: ArrayBuffer): Promise<Buffer> {
  const drops = [
    [0.05,0.02],[0.12,0.15],[0.22,0.05],[0.35,0.20],[0.48,0.08],[0.60,0.25],[0.72,0.03],[0.85,0.18],[0.93,0.10],
    [0.08,0.35],[0.18,0.42],[0.30,0.30],[0.42,0.48],[0.55,0.38],[0.68,0.45],[0.78,0.32],[0.90,0.50],
    [0.03,0.62],[0.15,0.70],[0.27,0.58],[0.40,0.75],[0.52,0.65],[0.65,0.72],[0.75,0.60],[0.88,0.78],
    [0.10,0.88],[0.23,0.82],[0.38,0.92],[0.50,0.85],[0.62,0.90],[0.80,0.83],[0.95,0.88],
  ].map(([xr, yr]) => ({
    type: 'div',
    props: {
      style: { position: 'absolute', left: Math.round(xr * FEED_W), top: Math.round(yr * FEED_H), width: 2, height: 40, background: 'rgba(255,255,255,0.07)', borderRadius: 2, transform: 'rotate(15deg)' },
      children: '',
    },
  }))

  const jsx = {
    type: 'div',
    props: {
      style: { width: FEED_W, height: FEED_H, background: NAVY, position: 'relative', display: 'flex' },
      children: drops,
    },
  }
  const svg = await satori(jsx as any, {
    width: FEED_W, height: FEED_H,
    fonts: [{ name: 'JetBrains Mono', data: fontRegular, weight: 400, style: 'normal' }],
  })
  return sharp(Buffer.from(svg)).png().toBuffer()
}

async function main() {
  const outDir = '/tmp/waslauft-static-posts'
  fs.mkdirSync(outDir, { recursive: true })

  const fontsDir = path.join(process.cwd(), 'public', 'fonts')
  const fontRegular = loadFont(path.join(fontsDir, 'JetBrainsMono-Regular.ttf'))
  const fontBold    = loadFont(path.join(fontsDir, 'JetBrainsMono-Bold.ttf'))

  console.log('Generiere Post 1...')
  fs.writeFileSync(path.join(outDir, 'post1-was-ist-das.png'), await generatePost1(fontRegular, fontBold))

  console.log('Generiere Post 2 — Slide 1...')
  fs.writeFileSync(path.join(outDir, 'post2-slide1-jeden-morgen.png'), await generatePost2Slide1(fontRegular, fontBold))

  console.log('Generiere Post 2 — Slide 2 (Feed-Preview)...')
  fs.writeFileSync(path.join(outDir, 'post2-slide2-feed-preview.png'), await generatePost2Slide2(fontRegular, fontBold))

  console.log('Generiere Post 2 — Slide 3...')
  fs.writeFileSync(path.join(outDir, 'post2-slide3-um-9-uhr.png'), await generatePost2Slide3(fontRegular, fontBold))

  console.log('Generiere Regen-Hintergrund...')
  fs.writeFileSync(path.join(outDir, 'rain-background.png'), await generateRainBackground(fontRegular))

  console.log('Generiere Regen-Event-Slide...')
  fs.writeFileSync(path.join(outDir, 'rain-events.png'), await generateRainEventSlide(fontRegular, fontBold))

  console.log(`\n✅ Fertig — Slides gespeichert in ${outDir}`)
  console.log('  post1-was-ist-das.png')
  console.log('  post2-slide1-jeden-morgen.png')
  console.log('  post2-slide2-feed-preview.png')
  console.log('  post2-slide3-um-9-uhr.png')
  console.log('  rain-background.png')
  console.log('  rain-events.png')
}

main().catch(console.error)
