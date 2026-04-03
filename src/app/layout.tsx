// src/app/layout.tsx

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'waslauft.in — Was läuft heute?',
  description: 'Kuratierte Events in deiner Stadt. Täglich die besten 10–15 Veranstaltungen. Kein Noise.',
  openGraph: {
    title: 'waslauft.in',
    description: 'Was läuft heute? Kuratiert, täglich.',
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
