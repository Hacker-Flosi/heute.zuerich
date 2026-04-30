// src/app/about/page.tsx — About page

import { getSanityClient } from '@/lib/sanity'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import styles from './about.module.css'
import type { Metadata } from 'next'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'waslauft.in / About',
  description: 'Weniger Noise, mehr Ausgang.',
}

const CITIES = [
  { label: 'Zürich', slug: 'zuerich', active: true },
  { label: 'Basel', slug: 'basel', active: true },
  { label: 'St.Gallen', slug: 'stgallen', active: true },
  { label: 'Luzern', slug: 'luzern', active: true },
  { label: 'Winterthur', slug: 'winterthur', active: true },
  { label: 'Bern', slug: 'bern', active: false },
]

interface Venue { name: string; tier: string }

const FAQ = [
  {
    q: 'Warum fehlt mein Event?',
    a: 'Es werden täglich die relevantesten Events pro Stadt ausgewählt — etwa 20–30 Stück. Wer nicht dabei ist, kann sich melden.',
  },
  {
    q: 'Wie oft wird aktualisiert?',
    a: 'Jeden Morgen um 07:00 Uhr werden die Events für heute, morgen und übermorgen neu geladen.',
  },
  {
    q: 'Kann ich mein Event eintragen lassen?',
    a: 'Ja — schreib mir kurz an hallo@waslauft.in. Venues die regelmässig gute Events machen, nehme ich gerne auf.',
  },
  {
    q: 'Was bedeuten die Farben?',
    a: 'Nichts. Die sehen einfach nice aus.',
  },
  {
    q: 'Kostet das etwas?',
    a: 'Nein — weder für Nutzer noch für Veranstalter. waslauft.in ist ein Nebenprojekt, kein Business.',
  },
]

export default async function AboutPage() {
  const client = getSanityClient()
  const venuesByCity = await client.fetch<Record<string, Venue[]>>(
    `{
      'zuerich':    *[_type=='venue' && city=='zuerich'    && active==true && (tier=='S' || tier=='A')] | order(tier asc, name asc) { name, tier },
      'basel':      *[_type=='venue' && city=='basel'      && active==true && (tier=='S' || tier=='A')] | order(tier asc, name asc) { name, tier },
      'stgallen':   *[_type=='venue' && city=='stgallen'   && active==true && (tier=='S' || tier=='A')] | order(tier asc, name asc) { name, tier },
      'luzern':     *[_type=='venue' && city=='luzern'     && active==true && (tier=='S' || tier=='A')] | order(tier asc, name asc) { name, tier },
      'winterthur': *[_type=='venue' && city=='winterthur' && active==true && (tier=='S' || tier=='A')] | order(tier asc, name asc) { name, tier },
    }`
  )

  return (
    <main className={styles.main}>
      <SiteHeader current="About" />

      {/* ── Intro ── */}
      <section className={styles.section}>
        <h1 className={styles.headline}>Was steckt<br />dahinter?</h1>
        <p className={styles.body}>
          Ich heisse Florin. Kennst du das? Man will eine Date-Idee finden, spontan was
          unternehmen oder ist gerade in einer neuen Stadt — und sitzt am Ende mit zehn
          offenen Tabs und immer noch keiner Entscheidung.
        </p>
        <p className={styles.body}>
          waslauft.in ist meine Antwort darauf. Inspiriert vom Teletext: die wichtigsten
          Infos, sofort scanbar, ohne Umwege. Ich habe es zuerst für mich gebaut — aber
          als meine Freunde es täglich genutzt haben und nicht mehr ohne konnten, war klar:
          das gehört geteilt.
        </p>
      </section>

      {/* ── Support / Twint ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeadline}>Unterstützen</h2>
        <p className={styles.body}>
          Bis jetzt geht alles auf meinen Nacken — falls dir waslauft.in gefällt
          und du Lust hast, einen Kaffee beizusteuern: sehr gerne.
        </p>
        <a
          href="https://buymeacoffee.com/grunderdiga"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.bmcButton}
        >
          ☕ Buy me a coffee
        </a>
      </section>

      {/* ── Wie funktioniert's ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeadline}>Wie funktioniert's?</h2>
        <ul className={styles.featureList}>
          <li className={styles.featureItem}>
            <span className={styles.featureLabel}>Täglich</span>
            <span className={styles.featureText}>
              Jeden Morgen werden Events aus verschiedenen Quellen zusammengetragen —
              Veranstaltungsseiten, Venue-Kalender, Ticketplattformen.
            </span>
          </li>
          <li className={styles.featureItem}>
            <span className={styles.featureLabel}>Kuratiert</span>
            <span className={styles.featureText}>
              Aus dem Rohmaterial werden die relevantesten 20–30 Events ausgewählt.
              Dauerausstellungen, Werbeveranstaltungen und Kurse fliegen raus.
            </span>
          </li>
          <li className={styles.featureItem}>
            <span className={styles.featureLabel}>3 Tage</span>
            <span className={styles.featureText}>
              Heute, morgen, übermorgen — mit einem Klick zwischen den Tagen wechseln
              und spontan oder vorausschauend planen.
            </span>
          </li>
          <li className={styles.featureItem}>
            <span className={styles.featureLabel}>Schlechtwetter</span>
            <span className={styles.featureText}>
              Bei Regen wechselt die Seite automatisch in den Drinnen-Modus und zeigt
              nur Indoor-Events — Konzerte, Kultur, Clubs.
            </span>
          </li>
          <li className={styles.featureItem}>
            <span className={styles.featureLabel}>Instagram</span>
            <span className={styles.featureText}>
              Jeden Morgen erscheinen die besten Events auch auf Instagram —
              als Post und als Stories pro Stadt.{' '}
              <a href="https://instagram.com/waslauft.in" target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>@waslauft.in</a>
            </span>
          </li>
          <li className={styles.featureItem}>
            <span className={styles.featureLabel}>Direkt</span>
            <span className={styles.featureText}>
              Kein Login, keine Filter, keine Kategorien. Ein Klick führt direkt
              zum Veranstalter — keine Zwischenseiten.
            </span>
          </li>
        </ul>
      </section>

      {/* ── Städte ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeadline}>Die Städte</h2>
        <ul className={styles.cityList}>
          {CITIES.map((city) => (
            <li key={city.slug} className={styles.cityItem}>
              {city.active ? (
                <div className={styles.cityRow}>
                  <a href={`/${city.slug}`} className={styles.cityLink}>
                    {city.label}
                    <span className={styles.cityActive}>Aktiv</span>
                  </a>
                  {venuesByCity[city.slug]?.length > 0 && (
                    <div className={styles.venueList}>
                      {venuesByCity[city.slug].map((v) => (
                        <span key={v.name} className={`${styles.venueTag} ${v.tier === 'S' ? styles.venueTagS : ''}`}>
                          {v.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span className={styles.cityInactive}>
                  {city.label}
                  <span className={styles.citySoon}>Coming soon</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeadline}>FAQ</h2>
        <dl className={styles.faqList}>
          {FAQ.map((item) => (
            <div key={item.q} className={styles.faqItem}>
              <dt className={styles.faqQ}>{item.q}</dt>
              <dd className={styles.faqA}>{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Feedback ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeadline}>Hilf mir, waslauft.in besser zu machen</h2>
        <p className={styles.body}>
          Keine E-Mail, kein Account — anonym.
          Dein Feedback entscheidet direkt was als nächstes gebaut wird.
        </p>
        <a
          href="https://forms.gle/PLACEHOLDER"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.feedbackLink}
        >
          Zum Feedback-Formular →
        </a>
      </section>

      {/* ── Kontakt ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeadline}>Kontakt</h2>
        <p className={styles.body}>
          Event eintragen lassen, Fehler melden, oder einfach Hallo sagen:
        </p>
        <a href="mailto:hallo@waslauft.in" className={styles.email}>
          hallo@waslauft.in
        </a>
      </section>

      <SiteFooter />
    </main>
  )
}
