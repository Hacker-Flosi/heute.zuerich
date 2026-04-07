// src/app/layout.tsx

import type { Metadata } from 'next'
import Script from 'next/script'
import CookieBanner from '@/components/CookieBanner'
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
      <head>
        <Script id="gtag-consent" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', { analytics_storage: 'denied' });
          gtag('js', new Date());
          gtag('config', 'G-TME0GKBTFB');
        `}</Script>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-TME0GKBTFB" strategy="afterInteractive" />
      </head>
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
