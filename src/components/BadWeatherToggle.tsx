'use client'

import styles from './BadWeatherToggle.module.css'

interface Props {
  active: boolean
  onToggle: () => void
  autoSuggested?: boolean
}

export default function BadWeatherToggle({ active, onToggle }: Props) {
  return (
    <div className={`${styles.wrapper} ${active ? styles.wrapperRain : ''}`}>
      <div className={`${styles.pill} ${active ? styles.pillRight : styles.pillLeft}`} aria-hidden="true" />

      <button
        className={`${styles.option} ${!active ? styles.optionActive : ''}`}
        onClick={() => active && onToggle()}
      >
        <span className={`material-icons-round ${styles.icon}`} aria-hidden="true">wb_sunny</span>
        <span className={styles.label}>Draussen</span>
      </button>

      <button
        className={`${styles.option} ${active ? styles.optionActive : ''}`}
        onClick={() => !active && onToggle()}
      >
        <span className={`material-icons-round ${styles.icon}`} aria-hidden="true">cloud</span>
        <span className={styles.label}>Drinnen</span>
      </button>
    </div>
  )
}
