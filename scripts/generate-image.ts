// scripts/generate-image.ts
// Generiert 1080×1350px Instagram Feed-Bilder
// Stack: Satori (JSX → SVG) + sharp (SVG → PNG)

import satori from 'satori'
import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

const WIDTH       = 1080
const HEIGHT      = 1350
const HALF_HEIGHT = Math.floor(HEIGHT / 2)  // 675px — black title section

const COLORS = [
  '#FF0000', '#FF00FF', '#00E5FF', '#FFFFFF', '#FFB800', '#00E05A',
  '#5B5BFF', '#FF4D94', '#C864FF', '#FFE500', '#FF6B35', '#00FF94',
]

function getColor(index: number): string {
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
  const regularPath = path.join(fontsDir, 'JetBrainsMono-Regular.ttf')
  const boldPath    = path.join(fontsDir, 'JetBrainsMono-Bold.ttf')
  if (!fs.existsSync(regularPath) || !fs.existsSync(boldPath)) {
    throw new Error('JetBrainsMono-Regular.ttf / JetBrainsMono-Bold.ttf fehlen unter public/fonts/')
  }
  return {
    fontRegular: loadFont(regularPath),
    fontBold: loadFont(boldPath),
    fontName: 'JetBrains Mono',
  }
}

function loadLogoDataUrl(): string {
  const logoPath = path.join(process.cwd(), 'public', 'logo', 'waslauft.svg')
  const svg = fs.readFileSync(logoPath, 'utf-8')
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

async function renderSvgToPng(jsx: object, fontRegular: ArrayBuffer, fontBold: ArrayBuffer, fontName: string): Promise<Buffer> {
  const svg = await satori(jsx as any, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: fontName, data: fontRegular, weight: 400, style: 'normal' },
      { name: fontName, data: fontBold,    weight: 700, style: 'normal' },
    ],
  })
  return sharp(Buffer.from(svg)).png().toBuffer()
}

/** Build event block JSX — used in both title slide (bottom) and event slides */
function buildEventBlock(event: ImageEvent, i: number, totalInSlide: number) {
  const bg = getColor(event.colorIndex ?? i)
  const fg = getTextColor(bg)
  const label = event.eventType ? EVENT_TYPE_LABELS[event.eventType] ?? event.eventType : null
  const isLast = i === totalInSlide - 1

  return {
    type: 'div',
    props: {
      style: {
        flex: 1,
        background: bg,
        borderBottom: isLast ? 'none' : '1px solid #000',
        padding: '0 60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 6,
        overflow: 'hidden',
      },
      children: [
        // Meta row
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', gap: 12 },
                  children: [
                    ...(label ? [{
                      type: 'div',
                      props: {
                        style: {
                          background: '#000',
                          color: '#fff',
                          fontSize: 18,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          padding: '4px 14px',
                          borderRadius: 4,
                        },
                        children: label,
                      },
                    }] : []),
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: 20,
                          fontWeight: 400,
                          color: fg,
                          opacity: 0.7,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        },
                        children: event.location,
                      },
                    },
                  ],
                },
              },
              // Time
              [{
                type: 'div',
                props: {
                  style: {
                    fontSize: 20,
                    fontWeight: 700,
                    color: fg,
                    opacity: 0.7,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  },
                  children: (event.time && event.time !== '00:00') ? event.time : 'Ganztägig',
                },
              }],
            ],
          },
        },
        // Event name
        {
          type: 'div',
          props: {
            style: {
              fontSize: event.name.length > 50 ? 28 : event.name.length > 35 ? 36 : 44,
              fontWeight: 700,
              color: fg,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              textTransform: 'uppercase',
            },
            children: event.name,
          },
        },
      ],
    },
  }
}

// ─── Titel-Slide (Slide 1): top half black + bottom half first events ──────────

export async function generateTitleImage(
  cityLabel: string,
  dateLabel: string,
  firstEvents: ImageEvent[],
): Promise<Buffer> {
  const { fontRegular, fontBold, fontName } = loadFonts()
  const logoDataUrl = loadLogoDataUrl()

  // Show up to 4 events in bottom half
  const displayEvents = firstEvents.slice(0, 4)

  const jsx = {
    type: 'div',
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: fontName,
      },
      children: [
        // Top half — black, logo + city + date
        {
          type: 'div',
          props: {
            style: {
              height: HALF_HEIGHT,
              background: '#000000',
              display: 'flex',
              flexDirection: 'column',
              padding: '60px 60px',
            },
            children: [
              // Top row — logo only
              {
                type: 'img',
                props: {
                  src: logoDataUrl,
                  style: { width: 260, height: 52, objectFit: 'contain', objectPosition: 'left center' },
                },
              },
              // Spacer
              { type: 'div', props: { style: { flex: 1 }, children: '' } },
              // City
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 148,
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '-0.04em',
                    lineHeight: 0.88,
                  },
                  children: cityLabel,
                },
              },
              // Date below city
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 40,
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '0.02em',
                    opacity: 0.6,
                    marginTop: 12,
                  },
                  children: dateLabel,
                },
              },
            ],
          },
        },
        // Bottom half — first events
        {
          type: 'div',
          props: {
            style: {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            },
            children: displayEvents.map((event, i) =>
              buildEventBlock(event, i, displayEvents.length)
            ),
          },
        },
      ],
    },
  }

  return renderSvgToPng(jsx, fontRegular, fontBold, fontName)
}

// ─── Event-Slide (Slides 2+): events fill full height ─────────────────────────

export async function generatePostImage(
  cityLabel: string,
  dateLabel: string,
  events: ImageEvent[],
): Promise<Buffer> {
  const { fontRegular, fontBold, fontName } = loadFonts()

  const displayEvents = events.slice(0, 8)

  const jsx = {
    type: 'div',
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        background: '#EEEEEE',
        fontFamily: fontName,
      },
      children: displayEvents.map((event, i) =>
        buildEventBlock(event, i, displayEvents.length)
      ),
    },
  }

  return renderSvgToPng(jsx, fontRegular, fontBold, fontName)
}
