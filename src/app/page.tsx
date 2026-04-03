// src/app/page.tsx — Landing page: city selection

import Link from 'next/link'
import styles from './page.module.css'

const CITIES = [
  { slug: 'zuerich', label: 'Zürich' },
]

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.logo}>waslauft.in</span>
      </header>

      <section className={styles.cities}>
        {CITIES.map((city) => (
          <Link key={city.slug} href={`/${city.slug}`} className={styles.cityLink}>
            {city.label}
          </Link>
        ))}
      </section>

      <footer className={styles.footer}>
        <Link href="/about">About</Link>
      </footer>
    </main>
  )
}
