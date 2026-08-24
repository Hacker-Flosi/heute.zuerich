// src/components/PageTransitionProvider.tsx — Farbwisch-Übergang bei Stadtwechsel

'use client'

import React, { createContext, useContext, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './PageTransitionProvider.module.css'

interface TransitionContextValue {
  // onCovered läuft erst, wenn der Screen voll abgedeckt ist (z.B. Dropdown schliessen) —
  // damit nichts vom Seitenwechsel sichtbar wird, bevor der Wisch alles verdeckt hat.
  transitionTo: (href: string, color: string, onCovered?: () => void) => void
}

const TransitionContext = createContext<TransitionContextValue | null>(null)

export function usePageTransition(): TransitionContextValue {
  const ctx = useContext(TransitionContext)
  if (!ctx) throw new Error('usePageTransition muss innerhalb von PageTransitionProvider verwendet werden')
  return ctx
}

// Muss zur @keyframes pageWipe Timing in PageTransitionProvider.module.css passen:
// bei 42% ist der Screen voll abgedeckt — dort wird navigiert.
const DURATION_MS = 780
const NAVIGATE_AT_MS = 330

/**
 * Mobile Safari färbt die Safe-Area/Statusleiste anhand des Seitenhintergrunds ein,
 * hinkt dabei aber bei SPA-Navigation spürbar hinterher (~2s), weil es ohne
 * `theme-color`-Meta-Tag selbst raten/samplen muss. Nur das content-Attribut eines
 * bestehenden Tags zu mutieren reicht auf echten iOS-Geräten oft nicht — Safari
 * übernimmt die Änderung zuverlässiger, wenn das Tag komplett neu eingefügt wird.
 */
function setThemeColor(color: string) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((el) => el.remove())
  const meta = document.createElement('meta')
  meta.setAttribute('name', 'theme-color')
  meta.setAttribute('content', color)
  document.head.appendChild(meta)
}

/** Liest die tatsächlich gerenderte Hintergrundfarbe aus (funktioniert für jede
 * Seite/jedes Theme generisch, ohne Spezialfälle pro Route hart zu codieren).
 * Manche Seiten (z.B. die Homepage) setzen ihren Hintergrund auf <main> statt auf
 * <body> — deshalb zuerst dort nachsehen und nur bei Transparenz auf body zurückfallen. */
function sampleBodyBackground() {
  const main = document.querySelector('main')
  const mainBg = main ? getComputedStyle(main).backgroundColor : null
  const isTransparent = !mainBg || mainBg === 'rgba(0, 0, 0, 0)' || mainBg === 'transparent'
  setThemeColor(isTransparent ? getComputedStyle(document.body).backgroundColor : mainBg)
}

export default function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Baseline beim Erstladen + hält das Meta-Tag synchron zu Theme-/Regen-Wechseln
  // ausserhalb von Navigationen (z.B. Dark-Mode-Toggle ohne Seitenwechsel).
  useEffect(() => {
    sampleBodyBackground()
    const observer = new MutationObserver(() => {
      requestAnimationFrame(sampleBodyBackground)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-rain'] })
    return () => observer.disconnect()
  }, [])

  // Direkte DOM-Manipulation statt React-State: läuft synchron im selben Klick-Handler
  // wie z.B. das Schliessen des Städte-Dropdowns, sodass beides im selben Frame gemalt
  // wird — kein sichtbarer Frame mit der alten Seite, bevor der Wisch startet.
  const transitionTo = useCallback((href: string, panelColor: string, onCovered?: () => void) => {
    timers.current.forEach(clearTimeout)
    timers.current = []

    const el = panelRef.current
    if (!el) { onCovered?.(); router.push(href); return }

    el.style.backgroundColor = panelColor
    el.classList.remove(styles.panelActive)
    void el.offsetWidth // Reflow erzwingen — Animation neu starten bei schnell aufeinanderfolgenden Klicks
    el.classList.add(styles.panelActive)
    // Safe-Area/Statusleiste sofort auf die Wisch-Farbe — sonst hängt Safari
    // ein paar Sekunden auf der alten Seitenfarbe fest.
    setThemeColor(panelColor)

    // Erst wenn der Screen voll abgedeckt ist (Panel bei 42% der Animation): dahinter
    // verstecktes Menü schliessen und navigieren — nichts vom Wechsel wird sichtbar.
    timers.current.push(setTimeout(() => { onCovered?.(); router.push(href) }, NAVIGATE_AT_MS))
    timers.current.push(setTimeout(() => {
      panelRef.current?.classList.remove(styles.panelActive)
      // Wisch ist weg — jetzt auf die tatsächliche Hintergrundfarbe der neuen Seite zurück.
      sampleBodyBackground()
    }, DURATION_MS))
  }, [router])

  return (
    <TransitionContext.Provider value={{ transitionTo }}>
      {children}
      <div ref={panelRef} className={styles.panel} aria-hidden="true" />
    </TransitionContext.Provider>
  )
}
