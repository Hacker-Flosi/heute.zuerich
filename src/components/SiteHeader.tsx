// src/components/SiteHeader.tsx — Gemeinsamer Header mit Logo für alle Seiten

import Link from 'next/link'
import LogoAnimated from './LogoAnimated'
import styles from './SiteHeader.module.css'

interface SiteHeaderProps {
  current?: string
}

export default function SiteHeader({ current }: SiteHeaderProps) {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        <LogoAnimated />
      </Link>
      {current && <span className={styles.current}>{current}</span>}
    </header>
  )
}
