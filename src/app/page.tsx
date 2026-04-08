// src/app/page.tsx — Landing page: city selection

import Link from 'next/link'
import { getSanityClient } from '@/lib/sanity'
import { SITE_SETTINGS_QUERY } from '@/lib/queries'
import LogoAnimated from '@/components/LogoAnimated'
import styles from './page.module.css'

export const revalidate = 3600

const CITIES = [
  { slug: 'zuerich', label: 'Zürich', active: true },
  { slug: 'basel', label: 'Basel', active: false },
  { slug: 'bern', label: 'Bern', active: false },
  { slug: 'stgallen', label: 'St. Gallen', active: true },
  { slug: 'luzern', label: 'Luzern', active: true },
]

export default async function Home() {
  const settings = await getSanityClient().fetch<Record<string, { asset: { url: string } } | null>>(SITE_SETTINGS_QUERY)
  const logoUrl = settings?.homeLogo?.asset?.url ?? null

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.logo}>
          <LogoAnimated />
        </span>
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

      <footer className={styles.footer}>
        <Link href="/about">About</Link>
        <Link href="/datenschutz">Datenschutz</Link>
      </footer>
    </main>
  )
}
