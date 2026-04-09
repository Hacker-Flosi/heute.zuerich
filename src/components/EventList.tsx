'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Event } from '@/lib/constants'
import { FEATURE_BADWEATHER } from '@/lib/features'
import EventBlock from './EventBlock'
import LogoAnimated from './LogoAnimated'
import BadWeatherToggle from './BadWeatherToggle'
import RainIntro from './RainIntro'
import RainEffect from './RainEffect'
import styles from './EventList.module.css'

const INDOOR_TYPES = new Set(['konzert', 'dj_club', 'party', 'kultur', 'kunst', 'special'])

interface EventListProps {
  city: string
  cityLabel: string
  logoUrl?: string | null
  today: Event[]
  tomorrow: Event[]
  dayAfter: Event[]
  rainToday?: Event[]
  rainTomorrow?: Event[]
  rainDayAfter?: Event[]
  isRainy?: boolean
}

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function getTabLabel(label: string, offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${label},${WEEKDAYS[d.getDay()]}`
}

const TAB_LABELS = [
  getTabLabel('Heute', 0),
  getTabLabel('Morgen', 1),
  getTabLabel('Übermorgen', 2),
]

export default function EventList({ city, cityLabel, logoUrl, today, tomorrow, dayAfter, rainToday, rainTomorrow, rainDayAfter, isRainy }: EventListProps) {
  const [activeTab, setActiveTab] = useState<number>(0)
  const [badWeather, setBadWeather] = useState<boolean>(false)
  const [showRain, setShowRain] = useState<boolean>(false)
  const rainTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function toggleBadWeather() {
    const next = !badWeather
    document.documentElement.dataset.rain = next ? 'true' : 'false'
    setBadWeather(next)
    if (next) {
      setShowRain(true)
      if (rainTimer.current) clearTimeout(rainTimer.current)
      rainTimer.current = setTimeout(() => setShowRain(false), 3000)
    } else {
      setShowRain(false)
      if (rainTimer.current) clearTimeout(rainTimer.current)
    }
  }

  useEffect(() => {
    return () => { if (rainTimer.current) clearTimeout(rainTimer.current) }
  }, [])

  const events = [today, tomorrow, dayAfter]
  const rainReserve = [rainToday ?? [], rainTomorrow ?? [], rainDayAfter ?? []]
  const currentEvents = events[activeTab] || []
  const displayEvents = FEATURE_BADWEATHER && badWeather
    ? [...currentEvents.filter(e => INDOOR_TYPES.has(e.eventType ?? '')), ...rainReserve[activeTab]]
        .sort((a, b) => a.time.localeCompare(b.time))
    : currentEvents

  return (
    <>
      {showRain && <RainEffect />}
      {/* Non-sticky: scrolls away */}
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <LogoAnimated />
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
        {FEATURE_BADWEATHER && badWeather && (
          <RainIntro dayLabel={TAB_LABELS[activeTab].replace(',', ' ')} />
        )}
        {displayEvents.length > 0 ? (
          displayEvents.map((event, i) => (
            <EventBlock key={event._id} event={event} index={i} />
          ))
        ) : (
          <li className={styles.empty}>
            {FEATURE_BADWEATHER && badWeather
              ? 'Keine Indoor-Events für diesen Tag.'
              : 'Keine Events für diesen Tag.'}
          </li>
        )}
      </ul>

      {FEATURE_BADWEATHER && (
        <BadWeatherToggle
          active={badWeather}
          onToggle={toggleBadWeather}
          autoSuggested={isRainy}
        />
      )}

      <footer className={styles.footer}>
        <a href="https://instagram.com/waslauft.in" target="_blank" rel="noopener">Instagram</a>
        <Link href="/about">About</Link>
        <Link href="/datenschutz">Datenschutz</Link>
      </footer>
    </>
  )
}
