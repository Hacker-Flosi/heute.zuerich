'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Event } from '@/lib/constants'
import EventBlock from './EventBlock'
import styles from './EventList.module.css'

interface EventListProps {
  city: string
  cityLabel: string
  logoUrl?: string | null
  today: Event[]
  tomorrow: Event[]
  dayAfter: Event[]
}

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function getTabLabel(label: string, offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${label}, ${WEEKDAYS[d.getDay()]}`
}

const TAB_LABELS = [
  getTabLabel('Heute', 0),
  getTabLabel('Morgen', 1),
  getTabLabel('Übermorgen', 2),
]

export default function EventList({ city, cityLabel, logoUrl, today, tomorrow, dayAfter }: EventListProps) {
  const [activeTab, setActiveTab] = useState<number>(0)

  const events = [today, tomorrow, dayAfter]
  const currentEvents = events[activeTab] || []

  return (
    <>
      {/* Non-sticky: scrolls away */}
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          {logoUrl
            ? <Image src={logoUrl} alt="waslauft.in" className={styles.logoImage} width={160} height={28} />
            : 'waslauft.in'
          }
        </Link>
        <span className={styles.city}>{cityLabel}</span>
      </header>

      {/* Sticky: only the pills, transparent background */}
      <div className={styles.stickyNav}>
        <nav className={styles.tabs}>
          {TAB_LABELS.map((label, i) => (
            <button
              key={i}
              className={`${styles.tab} ${i === activeTab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <ul className={styles.list}>
        {currentEvents.length > 0 ? (
          currentEvents.map((event, i) => (
            <EventBlock key={event._id} event={event} index={i} />
          ))
        ) : (
          <li className={styles.empty}>
            Keine Events für diesen Tag.
          </li>
        )}
      </ul>

      <footer className={styles.footer}>
        <a href="https://instagram.com/waslauft.in" target="_blank" rel="noopener">Instagram</a>
        <Link href="/about">About</Link>
        <Link href="/datenschutz">Datenschutz</Link>
      </footer>
    </>
  )
}
