// src/app/about/page.tsx — About page

import Link from 'next/link'
import { getSanityClient } from '@/lib/sanity'
import { SITE_SETTINGS_QUERY } from '@/lib/queries'
import LogoAnimated from '@/components/LogoAnimated'
import styles from './about.module.css'
import type { Metadata } from 'next'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'waslauft.in / About',
  description: 'Weniger Noise, mehr Ausgang.',
}

export default async function AboutPage() {
  const settings = await getSanityClient().fetch<Record<string, { asset: { url: string } } | null>>(SITE_SETTINGS_QUERY)
  const logoUrl = settings?.homeLogo?.asset?.url ?? null

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <LogoAnimated />
        </Link>
        <span className={styles.current}>About</span>
      </header>

      <section className={styles.content}>
        <h1 className={styles.headline}>Weniger Noise,<br />mehr Ausgang.</h1>
        <p className={styles.body}>
          waslauft.in ist eine kuratierte Event-Seite für Schweizer Städte.
          Kein Algorithmus, keine Werbung, keine 500 Einträge — nur die Veranstaltungen,
          die es wirklich wert sind.
        </p>
        <p className={styles.body}>
          Täglich werden die besten Events ausgewählt und chronologisch aufgelistet.
          Ein Klick führt direkt zum Veranstalter.
        </p>
      </section>

      <section className={styles.contact}>
        <h2 className={styles.contactHeadline}>Event eintragen lassen?</h2>
        <p className={styles.body}>
          Wenn du ein Veranstalter oder Venue bist und dein Event regelmässig erscheinen soll,
          melde dich:
        </p>
        <a href="mailto:hallo@waslauft.in" className={styles.email}>
          hallo@waslauft.in
        </a>
      </section>

      <footer className={styles.footer}>
        <a href="https://instagram.com/waslauft.in" target="_blank" rel="noopener">Instagram</a>
        <Link href="/about">About</Link>
        <Link href="/datenschutz">Datenschutz</Link>
        <Link href="/impressum">Impressum</Link>
      </footer>
    </main>
  )
}
