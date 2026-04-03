// src/app/about/page.tsx — About page

import Link from 'next/link'
import styles from './about.module.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'waslauft.in / About',
  description: 'Weniger Noise, mehr Ausgang.',
}

export default function AboutPage() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <Link href="/" className={styles.breadcrumb}>waslauft.in</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>About</span>
      </header>

      <section className={styles.content}>
        <h1 className={styles.headline}>Weniger Noise,<br />mehr Ausgang.</h1>
        <p className={styles.body}>
          waslauft.in ist eine kuratierte Event-Seite für Schweizer Städte.
          Kein Algorithmus, keine Werbung, keine 500 Einträge — nur die Veranstaltungen,
          die es wirklich wert sind.
        </p>
        <p className={styles.body}>
          Täglich werden die besten 10–15 Events ausgewählt und chronologisch aufgelistet.
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
      </footer>
    </main>
  )
}
