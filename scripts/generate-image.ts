// scripts/generate-image.ts
// Generiert ein 1080×1350px Instagram Feed-Bild für eine Stadt
// Stack: Satori (JSX → SVG) + sharp (SVG → PNG)

import satori from 'satori'
import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

const WIDTH  = 1080
const HEIGHT = 1350

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

export async function generatePostImage(
  cityLabel: string,
  dateLabel: string,
  events: ImageEvent[],
  pageNum?: number,
  totalPages?: number,
): Promise<Buffer> {
  const fontsDir = path.join(process.cwd(), 'public', 'fonts')
  const regularPath = path.join(fontsDir, 'JetBrainsMono-Regular.ttf')
  const boldPath    = path.join(fontsDir, 'JetBrainsMono-Bold.ttf')

  if (!fs.existsSync(regularPath) || !fs.existsSync(boldPath)) {
    throw new Error('JetBrainsMono-Regular.ttf / JetBrainsMono-Bold.ttf fehlen unter public/fonts/')
  }

  const fontRegular = loadFont(regularPath)
  const fontBold    = loadFont(boldPath)
  const fontName    = 'JetBrains Mono'

  // Max 8 events fit nicely in 1350px height
  const displayEvents = events.slice(0, 8)

  // Header height fixed, rest split evenly among events
  const HEADER_HEIGHT = 160
  const eventHeight = Math.floor((HEIGHT - HEADER_HEIGHT) / displayEvents.length)

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
      children: [
        // Header
        {
          type: 'div',
          props: {
            style: {
              height: HEADER_HEIGHT,
              padding: '0 60px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 4,
              borderBottom: '2px solid #000',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 32,
                    fontWeight: 700,
                    color: '#000',
                    opacity: 0.4,
                    letterSpacing: '-0.02em',
                  },
                  children: `waslauft.in / ${cityLabel}${totalPages && totalPages > 1 ? `  ${pageNum}/${totalPages}` : ''}`,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 28,
                    fontWeight: 400,
                    color: '#000',
                    opacity: 0.5,
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                  },
                  children: dateLabel,
                },
              },
            ],
          },
        },
        // Event blocks
        {
          type: 'div',
          props: {
            style: {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            },
            children: displayEvents.map((event, i) => {
              const bg = getColor(event.colorIndex ?? i)
              const fg = getTextColor(bg)
              const label = event.eventType ? EVENT_TYPE_LABELS[event.eventType] ?? event.eventType : null

              return {
                type: 'div',
                props: {
                  key: i,
                  style: {
                    height: eventHeight,
                    background: bg,
                    borderBottom: '1px solid #000',
                    padding: '0 60px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 6,
                  },
                  children: [
                    // Meta row: pill + location + time
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
                                // Category pill
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
                                // Location
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
                          {
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
                              children: event.time,
                            },
                          },
                        ],
                      },
                    },
                    // Event name
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: Math.min(52, Math.max(32, eventHeight * 0.32)),
                          fontWeight: 700,
                          color: fg,
                          letterSpacing: '-0.02em',
                          lineHeight: 1.05,
                          textTransform: 'uppercase',
                        },
                        children: event.name.length > 40 ? event.name.slice(0, 38) + '…' : event.name,
                      },
                    },
                  ],
                },
              }
            }),
          },
        },
      ],
    },
  }

  const svg = await satori(jsx as any, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: fontName, data: fontRegular, weight: 400, style: 'normal' },
      { name: fontName, data: fontBold,    weight: 700, style: 'normal' },
    ],
  })

  const png = await sharp(Buffer.from(svg)).png().toBuffer()
  return png
}
