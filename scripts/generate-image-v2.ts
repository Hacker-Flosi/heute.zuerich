// scripts/generate-image-v2.ts
// Neue Instagram Formate:
// 1. generateCombinedTitleSlide  — Titel "Was läuft heute?" (schwarz)
// 2. generateCombinedCitySlide   — Stadt-Slide mit farbigem BG (Karussell)
// 3. generateStoryTitleSlide     — Vollflächiger Titel-Slide pro Stadt (Story)
// 4. generateStoryEventSlide     — Event-Liste mit Stadtlegende (Story, mehrere möglich)

import satori from 'satori'
import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

const FEED_W  = 1080
const FEED_H  = 1350
const STORY_W = 1080
const STORY_H = 1920

// Safe zones für Stories (Instagram UI oben/unten)
const STORY_SAFE_TOP    = 150
const STORY_SAFE_BOTTOM = 150

const COLORS = [
  '#FF0000', '#FF00FF', '#00E5FF', '#FFFFFF', '#FFB800', '#00E05A',
  '#5B5BFF', '#FF4D94', '#C864FF', '#FFE500', '#FF6B35', '#00FF94',
]

export function getColor(index: number): string {
  return COLORS[index % COLORS.length]
}

function getTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const lin = (c: number) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return L < 0.179 ? '#ffffff' : '#000000'
}

export interface ImageEvent {
  name: string
  location: string
  time: string
  colorIndex: number
  eventType?: string
}

export interface CityEvents {
  label: string
  events: ImageEvent[]
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  konzert:  'Konzert',
  dj_club:  'DJ / Club',
  party:    'Party',
  kultur:   'Kultur',
  kunst:    'Kunst',
  markt:    'Markt',
  open_air: 'Open Air',
  special:  'Special',
}

function loadFont(fontPath: string): ArrayBuffer {
  const buf = fs.readFileSync(fontPath)
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

function loadFonts() {
  const fontsDir = path.join(process.cwd(), 'public', 'fonts')
  const fontName = 'JetBrains Mono'
  return {
    fontRegular: loadFont(path.join(fontsDir, 'JetBrainsMono-Regular.ttf')),
    fontBold: loadFont(path.join(fontsDir, 'JetBrainsMono-Bold.ttf')),
    fontName,
  }
}

function loadLogoDataUrl(color = '#ffffff'): string {
  const svg = fs.readFileSync(path.join(process.cwd(), 'public', 'logo', 'waslauft.svg'), 'utf-8')
  const colored = svg.replace(/fill="white"/g, `fill="${color}"`).replace(/fill="#ffffff"/gi, `fill="${color}"`)
  return `data:image/svg+xml;base64,${Buffer.from(colored).toString('base64')}`
}

async function renderFeed(jsx: object, fontRegular: ArrayBuffer, fontBold: ArrayBuffer, fontName: string): Promise<Buffer> {
  const svg = await satori(jsx as any, {
    width: FEED_W, height: FEED_H,
    fonts: [
      { name: fontName, data: fontRegular, weight: 400, style: 'normal' },
      { name: fontName, data: fontBold, weight: 700, style: 'normal' },
    ],
  })
  return sharp(Buffer.from(svg)).png().toBuffer()
}

async function renderStory(jsx: object, fontRegular: ArrayBuffer, fontBold: ArrayBuffer, fontName: string): Promise<Buffer> {
  const svg = await satori(jsx as any, {
    width: STORY_W, height: STORY_H,
    fonts: [
      { name: fontName, data: fontRegular, weight: 400, style: 'normal' },
      { name: fontName, data: fontBold, weight: 700, style: 'normal' },
    ],
  })
  return sharp(Buffer.from(svg)).png().toBuffer()
}

// ─── Rain Drops Overlay ──────────────────────────────────────────────────────

function buildRainDrops(width: number, height: number): object[] {
  const drops: object[] = []
  const positions = [
    [0.05, 0.02], [0.12, 0.15], [0.22, 0.05], [0.35, 0.20], [0.48, 0.08], [0.60, 0.25], [0.72, 0.03], [0.85, 0.18], [0.93, 0.10],
    [0.08, 0.35], [0.18, 0.42], [0.30, 0.30], [0.42, 0.48], [0.55, 0.38], [0.68, 0.45], [0.78, 0.32], [0.90, 0.50],
    [0.03, 0.62], [0.15, 0.70], [0.27, 0.58], [0.40, 0.75], [0.52, 0.65], [0.65, 0.72], [0.75, 0.60], [0.88, 0.78],
    [0.10, 0.88], [0.23, 0.82], [0.38, 0.92], [0.50, 0.85], [0.62, 0.90], [0.80, 0.83], [0.95, 0.88],
  ]
  for (const [xr, yr] of positions) {
    drops.push({
      type: 'div',
      props: {
        style: {
          position: 'absolute',
          left: Math.round(xr * width),
          top: Math.round(yr * height),
          width: 2,
          height: 40,
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 2,
          transform: 'rotate(15deg)',
        },
        children: '',
      },
    })
  }
  return drops
}

// ─── Event Row ────────────────────────────────────────────────────────────────

function buildEventRow(event: ImageEvent, i: number, total: number, compact = false, bgOverride?: string, badWeather = false) {
  const bg = badWeather ? NAVY : (bgOverride ?? getColor(event.colorIndex ?? i))
  const fg = badWeather ? NAVY_FG : getTextColor(bg)
  const borderColor = badWeather ? NAVY_BORDER : '#000'
  const label = event.eventType ? EVENT_TYPE_LABELS[event.eventType] ?? null : null
  const isLast = i === total - 1
  const padding = compact ? '0 40px' : '0 60px'
  const nameFontSize = compact ? 38 : 44

  return {
    type: 'div',
    props: {
      style: {
        flex: 1,
        background: bg,
        borderBottom: isLast ? 'none' : `1px solid ${borderColor}`,
        padding,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: compact ? 4 : 6,
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', gap: 10 },
                  children: [
                    ...(label ? [{
                      type: 'div',
                      props: {
                        style: {
                          background: badWeather ? NAVY_FG : '#000',
                          color: badWeather ? NAVY : '#fff',
                          fontSize: compact ? 13 : 18, fontWeight: 700,
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          padding: compact ? '2px 8px' : '4px 14px', borderRadius: 4,
                        },
                        children: label,
                      },
                    }] : []),
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: compact ? 20 : 20, fontWeight: 400,
                          color: fg, opacity: 0.7,
                          letterSpacing: '0.04em', textTransform: 'uppercase',
                        },
                        children: event.location,
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: compact ? 20 : 20, fontWeight: 700,
                    color: fg, opacity: 0.7,
                    letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0,
                  },
                  children: (event.time && event.time !== '00:00') ? event.time : 'Ganztägig',
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: nameFontSize, fontWeight: 700,
              color: fg, letterSpacing: '-0.02em',
              lineHeight: 1.05, textTransform: 'uppercase',
            },
            children: event.name,
          },
        },
      ],
    },
  }
}

// ─── 1. Kombinierter Titel-Slide (Feed, farbiger BG) ─────────────────────────

export async function generateCombinedTitleSlide(dateLabel: string, firstColorIndex = 0): Promise<Buffer> {
  const { fontRegular, fontBold, fontName } = loadFonts()
  const bg = getColor(firstColorIndex)
  const fg = getTextColor(bg)
  const logoDataUrl = loadLogoDataUrl(fg)

  const jsx = {
    type: 'div',
    props: {
      style: {
        width: FEED_W, height: FEED_H,
        background: bg,
        display: 'flex', flexDirection: 'column',
        padding: '80px 60px',
        fontFamily: fontName,
      },
      children: [
        {
          type: 'img',
          props: { src: logoDataUrl, style: { width: 260, height: 52, objectFit: 'contain', objectPosition: 'left center' } },
        },
        { type: 'div', props: { style: { flex: 1 }, children: '' } },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 120, fontWeight: 700, color: fg,
              letterSpacing: '-0.04em', lineHeight: 0.9, textTransform: 'uppercase',
            },
            children: 'Was läuft heute?',
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', gap: 16, marginTop: 40 },
            children: ['Zürich', 'St.Gallen', 'Luzern'].map((city) => ({
              type: 'div',
              props: {
                style: {
                  border: `2px solid ${fg}`, color: fg,
                  fontSize: 22, fontWeight: 700,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  padding: '8px 20px', borderRadius: 4,
                },
                children: city,
              },
            })),
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 36, fontWeight: 700, color: fg,
              letterSpacing: '0.02em', opacity: 0.5, marginTop: 20,
            },
            children: dateLabel,
          },
        },
      ],
    },
  }

  return renderFeed(jsx, fontRegular, fontBold, fontName)
}

// ─── 2. Stadt-Slide (Feed) — schwarze Legende, Events mit eigenen Farben ──────

export async function generateCombinedCitySlide(city: CityEvents): Promise<Buffer> {
  const { fontRegular, fontBold, fontName } = loadFonts()
  const MAX_EVENTS = 5
  const displayEvents = city.events.slice(0, MAX_EVENTS)

  const jsx = {
    type: 'div',
    props: {
      style: {
        width: FEED_W, height: FEED_H,
        background: '#000000',
        display: 'flex', flexDirection: 'column',
        fontFamily: fontName,
      },
      children: [
        // Kleine schwarze Legende mit Stadtname
        {
          type: 'div',
          props: {
            style: {
              background: '#000000',
              padding: '28px 60px 22px',
              borderBottom: '1px solid #333',
              display: 'flex',
              alignItems: 'center',
            },
            children: [{
              type: 'div',
              props: {
                style: {
                  fontSize: 28, fontWeight: 700, color: '#ffffff',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                },
                children: city.label,
              },
            }],
          },
        },
        // Events
        {
          type: 'div',
          props: {
            style: { flex: 1, display: 'flex', flexDirection: 'column' },
            children: displayEvents.map((e, i) => buildEventRow(e, i, displayEvents.length, true)),
          },
        },
      ],
    },
  }

  return renderFeed(jsx, fontRegular, fontBold, fontName)
}

// ─── 3. Story Titel-Slide — schwarz, vollflächig mit Stadtname ───────────────

export async function generateStoryTitleSlide(city: CityEvents, dateLabel: string): Promise<Buffer> {
  const { fontRegular, fontBold, fontName } = loadFonts()
  const logoDataUrl = loadLogoDataUrl()

  const jsx = {
    type: 'div',
    props: {
      style: {
        width: STORY_W, height: STORY_H,
        background: '#000000',
        display: 'flex', flexDirection: 'column',
        padding: `${STORY_SAFE_TOP + 40}px 60px ${STORY_SAFE_BOTTOM + 40}px`,
        fontFamily: fontName,
      },
      children: [
        {
          type: 'img',
          props: { src: logoDataUrl, style: { width: 200, height: 40, objectFit: 'contain', objectPosition: 'left center' } },
        },
        { type: 'div', props: { style: { flex: 1 }, children: '' } },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 160, fontWeight: 700, color: '#ffffff',
              letterSpacing: '-0.05em', lineHeight: 0.85, textTransform: 'uppercase',
            },
            children: city.label,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 40, fontWeight: 700, color: '#ffffff',
              opacity: 0.5, letterSpacing: '0.02em', marginTop: 24,
            },
            children: dateLabel,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 28, fontWeight: 400, color: '#ffffff',
              opacity: 0.4, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 12,
            },
            children: `${city.events.length} Events heute`,
          },
        },
      ],
    },
  }

  return renderStory(jsx, fontRegular, fontBold, fontName)
}

// ─── 4. Story Event-Slide — alle Events, aufgeteilt, mit Stadtlegende ─────────

const STORY_EVENTS_PER_SLIDE = 7

export async function generateStoryEventSlides(city: CityEvents): Promise<Buffer[]> {
  const { fontRegular, fontBold, fontName } = loadFonts()
  const events = city.events
  const slides: Buffer[] = []

  // Chunk events
  const chunks: ImageEvent[][] = []
  for (let i = 0; i < events.length; i += STORY_EVENTS_PER_SLIDE) {
    chunks.push(events.slice(i, i + STORY_EVENTS_PER_SLIDE))
  }

  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci]
    const slideNum = ci + 1
    const totalSlides = chunks.length

    const jsx = {
      type: 'div',
      props: {
        style: {
          width: STORY_W, height: STORY_H,
          background: '#000000',
          display: 'flex', flexDirection: 'column',
          fontFamily: fontName,
        },
        children: [
          // Safe zone top + Legende
          {
            type: 'div',
            props: {
              style: {
                paddingTop: STORY_SAFE_TOP,
                paddingBottom: 20,
                paddingLeft: 60,
                paddingRight: 60,
                background: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #333',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 36, fontWeight: 700, color: '#ffffff',
                      letterSpacing: '-0.02em', textTransform: 'uppercase',
                    },
                    children: city.label,
                  },
                },
                totalSlides > 1 ? {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 24, fontWeight: 400, color: '#ffffff',
                      opacity: 0.4, letterSpacing: '0.04em',
                    },
                    children: `${slideNum} / ${totalSlides}`,
                  },
                } : { type: 'div', props: { style: {}, children: '' } },
              ],
            },
          },
          // Events
          {
            type: 'div',
            props: {
              style: { flex: 1, display: 'flex', flexDirection: 'column' },
              children: chunk.map((e, i) => buildEventRow(e, i, chunk.length, true)),
            },
          },
          // Safe zone bottom + footer
          {
            type: 'div',
            props: {
              style: {
                paddingBottom: STORY_SAFE_BOTTOM,
                paddingTop: 20,
                paddingLeft: 60,
                paddingRight: 60,
                background: '#000000',
                borderTop: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
              },
              children: [{
                type: 'div',
                props: {
                  style: {
                    fontSize: 22, fontWeight: 700, color: '#ffffff',
                    opacity: 0.4, letterSpacing: '0.04em', textTransform: 'uppercase',
                  },
                  children: `waslauft.in/${city.label.toLowerCase().replace(/\./g, '')}`,
                },
              }],
            },
          },
        ],
      },
    }

    const svg = await satori(jsx as any, {
      width: STORY_W, height: STORY_H,
      fonts: [
        { name: fontName, data: fontRegular, weight: 400, style: 'normal' },
        { name: fontName, data: fontBold, weight: 700, style: 'normal' },
      ],
    })
    slides.push(await sharp(Buffer.from(svg)).png().toBuffer())
  }

  return slides
}

// ─── Bad Weather Constants ────────────────────────────────────────────────────

const NAVY = '#0D1A2D'
const NAVY_FG = '#ffffff'
const NAVY_BORDER = '#1E3A58'
const NAVY_LEGEND = '#152236'

const INDOOR_TYPES = new Set(['konzert', 'dj_club', 'party', 'kultur', 'kunst', 'special'])

function filterIndoor(events: ImageEvent[]): ImageEvent[] {
  return events.filter((e) => INDOOR_TYPES.has(e.eventType ?? ''))
}

// ─── 5. Bad Weather Post Stadt-Slide ─────────────────────────────────────────

export async function generateBadWeatherCitySlide(city: CityEvents, weatherDesc: string): Promise<Buffer> {
  const { fontRegular, fontBold, fontName } = loadFonts()
  const indoorEvents = filterIndoor(city.events).slice(0, 5)
  const rainDrops = buildRainDrops(FEED_W, FEED_H)

  const jsx = {
    type: 'div',
    props: {
      style: {
        width: FEED_W, height: FEED_H,
        background: NAVY,
        display: 'flex', flexDirection: 'column',
        fontFamily: fontName,
        position: 'relative',
        overflow: 'hidden',
      },
      children: [
        // Rain drops (absolute, behind content)
        ...rainDrops,
        // Navy Legende mit Stadtname + Wetter
        {
          type: 'div',
          props: {
            style: {
              background: NAVY_LEGEND,
              padding: '28px 60px 22px',
              borderBottom: `1px solid ${NAVY_BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 28, fontWeight: 700, color: NAVY_FG,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  },
                  children: city.label,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 20, fontWeight: 400, color: NAVY_FG,
                    opacity: 0.5, letterSpacing: '0.04em', textTransform: 'uppercase',
                  },
                  children: weatherDesc,
                },
              },
            ],
          },
        },
        // Indoor Events (Navy theme)
        {
          type: 'div',
          props: {
            style: { flex: 1, display: 'flex', flexDirection: 'column' },
            children: indoorEvents.length > 0
              ? indoorEvents.map((e, i) => buildEventRow(e, i, indoorEvents.length, true, undefined, true))
              : [{
                type: 'div',
                props: {
                  style: {
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: NAVY_FG, opacity: 0.4, fontSize: 28, fontWeight: 700,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                  },
                  children: 'Keine Indoor-Events',
                },
              }],
          },
        },
      ],
    },
  }

  return renderFeed(jsx, fontRegular, fontBold, fontName)
}

// ─── 6. Bad Weather Story Titel-Slide ────────────────────────────────────────

export async function generateBadWeatherStoryTitleSlide(city: CityEvents, dateLabel: string, weatherDesc: string): Promise<Buffer> {
  const { fontRegular, fontBold, fontName } = loadFonts()
  const logoDataUrl = loadLogoDataUrl(NAVY_FG)
  const indoorCount = filterIndoor(city.events).length
  const rainDrops = buildRainDrops(STORY_W, STORY_H)

  const jsx = {
    type: 'div',
    props: {
      style: {
        width: STORY_W, height: STORY_H,
        background: NAVY,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        padding: `${STORY_SAFE_TOP + 40}px 60px ${STORY_SAFE_BOTTOM + 40}px`,
        fontFamily: fontName,
      },
      children: [
        // Rain drops (behind content)
        ...rainDrops,
        // Logo
        {
          type: 'img',
          props: { src: logoDataUrl, style: { width: 200, height: 40, objectFit: 'contain', objectPosition: 'left center' } },
        },
        { type: 'div', props: { style: { flex: 1 }, children: '' } },
        // City name
        {
          type: 'div',
          props: {
            style: {
              fontSize: 160, fontWeight: 700, color: NAVY_FG,
              letterSpacing: '-0.05em', lineHeight: 0.85, textTransform: 'uppercase',
            },
            children: city.label,
          },
        },
        // Date
        {
          type: 'div',
          props: {
            style: {
              fontSize: 40, fontWeight: 700, color: NAVY_FG,
              opacity: 0.5, letterSpacing: '0.02em', marginTop: 20,
            },
            children: dateLabel,
          },
        },
        // [REGEN] INDOOR-PROGRAMM — same line
        {
          type: 'div',
          props: {
            style: {
              display: 'flex', alignItems: 'center', gap: 16, marginTop: 28,
            },
            children: [
              // REGEN pill (category style)
              {
                type: 'div',
                props: {
                  style: {
                    background: NAVY_FG, color: NAVY,
                    fontSize: 26, fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    padding: '6px 18px', borderRadius: 4,
                  },
                  children: weatherDesc,
                },
              },
              // INDOOR-PROGRAMM text
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 30, fontWeight: 700, color: NAVY_FG,
                    opacity: 0.7, letterSpacing: '0.04em', textTransform: 'uppercase',
                  },
                  children: 'Indoor-Programm',
                },
              },
            ],
          },
        },
        // Event count
        {
          type: 'div',
          props: {
            style: {
              fontSize: 26, fontWeight: 400, color: NAVY_FG,
              opacity: 0.4, letterSpacing: '0.04em', marginTop: 12,
            },
            children: `${indoorCount} Events`,
          },
        },
      ],
    },
  }

  return renderStory(jsx, fontRegular, fontBold, fontName)
}

// ─── 7. Bad Weather Story Event-Slides ───────────────────────────────────────

export async function generateBadWeatherStoryEventSlides(city: CityEvents): Promise<Buffer[]> {
  const { fontRegular, fontBold, fontName } = loadFonts()
  const events = filterIndoor(city.events)
  const slides: Buffer[] = []

  const chunks: ImageEvent[][] = []
  for (let i = 0; i < events.length; i += STORY_EVENTS_PER_SLIDE) {
    chunks.push(events.slice(i, i + STORY_EVENTS_PER_SLIDE))
  }

  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci]
    const slideNum = ci + 1
    const totalSlides = chunks.length

    const jsx = {
      type: 'div',
      props: {
        style: {
          width: STORY_W, height: STORY_H,
          background: NAVY,
          display: 'flex', flexDirection: 'column',
          fontFamily: fontName,
        },
        children: [
          // Safe zone top + Navy Legende
          {
            type: 'div',
            props: {
              style: {
                paddingTop: STORY_SAFE_TOP,
                paddingBottom: 20,
                paddingLeft: 60,
                paddingRight: 60,
                background: NAVY_LEGEND,
                borderBottom: `1px solid ${NAVY_BORDER}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 36, fontWeight: 700, color: NAVY_FG,
                      letterSpacing: '-0.02em', textTransform: 'uppercase',
                    },
                    children: city.label,
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: 18, fontWeight: 700, color: NAVY_FG,
                            opacity: 0.5, letterSpacing: '0.06em', textTransform: 'uppercase',
                          },
                          children: 'Indoor',
                        },
                      },
                      totalSlides > 1 ? {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: 20, fontWeight: 400, color: NAVY_FG,
                            opacity: 0.4, letterSpacing: '0.04em',
                          },
                          children: `${slideNum} / ${totalSlides}`,
                        },
                      } : { type: 'div', props: { style: {}, children: '' } },
                    ],
                  },
                },
              ],
            },
          },
          // Events
          {
            type: 'div',
            props: {
              style: { flex: 1, display: 'flex', flexDirection: 'column' },
              children: chunk.map((e, i) => buildEventRow(e, i, chunk.length, true, undefined, true)),
            },
          },
          // Safe zone bottom + footer
          {
            type: 'div',
            props: {
              style: {
                paddingBottom: STORY_SAFE_BOTTOM,
                paddingTop: 20,
                paddingLeft: 60,
                paddingRight: 60,
                background: NAVY_LEGEND,
                borderTop: `1px solid ${NAVY_BORDER}`,
                display: 'flex',
                alignItems: 'center',
              },
              children: [{
                type: 'div',
                props: {
                  style: {
                    fontSize: 22, fontWeight: 700, color: NAVY_FG,
                    opacity: 0.4, letterSpacing: '0.04em', textTransform: 'uppercase',
                  },
                  children: `waslauft.in/${city.label.toLowerCase().replace(/\./g, '')}`,
                },
              }],
            },
          },
        ],
      },
    }

    const svg = await satori(jsx as any, {
      width: STORY_W, height: STORY_H,
      fonts: [
        { name: fontName, data: fontRegular, weight: 400, style: 'normal' },
        { name: fontName, data: fontBold, weight: 700, style: 'normal' },
      ],
    })
    slides.push(await sharp(Buffer.from(svg)).png().toBuffer())
  }

  return slides
}
