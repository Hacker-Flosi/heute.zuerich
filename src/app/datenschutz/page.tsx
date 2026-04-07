'use client'

// src/app/datenschutz/page.tsx

import Link from 'next/link'
import styles from '../about/about.module.css'

export default function DatenschutzPage() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>waslauft.in</Link>
        <span className={styles.current}>Datenschutz</span>
      </header>

      <section className={styles.content}>
        <h1 className={styles.headline}>Datenschutz&shy;erklärung</h1>

        <h2 className={styles.contactHeadline}>Verantwortlicher</h2>
        <p className={styles.body}>
          Florin Grunder<br />
          Zürich, Schweiz<br />
          <a href="mailto:hallo@waslauft.in" className={styles.email}>hallo@waslauft.in</a>
        </p>

        <h2 className={styles.contactHeadline}>Welche Daten wir erheben</h2>
        <p className={styles.body}>
          waslauft.in erhebt keine personenbezogenen Daten. Es gibt kein Login, keine Registrierung und keinen Newsletter.
        </p>
        <p className={styles.body}>
          Mit deiner Zustimmung setzen wir <strong>Google Analytics 4</strong> ein, um anonymisierte Nutzungsstatistiken zu erheben (Seitenaufrufe, Verweildauer, Herkunft). IP-Adressen werden anonymisiert. Die Daten werden auf Servern von Google LLC (USA) gespeichert.
        </p>
        <p className={styles.body}>
          Ohne deine Zustimmung wird Google Analytics nicht aktiviert.
        </p>

        <h2 className={styles.contactHeadline}>Cookies</h2>
        <p className={styles.body}>
          Wir speichern deine Cookie-Entscheidung im <code>localStorage</code> deines Browsers. Es werden keine Tracking-Cookies ohne Zustimmung gesetzt.
        </p>

        <h2 className={styles.contactHeadline}>Zustimmung widerrufen</h2>
        <p className={styles.body}>
          Du kannst deine Zustimmung jederzeit widerrufen, indem du den Browser-Verlauf und lokalen Speicher löschst oder die Einwilligung unten zurückziehst.
        </p>
        <button
          className={styles.email}
          style={{ cursor: 'pointer', background: 'none' }}
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('cookie_consent')
              window.location.reload()
            }
          }}
        >
          Cookie-Einwilligung zurückziehen
        </button>

        <h2 className={styles.contactHeadline} style={{ marginTop: '2rem' }}>Google Analytics</h2>
        <p className={styles.body}>
          Anbieter: Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA.<br />
          Datenschutzerklärung: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className={styles.email}>policies.google.com/privacy</a><br />
          Opt-Out: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className={styles.email}>tools.google.com/dlpage/gaoptout</a>
        </p>

        <h2 className={styles.contactHeadline}>Rechtsgrundlage (nDSG / DSGVO)</h2>
        <p className={styles.body}>
          Die Bearbeitung von Analysedaten erfolgt ausschliesslich auf Grundlage deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO / Art. 31 Abs. 1 nDSG). Du kannst diese jederzeit widerrufen.
        </p>

        <h2 className={styles.contactHeadline}>Kontakt</h2>
        <p className={styles.body}>
          Bei Fragen zum Datenschutz wende dich an:{' '}
          <a href="mailto:hallo@waslauft.in" className={styles.email}>hallo@waslauft.in</a>
        </p>
      </section>

      <footer className={styles.footer}>
        <a href="https://instagram.com/waslauft.in" target="_blank" rel="noopener">Instagram</a>
        <Link href="/about">About</Link>
        <Link href="/datenschutz">Datenschutz</Link>
      </footer>
    </main>
  )
}
