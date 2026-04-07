// src/components/EventBlock.tsx
// Einzelner Event-Block mit farbigem Hintergrund

import { Event, getEventColor, EVENT_TYPE_LABELS } from '@/lib/constants'
import styles from './EventBlock.module.css'

interface EventBlockProps {
  event: Event
  index: number
}

export default function EventBlock({ event, index }: EventBlockProps) {
  const bgColor = getEventColor(event.colorIndex ?? index)

  return (
    <li className={styles.item}>
      <a
        href={event.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
        style={{ backgroundColor: bgColor }}
      >
        {event.sponsored && (
          <span className={styles.sponsoredBadge}>Gesponsert</span>
        )}
        <div className={styles.meta}>
          <span className={styles.location}>{event.location}</span>
          <span className={styles.time}>{event.time}</span>
        </div>
        <div className={styles.name}>{event.name}</div>
        {event.eventType && (
          <div className={styles.eventType}>
            {EVENT_TYPE_LABELS[event.eventType]}
          </div>
        )}
      </a>
    </li>
  )
}
