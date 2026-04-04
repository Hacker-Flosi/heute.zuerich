// src/app/page.tsx — Landing page: city selection

import Link from 'next/link'
import styles from './page.module.css'

const CITIES = [
  { slug: 'zuerich', label: 'Zürich', active: true },
  { slug: 'basel', label: 'Basel', active: false },
  { slug: 'bern', label: 'Bern', active: false },
  { slug: 'stgallen', label: 'St. Gallen', active: true },
  { slug: 'luzern', label: 'Luzern', active: true },
]

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.logo}>waslauft.in</span>
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
      </footer>
    </main>
  )
}
