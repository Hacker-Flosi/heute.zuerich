// src/app/page.tsx — Landing page: city selection

import Link from 'next/link'
import { getSanityClient } from '@/lib/sanity'
import { SITE_SETTINGS_QUERY } from '@/lib/queries'
import LogoAnimated from '@/components/LogoAnimated'
import SiteFooter from '@/components/SiteFooter'
import styles from './page.module.css'

export const revalidate = 3600

const CITIES = [
  { slug: 'zuerich', label: 'Zürich', active: true },
  { slug: 'basel', label: 'Basel', active: true },
  { slug: 'bern', label: 'Bern', active: false },
  { slug: 'stgallen', label: 'St.Gallen', active: true },
  { slug: 'luzern', label: 'Luzern', active: true },
  { slug: 'winterthur', label: 'Winterthur', active: false },
]

export const metadata = {
  alternates: { canonical: '/' },
}

export default async function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'waslauft.in',
    url: 'https://waslauft.in',
    description: 'Jeden Tag die besten Events in Zürich, St.Gallen und Luzern — kuratiert, ohne Noise.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://waslauft.in/{city}',
      'query-input': 'required name=city',
    },
  }
  const settings = await getSanityClient().fetch<Record<string, { asset: { url: string } } | null>>(SITE_SETTINGS_QUERY)
  const logoUrl = settings?.homeLogo?.asset?.url ?? null

  return (
    <main className={styles.main}>
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

      <section className={styles.cities}>
        {CITIES.map((city) =>
          city.active ? (
            <Link key={city.slug} href={`/${city.slug}`} className={styles.cityLink}>
              {city.label}
            </Link>
          ) : (
            <div key={city.slug} className={styles.cityDisabled}>
              <span>{city.label}</span>
              <span className={styles.comingSoon}>Coming Soon</span>
            </div>
          )
        )}
      </section>

      <SiteFooter />
    </main>
  )
}
