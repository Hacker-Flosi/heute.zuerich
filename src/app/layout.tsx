// src/app/layout.tsx

import type { Metadata } from 'next'
import Script from 'next/script'
import CookieBanner from '@/components/CookieBanner'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'waslauft.in — Was läuft heute in deiner Stadt?',
    template: '%s | waslauft.in',
  },
  description: 'Jeden Tag die besten Events in Zürich, Basel, St.Gallen, Luzern und Winterthur — kuratiert, ohne Werbung, ohne Noise.',
  metadataBase: new URL('https://waslauft.in'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'waslauft.in — Was läuft heute?',
    description: 'Jeden Tag die besten Events in Zürich, Basel, St.Gallen, Luzern und Winterthur. Kuratiert, ohne Noise.',
    url: 'https://waslauft.in',
    siteName: 'waslauft.in',
    type: 'website',
    locale: 'de_CH',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'waslauft.in — Was läuft heute?',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'waslauft.in — Was läuft heute?',
    description: 'Jeden Tag die besten Events in Zürich, Basel, St.Gallen, Luzern und Winterthur. Kuratiert, ohne Noise.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
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
