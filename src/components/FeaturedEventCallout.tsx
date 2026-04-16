// src/components/FeaturedEventCallout.tsx

import { FeaturedEvent, CITY_LABELS } from '@/lib/constants'
import styles from './FeaturedEventCallout.module.css'

interface Props {
  event: FeaturedEvent
}

function formatDateRange(from: string, to: string): string {
  const d1 = new Date(from + 'T12:00:00')
  const d2 = new Date(to + 'T12:00:00')
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  const m1 = months[d1.getMonth()]
  const m2 = months[d2.getMonth()]
  if (from === to) return `${d1.getDate()}. ${m1}`
  if (m1 === m2) return `${d1.getDate()}.–${d2.getDate()}. ${m1}`
  return `${d1.getDate()}. ${m1} – ${d2.getDate()}. ${m2}`
}

export default function FeaturedEventCallout({ event }: Props) {
  const cityLabel = CITY_LABELS[event.city] ?? event.city
  const dateRange = formatDateRange(event.dateFrom, event.dateTo)

  return (
    <li className={styles.item}>
      <a
        href={event.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        <div className={styles.metaTop}>
          <div className={styles.badgeGroup}>
            <svg className={styles.walkIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6.5625 15.5625C6.85417 15.2708 7 14.9167 7 14.5C7 14.0833 6.85417 13.7292 6.5625 13.4375C6.27083 13.1458 5.91667 13 5.5 13C5.08333 13 4.72917 13.1458 4.4375 13.4375C4.14583 13.7292 4 14.0833 4 14.5C4 14.9167 4.14583 15.2708 4.4375 15.5625C4.72917 15.8542 5.08333 16 5.5 16C5.91667 16 6.27083 15.8542 6.5625 15.5625ZM3 21V20L4.5 19C3.53333 19 2.70833 18.6583 2.025 17.975C1.34167 17.2917 1 16.4667 1 15.5V6C1 4.61667 1.64167 3.60417 2.925 2.9625C4.20833 2.32083 6.23333 2 9 2C9.88333 2 10.7167 2.02917 11.5 2.0875C12.2833 2.14583 13.0083 2.25 13.675 2.4L13.65 4.45C13.0833 4.28333 12.4208 4.16667 11.6625 4.1C10.9042 4.03333 10.0167 4 9 4C7.56667 4 6.37917 4.08333 5.4375 4.25C4.49583 4.41667 3.825 4.66667 3.425 5H12.65L8 7H3V10H8V12H3V15.5C3 15.7 3.0375 15.8917 3.1125 16.075C3.1875 16.2583 3.29583 16.4208 3.4375 16.5625C3.57917 16.7042 3.74167 16.8125 3.925 16.8875C4.10833 16.9625 4.3 17 4.5 17H10.025L9.175 21H3ZM11 22L13.8 8.9L12 9.6V12H10V8.3L15.05 6.15C15.5333 5.95 16.025 5.92917 16.525 6.0875C17.025 6.24583 17.4167 6.55 17.7 7L18.7 8.6C19.1 9.3 19.5125 9.875 19.9375 10.325C20.3625 10.775 21.05 11 22 11V13C20.9 13 20.0375 12.7708 19.4125 12.3125C18.7875 11.8542 18.15 11.25 17.5 10.5L16.9 12.5L19 14.5V22H17V16L14.9 14L13.1 22H11ZM17.5 5.5C16.95 5.5 16.4792 5.30417 16.0875 4.9125C15.6958 4.52083 15.5 4.05 15.5 3.5C15.5 2.95 15.6958 2.47917 16.0875 2.0875C16.4792 1.69583 16.95 1.5 17.5 1.5C18.05 1.5 18.5208 1.69583 18.9125 2.0875C19.3042 2.47917 19.5 2.95 19.5 3.5C19.5 4.05 19.3042 4.52083 18.9125 4.9125C18.5208 5.30417 18.05 5.5 17.5 5.5Z"/>
            </svg>
            <span className={styles.cityBadge}>Heute in {cityLabel}</span>
          </div>
          <span className={styles.dates}>{dateRange}</span>
        </div>
        <div className={styles.name}>{event.name}</div>
        {event.teaser && (
          <div className={styles.teaser}>{event.teaser}</div>
        )}
      </a>
    </li>
  )
}
