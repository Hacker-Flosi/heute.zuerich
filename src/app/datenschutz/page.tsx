// src/app/datenschutz/page.tsx

import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ClearRainMode from '@/components/ClearRainMode'
import ConsentRevokeButton from './ConsentRevokeButton'
import styles from '../about/about.module.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'waslauft.in / Datenschutz',
  description: 'Datenschutzerklärung für waslauft.in — Informationen zur Datenverarbeitung.',
}

export default function DatenschutzPage() {
  return (
    <main className={styles.main}>
      <ClearRainMode />
      <SiteHeader current="Datenschutz" />

      <section className={styles.content}>
        <h1 className={styles.headline}>Datenschutz&shy;erklärung</h1>

        <h2 className={styles.contactHeadline}>Verantwortlicher</h2>
        <p className={styles.body}>
          Florin Grunder<br />
          Zürich, Schweiz<br />
          <a href="mailto:hallo@waslauft.in" className={styles.email}>hallo@waslauft.in</a>
        </p>

        <h2 className={styles.contactHeadline}>Allgemeines</h2>
        <p className={styles.body}>
          waslauft.in erhebt keine personenbezogenen Daten. Es gibt kein Login, keine Registrierung,
          keinen Newsletter und keine Nutzerkonten. Die Seite zeigt täglich kuratierte Events — anonym
          und ohne Tracking, sofern du dem nicht zustimmst.
        </p>

        <h2 className={styles.contactHeadline}>Hosting</h2>
        <p className={styles.body}>
          Diese Website wird über <strong>Vercel Inc.</strong> (440 N Barranca Ave #4133, Covina, CA 91723, USA)
          gehostet. Dabei können technische Zugriffsdaten (IP-Adresse, Browser-Typ, Zeitstempel) kurzzeitig
          in Server-Logs erfasst werden. Diese Daten werden nicht mit anderen Daten zusammengeführt und
          nach spätestens 24 Stunden gelöscht. Vercel ist unter dem EU-U.S. Data Privacy Framework zertifiziert.
        </p>

        <h2 className={styles.contactHeadline}>Schriften & Icons</h2>
        <p className={styles.body}>
          Auf dieser Seite werden Schriften (JetBrains Mono) und Icons (Material Icons) über den
          CDN-Dienst von <strong>Google LLC</strong> (1600 Amphitheatre Parkway, Mountain View, CA 94043, USA)
          geladen. Dabei wird deine IP-Adresse an Google-Server übermittelt. Google LLC ist unter dem
          EU-U.S. Data Privacy Framework zertifiziert. Datenschutzerklärung:{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className={styles.email}>
            policies.google.com/privacy
          </a>
        </p>

        <h2 className={styles.contactHeadline}>Google Analytics</h2>
        <p className={styles.body}>
          Mit deiner Einwilligung setzen wir <strong>Google Analytics 4</strong> (Anbieter: Google LLC) ein,
          um anonymisierte Nutzungsstatistiken zu erheben — Seitenaufrufe, Verweildauer und Herkunftsregionen.
          IP-Adressen werden vor der Speicherung anonymisiert. Die Daten werden auf Servern von Google (USA)
          gespeichert und nach 14 Monaten automatisch gelöscht.
        </p>
        <p className={styles.body}>
          Ohne deine Zustimmung wird Google Analytics nicht aktiviert. Die Einwilligung basiert auf Art. 6
          Abs. 1 lit. a DSGVO / Art. 31 Abs. 1 nDSG und kann jederzeit widerrufen werden.
        </p>

        <h2 className={styles.contactHeadline}>Einwilligung widerrufen</h2>
        <p className={styles.body}>
          Du kannst deine Cookie-Einwilligung jederzeit zurückziehen. Die Einstellung wird im{' '}
          <code>localStorage</code> deines Browsers gespeichert.
        </p>
        <ConsentRevokeButton />
        <p className={styles.body} style={{ marginTop: '0.75rem' }}>
          Browser-Opt-Out:{' '}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className={styles.email}>
            tools.google.com/dlpage/gaoptout
          </a>
        </p>

        <h2 className={styles.contactHeadline}>Wetterdaten</h2>
        <p className={styles.body}>
          Für den Schlechtwetter-Modus werden Wetterdaten über <strong>Open-Meteo</strong> (open-meteo.com,
          Schweiz) abgerufen. Es werden ausschliesslich die Koordinaten von Stadtzentren übermittelt —
          keine personenbezogenen Daten.
        </p>

        <h2 className={styles.contactHeadline}>Externe Links</h2>
        <p className={styles.body}>
          waslauft.in verlinkt auf Websites von Drittanbietern (Eventveranstalter, Ticketplattformen, Venues).
          Für deren Inhalte und Datenschutzpraktiken übernehmen wir keine Verantwortung.
        </p>

        <h2 className={styles.contactHeadline}>Deine Rechte</h2>
        <p className={styles.body}>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung deiner
          Daten sowie auf Datenübertragbarkeit und Widerspruch. Da waslauft.in keine Nutzerkonten führt,
          liegen in aller Regel keine gespeicherten personenbezogenen Daten vor.
        </p>
        <p className={styles.body}>
          Bei Beschwerden kannst du dich an die{' '}
          <strong>Eidgenössische Datenschutz- und Öffentlichkeitsbeauftragte (EDÖB)</strong> wenden:{' '}
          <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener noreferrer" className={styles.email}>
            edoeb.admin.ch
          </a>{' '}
          — oder an die zuständige Datenschutzbehörde deines EU-Wohnsitzlandes.
        </p>

        <h2 className={styles.contactHeadline}>Kontakt</h2>
        <p className={styles.body}>
          Bei Fragen zum Datenschutz:{' '}
          <a href="mailto:hallo@waslauft.in" className={styles.email}>hallo@waslauft.in</a>
        </p>
      </section>

      <SiteFooter />
    </main>
  )
}
