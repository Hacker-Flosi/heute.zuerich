// src/app/about/page.tsx — About page

import { getSanityClient } from '@/lib/sanity'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import FaqAccordion from './FaqAccordion'
import ClearRainMode from '@/components/ClearRainMode'
import styles from './about.module.css'
import type { Metadata } from 'next'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'waslauft.in / About',
  description: 'Weniger Noise, mehr Ausgang.',
}

const COLORS = [
  '#FF0000', '#FF00FF', '#00E5FF', '#FFB800',
  '#00E05A', '#5B5BFF', '#FF4D94', '#C864FF',
  '#FFE500', '#FF6B35', '#00FF94',
]

const CITIES = [
  { label: 'Zürich',     slug: 'zuerich',    active: true,  color: '#FF0000' },
  { label: 'Basel',      slug: 'basel',       active: true,  color: '#FF00FF' },
  { label: 'St.Gallen',  slug: 'stgallen',    active: true,  color: '#00E5FF' },
  { label: 'Luzern',     slug: 'luzern',      active: true,  color: '#FFB800' },
  { label: 'Winterthur', slug: 'winterthur',  active: true,  color: '#00E05A' },
  { label: 'Bern',       slug: 'bern',        active: false, color: '#333333' },
]

const FEATURES = [
  { label: 'Täglich',       color: COLORS[4],  text: 'Jeden Morgen werden Events aus verschiedenen Quellen zusammengetragen — Veranstaltungsseiten, Venue-Kalender, Ticketplattformen.' },
  { label: 'Kuratiert',     color: COLORS[3],  text: 'Aus dem Rohmaterial werden die relevantesten 20–30 Events ausgewählt. Dauerausstellungen, Werbeveranstaltungen und Kurse fliegen raus.' },
  { label: '3 Tage',        color: COLORS[2],  text: 'Heute, morgen, übermorgen — mit einem Klick zwischen den Tagen wechseln und spontan oder vorausschauend planen.' },
  { label: 'Schlechtwetter',color: COLORS[5],  text: 'Bei Regen wechselt die Seite automatisch in den Drinnen-Modus und zeigt nur Indoor-Events — Konzerte, Kultur, Clubs.' },
  { label: 'Instagram',     color: COLORS[6],  text: 'Jeden Morgen erscheinen die besten Events auch auf Instagram — als Post und als Stories pro Stadt.', link: { href: 'https://instagram.com/waslauft.in', label: '@waslauft.in' } },
  { label: 'Direkt',        color: COLORS[7],  text: 'Kein Login, keine Filter, keine Kategorien. Ein Klick führt direkt zum Veranstalter — keine Zwischenseiten.' },
]

const FAQ = [
  { q: 'Warum fehlt mein Event?',         a: 'Es werden täglich die relevantesten Events pro Stadt ausgewählt — etwa 20–30 Stück. Wer nicht dabei ist, kann sich melden.' },
  { q: 'Wie oft wird aktualisiert?',       a: 'Jeden Morgen um 07:00 Uhr werden die Events für heute, morgen und übermorgen neu geladen.' },
  { q: 'Kann ich mein Event eintragen lassen?', a: 'Ja — schreib mir kurz an hallo@waslauft.in. Venues die regelmässig gute Events machen, nehme ich gerne auf.' },
  { q: 'Was bedeuten die Farben?',         a: 'Nichts. Die sehen einfach nice aus.' },
  { q: 'Kostet das etwas?',               a: 'Nein — weder für Nutzer noch für Veranstalter. waslauft.in ist ein Nebenprojekt, kein Business.' },
]

interface Venue { name: string; tier: string }

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
      <ClearRainMode />
      <SiteHeader current="About" />

      <div className={styles.teletext}>
      {/* ── Intro ── */}
      <section className={styles.introSection}>
        <h1 className={styles.headline}>Was steckt<br />dahinter?</h1>
        <div className={styles.introBody}>
          <p className={styles.body} style={{ color: '#000' }}>
            Ich heisse Florin. Kennst du das? Man will eine Date-Idee finden, spontan was
            unternehmen oder ist gerade in einer neuen Stadt — und sitzt am Ende mit zehn
            offenen Tabs und immer noch keiner Entscheidung.
          </p>
          <p className={styles.body} style={{ color: '#000' }}>
            waslauft.in ist meine Antwort darauf. Inspiriert vom Teletext: die wichtigsten
            Infos, sofort scanbar, ohne Umwege. Ich habe es zuerst für mich gebaut — aber
            als meine Freunde es täglich genutzt haben und nicht mehr ohne konnten, war klar:
            das gehört geteilt.
          </p>
        </div>
      </section>

      {/* ── Bento Grid ── */}
      <div className={styles.bentoGrid}>

        {/* Suport */}
        <div className={`${styles.bentoItem} ${styles.bentoSuport}`}>
          <h2 className={styles.sectionBar} style={{ color: '#00E05A' }}>Suport</h2>
          <div className={styles.suportSection}>
            <img src="/illustrations/suport.svg" className={styles.illustration} alt="" />
            <div className={styles.sectionContent}>
              <p className={styles.body} style={{ color: '#000' }}>
                Der ganze Aufwand — Unterhalt, Updates und alles was dazu gehört — geht auf meinen Nacken. Wenn du willst, dass das Ding weiterlebt, kannst du mir einen Kaffee spendieren.
              </p>
              <a
                href="https://buymeacoffee.com/grunderdiga"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.bmcButton}
              >
                Spendier ein Kaffee
              </a>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className={`${styles.bentoItem} ${styles.bentoFaq}`}>
          <h2 className={styles.sectionBar} style={{ color: '#FFB800' }}>FAQ</h2>
          <div className={styles.faqSection}>
            <FaqAccordion items={FAQ} />
          </div>
        </div>

        {/* Wie funktioniert's */}
        <div className={`${styles.bentoItem} ${styles.bentoFeatures}`}>
          <h2 className={styles.sectionBar} style={{ color: '#FF0000' }}>Wie funktioniert's?</h2>
          <div className={styles.featureSection}>
            <img src="/illustrations/wie-funtionierts.svg" className={styles.illustration} alt="" />
            <ul className={styles.featureList}>
              {FEATURES.map((f) => (
                <li key={f.label} className={styles.featureItem}>
                  <p className={styles.featureText}>
                    <span className={styles.featureLabel}>{f.label}</span>{' '}
                    {f.text}
                    {f.link && (
                      <> <a href={f.link.href} target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>{f.link.label}</a></>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Die Städte */}
        <div className={`${styles.bentoItem} ${styles.bentoStaedte}`}>
          <h2 className={styles.sectionBar} style={{ color: '#FE00FF' }}>Die Städte</h2>
          <div className={styles.stadtSection}>
            <img src="/illustrations/stadt.svg" className={styles.illustration} alt="" />
            <ul className={styles.cityList}>
              {CITIES.map((city) => (
                <li key={city.slug}>
                  {city.active ? (
                    <a href={`/${city.slug}`} className={styles.cityBlock}>
                      <div className={styles.cityBlockHeader} style={{ background: '#000' }}>
                        <span className={styles.cityBlockName} style={{ color: '#FE00FF' }}>
                          {city.label}
                        </span>
                        <span className={styles.cityBlockArrow}>→</span>
                      </div>
                      {venuesByCity[city.slug]?.length > 0 && (
                        <div className={styles.venueList}>
                          {venuesByCity[city.slug].map((v) => (
                            <span key={v.name} className={styles.venueTag}>{v.name}</span>
                          ))}
                        </div>
                      )}
                    </a>
                  ) : (
                    <div className={styles.cityBlockInactive}>
                      <div className={styles.cityBlockHeader} style={{ background: '#000' }}>
                        <span className={styles.cityBlockName} style={{ color: '#444' }}>
                          {city.label}
                        </span>
                        <span className={styles.citySoon}>Coming soon</span>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Feedback */}
        <div className={`${styles.bentoItem} ${styles.bentoFeedback}`}>
          <h2 className={styles.sectionBar} style={{ color: '#00E5FF' }}>Feedback</h2>
          <div className={styles.feedbackSection}>
            <img src="/illustrations/feedback.svg" className={styles.illustration} alt="" />
            <div className={styles.sectionContent}>
              <p className={styles.body} style={{ color: '#000' }}>
                Keine E-Mail, kein Account — anonym.
                Dein Feedback entscheidet direkt was als nächstes gebaut wird.
              </p>
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSfKRJDusXjOPQXQkMKxnYAiz_etFB9jrMSsIcKr1P6yTK_CUw/viewform?usp=dialog"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.feedbackButton}
              >
                Feedback Formular
              </a>
            </div>
          </div>
        </div>

        {/* Kontakt */}
        <div className={`${styles.bentoItem} ${styles.bentoKontakt}`}>
          <h2 className={styles.sectionBar} style={{ color: '#FFB800' }}>Kontakt</h2>
          <div className={styles.faqSection}>
            <div className={styles.sectionContent}>
              <p className={styles.body} style={{ color: '#000' }}>
                Event eintragen lassen, Fehler melden, oder einfach Hallo sagen:
              </p>
              <a href="mailto:hallo@waslauft.in" className={styles.kontaktButton}>
                hallo@waslauft.in
              </a>
            </div>
          </div>
        </div>

      </div>

      </div>

      <SiteFooter />
    </main>
  )
}
