'use client'

import styles from './BadWeatherToggle.module.css'

interface Props {
  active: boolean
  onToggle: () => void
  autoSuggested?: boolean  // true when weather API says it's rainy
}

export default function BadWeatherToggle({ active, onToggle, autoSuggested }: Props) {
  return (
    <button
      className={`${styles.toggle} ${active ? styles.active : ''} ${autoSuggested && !active ? styles.suggested : ''}`}
      onClick={onToggle}
      aria-label={active ? 'Schlechtwetter-Filter deaktivieren' : 'Schlechtwetter-Filter aktivieren'}
      title={active ? 'Schlechtwetter-Filter aktiv' : 'Nur Indoor-Events anzeigen'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor" aria-hidden="true">
        <path d="M440-120q-17 0-28.5-11.5T400-160v-160q0-17 11.5-28.5T440-360q17 0 28.5 11.5T480-320v160q0 17-11.5 28.5T440-120Zm240 80q-17 0-28.5-11.5T640-80v-160q0-17 11.5-28.5T680-280q17 0 28.5 11.5T720-240v160q0 17-11.5 28.5T680-40ZM200-40q-17 0-28.5-11.5T160-80v-160q0-17 11.5-28.5T200-280q17 0 28.5 11.5T240-240v160q0 17-11.5 28.5T200-40Zm30-440q-83 0-141.5-58.5T30-680q0-78 50-134.5T208-880q14-38 43.5-64.5T320-974q11-1 21.5-1.5T364-977q35-62 97-93.5T594-902q90 0 153 59.5T817-691q73 7 118 60.5T980-500q0 75-52.5 127.5T800-320H230Z"/>
      </svg>
    </button>
  )
}
