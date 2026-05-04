'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Event, FeaturedEvent } from '@/lib/constants'
import { FEATURE_BADWEATHER } from '@/lib/features'
import EventBlock from './EventBlock'
import FeaturedEventCallout from './FeaturedEventCallout'
import LogoAnimated from './LogoAnimated'
import BadWeatherToggle from './BadWeatherToggle'
import ThemeToggle from './ThemeToggle'
import RainIntro from './RainIntro'
import RainEffect from './RainEffect'
import SiteFooter from './SiteFooter'
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
  isRainyDays?: [boolean, boolean, boolean]
  featuredEvents?: FeaturedEvent[]
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

export default function EventList({ cityLabel, today, tomorrow, dayAfter, rainToday, rainTomorrow, rainDayAfter, isRainy, isRainyDays, featuredEvents }: EventListProps) {
  const [activeTab, setActiveTab] = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    const saved = sessionStorage.getItem('activeTab')
    const n = saved ? parseInt(saved, 10) : 0
    return n >= 0 && n <= 2 ? n : 0
  })
  const [badWeather, setBadWeather] = useState<boolean>(isRainy ?? false)
  const [showRain, setShowRain] = useState<boolean>(false)

  // Re-sync toggle if isRainy changes (e.g. navigating between cities)
  useEffect(() => {
    setBadWeather(isRainy ?? false)
    document.documentElement.dataset.rain = isRainy ? 'true' : 'false'
  }, [isRainy])

  // Auto-switch bad weather mode when changing tabs, based on per-day forecast
  useEffect(() => {
    if (!isRainyDays) return
    const rainy = isRainyDays[activeTab]
    setBadWeather(rainy)
    document.documentElement.dataset.rain = rainy ? 'true' : 'false'
    if (rainy) {
      setShowRain(true)
      if (rainTimer.current) clearTimeout(rainTimer.current)
      rainTimer.current = setTimeout(() => setShowRain(false), 3000)
    } else {
      setShowRain(false)
    }
  }, [activeTab, isRainyDays])
  const rainTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // On mount: if rainy, set CSS attribute + trigger rain animation once
  useEffect(() => {
    if (isRainy) {
      document.documentElement.dataset.rain = 'true'
      setShowRain(true)
      rainTimer.current = setTimeout(() => setShowRain(false), 3000)
    }
  }, [])

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

  // Featured events filtered for the active tab's date
  const tabDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + activeTab)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const tabFeatured = (featuredEvents ?? []).filter(
    (fe) => fe.dateFrom <= tabDate && fe.dateTo >= tabDate
  )

  return (
    <>
      {showRain && <RainEffect />}
      {/* Non-sticky: scrolls away */}
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <LogoAnimated />
        </Link>
        <h1 className={styles.city}>{cityLabel}</h1>
      </header>

      {/* Sticky: only the pills, transparent background */}
      <div className={styles.stickyNav}>
        <nav className={styles.tabs}>
          {TAB_LABELS.map((label, i) => (
            <button
              key={i}
              className={`${styles.tab} ${i === activeTab ? styles.tabActive : ''}`}
              onClick={() => { setActiveTab(i); sessionStorage.setItem('activeTab', String(i)) }}
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
          <>
            {displayEvents.slice(0, 3).map((event, i) => (
              <EventBlock key={event._id} event={event} index={i} />
            ))}
            {(() => {
              // Interleave: at least 1 regular event between two featured events
              const rest = displayEvents.slice(3)
              const items: React.ReactNode[] = []
              let feIdx = 0
              let evIdx = 0
              while (feIdx < tabFeatured.length) {
                items.push(<FeaturedEventCallout key={tabFeatured[feIdx]._id} event={tabFeatured[feIdx]} />)
                feIdx++
                // Insert one regular event as separator if another featured follows
                if (feIdx < tabFeatured.length && evIdx < rest.length) {
                  items.push(<EventBlock key={rest[evIdx]._id} event={rest[evIdx]} index={evIdx + 3} />)
                  evIdx++
                }
              }
              while (evIdx < rest.length) {
                items.push(<EventBlock key={rest[evIdx]._id} event={rest[evIdx]} index={evIdx + 3} />)
                evIdx++
              }
              return items
            })()}
          </>
        ) : (
          <>
            {tabFeatured.map((fe) => (
              <FeaturedEventCallout key={fe._id} event={fe} />
            ))}
            <li className={styles.empty}>
              {FEATURE_BADWEATHER && badWeather
                ? 'Keine Indoor-Events für diesen Tag.'
                : 'Keine Events für diesen Tag.'}
            </li>
          </>
        )}
      </ul>

      <div className={styles.bottomControls}>
        {FEATURE_BADWEATHER && (
          <BadWeatherToggle
            active={badWeather}
            onToggle={toggleBadWeather}
            autoSuggested={isRainy}
          />
        )}
        <div className={styles.themeWrapper}>
          <ThemeToggle />
        </div>
      </div>

      {[...today, ...tomorrow, ...dayAfter].some(e => e.spotifyUrl) && (
        <div className={styles.spotifyDisclaimer}>
          <span className={styles.spotifyDisclaimerLabel}>Spotify ↗</span>
          Experimentelles Feature — nicht alle Artists werden angezeigt und es kann unter Umständen zu falschen Angaben führen. Es wird daran gearbeitet.
        </div>
      )}

      <SiteFooter />
    </>
  )
}
