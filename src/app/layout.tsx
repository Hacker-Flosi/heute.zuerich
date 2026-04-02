// src/app/layout.tsx

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'heute.zürich — Was läuft heute in Zürich?',
  description: 'AI-kuratierte Events in Zürich. Jeden Tag die besten 10–15 Veranstaltungen. Keine Filter, kein Scrollen, kein Noise.',
  openGraph: {
    title: 'heute.zürich',
    description: 'Was läuft heute in Zürich? AI-kuratiert, täglich.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
