'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './CookieBanner.module.css'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      setVisible(true)
    } else if (consent === 'accepted') {
      enableAnalytics()
    }
  }, [])

  function enableAnalytics() {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      })
    }
  }

  function accept() {
    localStorage.setItem('cookie_consent', 'accepted')
    enableAnalytics()
    setVisible(false)
  }

  function decline() {
    localStorage.setItem('cookie_consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={styles.banner}>
      <p className={styles.text}>
        Wir nutzen Google Analytics um zu verstehen, wie die Seite genutzt wird.{' '}
        <Link href="/datenschutz" className={styles.link}>Datenschutz</Link>
      </p>
      <div className={styles.actions}>
        <button className={styles.decline} onClick={decline}>Ablehnen</button>
        <button className={styles.accept} onClick={accept}>Akzeptieren</button>
      </div>
    </div>
  )
}
