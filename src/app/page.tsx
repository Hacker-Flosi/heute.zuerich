// src/app/page.tsx — Landing page: city selection

import LogoAnimated from '@/components/LogoAnimated'
import SiteFooter from '@/components/SiteFooter'
import ClearRainMode from '@/components/ClearRainMode'
import BalloonsScene from '@/components/BalloonsScene'
import styles from './page.module.css'

export const revalidate = 3600

const CITIES = [
  { slug: 'zuerich',    label: 'Zürich',     active: true,  color: '#FF6B35' },
  { slug: 'basel',      label: 'Basel',      active: true,  color: '#C864FF' },
  { slug: 'stgallen',   label: 'St.Gallen',  active: true,  color: '#FFFFFF' },
  { slug: 'winterthur', label: 'Winterthur', active: true,  color: '#FF4D94' },
  { slug: 'luzern',     label: 'Luzern',     active: true,  color: '#00E5FF' },
]

export const metadata = {
  alternates: { canonical: '/' },
}

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'waslauft.in',
    url: 'https://waslauft.in',
    description: 'Jeden Tag die besten Events in Zürich, Basel, St.Gallen, Luzern und Winterthur — kuratiert, ohne Noise.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://waslauft.in/{city}',
      'query-input': 'required name=city',
    },
  }

  return (
    <main className={styles.main}>
      <ClearRainMode />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className={styles.header}>
        <span className={styles.logo}>
          <LogoAnimated />
        </span>
        <h1 className={styles.srOnly}>waslauft.in — Was läuft heute in deiner Stadt?</h1>
      </header>

      <BalloonsScene cities={CITIES} />

      <SiteFooter />
    </main>
  )
}
