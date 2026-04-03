// src/components/EventList.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Event } from '@/lib/constants'
import EventBlock from './EventBlock'
import styles from './EventList.module.css'

interface EventListProps {
  city: string
  cityLabel: string
  today: Event[]
  tomorrow: Event[]
  dayAfter: Event[]
}

const TABS = ['heute', 'morgen', 'übermorgen'] as const

export default function EventList({ city, cityLabel, today, tomorrow, dayAfter }: EventListProps) {
  const [activeTab, setActiveTab] = useState<number>(0)

  const events = [today, tomorrow, dayAfter]
  const currentEvents = events[activeTab] || []

  return (
    <>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>waslauft.in</Link>
        <span className={styles.city}>{cityLabel}</span>
        <nav className={styles.tabs}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              className={`${styles.tab} ${i === activeTab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

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
      </footer>
    </>
  )
}
