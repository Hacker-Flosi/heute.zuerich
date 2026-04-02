// src/components/EventList.tsx
'use client'

import { useState } from 'react'
import { Event } from '@/lib/constants'
import EventBlock from './EventBlock'
import styles from './EventList.module.css'

interface EventListProps {
  today: Event[]
  tomorrow: Event[]
  dayAfter: Event[]
}

const TABS = ['heute', 'morgen', 'übermorgen'] as const

export default function EventList({ today, tomorrow, dayAfter }: EventListProps) {
  const [activeTab, setActiveTab] = useState<number>(0)

  const events = [today, tomorrow, dayAfter]
  const currentEvents = events[activeTab] || []

  return (
    <>
      {/* Header */}
      <header className={styles.header}>
        <a href="/" className={styles.logo}>heute.zürich</a>
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

      {/* Event List */}
      <ul className={styles.list}>
        {currentEvents.length > 0 ? (
          currentEvents.map((event, i) => (
            <EventBlock key={event._id} event={event} index={i} />
          ))
        ) : (
          <li className={styles.empty}>
            Keine kuratierten Events für diesen Tag.
          </li>
        )}
      </ul>

      {/* Footer */}
      <footer className={styles.footer}>
        <span className={styles.footerLeft}>AI-kuratiert · Zürich · 2026</span>
        <div className={styles.footerRight}>
          <a href="https://instagram.com/heute.zuerich" target="_blank" rel="noopener">
            Instagram
          </a>
          <a href="mailto:hallo@heute-zuerich.ch">Event melden</a>
        </div>
      </footer>
    </>
  )
}
