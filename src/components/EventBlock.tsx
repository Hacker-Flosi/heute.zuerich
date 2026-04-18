// src/components/EventBlock.tsx

import { Event, getEventColor, getTextColor, EVENT_TYPE_LABELS } from '@/lib/constants'
import styles from './EventBlock.module.css'

interface EventBlockProps {
  event: Event
  index: number
}

export default function EventBlock({ event, index }: EventBlockProps) {
  const bgColor = getEventColor(event.colorIndex ?? index)
  const textColor = getTextColor(bgColor)

  return (
    <li className={styles.item} style={{ '--i': index } as React.CSSProperties}>
      <a
        href={event.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        {event.sponsored && (
          <span className={styles.sponsoredBadge}>Gesponsert</span>
        )}
        <div className={styles.meta}>
          <div className={styles.metaTop}>
            {event.eventType && (
              <span className={styles.categoryPill}>
                {EVENT_TYPE_LABELS[event.eventType]}
              </span>
            )}
            <span className={styles.time}>
              {event.time && event.time !== '00:00' ? event.time : 'Ganztägig'}
            </span>
          </div>
          <span className={styles.location}>{event.location}</span>
        </div>
        <div className={styles.nameRow}>
          <div className={styles.name}>{event.name}</div>
          {event.spotifyUrl && (
            <button
              className={styles.spotifyLink}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(event.spotifyUrl, '_blank', 'noopener,noreferrer') }}
              aria-label="Auf Spotify anhören"
            >
              ▶ Play
            </button>
          )}
        </div>
      </a>
    </li>
  )
}
