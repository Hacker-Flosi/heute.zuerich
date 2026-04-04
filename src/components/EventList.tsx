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
