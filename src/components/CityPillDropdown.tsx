'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { CITY_CONFIG } from '@/lib/constants'
import LogoAnimated from './LogoAnimated'
import BalloonsScene from './BalloonsScene'
import styles from './CityPillDropdown.module.css'

export default function CityPillDropdown({ currentSlug }: { currentSlug: string }) {
  const [open, setOpen] = useState(false)

  const current = CITY_CONFIG.find((c) => c.slug === currentSlug)
  const others  = CITY_CONFIG.filter((c) => c.slug !== currentSlug)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Lock body scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!current) return null

  return (
    <>
      {/* Trigger pill — ▴ when open, ▾ when closed */}
      <button
        className={styles.pill}
        style={{ '--pill-bg': current.color } as React.CSSProperties}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>{current.label}</span>
        <span className={styles.arrow}>{open ? '▴' : '▾'}</span>
      </button>

      {/* Full-screen overlay */}
      {open && (
        <div className={styles.overlay} role="dialog" aria-modal="true">
          <div className={styles.overlayHeader}>
            <Link href="/" className={styles.logo}>
              <LogoAnimated />
            </Link>
            <button
              className={styles.pill}
              style={{ '--pill-bg': current.color } as React.CSSProperties}
              onClick={() => setOpen(false)}
              aria-label="Menü schliessen"
            >
              <span>{current.label}</span>
              <span className={styles.arrow}>▴</span>
            </button>
          </div>

          <BalloonsScene
            cities={others.map((c) => ({ ...c, active: true }))}
            onNavigate={() => setOpen(false)}
          />
        </div>
      )}
    </>
  )
}
