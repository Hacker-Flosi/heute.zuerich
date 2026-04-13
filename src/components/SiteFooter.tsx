// src/components/SiteFooter.tsx — Gemeinsamer Footer für alle Seiten

import Link from 'next/link'
import styles from './SiteFooter.module.css'

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <a href="https://instagram.com/waslauft.in" target="_blank" rel="noopener">Instagram</a>
      <Link href="/about">About</Link>
      <Link href="/datenschutz">Datenschutz</Link>
      <Link href="/impressum">Impressum</Link>
    </footer>
  )
}
