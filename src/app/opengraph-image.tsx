import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'waslauft.in — Was läuft heute?'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ color: '#ffffff', fontSize: '28px', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.5 }}>
            waslauft.in
          </div>
          <div style={{ color: '#ffffff', fontSize: '80px', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', textTransform: 'uppercase' }}>
            Was läuft heute?
          </div>
        </div>
        <div style={{ display: 'flex', gap: '32px' }}>
          {['Zürich', 'St.Gallen', 'Luzern'].map((city) => (
            <div
              key={city}
              style={{
                color: '#000000',
                background: '#ffffff',
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                padding: '10px 24px',
                borderRadius: '999px',
              }}
            >
              {city}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
